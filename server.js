// const express = require("express");
// const axios = require("axios");
// const dotenv = require("dotenv");
// dotenv.config();

// const app = express();
// app.use(express.json());


// const sendText = async (to, body) => {
//   await axios.post(
//     `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
//     { messaging_product: "whatsapp", to, text: { body } },
//     { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
//   );
// };

// const sendButtonsTrainBus = async (to) => {
//   await axios.post(
//     `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
//     {
//       messaging_product: "whatsapp",
//       to,
//       type: "interactive",
//       interactive: {
//         type: "button",
//         body: { text: "Welcome to Quickets! ⚡\nChoose an option to begin:" },
//         action: {
//           buttons: [
//             { type: "reply", reply: { id: "train_btn", title: "🚆 Train" } },
//             { type: "reply", reply: { id: "bus_btn", title: "🚌 Bus" } },
//           ],
//         },
//       },
//     },
//     { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
//   );
// };


// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   console.log("Mode:", mode);
//   console.log("Token from Meta:", token);
//   console.log("Our VERIFY_TOKEN:", process.env.VERIFY_TOKEN);

//   if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
//     return res.status(200).send(challenge);
//   }

//   return res.sendStatus(403);
// });


// // --- Webhook receiver (POST) --------------------------------
// app.post("/webhook", async (req, res) => {
//   try {
//     const entry = req.body.entry?.[0];
//     const changes = entry?.changes?.[0];
//     const value = changes?.value;
//     const msg = value?.messages?.[0];
//     if (!msg) return res.sendStatus(200);

//     const from = msg.from; // user's WA number
//     // 1) Handle text messages (e.g., "Book")
//     if (msg.type === "text") {
//       const text = msg.text.body.trim().toLowerCase();
//       if (text === "book") {
//         await sendButtonsTrainBus(from);
//       } else {
//         await sendText(
//           from,
//           `Welcome to Quickets! Type "Book" to start.`
//         );
//       }
//     }

//     // 2) Handle button replies
//     if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
//       const id = msg.interactive.button_reply.id;
//       if (id === "train_btn") {
//         await sendText(
//           from,
//           `Great! Let's book your train ✅\n\nPlease send:\n• From → To\n• Journey Date\n• Number of Passengers\n• Passenger Details (Name, Age, Gender)`
//         );
//       }
//       if (id === "bus_btn") {
//         await sendText(
//           from,
//           `Bus booking selected 🚌\n\nPlease send:\n• From → To\n• Travel Date\n• Preferred Time (Morning/Evening/Night)\n• Number of Seats`
//         );
//       }
//     }

//     res.sendStatus(200);
//   } catch (e) {
//     console.error(e.response?.data || e.message);
//     res.sendStatus(200);
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// ------------------------------ WhatsApp helpers ------------------------------
const WA_URL = (pid) => `https://graph.facebook.com/v20.0/${pid}/messages`;
const HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};

// Mask any phone we might echo (we generally avoid echoing numbers anyway)
const maskPhone = (p) => {
  if (!p) return "";
  const s = p.toString();
  if (s.length < 4) return "XXXX";
  return `+XX XXXXX ${s.slice(-4)}`;
};

const sendText = async (to, body) => {
  return axios.post(
    WA_URL(process.env.PHONE_NUMBER_ID),
    { messaging_product: "whatsapp", to, text: { body } },
    { headers: HEADERS }
  );
};

const sendButtons = async (to, text, buttons) => {
  // buttons: [{id, title}, ...] (max 3)
  return axios.post(
    WA_URL(process.env.PHONE_NUMBER_ID),
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    { headers: HEADERS }
  );
};

const sendList = async (to, headerText, bodyText, footerText, sectionTitle, rows) => {
  // rows: [{id, title, description?}, ...] (max 10 rows per section)
  return axios.post(
    WA_URL(process.env.PHONE_NUMBER_ID),
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        footer: footerText ? { text: footerText } : undefined,
        action: {
          button: "Choose",
          sections: [
            {
              title: sectionTitle,
              rows: rows.slice(0, 10).map((r) => ({
                id: r.id,
                title: r.title,
                description: r.description || undefined,
              })),
            },
          ],
        },
      },
    },
    { headers: HEADERS }
  );
};

// ------------------------------ In-memory data ------------------------------
/**
 * userState: Map<waNumber, {
 *   step: string,
 *   booking: {
 *     id?: string,
 *     from?: string,
 *     to?: string,
 *     date?: string,
 *     timePref?: string,
 *     paxCount?: number,
 *     seatType?: string,
 *     passengers?: Array<{name:string, age:number, gender:string}>
 *     status: 'pending'|'processing'|'booked'|'cancelled'
 *   }
 * }>
 */
const userState = new Map();

/**
 * passengersBook: Map<waNumber, Array<{name, age, gender}>>
 * (persist preferred passengers per user — limit 6)
 */
const passengersBook = new Map();

/**
 * bookings: Map<waNumber, Array<booking>>
 */
const bookings = new Map();

const MAX_PASSENGERS = 6;

// ------------------------------ Utilities ------------------------------
const newBookingId = () => `QK-${Math.floor(10000 + Math.random() * 89999)}`;
const ensureArrays = (wa) => {
  if (!bookings.has(wa)) bookings.set(wa, []);
  if (!passengersBook.has(wa)) passengersBook.set(wa, []);
};

const resetFlow = (wa) => {
  userState.set(wa, { step: "menu", booking: { status: "pending", passengers: [] } });
};

// ------------------------------ Menus & Flows ------------------------------
const MAIN_MENU_TEXT =
  "🎉 Welcome to Quickets!\n\nYour personal assistant for fast & reliable travel bookings.\nChoose an option to continue:";
const MAIN_MENU_BTNS = [
  { id: "menu_book", title: "✅ Book Tickets" },
  { id: "menu_track", title: "📦 Track Request" },
  { id: "menu_my", title: "🧾 My Bookings" },
];

const SECOND_MENU_BTNS = [
  { id: "menu_passengers", title: "👥 Passengers" },
  { id: "menu_help", title: "🆘 Help & Support" },
  { id: "menu_about", title: "ℹ️ About Quickets" },
];

const showMainMenu = async (wa) => {
  await sendButtons(wa, MAIN_MENU_TEXT, MAIN_MENU_BTNS);
  await sendButtons(wa, "More options:", SECOND_MENU_BTNS);
};

const BOOK_MODE_TEXT =
  "Choose booking type:";
const BOOK_MODE_BTNS = [
  { id: "book_bus", title: "🚌 Bus" },
  { id: "book_train", title: "🚆 Train (soon)" },
];

const TIME_ROWS = [
  { id: "time_morning", title: "Morning (5–12)" },
  { id: "time_afternoon", title: "Afternoon (12–5)" },
  { id: "time_evening", title: "Evening (5–9)" },
  { id: "time_night", title: "Night (9–5)" },
];

const SEAT_ROWS = [
  { id: "seat_SL", title: "SL (Sleeper)" },
  { id: "seat_3A", title: "3A (AC 3-Tier)" },
  { id: "seat_2A", title: "2A (AC 2-Tier)" },
  { id: "seat_1A", title: "1A (AC First)" },
];

const PAX_ROWS = Array.from({ length: MAX_PASSENGERS }, (_, i) => ({
  id: `pax_${i + 1}`,
  title: `${i + 1}`,
}));

const GENDER_ROWS = [
  { id: "gender_m", title: "Male" },
  { id: "gender_f", title: "Female" },
  { id: "gender_o", title: "Other" },
]);

// ------------------------------ Flow steps ------------------------------
const startBooking = async (wa) => {
  resetFlow(wa);
  const st = userState.get(wa);
  st.step = "choose_mode";
  await sendButtons(wa, BOOK_MODE_TEXT, BOOK_MODE_BTNS);
};

const askFrom = async (wa) => {
  const st = userState.get(wa);
  st.step = "ask_from";
  await sendText(wa, "📍 Enter *From* city (e.g., Chennai)");
};

const askTo = async (wa) => {
  const st = userState.get(wa);
  st.step = "ask_to";
  await sendText(wa, "🎯 Enter *To* city (e.g., Bangalore)");
};

const askDate = async (wa) => {
  const st = userState.get(wa);
  st.step = "ask_date";
  await sendText(wa, "🗓️ Enter *Journey Date* (e.g., 2025-11-15)");
};

const askTimePref = async (wa) => {
  const st = userState.get(wa);
  st.step = "ask_time";
  await sendList(wa, "Time Preference", "Choose your preferred time:", "", "Time", TIME_ROWS);
};

const askPaxCount = async (wa) => {
  const st = userState.get(wa);
  st.step = "ask_pax";
  await sendList(wa, "Passengers", "How many seats do you need?", "", "Count", PAX_ROWS);
};

const askSeatType = async (wa) => {
  const st = userState.get(wa);
  st.step = "ask_seat";
  await sendList(wa, "Seat Type", "Choose class/seat type:", "", "Seat", SEAT_ROWS);
};

const confirmSummary = async (wa) => {
  const st = userState.get(wa);
  const b = st.booking;
  const summary =
    `Please confirm your request:\n\n` +
    `From: *${b.from || "-"}*\n` +
    `To: *${b.to || "-"}*\n` +
    `Date: *${b.date || "-"}*\n` +
    `Time: *${b.timePref || "-"}*\n` +
    `Passengers: *${b.paxCount || "-"}*\n` +
    `Seat Type: *${b.seatType || "-"}*\n\n` +
    `Add passengers now (profiles) or confirm?`;

  st.step = "confirm_summary";
  await sendButtons(wa, summary, [
    { id: "confirm_submit", title: "✅ Confirm" },
    { id: "confirm_addpax", title: "👥 Add Passengers" },
    { id: "confirm_cancel", title: "❌ Cancel" },
  ]);
};

const storePending = (wa) => {
  ensureArrays(wa);
  const st = userState.get(wa);
  const b = st.booking;
  b.id = newBookingId();
  b.status = "pending";
  bookings.get(wa).push({ ...b });
  return b.id;
};

// ------------------------------ Passengers (profiles, up to 6) ------------------------------
const showPassengers = async (wa) => {
  ensureArrays(wa);
  const list = passengersBook.get(wa);
  if (!list.length) {
    await sendButtons(wa, "No saved passengers yet. Add up to 6.", [
      { id: "pax_add", title: "➕ Add Passenger" },
      { id: "menu_home", title: "🏠 Main Menu" },
    ]);
  } else {
    const lines = list
      .map((p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`)
      .join("\n");
    await sendButtons(wa, `Saved Passengers:\n\n${lines}\n\nManage:`, [
      { id: "pax_add", title: "➕ Add" },
      { id: "pax_del", title: "🗑️ Delete" },
      { id: "menu_home", title: "🏠 Menu" },
    ]);
  }
};

const addPassenger_Start = async (wa) => {
  const list = passengersBook.get(wa) || [];
  if (list.length >= MAX_PASSENGERS) {
    await sendButtons(wa, `You already have ${MAX_PASSENGERS} passengers saved.`, [
      { id: "menu_home", title: "🏠 Menu" },
    ]);
    return;
  }
  userState.set(wa, { step: "pax_name", booking: { status: "pending", passengers: [] } });
  await sendText(wa, "Enter passenger *name*:");
};

const addPassenger_AskAge = async (wa) => {
  const st = userState.get(wa);
  st.step = "pax_age";
  await sendText(wa, "Enter passenger *age*:");
};

const addPassenger_AskGender = async (wa) => {
  const st = userState.get(wa);
  st.step = "pax_gender";
  await sendList(wa, "Gender", "Select gender:", "", "Gender", GENDER_ROWS);
};

const addPassenger_Save = async (wa, p) => {
  ensureArrays(wa);
  const list = passengersBook.get(wa);
  if (list.length >= MAX_PASSENGERS) {
    await sendButtons(wa, `Limit reached (${MAX_PASSENGERS}).`, [{ id: "menu_home", title: "🏠 Menu" }]);
    return;
  }
  list.push(p);
  passengersBook.set(wa, list);
  await sendButtons(wa, `Saved: ${p.name}, ${p.age}, ${p.gender}\nAdd more?`, [
    { id: "pax_add", title: "➕ Add More" },
    { id: "menu_home", title: "🏠 Main Menu" },
  ]);
};

// ------------------------------ Handlers ------------------------------
const onAnyGreeting = async (wa) => {
  resetFlow(wa);
  await showMainMenu(wa);
};

const onTrack = async (wa) => {
  userState.set(wa, { step: "track_ask", booking: { status: "pending", passengers: [] } });
  await sendText(wa, "Enter your *Booking ID* (e.g., QK-48231):");
};

const onMyBookings = async (wa) => {
  ensureArrays(wa);
  const list = bookings.get(wa);
  if (!list.length) {
    await sendButtons(wa, "No bookings found for your number.", [
      { id: "menu_book", title: "✅ Book Tickets" },
      { id: "menu_home", title: "🏠 Main Menu" },
    ]);
    return;
  }
  const lines = list
    .map(
      (b) =>
        `${b.id} — ${b.from} → ${b.to} | ${b.paxCount} seats | ${b.seatType || "-"} | ${b.timePref || "-"} | ${b.date} | ${b.status}`
    )
    .join("\n");
  await sendButtons(wa, `Your bookings:\n\n${lines}`, [{ id: "menu_home", title: "🏠 Main Menu" }]);
};

const onHelp = async (wa) => {
  await sendButtons(
    wa,
    "Help & Support:\n\n• Support hours: 9am–9pm IST\n• Refund policy: As per operator/IR rules\n\nNeed more?",
    [
      { id: "help_chat", title: "💬 Chat with Agent" },
      { id: "menu_home", title: "🏠 Main Menu" },
    ]
  );
};

const onAbout = async (wa) => {
  await sendButtons(
    wa,
    "About Quickets:\n\nWe help you book tickets fast with clear, button-based steps.\nNo confusion — just travel made simple.",
    [{ id: "menu_home", title: "🏠 Main Menu" }]
  );
};

// ------------------------------ Webhook: VERIFY ------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Mode:", mode);
  console.log("Token from Meta:", token);
  console.log("Our VERIFY_TOKEN:", process.env.VERIFY_TOKEN);

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ------------------------------ Webhook: MESSAGES ------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const wa = msg.from; // user's WA number
    ensureArrays(wa);
    if (!userState.has(wa)) resetFlow(wa);
    const st = userState.get(wa);

    // TEXT messages
    if (msg.type === "text") {
      const text = (msg.text.body || "").trim();

      // Global shortcuts to open menu
      const low = text.toLowerCase();
      if (["hi", "hello", "start", "menu", "book"].includes(low)) {
        if (low === "book") {
          await startBooking(wa);
        } else {
          await onAnyGreeting(wa);
        }
        return res.sendStatus(200);
      }

      // Step-by-step free-form inputs
      if (st.step === "ask_from") {
        st.booking.from = text;
        return (await askTo(wa)), res.sendStatus(200);
      }
      if (st.step === "ask_to") {
        st.booking.to = text;
        return (await askDate(wa)), res.sendStatus(200);
      }
      if (st.step === "ask_date") {
        st.booking.date = text;
        return (await askTimePref(wa)), res.sendStatus(200);
      }

      // Passenger profile creation
      if (st.step === "pax_name") {
        st.tmpPassenger = { name: text };
        return (await addPassenger_AskAge(wa)), res.sendStatus(200);
      }
      if (st.step === "pax_age") {
        const age = parseInt(text, 10);
        if (isNaN(age) || age <= 0 || age > 120) {
          await sendText(wa, "Please enter a valid age (number).");
          return res.sendStatus(200);
        }
        st.tmpPassenger.age = age;
        return (await addPassenger_AskGender(wa)), res.sendStatus(200);
      }

      // Track booking
      if (st.step === "track_ask") {
        const id = text.toUpperCase().trim();
        const list = bookings.get(wa);
        const found = list.find((b) => b.id === id);
        if (!found) {
          await sendButtons(wa, "Booking not found.", [
            { id: "menu_my", title: "🧾 My Bookings" },
            { id: "menu_home", title: "🏠 Menu" },
          ]);
          return res.sendStatus(200);
        }
        await sendButtons(
          wa,
          `Status for ${found.id}:\n${found.from} → ${found.to} on ${found.date}\nStatus: *${found.status.toUpperCase()}*`,
          [{ id: "menu_home", title: "🏠 Main Menu" }]
        );
        resetFlow(wa);
        return res.sendStatus(200);
      }

      // Default
      await showMainMenu(wa);
      return res.sendStatus(200);
    }

    // INTERACTIVE: button replies & list selections
    if (msg.type === "interactive") {
      if (msg.interactive.type === "button_reply") {
        const id = msg.interactive.button_reply.id;

        // Main menu choices
        if (id === "menu_book") return (await startBooking(wa)), res.sendStatus(200);
        if (id === "menu_track") return (await onTrack(wa)), res.sendStatus(200);
        if (id === "menu_my") return (await onMyBookings(wa)), res.sendStatus(200);
        if (id === "menu_passengers") return (await showPassengers(wa)), res.sendStatus(200);
        if (id === "menu_help") return (await onHelp(wa)), res.sendStatus(200);
        if (id === "menu_about") return (await onAbout(wa)), res.sendStatus(200);
        if (id === "menu_home") return (await showMainMenu(wa)), res.sendStatus(200);

        // Booking mode
        if (id === "book_bus") {
          st.step = "book_bus";
          st.booking = { status: "pending", passengers: [] };
          return (await askFrom(wa)), res.sendStatus(200);
        }
        if (id === "book_train") {
          await sendButtons(wa, "Train flow coming soon. Use Bus for now.", [
            { id: "book_bus", title: "🚌 Bus" },
            { id: "menu_home", title: "🏠 Menu" },
          ]);
          return res.sendStatus(200);
        }

        // Confirmation buttons
        if (id === "confirm_submit") {
          const newId = storePending(wa);
          await sendButtons(
            wa,
            `✅ Request submitted!\n\nBooking ID: *${newId}*\nStatus: *PENDING*\n\nWe’ll process and update you here.`,
            [{ id: "menu_home", title: "🏠 Main Menu" }]
          );
          resetFlow(wa);
          return res.sendStatus(200);
        }
        if (id === "confirm_addpax") {
          await showPassengers(wa);
          return res.sendStatus(200);
        }
        if (id === "confirm_cancel") {
          resetFlow(wa);
          await sendButtons(wa, "Cancelled. What next?", [
            { id: "menu_book", title: "✅ Book Tickets" },
            { id: "menu_home", title: "🏠 Main Menu" },
          ]);
          return res.sendStatus(200);
        }

        // Passengers management
        if (id === "pax_add") {
          await addPassenger_Start(wa);
          return res.sendStatus(200);
        }
        if (id === "pax_del") {
          const list = passengersBook.get(wa);
          if (!list.length) {
            await sendButtons(wa, "No passengers to delete.", [{ id: "menu_home", title: "🏠 Menu" }]);
          } else {
            // show list rows to delete
            const rows = list.map((p, i) => ({ id: `pax_del_${i}`, title: `${i + 1}. ${p.name}` }));
            await sendList(wa, "Delete Passenger", "Choose one to delete:", "", "Saved", rows);
          }
          return res.sendStatus(200);
        }

        // Help
        if (id === "help_chat") {
          await sendButtons(wa, "An agent will contact you here soon. Anything else?", [
            { id: "menu_home", title: "🏠 Main Menu" },
          ]);
          return res.sendStatus(200);
        }

        // Fallback to menu
        await showMainMenu(wa);
        return res.sendStatus(200);
      }

      if (msg.interactive.type === "list_reply") {
        const sel = msg.interactive.list_reply;
        const id = sel.id;

        // Time preference
        if (id.startsWith("time_")) {
          const map = {
            time_morning: "Morning",
            time_afternoon: "Afternoon",
            time_evening: "Evening",
            time_night: "Night",
          };
          userState.get(wa).booking.timePref = map[id] || sel.title;
          await askPaxCount(wa);
          return res.sendStatus(200);
        }

        // Passenger count
        if (id.startsWith("pax_")) {
          const n = parseInt(id.split("_")[1], 10);
          userState.get(wa).booking.paxCount = n;
          await askSeatType(wa);
          return res.sendStatus(200);
        }

        // Seat type
        if (id.startsWith("seat_")) {
          const stype = id.replace("seat_", "").toUpperCase();
          userState.get(wa).booking.seatType = stype;
          await confirmSummary(wa);
          return res.sendStatus(200);
        }

        // Passenger gender select (for profile creation)
        if (id.startsWith("gender_")) {
          const st = userState.get(wa);
          const gMap = { gender_m: "Male", gender_f: "Female", gender_o: "Other" };
          st.tmpPassenger.gender = gMap[id] || "Other";
          await addPassenger_Save(wa, st.tmpPassenger);
          resetFlow(wa);
          return res.sendStatus(200);
        }

        // Delete passenger
        if (id.startsWith("pax_del_")) {
          const idx = parseInt(id.split("_")[2], 10);
          const list = passengersBook.get(wa);
          if (!isNaN(idx) && list[idx]) {
            const gone = list.splice(idx, 1)[0];
            passengersBook.set(wa, list);
            await sendButtons(wa, `Deleted: ${gone.name}.`, [
              { id: "menu_passengers", title: "👥 Passengers" },
              { id: "menu_home", title: "🏠 Menu" },
            ]);
            resetFlow(wa);
            return res.sendStatus(200);
          }
        }

        // Default
        await showMainMenu(wa);
        return res.sendStatus(200);
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("ERR:", e.response?.data || e.message);
    res.sendStatus(200);
  }
});

// ------------------------------ Start ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));
