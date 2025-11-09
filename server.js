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

// ======================= Helpers ===========================
const WA_URL = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;
const AUTH = { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };

async function sendText(to, body) {
  return axios.post(WA_URL, {
    messaging_product: "whatsapp",
    to,
    text: { body }
  }, { headers: AUTH });
}

async function sendButtons(to, bodyText, buttons) {
  // buttons: [{id:'x', title:'Title'}, ...] max 3
  const btns = buttons.slice(0, 3).map(b => ({
    type: "reply",
    reply: { id: b.id, title: b.title }
  }));
  return axios.post(WA_URL, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: btns }
    }
  }, { headers: AUTH });
}

async function sendList(to, bodyText, rows, buttonText = "Choose") {
  // rows: [{id, title, description?}, ...]
  return axios.post(WA_URL, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: [
          {
            title: "Options",
            rows: rows.map(r => ({
              id: r.id, title: r.title, description: r.description || ""
            }))
          }
        ]
      }
    }
  }, { headers: AUTH });
}

function mask(msisdn) {
  // auto-mask example: +91 XXXXX 0952
  if (!msisdn) return "";
  const d = msisdn.replace(/\D/g, "");
  if (d.length < 4) return "XXXX";
  return `+${d.slice(0, 2)} XXXXX ${d.slice(-4)}`;
}

// =============== In-memory "DB" & Session ===================
/**
 * db.passengers[waId] = [{name, age, gender}, ...]   (max 6)
 * db.bookings = [{id, waId, type:'BUS'|'TRAIN', from, to, date, timePref, paxCount,
 *                 seatAc:'AC'|'NON-AC', seatKind:'SLEEPER'|'SEATER',
 *                 passengers:[{...}], status:'PENDING'|'BOOKED'|'CANCELLED', createdAt }]
 */
const db = { passengers: {}, bookings: [] };

/**
 * session[waId] =
 *   { step, draft: { ... }, mode: 'ADD_PASSENGERS_ONEBYONE'|'BOOK_BUS'|'BOOK_TRAIN'|null }
 */
const session = new Map();

function ensureSession(waId) {
  if (!session.get(waId)) {
    session.set(waId, { step: null, mode: null, draft: {} });
  }
  return session.get(waId);
}

function resetFlow(waId) {
  session.set(waId, { step: null, mode: null, draft: {} });
}

function newBookingId() {
  const n = Math.floor(Math.random() * 90000) + 10000;
  return `QK-${n}`;
}

// ================== Menus & Flow ============================
async function sendMainMenu(to) {
  return sendList(to,
    `🎉 Welcome to Quickets!\n\nYour personal assistant for fast & reliable travel bookings.\nChoose an option to continue:`,
    [
      { id: "MENU_BOOK", title: "1) Book Tickets", description: "Bus tickets (Train coming soon)" },
      { id: "MENU_TRACK", title: "2) Track Request", description: "Check your booking status" },
      { id: "MENU_MYBK", title: "3) My Bookings", description: "View bookings for your number" },
      { id: "MENU_HELP", title: "4) Help & Support", description: "Support chat, email, refund policy" },
      { id: "MENU_ABOUT", title: "5) About Quickets", description: "Brand & service info" },
      { id: "MENU_PAX", title: "6) Add Passengers", description: "Save frequent passengers (up to 6)" }
    ],
    "Open Menu"
  );
}

async function startBookMenu(to, waId) {
  const s = ensureSession(waId);
  s.mode = null; // just selecting domain
  return sendButtons(to,
    "What would you like to book?",
    [
      { id: "BOOK_TRAIN", title: "🚆 Train" },
      { id: "BOOK_BUS", title: "🚌 Bus" },
      { id: "BOOK_BACK", title: "⬅️ Back" }
    ]
  );
}

// ================== Booking (BUS) ===========================
async function beginBusBooking(to, waId) {
  const s = ensureSession(waId);
  s.mode = "BOOK_BUS";
  s.step = "BUS_FROM";
  s.draft = { type: "BUS" };
  return sendText(to, "From city? (e.g., Hyderabad)");
}

async function busFlowHandleText(to, waId, text) {
  const s = ensureSession(waId);
  switch (s.step) {
    case "BUS_FROM":
      s.draft.from = text;
      s.step = "BUS_TO";
      return sendText(to, "To city? (e.g., Visakhapatnam)");

    case "BUS_TO":
      s.draft.to = text;
      s.step = "BUS_DATE";
      return sendText(to, "Journey Date? (e.g., 24 Feb 2026 or 2026-02-24)");

    case "BUS_DATE":
      s.draft.date = text;
      s.step = "BUS_TIME";
      // Time preference as list (Any/Morning/Evening/Night)
      return sendList(to, "Pick a time preference:", [
        { id: "TIME_ANY", title: "Any" },
        { id: "TIME_MORNING", title: "Morning (5am–12pm)" },
        { id: "TIME_EVENING", title: "Evening (5pm–9pm)" },
        { id: "TIME_NIGHT", title: "Night (9pm–2am)" }
      ], "Select");

    case "BUS_PAX_MANUAL":
      // Parse manual passenger list (Name Age Gender per line)
      // Example lines:
      // Rahul 28 M
      // Anika 24 F
      {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const parsed = [];
        for (const line of lines) {
          const m = line.match(/^([A-Za-z .'-]+)\s+(\d{1,2})\s+([MFmf])$/);
          if (!m) continue;
          parsed.push({ name: m[1], age: Number(m[2]), gender: m[3].toUpperCase() });
        }
        if (parsed.length === 0) {
          return sendText(to,
            "Couldn’t parse passengers. Use format:\nName Age Gender\nExample:\nRahul 28 M\nAnika 24 F"
          );
        }
        if (parsed.length > 6) {
          return sendText(to, "Max 6 passengers allowed. Please send up to 6 lines.");
        }
        s.draft.passengers = parsed;
        return showBusSummary(to, waId);
      }

    case "BUS_PAX_ONEBYONE_NAME":
      s._tmpPassenger = { name: text };
      s.step = "BUS_PAX_ONEBYONE_AGE";
      return sendText(to, "Age?");

    case "BUS_PAX_ONEBYONE_AGE":
      if (!/^\d{1,2}$/.test(text)) return sendText(to, "Please enter a valid age (number).");
      s._tmpPassenger.age = Number(text);
      s.step = "BUS_PAX_ONEBYONE_GENDER";
      return sendButtons(to, "Gender?", [
        { id: "PAX_G_M", title: "Male" },
        { id: "PAX_G_F", title: "Female" }
      ]);

    default:
      // Any other text while in BUS flow
      return sendText(to, "Got it. Please continue using the options shown.");
  }
}

async function busFlowHandleButton(to, waId, id) {
  const s = ensureSession(waId);

  // handle time pref
  if (s.mode === "BOOK_BUS" && s.step === "BUS_TIME") {
    const map = {
      "TIME_ANY": "Any",
      "TIME_MORNING": "Morning",
      "TIME_EVENING": "Evening",
      "TIME_NIGHT": "Night"
    };
    if (map[id]) {
      s.draft.timePref = map[id];
      s.step = "BUS_PAX_COUNT";
      // ask pax count (buttons up to 3 → we’ll do 1,2,3 then list for more)
      return sendButtons(to, "How many passengers?", [
        { id: "PAX_1", title: "1" },
        { id: "PAX_2", title: "2" },
        { id: "PAX_3", title: "3" }
      ]);
    }
  }

  // passenger count (1–3 via buttons, else list)
  if (s.mode === "BOOK_BUS" && s.step === "BUS_PAX_COUNT") {
    if (id.startsWith("PAX_")) {
      const c = Number(id.split("_")[1]);
      s.draft.paxCount = c;
      s.step = "BUS_SEAT_AC";
      return sendButtons(to, "AC preference?", [
        { id: "AC", title: "AC" },
        { id: "NONAC", title: "Non-AC" }
      ]);
    }
  }

  // AC vs Non-AC
  if (s.mode === "BOOK_BUS" && s.step === "BUS_SEAT_AC") {
    if (id === "AC" || id === "NONAC") {
      s.draft.seatAc = id === "AC" ? "AC" : "NON-AC";
      s.step = "BUS_SEAT_KIND";
      return sendButtons(to, "Seat type?", [
        { id: "SLEEPER", title: "Sleeper" },
        { id: "SEATER", title: "Seater" }
      ]);
    }
  }

  // Sleeper/Seater
  if (s.mode === "BOOK_BUS" && s.step === "BUS_SEAT_KIND") {
    if (id === "SLEEPER" || id === "SEATER") {
      s.draft.seatKind = id;
      s.step = "BUS_PAX_MODE";
      return sendButtons(to,
        "How would you like to enter passenger details?",
        [
          { id: "PAX_MANUAL", title: "Manual (fast 1 msg)" },
          { id: "PAX_ONEBYONE", title: "One-by-one (easy)" }
        ]
      );
    }
  }

  // Passenger entry mode
  if (s.mode === "BOOK_BUS" && s.step === "BUS_PAX_MODE") {
    if (id === "PAX_MANUAL") {
      s.step = "BUS_PAX_MANUAL";
      return sendText(to,
        "Send passengers in this format (one per line):\n\nName Age Gender\nExample:\nRahul 28 M\nAnika 24 F\n\n(Max 6)"
      );
    }
    if (id === "PAX_ONEBYONE") {
      s.draft.passengers = [];
      s.step = "BUS_PAX_ONEBYONE_NAME";
      return sendText(to, `Passenger 1 name?`);
    }
  }

  // One-by-one gender pick
  if (s.mode === "BOOK_BUS" && s.step === "BUS_PAX_ONEBYONE_GENDER") {
    if (id === "PAX_G_M" || id === "PAX_G_F") {
      s._tmpPassenger.gender = (id === "PAX_G_M") ? "M" : "F";
      s.draft.passengers.push(s._tmpPassenger);
      s._tmpPassenger = null;

      if (s.draft.passengers.length < (s.draft.paxCount || 1)) {
        s.step = "BUS_PAX_ONEBYONE_NAME";
        return sendText(to, `Passenger ${s.draft.passengers.length + 1} name?`);
      } else {
        // collected all
        return showBusSummary(to, waId);
      }
    }
  }

  // Summary confirm
  if (s.mode === "BOOK_BUS" && s.step === "BUS_SUMMARY") {
    if (id === "CONFIRM_BOOK") {
      const booking = {
        id: newBookingId(),
        waId,
        type: "BUS",
        ...s.draft,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };
      db.bookings.push(booking);
      resetFlow(waId);
      return sendText(to,
        `✅ Booking created as *PENDING*.\nID: ${booking.id}\nWe’ll process and update status soon.\n\nUse “Track Request” to check status.`
      );
    }
    if (id === "EDIT_BOOK") {
      s.step = "BUS_FROM";
      return sendText(to, "Okay, let’s edit. From city?");
    }
    if (id === "CANCEL_BOOK") {
      resetFlow(waId);
      return sendMainMenu(to);
    }
  }

  return sendText(to, "Please use the options shown.");
}

async function showBusSummary(to, waId) {
  const s = ensureSession(waId);
  s.step = "BUS_SUMMARY";
  const d = s.draft;
  const paxLines = (d.passengers || []).map(
    (p, i) => `${i + 1}. ${p.name} ${p.age} ${p.gender}`
  ).join("\n") || "(not provided)";

  const summary =
    `Please review your details:\n\n` +
    `From: ${d.from}\n` +
    `To: ${d.to}\n` +
    `Date: ${d.date}\n` +
    `Time: ${d.timePref}\n` +
    `Passengers: ${d.paxCount || (d.passengers ? d.passengers.length : 0)}\n` +
    `Seat: ${d.seatAc} / ${d.seatKind}\n\n` +
    `Passenger Details:\n${paxLines}\n\n` +
    `Confirm to create a PENDING booking.`;

  return sendButtons(to, summary, [
    { id: "CONFIRM_BOOK", title: "✅ Confirm" },
    { id: "EDIT_BOOK", title: "✏️ Edit" },
    { id: "CANCEL_BOOK", title: "❌ Cancel" }
  ]);
}

// ================== Passengers Vault ========================
async function startAddPassengers(to, waId) {
  const s = ensureSession(waId);
  s.mode = "ADD_PASSENGERS";
  s.step = "PAX_ADD_MODE";
  return sendButtons(to, "Add passengers (max 6 saved). Choose a method:", [
    { id: "PAX_ADD_MANUAL", title: "Manual (fast)" },
    { id: "PAX_ADD_ONEBYONE", title: "One-by-one" },
    { id: "PAX_ADD_CANCEL", title: "Cancel" }
  ]);
}

async function paxFlowHandleText(to, waId, text) {
  const s = ensureSession(waId);
  const arr = db.passengers[waId] || [];

  switch (s.step) {
    case "PAX_ADD_MANUAL_TEXT": {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const parsed = [];
      for (const line of lines) {
        const m = line.match(/^([A-Za-z .'-]+)\s+(\d{1,2})\s+([MFmf])$/);
        if (!m) continue;
        parsed.push({ name: m[1], age: Number(m[2]), gender: m[3].toUpperCase() });
      }
      if (parsed.length === 0) {
        return sendText(to,
          "Couldn’t parse. Use format:\nName Age Gender\nExample:\nRahul 28 M\nAnika 24 F"
        );
      }
      const room = Math.max(0, 6 - arr.length);
      const toAdd = parsed.slice(0, room);
      db.passengers[waId] = [...arr, ...toAdd];
      resetFlow(waId);
      return sendText(to,
        `✅ Saved ${toAdd.length} passengers. Total stored: ${db.passengers[waId].length}/6.`
      );
    }

    case "PAX_ADD_ONE_NAME":
      s._tmpPassenger = { name: text };
      s.step = "PAX_ADD_ONE_AGE";
      return sendText(to, "Age?");
    case "PAX_ADD_ONE_AGE":
      if (!/^\d{1,2}$/.test(text)) return sendText(to, "Enter a valid age (number).");
      s._tmpPassenger.age = Number(text);
      s.step = "PAX_ADD_ONE_GENDER";
      return sendButtons(to, "Gender?", [
        { id: "PAX_V_G_M", title: "Male" },
        { id: "PAX_V_G_F", title: "Female" }
      ]);
  }
  return sendText(to, "Please continue using the options shown.");
}

async function paxFlowHandleButton(to, waId, id) {
  const s = ensureSession(waId);
  const arr = db.passengers[waId] || [];

  if (s.step === "PAX_ADD_MODE") {
    if (id === "PAX_ADD_CANCEL") {
      resetFlow(waId);
      return sendMainMenu(to);
    }
    if (id === "PAX_ADD_MANUAL") {
      s.step = "PAX_ADD_MANUAL_TEXT";
      return sendText(to,
        "Send passengers in this format (one per line):\n\nName Age Gender\nExample:\nRahul 28 M\nAnika 24 F\n\n(Max total 6 saved)"
      );
    }
    if (id === "PAX_ADD_ONEBYONE") {
      if ((arr.length || 0) >= 6) {
        resetFlow(waId);
        return sendText(to, "You already have 6 saved passengers.");
      }
      s.step = "PAX_ADD_ONE_NAME";
      return sendText(to, "Passenger name?");
    }
  }

  if (s.step === "PAX_ADD_ONE_GENDER") {
    if (id === "PAX_V_G_M" || id === "PAX_V_G_F") {
      s._tmpPassenger.gender = (id === "PAX_V_G_M") ? "M" : "F";
      db.passengers[waId] = [...(db.passengers[waId] || []), s._tmpPassenger].slice(0, 6);
      s._tmpPassenger = null;

      if (db.passengers[waId].length >= 6) {
        resetFlow(waId);
        return sendText(to, "✅ Saved. You now have 6/6 passengers stored.");
      } else {
        // ask to add another
        s.step = "PAX_ADD_MODE";
        return sendButtons(to, `✅ Saved. You now have ${db.passengers[waId].length}/6.\nAdd another?`, [
          { id: "PAX_ADD_ONEBYONE", title: "Add another" },
          { id: "PAX_ADD_MANUAL", title: "Manual" },
          { id: "PAX_ADD_CANCEL", title: "Done" }
        ]);
      }
    }
  }

  return sendText(to, "Please use the options provided.");
}

// ================== Other Menus Handlers ====================
async function showMyBookings(to, waId) {
  const items = db.bookings.filter(b => b.waId === waId);
  if (!items.length) return sendText(to, "You have no bookings yet.");
  const lines = items.map(b => {
    const core = `${b.date}: ${b.from} → ${b.to} | ${b.paxCount || (b.passengers?.length || 0)} seats | ${b.seatAc}/${b.seatKind} | ${b.timePref}`;
    return `${b.id} — ${core} — ${b.status}`;
  }).join("\n");
  return sendText(to, `📒 Your bookings:\n${lines}`);
}

async function startTrack(to, waId) {
  const s = ensureSession(waId);
  s.mode = "TRACK";
  s.step = "TRACK_ID";
  return sendText(to, "Enter your Booking ID (e.g., QK-12345)");
}

async function handleTrackText(to, waId, text) {
  const id = text.trim().toUpperCase();
  const hit = db.bookings.find(b => b.id === id && b.waId === waId);
  if (!hit) return sendText(to, "Not found. Check the ID and try again.");
  return sendText(to, `Status for ${hit.id}: ${hit.status}`);
}

async function showHelp(to) {
  return sendText(to,
    "Help & Support\n\n" +
    "• Chat: This WhatsApp\n" +
    "• Email: support@quickets.example\n" +
    "• Hours: 9am–9pm IST\n" +
    "• Refund: As per operator policy"
  );
}

async function showAbout(to) {
  return sendText(to,
    "About Quickets\n\n" +
    "We help you book tickets fast with minimal hassle.\n" +
    "Reliable, simple, and easy — powered by automation."
  );
}

// ================== WhatsApp Webhook ========================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from; // E.164 string without +
    const waId = from;     // we use raw as key (server side only)

    // Route incoming message types
    if (msg.type === "text") {
      const text = msg.text.body.trim().toLowerCase();

      // If in a flow, route to that flow first
      const s = ensureSession(waId);

      if (s.mode === "BOOK_BUS") {
        await busFlowHandleText(from, waId, msg.text.body.trim());
        return res.sendStatus(200);
      }
      if (s.mode === "ADD_PASSENGERS") {
        await paxFlowHandleText(from, waId, msg.text.body.trim());
        return res.sendStatus(200);
      }
      if (s.mode === "TRACK" && s.step === "TRACK_ID") {
        await handleTrackText(from, waId, msg.text.body.trim());
        return res.sendStatus(200);
      }

      // Any general text → show Main Menu (brand)
      await sendMainMenu(from);
      return res.sendStatus(200);
    }

    if (msg.type === "interactive") {
      // Button reply
      if (msg.interactive.type === "button_reply") {
        const id = msg.interactive.button_reply.id;
        const s = ensureSession(waId);

        // Global book menu navigation
        if (id === "BOOK_BACK") {
          resetFlow(waId);
          await sendMainMenu(from);
          return res.sendStatus(200);
        }
        if (id === "BOOK_BUS") {
          await beginBusBooking(from, waId);
          return res.sendStatus(200);
        }
        if (id === "BOOK_TRAIN") {
          // Train coming soon
          await sendText(from, "🚆 Train booking coming soon. Please use Bus for now.");
          return res.sendStatus(200);
        }

        // If inside Bus booking flow
        if (ensureSession(waId).mode === "BOOK_BUS") {
          await busFlowHandleButton(from, waId, id);
          return res.sendStatus(200);
        }

        // If inside passenger vault flow
        if (ensureSession(waId).mode === "ADD_PASSENGERS") {
          await paxFlowHandleButton(from, waId, id);
          return res.sendStatus(200);
        }

        // Fallback
        await sendText(from, "Please use the options shown.");
        return res.sendStatus(200);
      }

      // List reply
      if (msg.interactive.type === "list_reply") {
        const id = msg.interactive.list_reply.id;
        switch (id) {
          case "MENU_BOOK":
            await startBookMenu(from, waId);
            break;

          case "MENU_TRACK":
            await startTrack(from, waId);
            break;

          case "MENU_MYBK":
            await showMyBookings(from, waId);
            break;

          case "MENU_HELP":
            await showHelp(from);
            break;

          case "MENU_ABOUT":
            await showAbout(from);
            break;

          case "MENU_PAX":
            await startAddPassengers(from, waId);
            break;

          default:
            await sendText(from, "Please choose one of the available options.");
        }
        return res.sendStatus(200);
      }
    }

    // If we get here, unhandled type (image/audio/etc)
    await sendMainMenu(from);
    res.sendStatus(200);

  } catch (e) {
    console.error(e.response?.data || e.message);
    res.sendStatus(200);
  }
});

// ================== Start ===========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));
