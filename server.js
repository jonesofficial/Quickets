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

// Quickets – Brand Mode WhatsApp Bot
// Render-ready Node.js server (buttons + lists + JSON storage)

const express = require("express");
const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(express.json());

// ====== Config ======
const GRAPH_URL = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;
const WA_HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  "Content-Type": "application/json",
};

const SUPPORT_WHATSAPP = process.env.SUPPORT_WHATSAPP || "https://wa.me/91XXXXXXXXXX";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "support@quickets.app";

// ====== Simple JSON DB (ephemeral on Render; good for prototype) ======
const DB_FILE = "./data.json";
function loadDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (_) {
    return { states: {}, bookings: [] }; // {states: {user: {...}}, bookings:[{...}]}
  }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
let DB = loadDB();

// ====== Helpers: senders ======
async function sendText(to, body) {
  await axios.post(
    GRAPH_URL,
    { messaging_product: "whatsapp", to, text: { body } },
    { headers: WA_HEADERS }
  );
}

async function sendButtons(to, text, buttons /* [{id,title},...] max 3 */) {
  const payloadButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: { id: b.id, title: b.title },
  }));
  await axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: { buttons: payloadButtons },
      },
    },
    { headers: WA_HEADERS }
  );
}

// For >3 options, use interactive list
async function sendList(to, text, buttonText, rows /* [{id,title,description?}] */) {
  const section = {
    title: "Options",
    rows: rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description || "",
    })),
  };
  await axios.post(
    GRAPH_URL,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text },
        action: { button: buttonText || "Select", sections: [section] },
      },
    },
    { headers: WA_HEADERS }
  );
}

// ====== Booking flow helpers ======
function newState() {
  return {
    mode: "bus",
    step: "idle", // idle | from | to | date | time | pax | seat | confirm
    booking: {
      kind: "Bus",
      from: "",
      to: "",
      date: "",
      timePref: "",
      passengers: "",
      seatType: "",
      status: "Pending",
      id: "",
    },
  };
}

function genId() {
  return `QK-${Math.floor(10000 + Math.random() * 89999)}`;
}

async function showMainMenu(to) {
  await sendButtons(to, "🎉 Welcome to *Quickets*!\nYour personal assistant for fast & reliable travel bookings.\n\nChoose an option:", [
    { id: "menu_book", title: "✅ Book Tickets" },
    { id: "menu_track", title: "🔎 Track Request" },
    { id: "menu_my", title: "📚 My Bookings" },
  ]);
  // Tip text for extras
  await sendText(to, "Need help? Type *help* or *about* anytime.");
}

async function startBookFlow(to) {
  const state = DB.states[to] || newState();
  state.step = "from";
  state.booking = { ...state.booking, kind: "Bus" };
  DB.states[to] = state;
  saveDB(DB);
  await sendText(to, "🚌 *Bus booking selected*.\n\nPlease enter *From* (city).");
}

async function askTo(to) {
  const s = DB.states[to];
  s.step = "to";
  saveDB(DB);
  await sendText(to, "Great! Now enter *To* (city).");
}

async function askDate(to) {
  const s = DB.states[to];
  s.step = "date";
  saveDB(DB);
  await sendText(to, "📅 Enter *Travel Date* in format: *DD-MM-YYYY* (e.g., 12-11-2025).");
}

// For time preference (4+ options) use list
async function askTime(to) {
  const s = DB.states[to];
  s.step = "time";
  saveDB(DB);
  await sendList(to, "⏰ Choose *time preference*:", "Choose time", [
    { id: "time_morning", title: "Morning (4–11 AM)" },
    { id: "time_afternoon", title: "Afternoon (12–5 PM)" },
    { id: "time_evening", title: "Evening (5–9 PM)" },
    { id: "time_night", title: "Night (9 PM–4 AM)" },
    { id: "time_any", title: "Any" },
  ]);
}

// Pax count list (1–6)
async function askPax(to) {
  const s = DB.states[to];
  s.step = "pax";
  saveDB(DB);
  const rows = Array.from({ length: 6 }, (_, i) => ({
    id: `pax_${i + 1}`,
    title: `${i + 1}`,
  }));
  await sendList(to, "👥 Select *number of passengers*:", "Select count", rows);
}

// Seat type list (>3 options)
async function askSeat(to) {
  const s = DB.states[to];
  s.step = "seat";
  saveDB(DB);
  await sendList(to, "💺 Choose *seat type*:", "Seat type", [
    { id: "seat_seater", title: "Seater" },
    { id: "seat_semi", title: "Semi Sleeper" },
    { id: "seat_sleeper", title: "Sleeper" },
    { id: "seat_ac", title: "AC" },
    { id: "seat_nonac", title: "Non-AC" },
  ]);
}

async function showSummary(to) {
  const b = DB.states[to].booking;
  const summary =
    `Please confirm your booking:\n\n` +
    `• Type: *${b.kind}*\n` +
    `• From: *${b.from}*\n` +
    `• To: *${b.to}*\n` +
    `• Date: *${b.date}*\n` +
    `• Time: *${b.timePref}*\n` +
    `• Passengers: *${b.passengers}*\n` +
    `• Seat type: *${b.seatType}*`;

  DB.states[to].step = "confirm";
  saveDB(DB);
  await sendButtons(to, summary, [
    { id: "confirm_yes", title: "✅ Confirm" },
    { id: "confirm_edit", title: "✏️ Edit" },
    { id: "confirm_cancel", title: "❌ Cancel" },
  ]);
}

// ====== Webhook verification ======
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ====== Webhook messages ======
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from; // user's WA number
    DB.states[from] = DB.states[from] || newState();

    // TEXT
    if (msg.type === "text") {
      const text = msg.text.body.trim().toLowerCase();

      // global triggers
      if (["hi", "hello", "start", "menu", "book"].includes(text)) {
        if (text === "book") {
          await startBookFlow(from);
        } else {
          await showMainMenu(from);
        }
        return res.sendStatus(200);
      }
      if (text === "help") {
        await sendButtons(from, "🆘 *Help & Support*\n\nGet help quickly:", [
          { id: "help_chat", title: "Chat with Agent" },
          { id: "help_email", title: "Email Support" },
          { id: "help_about", title: "About Quickets" },
        ]);
        return res.sendStatus(200);
      }
      if (text === "about") {
        await sendText(
          from,
          "⚡ *About Quickets*\nWe help you book tickets fast—simple, reliable, and automated.\n\nNo hidden charges. Brand-first experience."
        );
        return res.sendStatus(200);
      }

      // FLOW: handle typed answers by step
      const state = DB.states[from];

      if (state.step === "from") {
        state.booking.from = msg.text.body.trim();
        await askTo(from);
        saveDB(DB);
        return res.sendStatus(200);
      }
      if (state.step === "to") {
        state.booking.to = msg.text.body.trim();
        await askDate(from);
        saveDB(DB);
        return res.sendStatus(200);
      }
      if (state.step === "date") {
        state.booking.date = msg.text.body.trim();
        await askTime(from);
        saveDB(DB);
        return res.sendStatus(200);
      }
      if (state.step === "track_wait_id") {
        const id = msg.text.body.trim().toUpperCase();
        const found = DB.bookings.find((b) => b.id === id && b.fromNumber === from);
        if (!found) {
          await sendText(from, "❌ No request found for that ID on your number.");
        } else {
          await sendText(
            from,
            `🔎 *Status for ${id}*\n` +
              `• ${found.kind}: ${found.from} → ${found.to}, ${found.date}\n` +
              `• Status: *${found.status}*`
          );
        }
        state.step = "idle";
        saveDB(DB);
        await showMainMenu(from);
        return res.sendStatus(200);
      }

      // If we get plain text at wrong time, show menu
      await showMainMenu(from);
      return res.sendStatus(200);
    }

    // INTERACTIVE (buttons & lists)
    if (msg.type === "interactive") {
      const state = DB.states[from];
      if (msg.interactive.type === "button_reply") {
        const id = msg.interactive.button_reply.id;

        // Main menu
        if (id === "menu_book") {
          await startBookFlow(from);
          return res.sendStatus(200);
        }
        if (id === "menu_track") {
          state.step = "track_wait_id";
          saveDB(DB);
          await sendText(from, "🔎 Enter your *Booking ID* (e.g., QK-12345).");
          return res.sendStatus(200);
        }
        if (id === "menu_my") {
          const mine = DB.bookings.filter((b) => b.fromNumber === from);
          if (mine.length === 0) {
            await sendText(from, "📚 You have no saved bookings yet.");
          } else {
            const list = mine
              .slice(-10)
              .map(
                (b) =>
                  `• ${b.date}: ${b.from} → ${b.to} | ${b.passengers} | ${b.seatType} | *${b.id}*`
              )
              .join("\n");
            await sendText(from, `📚 *Your bookings*\n${list}`);
          }
          await showMainMenu(from);
          return res.sendStatus(200);
        }

        // Help buttons
        if (id === "help_chat") {
          await sendText(from, `Chat with agent: ${SUPPORT_WHATSAPP}`);
          return res.sendStatus(200);
        }
        if (id === "help_email") {
          await sendText(from, `Email support: ${SUPPORT_EMAIL}`);
          return res.sendStatus(200);
        }
        if (id === "help_about") {
          await sendText(
            from,
            "⚡ *About Quickets*\nFast & reliable travel bookings. Simple flows. Smart automation."
          );
          return res.sendStatus(200);
        }

        // Confirmation buttons
        if (id === "confirm_yes") {
          const b = state.booking;
          b.id = genId();
          b.fromNumber = from;
          DB.bookings.push({ ...b });
          state.step = "idle";
          saveDB(DB);
          await sendText(
            from,
            `🎟️ *Booking received!*\nID: *${b.id}*\n` +
              `We’ll process it and update the status. Use *Track Request* with your ID.`
          );
          await showMainMenu(from);
          return res.sendStatus(200);
        }
        if (id === "confirm_edit") {
          // go back to first editable field (From)
          state.step = "from";
          saveDB(DB);
          await sendText(from, "✏️ Edit mode: please re-enter *From* (city).");
          return res.sendStatus(200);
        }
        if (id === "confirm_cancel") {
          state.step = "idle";
          saveDB(DB);
          await sendText(from, "❌ Booking cancelled.");
          await showMainMenu(from);
          return res.sendStatus(200);
        }

        return res.sendStatus(200);
      }

      // LIST reply handling
      if (msg.interactive.type === "list_reply") {
        const selId = msg.interactive.list_reply.id;

        // Time
        if (selId.startsWith("time_")) {
          const label = {
            time_morning: "Morning",
            time_afternoon: "Afternoon",
            time_evening: "Evening",
            time_night: "Night",
            time_any: "Any",
          }[selId];
          state.booking.timePref = label || "Any";
          await askPax(from);
          saveDB(DB);
          return res.sendStatus(200);
        }

        // Pax
        if (selId.startsWith("pax_")) {
          state.booking.passengers = selId.split("_")[1];
          await askSeat(from);
          saveDB(DB);
          return res.sendStatus(200);
        }

        // Seat
        if (selId.startsWith("seat_")) {
          const seatLabel = {
            seat_seater: "Seater",
            seat_semi: "Semi Sleeper",
            seat_sleeper: "Sleeper",
            seat_ac: "AC",
            seat_nonac: "Non-AC",
          }[selId];
          state.booking.seatType = seatLabel || "Seater";
          await showSummary(from);
          saveDB(DB);
          return res.sendStatus(200);
        }

        return res.sendStatus(200);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("ERR:", err?.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ====== Boot ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Quickets running on :${PORT}`);
});
