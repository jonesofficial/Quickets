// lib/flowHandler.js
const { sendText, sendButtons, sendList, sendOopsTapOptions } = require("./waClient");
const { hmac, maskPhone, ageBracket, anonymizePassenger } = require("./privacy");
const {
  parseDateInput,
  isValidDate,
  formatDDMMYYYY,
  normalizeDate,
  resolveCityAlias,
  parsePassengerLine,
} = require("./validators");
const { sessions, startOrGet, nextBookingId, isProcessed, markProcessed } = require("./sessionStore");

// --- Option sets: separate label collections (EN / TA) ---
const optionSets = {
  en: {
    WELCOME_TITLE: "🎉 Welcome to *Quickets!*",
    WELCOME_DESC: "Fast, friendly ticket assistance.\n\nChoose an option:",
    LANG_PROMPT: "Select language:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",
    MAIN: "Main",
    MENU_BOOK: "Book Tickets",
    MENU_TRACK: "Track Request",
    MENU_MYBOOK: "My Bookings",
    MENU_PASSENGERS: "Saved Passengers",         // <=24
    MENU_HELP: "Help & Support",
    MENU_ABOUT: "About Quickets",
    SUPPORT_INFO: "*Support*\nChat: this WhatsApp\nEmail: quicketsofficial@gmail.com\nHours: 9am–9pm IST",
    ABOUT: "*Quickets*\nFast, friendly ticket assistance. No hassle, no spam.",
    NO_MSG: "No message in webhook (maybe status).",
    DUP_MSG: "Duplicate message received, ignoring:",
    ASK_FROM: "From city? (e.g., Hyderabad) — please *type in English*",
    ASK_TO: "To city? (e.g., Visakhapatnam) — please *type in English*",
    CITY_NOT_UNDERSTOOD: "I couldn’t understand that city.\nPlease type the *full city name* in English, e.g., Chennai",
    CONFIRM_FROM_PROMPT: 'Did you mean *{{canonical}}* for "{{candidate}}"?',
    CONFIRM_TO_PROMPT: 'Did you mean *{{canonical}}* for "{{candidate}}"?',
    ASK_DATE: "Journey Date?\n(e.g., 24 Feb 2026 or 2026-02-24)\nOr use: tomorrow | day after tomorrow | next Monday | coming Friday night | this weekend",
    INVALID_DATE:
      "Invalid date ❌\n\nYou can type:\n• 24 Feb 2026\n• 2026-02-24\n• tomorrow\n• day after tomorrow\n• next Monday\n• coming Friday night\n• this weekend\n\nEnsure it’s not past and within 120 days.",
    DATE_PAST: "That date is in the past. Please enter a future date (e.g., tomorrow, 24 Feb 2026).",
    DATE_TOO_FAR: "Booking too far: please choose a date within the next {{maxAhead}} days.",
    PICK_TIME_PREF: "Pick a time preference:",

    // Short time labels (all <=24)
    TIME_MORNING: "Morning",
    TIME_AFTERNOON: "Afternoon",
    TIME_EVENING: "Evening",
    TIME_NIGHT: "Night",

    HOW_MANY_PAX: "How many passengers?",
    PAX_1: "1",
    PAX_2: "2",
    PAX_3: "3",
    PAX_4: "4",
    PAX_5: "5",
    PAX_6: "6",

    SEAT_TYPE_PROMPT: "Seat type preference?",

    // Short seat labels (<=24)
    SEAT_AC_SLEEPER: "AC Sleeper",
    SEAT_AC_SEATER: "AC Seater",
    SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
    SEAT_NONAC_SEATER: "Non-AC Seater",

    PASSENGER_DETAILS_MODE: "Passenger details input:",
    PAX_BULK: "Fill at once",                    // <=24
    PAX_ONEBYONE: "Fill one-by-one",             // <=24

    PASSENGER_BULK_EXAMPLE:
      "Paste passengers (one per line) in the format:\n*name age gender* (type all in English)\n\nExample:\nAarav 28 M\nDiya 26 F\n(We will store anonymized entries only.)",
    NEED_EXACT_PAX:
      "I need exactly *{{want}}* passengers. You sent *{{have}}* I could read.\nFormat: *name age gender* (M/F/O)",
    COULDNT_PARSE_PASS: "Couldn’t parse. Use: *name age gender*. Example:\nAarav 28 M",
    ADDED_PASSENGERS: "Added {{count}} passengers.", // shortened
    ENTER_AGE: "Enter *Age*",
    INVALID_AGE: "Invalid age. Try again.",
    PICK_GENDER: "Pick Gender:",
    G_M: "Male",
    G_F: "Female",
    G_O: "Other",

    REVIEW_REQUEST: "*Review your request*",
    CONFIRM_BOOKING_PROMPT: "Confirm this booking?",
    CONFIRM_BOOK: "Confirm",                      // <=24
    EDIT_BOOK: "Edit",                            // <=24
    CANCEL_BOOK: "Cancel",                        // <=24

    CONFIRMED_BOOKING: "✅ *Confirmed*\nYour booking ID is *{{id}}*.\nWe’ll send details soon.",
    CANCELLED: "Cancelled. No booking was created.",
    TRACK_PROMPT:
      "Enter your booking ID (e.g., QK-10023). If created today it may show *Pending* until confirmed.",
    NO_BOOKING_FOUND: "No booking found for *{{id}}*.",
    YOUR_BOOKINGS_NONE: "You have no confirmed bookings yet.",
    YOUR_BOOKINGS_LIST: "*Your bookings:*\n{{lines}}",
    SAVED_PASSENGERS_NONE: "No saved passengers yet.",

    // shortened saved passengers list title for lists
    SAVED_PASSENGERS_LIST: "*Saved Passengers:*\n{{lines}}", // <=24 inside single row title if used

    CLEARED_PASSENGERS: "Cleared saved passengers.",
    FILL_PAX_BULK:
      "Please paste *{{total}}* passenger(s) like (type in English):\n\n• *Name<SPACE>Age<SPACE>Gender*\nExample:\nVikram 28 M\nSita 26 F\n",
    OOPS_TAP_OPTIONS: "Please tap/select one of the options shown.",
    MENU_PROMPT_SHORT: "Welcome to *Quickets!* \nFast, friendly ticket assistance.\n\nChoose an option:",
    EDIT_BOOK_PROMPT: "Edit booking — pick time preference:",
    ENTER_NAME_PROMPT: "Passenger {{i}}/{{total}} – enter Name (type in English)",
    TRACK_STATUS_LINE: "*{{id}}* → {{from}} → {{to}}, {{date}}\nStatus: *{{status}}*",

    // Budget labels & prompt (6 options) - all <=24
    BUDGET_PROMPT: "Select your budget (INR):",
    BUDGET_300U: "Under 300",
    BUDGET_500: "500",
    BUDGET_700: "700",
    BUDGET_1000: "1000",
    BUDGET_1500: "1500",
    BUDGET_2000PLUS: "2000+",
  },
  ta: {
    WELCOME_TITLE: "🎉 *Quickets* வரவேற்பு!",
    WELCOME_DESC: "விரைவான, எளிய டிக்கெட் உதவி.\n\nதேர்வு செய்யவும்:",
    LANG_PROMPT: "மொழியைத் தேர்வு செய்யவும்:",
    LANG_EN_LABEL: "English",
    LANG_TA_LABEL: "தமிழ்",

    MAIN: "முகப்பு",

    // Main menu (meaningful + short)
    MENU_BOOK: "பேருந்து டிக்கெட் முன்பதிவு",
    MENU_TRACK: "முன்பதிவு நிலை காண்க",
    MENU_MYBOOK: "எனது முன்பதிவுகள்",
    MENU_PASSENGERS: "பயணி பட்டியல்",
    MENU_HELP: "உதவி மையம்",
    MENU_ABOUT: "Quickets பற்றி",

    SUPPORT_INFO: "*ஆதரவு*\nசாட்: இந்த WhatsApp\nமின்னஞ்சல்: quicketsofficial@gmail.com\nநேரம்: 9am–9pm IST",

    ABOUT: "*Quickets*\nஉங்கள் பயணத்துக்கு விரைவான மற்றும் நம்பகமான டிக்கெட் உதவி.",

    NO_MSG: "செய்தி இல்லை.",
    DUP_MSG: "நகல் செய்தி, புறக்கணிக்கப்பட்டது.",

    ASK_FROM: "புறப்படும் நகரம்?",
    ASK_TO: "செல்லும் நகரம்?",

    CITY_NOT_UNDERSTOOD:
      "இந்த நகரம் புரியவில்லை.\nமுழு நகரப் பெயரை ஆங்கிலத்தில் எழுதவும்.",

    CONFIRM_FROM_PROMPT: '“{{candidate}}” → *{{canonical}}* என உறுதிப்படுத்தவா?',
    CONFIRM_TO_PROMPT: '“{{candidate}}” → *{{canonical}}* என உறுதிப்படுத்தவா?',

    ASK_DATE:
      "பயண தேதி? (e.g., 24 Feb 2026)\nஅல்லது: tomorrow / next Monday / weekend",

    INVALID_DATE:
      "தவறான தேதி ❌\nஉதாரணங்கள்: 24 Feb 2026, tomorrow.\nகடந்த தேதிகளைத் தேர்வு செய்ய வேண்டாம்.",

    DATE_PAST: "இந்தத் தேதி கடந்துவிட்டது.",
    DATE_TOO_FAR: "{{maxAhead}} நாட்களுக்குள் உள்ள தேதியைத் தேர்வு செய்யவும்.",

    PICK_TIME_PREF: "நேரத்தை தேர்வு செய்யவும்:",

    // Time labels — meaningful & short
    TIME_MORNING: "காலை (2AM - 10AM)",
    TIME_AFTERNOON: "மதியம் (10AM - 4PM)",
    TIME_EVENING: "மாலை (4PM - 7PM)",
    TIME_NIGHT: "இரவு (7PM - 2AM)",

    HOW_MANY_PAX: "எத்தனை பயணிகள்?",

    PAX_1: "1", PAX_2: "2", PAX_3: "3",
    PAX_4: "4", PAX_5: "5", PAX_6: "6",

    SEAT_TYPE_PROMPT: "இருக்கை வகை தேர்வு:",

    // Seat types — natural Tamil
    SEAT_AC_SLEEPER: "AC ஸ்லீப்பர்",
    SEAT_AC_SEATER: "AC சீட்டர்",
    SEAT_NONAC_SLEEPER: "Non-AC ஸ்லீப்பர்",
    SEAT_NONAC_SEATER: "Non-AC சீட்டர்",

    PASSENGER_DETAILS_MODE: "பயணி விவரங்கள்:",

    // Passenger entry modes — meaningful
    PAX_BULK: "ஒரே முறையில் சேர்க்க",
    PAX_ONEBYONE: "ஒன்றாக ஒன்றாக சேர்க்க",

    PASSENGER_BULK_EXAMPLE:
      "ஒவ்வொரு வரியிலும்: பெயர் | வயது | பாலினம் — ஆங்கிலத்தில்.\nஎ.கா:\nVikram 28 M\nSita 26 F",

    NEED_EXACT_PAX: "*{{want}}* பேர் வேண்டும்.\nநீங்கள் *{{have}}* பேரை தேர்ந்தெடுத்துள்ளீர்கள்.",

    COULDNT_PARSE_PASS: "வடிவம் பிழை.\nஉதாரணம்: Aarav 28 M",

    ADDED_PASSENGERS: "{{count}} பயணிகளை தேர்ந்தெடுத்துள்ளீர்கள்.",
    ENTER_AGE: "வயதை எழுதவும்",
    INVALID_AGE: "செல்லுபடியாகாத வயது.",
    PICK_GENDER: "பாலினம் தேர்வு:",

    G_M: "ஆண்",
    G_F: "பெண்",
    G_O: "மற்றது",

    REVIEW_REQUEST: "*உங்கள் கோரிக்கை சுருக்கம்*",

    CONFIRM_BOOKING_PROMPT: "முன்பதிவுகளை உறுதிப்படுத்தலாமா?",
    CONFIRM_BOOK: "உறுதிப்படுத்து",
    EDIT_BOOK: "மாற்று",
    CANCEL_BOOK: "ரத்து செய்",

    CONFIRMED_BOOKING: "✅ *உறுதிப்படுத்தப்பட்டது*\nபுக் ஐடி: *{{id}}*.",
    CANCELLED: "முன்பதிவை ரத்து செய்யப்பட்டது.",

    TRACK_PROMPT: "முன்பதிவின் ஐடி எழுதவும்.",
    NO_BOOKING_FOUND: "*{{id}}* கிடைக்கவில்லை.",

    YOUR_BOOKINGS_NONE: "முன்பதிவுகள் எதுவும் இல்லை.",
    YOUR_BOOKINGS_LIST: "*உங்கள் முன்பதிவுகள்:*\n{{lines}}",

    SAVED_PASSENGERS_NONE: "சேமிக்கப்பட்ட பயணிகள் இல்லை.",
    SAVED_PASSENGERS_LIST: "*சேமிக்கப்பட்ட பயணிகள்:*\n{{lines}}",

    CLEARED_PASSENGERS: "பயணி பட்டியல் அழிக்கப்பட்டது.",

    FILL_PAX_BULK:
      "*{{total}}* பேரை வரிசையாக எழுதவும்:\nபெயர் | வயது | பாலினம்\nஎ.கா: Vikram 28 M",

    OOPS_TAP_OPTIONS: "கீழே உள்ள விருப்பங்களில் ஒன்றைத் தட்டவும்.",

    MENU_PROMPT_SHORT: "Quickets வரவேற்பு!\nவிரைவான டிக்கெட் உதவி.",

    EDIT_BOOK_PROMPT: "நேரம் தேர்வு செய்யவும்:",
    ENTER_NAME_PROMPT: "பயணி {{i}}/{{total}} — பெயர் (EN)",

    TRACK_STATUS_LINE: "*{{id}}* → {{from}} → {{to}}, {{date}}\nநிலை: *{{status}}*",

    // Budget prompt & labels (natural Tamil)
    BUDGET_PROMPT: "உங்கள் கட்டணத் தேர்வு:",
    BUDGET_300U: "₹300க்கு கீழ்",
    BUDGET_500: "₹500க்கு கீழ்",
    BUDGET_700: "₹700க்கு கீழ்",
    BUDGET_1000: "₹1000க்கு கீழ்",
    BUDGET_1500: "₹1500க்கு கீழ்",
    BUDGET_2000PLUS: "₹1500க்கு மேல்+",
  },
};

// helper to read label from the currently selected option set
function L(session, key, vars = {}) {
  const set = optionSets[session.optionSet] || optionSets.en;
  let str = set[key] || optionSets.en[key] || key;
  Object.keys(vars).forEach((k) => {
    str = str.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), vars[k]);
  });
  return str;
}

// --- Main exported handler ---
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

    const from = msg.from; // full phone; transient
    const masked = maskPhone(from);
    console.log(`Incoming message id=${msg.id} from=${masked} type=${msg.type}`);

    // session
    const { session: s, key: sessionKey } = startOrGet(from);

    // getter for labels
    const get = (key, vars) => L(s, key, vars);

    // parse text
    const textIn = msg.type === "text" ? msg.text.body.trim() : "";
    const lower = (textIn || "").toLowerCase();

    // -------------------------
    // language selection logic
    // -------------------------
    if (lower === "ta" || lower === "தமிழ்") {
      s.optionSet = "ta";
      s.state = "IDLE";
      await sendList(
        from,
        `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
        get("MAIN"),
        [
          {
            title: get("MAIN"),
            rows: [
              { id: "MENU_BOOK", title: get("MENU_BOOK") },
              { id: "MENU_TRACK", title: get("MENU_TRACK") },
              { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
              { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
              { id: "MENU_HELP", title: get("MENU_HELP") },
              { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }
    if (lower === "en" || lower === "english") {
      s.optionSet = "en";
      s.state = "IDLE";
      await sendList(
        from,
        `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
        get("MAIN"),
        [
          {
            title: get("MAIN"),
            rows: [
              { id: "MENU_BOOK", title: get("MENU_BOOK") },
              { id: "MENU_TRACK", title: get("MENU_TRACK") },
              { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
              { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
              { id: "MENU_HELP", title: get("MENU_HELP") },
              { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    // prompt language if not chosen
    if (!s.optionSet && s.state !== "LANG_SELECTION") {
      s.state = "LANG_SELECTION";
      await sendButtons(
        from,
        `${optionSets.en.WELCOME_TITLE}\n${optionSets.en.WELCOME_DESC}\n\n${optionSets.en.LANG_PROMPT}`,
        [
          { id: "LANG_EN", title: optionSets.en.LANG_EN_LABEL },
          { id: "LANG_TA", title: optionSets.en.LANG_TA_LABEL },
        ]
      );
      return res.sendStatus(200);
    }

    // interactive
    let interactiveType = null;
    let interactiveId = null;
    if (msg.type === "interactive") {
      interactiveType = msg.interactive.type;
      if (interactiveType === "button_reply") interactiveId = msg.interactive.button_reply.id;
      if (interactiveType === "list_reply") interactiveId = msg.interactive.list_reply.id;
    }

    // handle lang buttons
    if (interactiveType === "button_reply" && s.state === "LANG_SELECTION") {
      if (interactiveId === "LANG_EN") {
        s.optionSet = "en";
        s.state = "IDLE";
        await sendList(
          from,
          `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
          get("MAIN"),
          [
            {
              title: get("MAIN"),
              rows: [
                { id: "MENU_BOOK", title: get("MENU_BOOK") },
                { id: "MENU_TRACK", title: get("MENU_TRACK") },
                { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
                { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
                { id: "MENU_HELP", title: get("MENU_HELP") },
                { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
              ],
            },
          ]
        );
        return res.sendStatus(200);
      }
      if (interactiveId === "LANG_TA") {
        s.optionSet = "ta";
        s.state = "IDLE";
        await sendList(
          from,
          `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
          get("MAIN"),
          [
            {
              title: get("MAIN"),
              rows: [
                { id: "MENU_BOOK", title: get("MENU_BOOK") },
                { id: "MENU_TRACK", title: get("MENU_TRACK") },
                { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
                { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
                { id: "MENU_HELP", title: get("MENU_HELP") },
                { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
              ],
            },
          ]
        );
        return res.sendStatus(200);
      }
      await sendOopsTapOptions(from);
      return res.sendStatus(200);
    }

    if (!s.optionSet) s.optionSet = "en";

    // --- Confirm-from / Confirm-to early handlers ---
    if (interactiveType === "button_reply") {
      if (s.state === "CONFIRM_BOARDING") {
        if (interactiveId === "CONFIRM_FROM_YES") {
          s.pendingBooking.from = s.__pendingFromCandidate;
          delete s.__pendingFromCandidate;
          s.state = "BUS_TO";
          await sendText(from, `${get("ASK_FROM").split("—")[0]} — *${s.pendingBooking.from}*`);
          await sendText(from, get("ASK_TO"));
          return res.sendStatus(200);
        }
        if (interactiveId === "CONFIRM_FROM_NO") {
          delete s.__pendingFromCandidate;
          s.state = "BUS_FROM";
          await sendText(from, get("CITY_NOT_UNDERSTOOD"));
          return res.sendStatus(200);
        }
      }
      if (s.state === "CONFIRM_DESTINATION") {
        if (interactiveId === "CONFIRM_TO_YES") {
          s.pendingBooking.to = s.__pendingToCandidate;
          delete s.__pendingToCandidate;
          s.state = "BUS_DATE";
          await sendText(from, `${get("ASK_TO").split("—")[0]} — *${s.pendingBooking.to}*`);
          await sendText(from, get("ASK_DATE"));
          return res.sendStatus(200);
        }
        if (interactiveId === "CONFIRM_TO_NO") {
          delete s.__pendingToCandidate;
          s.state = "BUS_TO";
          await sendText(from, get("CITY_NOT_UNDERSTOOD"));
          return res.sendStatus(200);
        }
      }
    }

    // --- Global menu trigger ---
    const wantsMenu =
      textIn &&
      ["menu", "hi", "hello", "start", "book", "quickets"].some((w) => textIn.toLowerCase().includes(w));

    if (wantsMenu && s.state !== "BUS_PAX_ONE_GENDER_WAIT") {
      s.state = "IDLE";
      s.pendingBooking = null;
      await sendList(
        from,
        `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
        get("MAIN"),
        [
          {
            title: get("MAIN"),
            rows: [
              { id: "MENU_BOOK", title: get("MENU_BOOK") },
              { id: "MENU_TRACK", title: get("MENU_TRACK") },
              { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
              { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
              { id: "MENU_HELP", title: get("MENU_HELP") },
              { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
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
        await sendButtons(from, get("MENU_BOOK"), [
          { id: "BOOK_BUS", title: get("MENU_BOOK") },
          { id: "BOOK_INFO", title: "ℹ️ Other info" },
        ]);
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_TRACK") {
        s.state = "TRACK_WAIT_ID";
        await sendText(from, get("TRACK_PROMPT"));
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_MYBOOK") {
        if (!s.bookings.length) {
          await sendText(from, get("YOUR_BOOKINGS_NONE"));
        } else {
          const lines = s.bookings.map(
            (b) => `${b.id}: ${b.date} – ${b.from} → ${b.to} | ${b.paxCount} | ${b.seatType} | ${b.budget || "-" }`
          );
          await sendText(from, get("YOUR_BOOKINGS_LIST", { lines: lines.join("\n") }));
        }
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_PASSENGERS") {
        s.state = "PASSENGER_MENU";
        await sendButtons(from, get("MENU_PASSENGERS"), [
          { id: "SP_ADD", title: "Add new" },
          { id: "SP_LIST", title: "View all" },
          { id: "SP_CLEAR", title: "Clear all" },
        ]);
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_HELP") {
        await sendText(from, get("SUPPORT_INFO"));
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "MENU_ABOUT") {
        await sendText(from, get("ABOUT"));
        s.state = "IDLE";
        return res.sendStatus(200);
      }
    }

    // SAVED PASSENGERS manager
    if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
      if (s.state === "PASSENGER_MENU") {
        if (interactiveId === "SP_ADD") {
          s.state = "SP_ADD_BULK";
          await sendText(from, get("PASSENGER_BULK_EXAMPLE"));
          return res.sendStatus(200);
        }
        if (interactiveId === "SP_LIST") {
          if (!s.savedPassengers.length) await sendText(from, get("SAVED_PASSENGERS_NONE"));
          else {
            await sendText(
              from,
              get("SAVED_PASSENGERS_LIST", {
                lines: s.savedPassengers
                  .map((p, i) => `${i + 1}. ${p.id.slice(0, 6)}.. ${p.ageBracket} ${p.gender}`)
                  .join("\n"),
              })
            );
          }
          s.state = "IDLE";
          return res.sendStatus(200);
        }
        if (interactiveId === "SP_CLEAR") {
          s.savedPassengers = [];
          await sendText(from, get("CLEARED_PASSENGERS"));
          s.state = "IDLE";
          return res.sendStatus(200);
        }
      }
    }

    if (s.state === "SP_ADD_BULK" && msg.type === "text") {
      const lines = msg.text.body.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
      const parsed = [];
      for (const ln of lines) {
        const p = parsePassengerLine(ln); // expects English input
        if (p) parsed.push(anonymizePassenger(p));
      }
      if (!parsed.length) {
        await sendText(from, get("COULDNT_PARSE_PASS"));
      } else {
        s.savedPassengers.push(...parsed);
        await sendText(from, get("ADDED_PASSENGERS", { count: parsed.length }));
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
          budget: null,
          passengers: [],
          status: "Pending",
          createdAt: Date.now(),
        };
        s.state = "BUS_FROM";
        await sendText(from, get("ASK_FROM")); // askBusFrom inline
        return res.sendStatus(200);
      }
    }

    // BUS_FROM
    if (s.state === "BUS_FROM" && msg.type === "text") {
      const candidate = msg.text.body.trim();
      const resolved = resolveCityAlias(candidate);

      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return res.sendStatus(200);
      }

      if (resolved.kind === "alias") {
        s.__pendingFromCandidate = resolved.canonical;
        s.state = "CONFIRM_BOARDING";
        await sendButtons(
          from,
          get("CONFIRM_FROM_PROMPT", { canonical: resolved.canonical, candidate }),
          [
            { id: "CONFIRM_FROM_YES", title: "✅ Yes" },
            { id: "CONFIRM_FROM_NO", title: "❌ No" },
          ]
        );
        return res.sendStatus(200);
      }

      s.pendingBooking.from = resolved.canonical || candidate;
      s.state = "BUS_TO";
      await sendText(from, get("ASK_TO"));
      return res.sendStatus(200);
    }

    // BUS_TO
    if (s.state === "BUS_TO" && msg.type === "text") {
      const candidate = msg.text.body.trim();
      const resolved = resolveCityAlias(candidate);

      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return res.sendStatus(200);
      }

      if (resolved.kind === "alias") {
        s.__pendingToCandidate = resolved.canonical;
        s.state = "CONFIRM_DESTINATION";
        await sendButtons(
          from,
          get("CONFIRM_TO_PROMPT", { canonical: resolved.canonical, candidate }),
          [
            { id: "CONFIRM_TO_YES", title: "✅ Yes" },
            { id: "CONFIRM_TO_NO", title: "❌ No" },
          ]
        );
        return res.sendStatus(200);
      }

      s.pendingBooking.to = resolved.canonical || candidate;
      s.state = "BUS_DATE";
      await sendText(from, get("ASK_DATE"));
      return res.sendStatus(200);
    }

    // BUS_DATE
    if (s.state === "BUS_DATE" && msg.type === "text") {
      const raw = msg.text.body.trim();
      const parsed = parseDateInput(raw);

      if (!parsed.ok) {
        await sendText(from, get("INVALID_DATE"));
        return res.sendStatus(200);
      }

      const d = new Date(parsed.dateObj.getFullYear(), parsed.dateObj.getMonth(), parsed.dateObj.getDate());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) {
        await sendText(from, get("DATE_PAST"));
        return res.sendStatus(200);
      }

      const maxAhead = 120;
      const limit = new Date();
      limit.setDate(limit.getDate() + maxAhead);
      limit.setHours(0, 0, 0, 0);
      if (d > limit) {
        await sendText(from, get("DATE_TOO_FAR", { maxAhead }));
        return res.sendStatus(200);
      }

      s.pendingBooking.date = parsed.dateStr;

      if (parsed.timeHint) {
        const timeMap = {
          morning: get("TIME_MORNING"),
          afternoon: get("TIME_AFTERNOON"),
          evening: get("TIME_EVENING"),
          night: get("TIME_NIGHT"),
        };
        s.pendingBooking.timeHint = parsed.timeHint;
        s.pendingBooking.timePref = timeMap[parsed.timeHint] || "Any";
      }

      s.state = "BUS_TIME";
      await sendList(
        from,
        get("PICK_TIME_PREF"),
        "Select",
        [
          {
            title: "Time slots",
            rows: [
              { id: "TIME_MORNING", title: get("TIME_MORNING") },
              { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
              { id: "TIME_EVENING", title: get("TIME_EVENING") },
              { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    // BUS_TIME -> choose time
    if (s.state === "BUS_TIME") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      const map = {
        TIME_MORNING: get("TIME_MORNING"),
        TIME_AFTERNOON: get("TIME_AFTERNOON"),
        TIME_EVENING: get("TIME_EVENING"),
        TIME_NIGHT: get("TIME_NIGHT"),
      };
      s.pendingBooking.timePref = map[interactiveId] || "Any";
      s.state = "BUS_PAX";
      // askPaxCount inline
      await sendList(
        from,
        get("HOW_MANY_PAX"),
        "Choose",
        [
          {
            title: "Passengers (max 6)",
            rows: [
              { id: "PAX_1", title: get("PAX_1") },
              { id: "PAX_2", title: get("PAX_2") },
              { id: "PAX_3", title: get("PAX_3") },
              { id: "PAX_4", title: get("PAX_4") },
              { id: "PAX_5", title: get("PAX_5") },
              { id: "PAX_6", title: get("PAX_6") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    // BUS_PAX -> choose pax count
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
        get("SEAT_TYPE_PROMPT"),
        "Pick type",
        [
          {
            title: "Type",
            rows: [
              { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
              { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
              { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
              { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    // BUS_SEAT_TYPE -> choose seat -> next: BUDGET
    if (s.state === "BUS_SEAT_TYPE") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      const map = {
        SEAT_AC_SLEEPER: get("SEAT_AC_SLEEPER"),
        SEAT_AC_SEATER: get("SEAT_AC_SEATER"),
        SEAT_NONAC_SLEEPER: get("SEAT_NONAC_SLEEPER"),
        SEAT_NONAC_SEATER: get("SEAT_NONAC_SEATER"),
      };
      s.pendingBooking.seatType = map[interactiveId] || "Any";

      // --- NEW: Ask for Budget (after seat type, before passenger mode) ---
      s.state = "BUS_BUDGET";
      // WhatsApp supports up to 6 list rows; we present the 6 options requested
      await sendList(
        from,
        get("BUDGET_PROMPT"),
        "Budget",
        [
          {
            title: "Budget options",
            rows: [
              { id: "BUDGET_300U", title: get("BUDGET_300U") },
              { id: "BUDGET_500", title: get("BUDGET_500") },
              { id: "BUDGET_700", title: get("BUDGET_700") },
              { id: "BUDGET_1000", title: get("BUDGET_1000") },
              { id: "BUDGET_1500", title: get("BUDGET_1500") },
              { id: "BUDGET_2000PLUS", title: get("BUDGET_2000PLUS") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    // BUS_BUDGET -> user selects budget -> then go to passenger mode
    if (s.state === "BUS_BUDGET") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      const bmap = {
        BUDGET_300U: get("BUDGET_300U"),
        BUDGET_500: get("BUDGET_500"),
        BUDGET_700: get("BUDGET_700"),
        BUDGET_1000: get("BUDGET_1000"),
        BUDGET_1500: get("BUDGET_1500"),
        BUDGET_2000PLUS: get("BUDGET_2000PLUS"),
      };
      s.pendingBooking.budget = bmap[interactiveId] || "Any";
      s.state = "BUS_PAX_MODE";
      // askPassengerMode inline:
      await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: get("PAX_BULK") },
        { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
      ]);
      return res.sendStatus(200);
    }

    // Passenger mode pick
    if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
      const total = s.pendingBooking.paxCount;
      if (interactiveId === "PAX_BULK") {
        s.state = "BUS_PAX_BULK";
        await sendText(from, get("FILL_PAX_BULK", { total }));
        return res.sendStatus(200);
      }
      if (interactiveId === "PAX_ONEBYONE") {
        s.state = "BUS_PAX_ONE_NAME_WAIT";
        s.pendingBooking.passengers = [];
        s.__oneIndex = 1;
        await sendText(from, get("ENTER_NAME_PROMPT", { i: 1, total }));
        return res.sendStatus(200);
      }
    }

    // Fast form (bulk)
    if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
      const want = s.pendingBooking.paxCount;
      const lines = msg.text.body.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
      const parsed = [];
      for (const ln of lines) {
        const p = parsePassengerLine(ln); // expects English
        if (p) parsed.push(anonymizePassenger(p));
      }
      if (parsed.length !== want) {
        await sendText(from, get("NEED_EXACT_PAX", { want, have: parsed.length }));
        return res.sendStatus(200);
      }
      s.pendingBooking.passengers = parsed;
      s.state = "BUS_SUMMARY";
      // showBusSummary inline:
      {
        const b = s.pendingBooking;
        const lines = [];
        lines.push(get("REVIEW_REQUEST"));
        lines.push(`From: ${b.from}`);
        lines.push(`To: ${b.to}`);
        lines.push(`Date: ${b.date}`);
        lines.push(`Time: ${b.timePref}`);
        lines.push(`Pax: ${b.paxCount}`);
        lines.push(`Seat: ${b.seatType}`);
        lines.push(`Budget: ${b.budget || "-"}`);
        lines.push(
          "Passengers (anonymized):\n" +
            b.passengers.map((p, i) => `${i + 1}. ${p.id.slice(0, 6)}.. ${p.ageBracket} ${p.gender}`).join("\n")
        );
        await sendText(from, lines.join("\n"));
        await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
          { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
          { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
          { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
        ]);
      }
      return res.sendStatus(200);
    }

    // One-by-one
    if (s.state === "BUS_PAX_ONE_NAME_WAIT" && msg.type === "text") {
      s.__tmpName = msg.text.body.trim(); // English name
      s.state = "BUS_PAX_ONE_AGE_WAIT";
      await sendText(from, get("ENTER_AGE"));
      return res.sendStatus(200);
    }

    if (s.state === "BUS_PAX_ONE_AGE_WAIT" && msg.type === "text") {
      const age = parseInt(msg.text.body.trim(), 10);
      if (isNaN(age) || age <= 0) {
        await sendText(from, get("INVALID_AGE"));
        return res.sendStatus(200);
      }
      s.__tmpAge = age;
      s.state = "BUS_PAX_ONE_GENDER_WAIT";
      await sendButtons(from, get("PICK_GENDER"), [
        { id: "G_M", title: get("G_M") },
        { id: "G_F", title: get("G_F") },
        { id: "G_O", title: get("G_O") },
      ]);
      return res.sendStatus(200);
    }

    if (s.state === "BUS_PAX_ONE_GENDER_WAIT" && interactiveType === "button_reply") {
      const gender = interactiveId === "G_M" ? "M" : interactiveId === "G_F" ? "F" : "O";
      // anonymize before storing
      s.pendingBooking.passengers.push(
        anonymizePassenger({ name: s.__tmpName, age: s.__tmpAge, gender })
      );
      const total = s.pendingBooking.paxCount;
      if (s.pendingBooking.passengers.length < total) {
        s.__oneIndex++;
        s.state = "BUS_PAX_ONE_NAME_WAIT";
        await sendText(from, get("ENTER_NAME_PROMPT", { i: s.__oneIndex, total }));
      } else {
        s.state = "BUS_SUMMARY";
        // showBusSummary inline:
        {
          const b = s.pendingBooking;
          const lines = [];
          lines.push(get("REVIEW_REQUEST"));
          lines.push(`From: ${b.from}`);
          lines.push(`To: ${b.to}`);
          lines.push(`Date: ${b.date}`);
          lines.push(`Time: ${b.timePref}`);
          lines.push(`Pax: ${b.paxCount}`);
          lines.push(`Seat: ${b.seatType}`);
          lines.push(`Budget: ${b.budget || "-"}`);
          lines.push(
            "Passengers (anonymized):\n" +
              b.passengers.map((p, i) => `${i + 1}. ${p.id.slice(0, 6)}.. ${p.ageBracket} ${p.gender}`).join("\n")
          );
          await sendText(from, lines.join("\n"));
          await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
            { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
            { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
            { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
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
          budget: s.pendingBooking.budget,
          passengers: s.pendingBooking.passengers, // anonymized objects
          status: "Booked",
          createdAt: Date.now(),
        });
        // send confirmation
        await sendText(from, get("CONFIRMED_BOOKING", { id: s.pendingBooking.id }));
        s.pendingBooking = null;
        s.state = "IDLE";
        return res.sendStatus(200);
      }
      if (interactiveId === "EDIT_BOOK") {
        s.state = "BUS_TIME";
        // askTimePref inline:
        await sendList(
          from,
          get("EDIT_BOOK_PROMPT"),
          "Select",
          [
            {
              title: "Time slots",
              rows: [
                { id: "TIME_MORNING", title: get("TIME_MORNING") },
                { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
                { id: "TIME_EVENING", title: get("TIME_EVENING") },
                { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
              ],
            },
          ]
        );
        return res.sendStatus(200);
      }
      if (interactiveId === "CANCEL_BOOK") {
        s.pendingBooking = null;
        s.state = "IDLE";
        await sendText(from, get("CANCELLED"));
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
        await sendText(from, get("NO_BOOKING_FOUND", { id }));
      } else {
        await sendText(
          from,
          get("TRACK_STATUS_LINE", {
            id: id,
            from: found.from,
            to: found.to,
            date: found.date,
            status: found.status || "Pending",
          })
        );
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
        `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
        get("MAIN"),
        [
          {
            title: get("MAIN"),
            rows: [
              { id: "MENU_BOOK", title: get("MENU_BOOK") },
              { id: "MENU_TRACK", title: get("MENU_TRACK") },
              { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
              { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
              { id: "MENU_HELP", title: get("MENU_HELP") },
              { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
            ],
          },
        ]
      );
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("ERR:", err.response?.data || err.message);
    // always return 200 to the webhook provider to avoid retries
    res.sendStatus(200);
  }
}

module.exports = { handleWebhook };
