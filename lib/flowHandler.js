// lib/flowHandler.js
const { sendText, sendButtons, sendList, sendOopsTapOptions } = require("./waClient");
const { hmac, maskPhone, ageBracket, anonymizePassenger } = require("./privacy");
const { parseDateInput, isValidDate, formatDDMMYYYY, normalizeDate, resolveCityAlias, parsePassengerLine } = require("./validators");
const { sessions, startOrGet, nextBookingId, isProcessed, markProcessed } = require("./sessionStore");

// We kept your original flow + helpers intact. Only difference: this file exports handleWebhook(req,res).

async function handleWebhook(req, res) {
  try {
    // Log minimal info — mask phone when present
    console.log("🔥 Webhook triggered (minimal):");
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const msg = value?.messages?.[0];
    if (!msg) {
      // Could be status update: still log minimal
      console.log("No message in webhook (maybe status).");
      return res.sendStatus(200);
    }

    // Dedupe incoming messages by id
    if (isProcessed(msg.id)) {
      console.log("Duplicate message received, ignoring:", msg.id);
      return res.sendStatus(200);
    }
    markProcessed(msg.id);

    const from = msg.from; // full phone; we will only use transiently
    const masked = maskPhone(from);
    console.log(`Incoming message id=${msg.id} from=${masked} type=${msg.type}`);

    // We use hashed key for session storage, never store raw phone
    const { session: s, key: sessionKey } = startOrGet(from);

    // Normalize triggers to open main menu
    const textIn = msg.type === "text" ? msg.text.body.trim().toLowerCase() : null;
    const wantsMenu =
      textIn &&
      ["menu", "hi", "hello", "start", "book", "quickets"].some((w) => textIn.includes(w));

    // Handle interactive replies (button/list)
    let interactiveType = null;
    let interactiveId = null;
    if (msg.type === "interactive") {
      interactiveType = msg.interactive.type; // "button_reply" | "list_reply"
      if (interactiveType === "button_reply") interactiveId = msg.interactive.button_reply.id;
      if (interactiveType === "list_reply") interactiveId = msg.interactive.list_reply.id;
    }

    // --- Confirm-from / Confirm-to button handlers (early) ---
    if (interactiveType === "button_reply") {
      if (s.state === "CONFIRM_BOARDING") {
        if (interactiveId === "CONFIRM_FROM_YES") {
          s.pendingBooking.from = s.__pendingFromCandidate;
          delete s.__pendingFromCandidate;
          s.state = "BUS_TO";
          await sendText(from, `Got it — *${s.pendingBooking.from}* set as boarding city.`);
          await sendText(from, "To city? (e.g., Visakhapatnam)"); // askBusTo replaced here to avoid circular require
          return res.sendStatus(200);
        }
        if (interactiveId === "CONFIRM_FROM_NO") {
          delete s.__pendingFromCandidate;
          s.state = "BUS_FROM";
          await sendText(from, "Okay — please re-enter your boarding city (full name).");
          return res.sendStatus(200);
        }
      }
      if (s.state === "CONFIRM_DESTINATION") {
        if (interactiveId === "CONFIRM_TO_YES") {
          s.pendingBooking.to = s.__pendingToCandidate;
          delete s.__pendingToCandidate;
          s.state = "BUS_DATE";
          await sendText(from, `Great — *${s.pendingBooking.to}* set as destination.`);
          await sendText(from, "Journey Date?\n(e.g., 24 Feb 2026 or 2026-02-24)\nOr use: tomorrow | day after tomorrow | next Monday | coming Friday night | this weekend"); // askBusDate
          return res.sendStatus(200);
        }
        if (interactiveId === "CONFIRM_TO_NO") {
          delete s.__pendingToCandidate;
          s.state = "BUS_TO";
          await sendText(from, "Okay — please re-enter your destination city (full name).");
          return res.sendStatus(200);
        }
      }
    }

    // --- Global states ---
    if (wantsMenu && s.state !== "BUS_PAX_ONE_GENDER_WAIT") {
      s.state = "IDLE";
      s.pendingBooking = null;
      // mainMenuList recreated inline to avoid circular require
      await sendList(
        from,
        "🎉 Welcome to *Quickets!* \nFast, friendly ticket assistance.\n\nChoose an option:",
        "Open menu",
        [
          {
            title: "Main",
            rows: [
              { id: "MENU_BOOK", title: "Book Tickets" },
              { id: "MENU_TRACK", title: "Track Request" },
              { id: "MENU_MYBOOK", title: "My Bookings" },
              { id: "MENU_PASSENGERS", title: "Saved Passengers" },
              { id: "MENU_HELP", title: "Help & Support" },
              { id: "MENU_ABOUT", title: "About Quickets" },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    // MAIN MENU selection (list)
    if (interactiveType === "list_reply") {
      if (interactiveId === "MENU_BOOK") {
        s.state = "BOOK_PICK";
        // bookPicker recreated inline
        await sendButtons(from, "What would you like to book?", [
          { id: "BOOK_BUS", title: "🚌 Bus" },
          { id: "BOOK_INFO", title: "ℹ️ Other info" },
        ]);
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_TRACK") {
        s.state = "TRACK_WAIT_ID";
        await sendText(from, "Enter your booking ID (e.g., QK-10023). If created today it may show *Pending* until confirmed.");
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_MYBOOK") {
        if (!s.bookings.length) {
          await sendText(from, "You have no confirmed bookings yet.");
        } else {
          const lines = s.bookings.map((b) => `${b.id}: ${b.date} – ${b.from} → ${b.to} | ${b.paxCount} | ${b.seatType}`);
          await sendText(from, "*Your bookings:*\n" + lines.join("\n"));
        }
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_PASSENGERS") {
        s.state = "PASSENGER_MENU";
        await sendButtons(from, "Saved passengers", [
          { id: "SP_ADD", title: "Add new" },
          { id: "SP_LIST", title: "View all" },
          { id: "SP_CLEAR", title: "Clear all" },
        ]);
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_HELP") {
        await sendText(from, "*Support*\nChat: this WhatsApp\nEmail: support@quickets.io\nHours: 9am–9pm IST");
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_ABOUT") {
        await sendText(from, "*Quickets*\nFast, friendly ticket assistance. No hassle, no spam.");
        s.state = "IDLE";
        return res.sendStatus(200);
      }
    }

    // SAVED PASSENGERS manager
    if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
      if (s.state === "PASSENGER_MENU") {
        if (interactiveId === "SP_ADD") {
          s.state = "SP_ADD_BULK";
          await sendText(from, "Paste passengers (one per line) in the format:\n*name age gender*\n\nExample:\nAarav 28 M\nDiya 26 F\n(We will store anonymized entries only.)");
          return res.sendStatus(200);
        }
        if (interactiveId === "SP_LIST") {
          if (!s.savedPassengers.length) await sendText(from, "No saved passengers yet.");
          else {
            await sendText(from, "*Saved passengers (anonymized):*\n" + s.savedPassengers.map((p, i) => `${i + 1}. ${p.id.slice(0, 6)}.. ${p.ageBracket} ${p.gender}`).join("\n"));
          }
          s.state = "IDLE";
          return res.sendStatus(200);
        }
        if (interactiveId === "SP_CLEAR") {
          s.savedPassengers = [];
          await sendText(from, "Cleared saved passengers (anonymized).");
          s.state = "IDLE";
          return res.sendStatus(200);
        }
      }
    }

    if (s.state === "SP_ADD_BULK" && msg.type === "text") {
      const lines = msg.text.body.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
      const parsed = [];
      for (const ln of lines) {
        const p = parsePassengerLine(ln);
        if (p) parsed.push(anonymizePassenger(p));
      }
      if (!parsed.length) {
        await sendText(from, "Couldn’t parse. Use: *name age gender*. Example:\nAarav 28 M");
      } else {
        // store hashed/anonymized only
        s.savedPassengers.push(...parsed);
        await sendText(from, `Added ${parsed.length} passenger(s) (anonymized).`);
      }
      s.state = "IDLE";
      return res.sendStatus(200);
    }

    // BOOK PICK (buttons)
    if (s.state === "BOOK_PICK" && interactiveType === "button_reply") {
      if (interactiveId === "BOOK_INFO") {
        await sendText(from, "We’ll ask a few quick questions and confirm with you before booking.");
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "BOOK_BUS") {
        s.pendingBooking = {
          id: null,
          type: "BUS",
          from: null,
          to: null,
          date: null,
          timePref: null,
          paxCount: null,
          seatType: null,
          passengers: [],
          status: "Pending",
          createdAt: Date.now(),
        };
        s.state = "BUS_FROM";
        await sendText(from, "From city? (e.g., Hyderabad)"); // askBusFrom inline
        return res.sendStatus(200);
      }
    }

    // BUS FLOW
    if (s.state === "BUS_FROM" && msg.type === "text") {
      const candidate = msg.text.body.trim();
      const resolved = resolveCityAlias(candidate);

      if (resolved.kind === "invalid") {
        await sendText(from, "I couldn’t understand that city.\nPlease type the *full city name*, e.g., Chennai");
        return res.sendStatus(200);
      }

      if (resolved.kind === "alias") {
        s.__pendingFromCandidate = resolved.canonical;
        s.state = "CONFIRM_BOARDING";
        await sendButtons(from, `Did you mean *${resolved.canonical}* for "${candidate}"?`, [
          { id: "CONFIRM_FROM_YES", title: "✅ Yes" },
          { id: "CONFIRM_FROM_NO", title: "❌ No" },
        ]);
        return res.sendStatus(200);
      }

      // normal direct acceptance
      s.pendingBooking.from = resolved.canonical || candidate;
      s.state = "BUS_TO";
      await sendText(from, "To city? (e.g., Visakhapatnam)"); // askBusTo inline
      return res.sendStatus(200);
    }

    // BUS_TO (validated)
    if (s.state === "BUS_TO" && msg.type === "text") {
      const candidate = msg.text.body.trim();
      const resolved = resolveCityAlias(candidate);

      if (resolved.kind === "invalid") {
        await sendText(from, "I couldn’t understand that city.\nPlease type the *full city name*, e.g., Hyderabad");
        return res.sendStatus(200);
      }

      if (resolved.kind === "alias") {
        s.__pendingToCandidate = resolved.canonical;
        s.state = "CONFIRM_DESTINATION";
        await sendButtons(from, `Did you mean *${resolved.canonical}* for "${candidate}"?`, [
          { id: "CONFIRM_TO_YES", title: "✅ Yes" },
          { id: "CONFIRM_TO_NO", title: "❌ No" },
        ]);
        return res.sendStatus(200);
      }

      s.pendingBooking.to = resolved.canonical || candidate;
      s.state = "BUS_DATE";
      await sendText(from, "Journey Date?\n(e.g., 24 Feb 2026 or 2026-02-24)\nOr use: tomorrow | day after tomorrow | next Monday | coming Friday night | this weekend");
      return res.sendStatus(200);
    }

    // BUS_DATE (supports natural language)
    if (s.state === "BUS_DATE" && msg.type === "text") {
      const raw = msg.text.body.trim();
      const parsed = parseDateInput(raw);

      if (!parsed.ok) {
        await sendText(
          from,
          "Invalid date ❌\n\nYou can type:\n• 24 Feb 2026\n• 2026-02-24\n• tomorrow\n• day after tomorrow\n• next Monday\n• coming Friday night\n• this weekend\n\nEnsure it’s not past and within 120 days."
        );
        return res.sendStatus(200);
      }

      // Business rules: no past, within window
      const d = new Date(parsed.dateObj.getFullYear(), parsed.dateObj.getMonth(), parsed.dateObj.getDate());
      const today = new Date(); today.setHours(0,0,0,0);
      if (d < today) {
        await sendText(from, "That date is in the past. Please enter a future date (e.g., tomorrow, 24 Feb 2026).");
        return res.sendStatus(200);
      }

      const maxAhead = 120;
      const limit = new Date(); limit.setDate(limit.getDate() + maxAhead); limit.setHours(0,0,0,0);
      if (d > limit) {
        await sendText(from, `Booking too far: please choose a date within the next ${maxAhead} days.`);
        return res.sendStatus(200);
      }

      s.pendingBooking.date = parsed.dateStr;

      // Map small time hint to the timePref (optional auto-fill)
      if (parsed.timeHint) {
        const timeMap = {
          morning: "Morning (5am–12pm)",
          afternoon: "Afternoon (12pm–5pm)",
          evening: "Evening (5pm–9pm)",
          night: "Night (9pm–2am)",
        };
        s.pendingBooking.timeHint = parsed.timeHint;
        s.pendingBooking.timePref = timeMap[parsed.timeHint] || "Any";
      }

      s.state = "BUS_TIME";
      // askTimePref inline:
      await sendList(
        from,
        "Pick a time preference:",
        "Select",
        [
          {
            title: "Time slots",
            rows: [
              { id: "TIME_MORNING", title: "Morning (5am–12pm)" },
              { id: "TIME_AFTERNOON", title: "Afternoon (12pm–5pm)" },
              { id: "TIME_EVENING", title: "Evening (5pm–9pm)" },
              { id: "TIME_NIGHT", title: "Night (9pm–2am)" },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    if (s.state === "BUS_TIME") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      const map = {
        TIME_MORNING: "Morning (5am–12pm)",
        TIME_AFTERNOON: "Afternoon (12pm–5pm)",
        TIME_EVENING: "Evening (5pm–9pm)",
        TIME_NIGHT: "Night (9pm–2am)",
      };
      s.pendingBooking.timePref = map[interactiveId] || "Any";
      s.state = "BUS_PAX";
      // askPaxCount inline
      await sendList(
        from,
        "How many passengers?",
        "Choose",
        [
          {
            title: "Passengers (max 6)",
            rows: [
              { id: "PAX_1", title: "1" },
              { id: "PAX_2", title: "2" },
              { id: "PAX_3", title: "3" },
              { id: "PAX_4", title: "4" },
              { id: "PAX_5", title: "5" },
              { id: "PAX_6", title: "6" },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    if (s.state === "BUS_PAX") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      s.pendingBooking.paxCount = parseInt(interactiveId.split("_")[1], 10);
      s.state = "BUS_SEAT_TYPE";
      // askSeatType inline
      await sendList(
        from,
        "Seat type preference?",
        "Pick type",
        [
          {
            title: "Type",
            rows: [
              { id: "SEAT_AC_SLEEPER", title: "AC Sleeper" },
              { id: "SEAT_AC_SEATER", title: "AC Seater" },
              { id: "SEAT_NONAC_SLEEPER", title: "Non-AC Sleeper" },
              { id: "SEAT_NONAC_SEATER", title: "Non-AC Seater" },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    if (s.state === "BUS_SEAT_TYPE") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      const map = {
        SEAT_AC_SLEEPER: "AC Sleeper",
        SEAT_AC_SEATER: "AC Seater",
        SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
        SEAT_NONAC_SEATER: "Non-AC Seater",
      };
      s.pendingBooking.seatType = map[interactiveId] || "Any";
      s.state = "BUS_PAX_MODE";
      // askPassengerMode inline:
      await sendButtons(from, "Passenger details input:", [
        { id: "PAX_BULK", title: "Fill at Once" },
        { id: "PAX_ONEBYONE", title: "Fill one by one" },
      ]);
      return res.sendStatus(200);
    }

    // Passenger mode pick
    if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
      const total = s.pendingBooking.paxCount;
      if (interactiveId === "PAX_BULK") {
        s.state = "BUS_PAX_BULK";
        await sendText(
          from,
          `Please paste *${total}* passenger(s) like:\n\n• *Name<SPACE>Age<SPACE>Gender*\nExample:\nVikram 28 M\nSita 26 F\n`
        );
        return res.sendStatus(200);
      }
      if (interactiveId === "PAX_ONEBYONE") {
        s.state = "BUS_PAX_ONE_NAME_WAIT";
        s.pendingBooking.passengers = [];
        s.__oneIndex = 1;
        await sendText(from, `Passenger 1/${total} – enter *Name*`);
        return res.sendStatus(200);
      }
    }

    // Fast form (bulk)
    if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
      const want = s.pendingBooking.paxCount;
      const lines = msg.text.body.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
      const parsed = [];
      for (const ln of lines) {
        const p = parsePassengerLine(ln);
        if (p) parsed.push(anonymizePassenger(p));
      }
      if (parsed.length !== want) {
        await sendText(from, `I need exactly *${want}* passengers. You sent *${parsed.length}* I could read.\nFormat: *name age gender* (M/F/O)`);
        return res.sendStatus(200);
      }
      s.pendingBooking.passengers = parsed;
      s.state = "BUS_SUMMARY";
      // showBusSummary inline:
      {
        const b = s.pendingBooking;
        const lines = [];
        lines.push("*Review your request*");
        lines.push(`From: ${b.from}`);
        lines.push(`To: ${b.to}`);
        lines.push(`Date: ${b.date}`);
        lines.push(`Time: ${b.timePref}`);
        lines.push(`Pax: ${b.paxCount}`);
        lines.push(`Seat: ${b.seatType}`);
        lines.push(
          "Passengers (anonymized):\n" +
            b.passengers.map((p, i) => `${i + 1}. ${p.id.slice(0, 6)}.. ${p.ageBracket} ${p.gender}`).join("\n")
        );
        await sendText(from, lines.join("\n"));
        await sendButtons(from, "Confirm this booking?", [
          { id: "CONFIRM_BOOK", title: "✅ Confirm" },
          { id: "EDIT_BOOK", title: "✏️ Edit" },
          { id: "CANCEL_BOOK", title: "❌ Cancel" },
        ]);
      }
      return res.sendStatus(200);
    }

    // One-by-one
    if (s.state === "BUS_PAX_ONE_NAME_WAIT" && msg.type === "text") {
      s.__tmpName = msg.text.body.trim();
      s.state = "BUS_PAX_ONE_AGE_WAIT";
      await sendText(from, "Enter *Age*");
      return res.sendStatus(200);
    }

    if (s.state === "BUS_PAX_ONE_AGE_WAIT" && msg.type === "text") {
      const age = parseInt(msg.text.body.trim(), 10);
      if (isNaN(age) || age <= 0) {
        await sendText(from, "Invalid age. Try again.");
        return res.sendStatus(200);
      }
      s.__tmpAge = age;
      s.state = "BUS_PAX_ONE_GENDER_WAIT";
      await sendButtons(from, "Pick *Gender*:", [
        { id: "G_M", title: "Male" },
        { id: "G_F", title: "Female" },
        { id: "G_O", title: "Other" },
      ]);
      return res.sendStatus(200);
    }

    if (s.state === "BUS_PAX_ONE_GENDER_WAIT" && interactiveType === "button_reply") {
      const gender = interactiveId === "G_M" ? "M" : interactiveId === "G_F" ? "F" : "O";
      // anonymize before storing
      s.pendingBooking.passengers.push(anonymizePassenger({ name: s.__tmpName, age: s.__tmpAge, gender }));
      const total = s.pendingBooking.paxCount;
      if (s.pendingBooking.passengers.length < total) {
        s.__oneIndex++;
        s.state = "BUS_PAX_ONE_NAME_WAIT";
        await sendText(from, `Passenger ${s.__oneIndex}/${total} – enter *Name*`);
      } else {
        s.state = "BUS_SUMMARY";
        // showBusSummary inline:
        {
          const b = s.pendingBooking;
          const lines = [];
          lines.push("*Review your request*");
          lines.push(`From: ${b.from}`);
          lines.push(`To: ${b.to}`);
          lines.push(`Date: ${b.date}`);
          lines.push(`Time: ${b.timePref}`);
          lines.push(`Pax: ${b.paxCount}`);
          lines.push(`Seat: ${b.seatType}`);
          lines.push(
            "Passengers (anonymized):\n" +
              b.passengers.map((p, i) => `${i + 1}. ${p.id.slice(0, 6)}.. ${p.ageBracket} ${p.gender}`).join("\n")
          );
          await sendText(from, lines.join("\n"));
          await sendButtons(from, "Confirm this booking?", [
            { id: "CONFIRM_BOOK", title: "✅ Confirm" },
            { id: "EDIT_BOOK", title: "✏️ Edit" },
            { id: "CANCEL_BOOK", title: "❌ Cancel" },
          ]);
        }
      }
      return res.sendStatus(200);
    }

    // Confirm / Edit / Cancel (buttons)
    if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
      if (interactiveId === "CONFIRM_BOOK") {
        s.pendingBooking.id = nextBookingId();
        s.pendingBooking.status = "Processing";
        // store anonymized booking only (do not save raw names)
        s.bookings.push({
          id: s.pendingBooking.id,
          type: s.pendingBooking.type,
          from: s.pendingBooking.from,
          to: s.pendingBooking.to,
          date: s.pendingBooking.date,
          paxCount: s.pendingBooking.paxCount,
          seatType: s.pendingBooking.seatType,
          passengers: s.pendingBooking.passengers, // anonymized objects
          status: "Booked",
          createdAt: Date.now(),
        });
        // send confirmation
        await sendText(from, `✅ *Confirmed*\nYour booking ID is *${s.pendingBooking.id}*.\nWe’ll send details soon.`);
        s.pendingBooking = null;
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "EDIT_BOOK") {
        s.state = "BUS_TIME";
        // askTimePref inline:
        await sendList(
          from,
          "Pick a time preference:",
          "Select",
          [
            {
              title: "Time slots",
              rows: [
                { id: "TIME_MORNING", title: "Morning (5am–12pm)" },
                { id: "TIME_AFTERNOON", title: "Afternoon (12pm–5pm)" },
                { id: "TIME_EVENING", title: "Evening (5pm–9pm)" },
                { id: "TIME_NIGHT", title: "Night (9pm–2am)" },
              ],
            },
          ]
        );
        return res.sendStatus(200);
      }
      if (interactiveId === "CANCEL_BOOK") {
        s.pendingBooking = null;
        s.state = "IDLE";
        await sendText(from, "Cancelled. No booking was created.");
        return res.sendStatus(200);
      }
    }

    // Track (text)
    if (s.state === "TRACK_WAIT_ID" && msg.type === "text") {
      const id = msg.text.body.trim().toUpperCase();
      const found =
        s.bookings.find((b) => b.id === id) ||
        (s.pendingBooking && s.pendingBooking.id === id ? s.pendingBooking : null);
      if (!found) {
        await sendText(from, `No booking found for *${id}*.`);
      } else {
        await sendText(from, `*${id}* → ${found.from} → ${found.to}, ${found.date}\nStatus: *${found.status || "Pending"}*`);
      }
      s.state = "IDLE";
      return res.sendStatus(200);
    }

    // Fallbacks
    if (msg.type === "interactive") {
      await sendOopsTapOptions(from);
      return res.sendStatus(200);
    }

    if (msg.type === "text") {
      // mainMenuList inline
      await sendList(
        from,
        "🎉 Welcome to *Quickets!!*\nFast, friendly ticket assistance.\n\nChoose an option:",
        "Open menu",
        [
          {
            title: "Main",
            rows: [
              { id: "MENU_BOOK", title: "Book Tickets" },
              { id: "MENU_TRACK", title: "Track Request" },
              { id: "MENU_MYBOOK", title: "My Bookings" },
              { id: "MENU_PASSENGERS", title: "Saved Passengers" },
              { id: "MENU_HELP", title: "Help & Support" },
              { id: "MENU_ABOUT", title: "About Quickets" },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("ERR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
}

module.exports = { handleWebhook };
