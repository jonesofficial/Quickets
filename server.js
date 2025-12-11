

// /**
//  * Quickets – WhatsApp Bot (Brand Mode)
//  * ✅ Buttons max 3, otherwise we use List-type messages.
//  * ✅ Pending vs Confirmed bookings
//  * ✅ Saved passengers per user
//  * ✅ Bus flow: From → To → Date → Time(list) → Pax(list) → Seat Type(list)
//  * ✅ Passenger details: Bulk form OR One-by-one
//  * ✅ Track request, My bookings, Help & About
//  *
//  * ENV required:
//  *   WHATSAPP_TOKEN       (Permanent/long-lived token)
//  *   PHONE_NUMBER_ID      (WA phone number ID)
//  *   VERIFY_TOKEN         (Webhook verify token)
//  *
//  * Tested against WhatsApp Cloud API v20
//  */

// const express = require("express");
// const axios = require("axios");
// require("dotenv").config();

// const app = express();
// app.use(express.json());

// // --------- Helpers: WhatsApp senders ----------
// const WA = axios.create({
//   baseURL: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}`,
//   headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
// });

// const sendText = async (to, body) => {
//   return WA.post(`/messages`, {
//     messaging_product: "whatsapp",
//     to,
//     text: { body },
//   });
// };

// // Buttons (max 3)
// const sendButtons = async (to, bodyText, buttons /* [{id,title}] max 3 */) => {
//   const safeButtons = buttons.slice(0, 3).map((b) => ({
//     type: "reply",
//     reply: { id: b.id, title: b.title },
//   }));
//   return WA.post(`/messages`, {
//     messaging_product: "whatsapp",
//     to,
//     type: "interactive",
//     interactive: {
//       type: "button",
//       body: { text: bodyText },
//       action: { buttons: safeButtons },
//     },
//   });
// };

// // List (use when >3 choices or when you want a picker)
// // sections: [{title, rows:[{id,title,description?}]}]
// const sendList = async (to, bodyText, buttonText, sections) => {
//   return WA.post(`/messages`, {
//     messaging_product: "whatsapp",
//     to,
//     type: "interactive",
//     interactive: {
//       type: "list",
//       body: { text: bodyText },
//       action: { button: buttonText, sections },
//     },
//   });
// };

// const sendOopsTapOptions = (to) =>
//   sendText(
//     to,
//     "Please use the on-screen options (buttons or the ‘Select’ list). If you can’t see them, update WhatsApp and try again. 🙂"
//   );

// // ---------- In-memory store (swap to DB later) ----------
// const sessions = new Map(); // phone -> { state, currentBooking, savedPassengers, bookings:[] }
// let bookingSequence = 10000;

// const newSession = () => ({
//   state: "IDLE",
//   savedPassengers: [],      // [{name,age,gender}]
//   pendingBooking: null,     // transient
//   bookings: [],             // confirmed only
//   lastMessageAt: Date.now(),
// });

// const startOrGet = (phone) => {
//   if (!sessions.has(phone)) sessions.set(phone, newSession());
//   const s = sessions.get(phone);
//   s.lastMessageAt = Date.now();
//   return s;
// };

// const nextBookingId = () => `QK-${++bookingSequence}`;

// // ---------- Menu builders ----------
// const mainMenuList = (to) =>
//   sendList(
//     to,
//     "🎉 Welcome to *Quickets!*\nFast, friendly ticket assistance.\n\nChoose an option:",
//     "Open menu",
//     [
//       {
//         title: "Main",
//         rows: [
//           { id: "MENU_BOOK", title: "Book Tickets" },
//           { id: "MENU_TRACK", title: "Track Request" },
//           { id: "MENU_MYBOOK", title: "My Bookings" },
//           { id: "MENU_PASSENGERS", title: "Saved Passengers" },
//           { id: "MENU_HELP", title: "Help & Support" },
//           { id: "MENU_ABOUT", title: "About Quickets" },
//         ],
//       },
//     ]
//   );

// const bookPicker = (to) =>
//   // 3 buttons only
//   sendButtons(to, "What would you like to book?", [
//     { id: "BOOK_TRAIN", title: "🚆 Train" },
//     { id: "BOOK_BUS", title: "🚌 Bus" },
//     { id: "BOOK_INFO", title: "ℹ️ Other info" },
//   ]);

// // ---------- Validators ----------
// const isValidDate = (s) => {
//   // Accept "15 Nov 2025" or "2025-11-15"
//   const tryA = Date.parse(s);
//   if (!isNaN(tryA)) return true;
//   // Basic yyyy-mm-dd
//   return /^\d{2}-\d{2}-\d{4}$/.test(s);
// };

// const normalizeDate = (s) => {
//   if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
//   const d = new Date(s);
//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");
//   return `${dd}-${mm}-${yyyy}`;
// };

// const parsePassengerLine = (line) => {
//   // "Riya 24 F"
//   const parts = line.trim().split(/\s+/);
//   if (parts.length < 3) return null;
//   const [name, ageStr, genderRaw] = [
//     parts.slice(0, parts.length - 2).join(" "),
//     parts[parts.length - 2],
//     parts[parts.length - 1],
//   ];
//   const age = parseInt(ageStr, 10);
//   const g = (genderRaw || "").toUpperCase();
//   if (!name || isNaN(age) || age <= 0) return null;
//   if (!["M", "F", "O", "MALE", "FEMALE", "OTHER"].includes(g)) return null;
//   const gender = g.startsWith("M") ? "M" : g.startsWith("F") ? "F" : "O";
//   return { name, age, gender };
// };

// // ---------- Bus flow askers ----------
// const askBusFrom = (to) => sendText(to, "From city? (e.g., Hyderabad)");
// const askBusTo = (to) => sendText(to, "To city? (e.g., Visakhapatnam)");
// const askBusDate = (to) =>
//   sendText(
//     to,
//     "Journey Date? (e.g., 24 Feb 2026 or 2026-02-24)"
//   );

// const askTimePref = (to) =>
//   sendList(
//     to,
//     "Pick a time preference:",
//     "Select",
//     [
//       {
//         title: "Time slots",
//         rows: [
//           { id: "TIME_MORNING", title: "Morning (5am–12pm)" },
//           { id: "TIME_AFTERNOON", title: "Afternoon (12pm–5pm)" },
//           { id: "TIME_EVENING", title: "Evening (5pm–9pm)" },
//           { id: "TIME_NIGHT", title: "Night (9pm–2am)" },
//         ],
//       },
//     ]
//   );

// const askPaxCount = (to) =>
//   sendList(
//     to,
//     "How many passengers?",
//     "Choose",
//     [
//       {
//         title: "Passengers (max 6)",
//         rows: [
//           { id: "PAX_1", title: "1" },
//           { id: "PAX_2", title: "2" },
//           { id: "PAX_3", title: "3" },
//           { id: "PAX_4", title: "4" },
//           { id: "PAX_5", title: "5" },
//           { id: "PAX_6", title: "6" },
//         ],
//       },
//     ]
//   );

// const askSeatType = (to) =>
//   sendList(
//     to,
//     "Seat type preference?",
//     "Pick type",
//     [
//       {
//         title: "Type",
//         rows: [
//           { id: "SEAT_AC_SLEEPER", title: "AC Sleeper" },
//           { id: "SEAT_AC_SEATER", title: "AC Seater" },
//           { id: "SEAT_NONAC_SLEEPER", title: "Non-AC Sleeper" },
//           { id: "SEAT_NONAC_SEATER", title: "Non-AC Seater" },
//         ],
//       },
//     ]
//   );

// const askPassengerMode = (to) =>
//   sendButtons(to, "Passenger details input:", [
//     { id: "PAX_BULK", title: "Fill at Once" },
//     { id: "PAX_ONEBYONE", title: "Fill one by one" },
//   ]);

// const askBulkHint = (to, remaining) =>
//   sendText(
//     to,
//     `Please paste *${remaining}* passenger(s) like:\n\n` +
//       `• *Name<SPACE>Age<SPACE>Gender*\n` +
//       `Example:\nVikram 28 M\nSita 26 F\n`
//   );

// const askOneName = (to, i, total) =>
//   sendText(to, `Passenger ${i}/${total} – enter *Name*`);
// const askOneAge = (to) => sendText(to, "Enter *Age*");
// const askOneGender = (to) =>
//   sendButtons(to, "Pick *Gender*:", [
//     { id: "G_M", title: "Male" },
//     { id: "G_F", title: "Female" },
//     { id: "G_O", title: "Other" },
//   ]);

// const showBusSummary = async (to, b) => {
//   const lines = [];
//   lines.push("*Review your request*");
//   lines.push(`From: ${b.from}`);
//   lines.push(`To: ${b.to}`);
//   lines.push(`Date: ${b.date}`);
//   lines.push(`Time: ${b.timePref}`);
//   lines.push(`Pax: ${b.paxCount}`);
//   lines.push(`Seat: ${b.seatType}`);
//   lines.push(
//     "Passengers:\n" +
//       b.passengers.map((p, i) => `${i + 1}. ${p.name} ${p.age} ${p.gender}`).join("\n")
//   );
//   await sendText(to, lines.join("\n"));
//   return sendButtons(to, "Confirm this booking?", [
//     { id: "CONFIRM_BOOK", title: "✅ Confirm" },
//     { id: "EDIT_BOOK", title: "✏️ Edit" },
//     { id: "CANCEL_BOOK", title: "❌ Cancel" },
//   ]);
// };

// // --------- Webhook verify ----------
// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
//     return res.status(200).send(challenge);
//   }
//   return res.sendStatus(403);
// });

// // --------- Webhook receiver ----------
// app.post("/webhook", async (req, res) => {
//     console.log("🔥 Webhook triggered:");
//     console.log(JSON.stringify(req.body, null, 2));

//   try {
//     const entry = req.body.entry?.[0];
//     const changes = entry?.changes?.[0];
//     const value = changes?.value;
//     const msg = value?.messages?.[0];
//     if (!msg) return res.sendStatus(200);

//     const from = msg.from;
//     const s = startOrGet(from);

//     // Normalize triggers to open main menu
//     const textIn =
//       msg.type === "text" ? msg.text.body.trim().toLowerCase() : null;
//     const wantsMenu =
//       textIn &&
//       ["menu", "hi", "hello", "start", "book", "quickets"].some((w) =>
//         textIn.includes(w)
//       );

//     // Handle interactive replies (button/list)
//     let interactiveType = null;
//     let interactiveId = null;
//     if (msg.type === "interactive") {
//       interactiveType = msg.interactive.type; // "button_reply" | "list_reply"
//       if (interactiveType === "button_reply")
//         interactiveId = msg.interactive.button_reply.id;
//       if (interactiveType === "list_reply")
//         interactiveId = msg.interactive.list_reply.id;
//     }

//     // --- Global states ---
//     if (wantsMenu && s.state !== "BUS_PAX_ONE_GENDER_WAIT") {
//       s.state = "IDLE";
//       s.pendingBooking = null;
//       await mainMenuList(from);
//       return res.sendStatus(200);
//     }

//     // MAIN MENU selection (list)
//     if (interactiveType === "list_reply") {
//       if (interactiveId === "MENU_BOOK") {
//         s.state = "BOOK_PICK";
//         await bookPicker(from);
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "MENU_TRACK") {
//         s.state = "TRACK_WAIT_ID";
//         await sendText(
//           from,
//           "Enter your booking ID (e.g., QK-10023). If created today it may show *Pending* until confirmed."
//         );
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "MENU_MYBOOK") {
//         if (!s.bookings.length) {
//           await sendText(from, "You have no confirmed bookings yet.");
//         } else {
//           const lines = s.bookings.map(
//             (b) =>
//               `${b.id}: ${b.date} – ${b.from} → ${b.to} | ${b.paxCount} | ${b.seatType}`
//           );
//           await sendText(from, "*Your bookings:*\n" + lines.join("\n"));
//         }
//         s.state = "IDLE";
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "MENU_PASSENGERS") {
//         s.state = "PASSENGER_MENU";
//         await sendButtons(from, "Saved passengers", [
//           { id: "SP_ADD", title: "Add new" },
//           { id: "SP_LIST", title: "View all" },
//           { id: "SP_CLEAR", title: "Clear all" },
//         ]);
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "MENU_HELP") {
//         await sendText(
//           from,
//           "*Support*\nChat: this WhatsApp\nEmail: support@quickets.io\nHours: 9am–9pm IST"
//         );
//         s.state = "IDLE";
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "MENU_ABOUT") {
//         await sendText(
//           from,
//           "*Quickets*\nFast, friendly ticket assistance. No hassle, no spam."
//         );
//         s.state = "IDLE";
//         return res.sendStatus(200);
//       }
//     }

//     // SAVED PASSENGERS manager
//     if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
//       if (s.state === "PASSENGER_MENU") {
//         if (interactiveId === "SP_ADD") {
//           s.state = "SP_ADD_BULK";
//           await sendText(
//             from,
//             "Paste passengers (one per line) in the format:\n*name age gender*\n\nExample:\nAarav 28 M\nDiya 26 F"
//           );
//           return res.sendStatus(200);
//         }
//         if (interactiveId === "SP_LIST") {
//           if (!s.savedPassengers.length)
//             await sendText(from, "No saved passengers yet.");
//           else {
//             await sendText(
//               from,
//               "*Saved passengers:*\n" +
//                 s.savedPassengers
//                   .map((p, i) => `${i + 1}. ${p.name} ${p.age} ${p.gender}`)
//                   .join("\n")
//             );
//           }
//           s.state = "IDLE";
//           return res.sendStatus(200);
//         }
//         if (interactiveId === "SP_CLEAR") {
//           s.savedPassengers = [];
//           await sendText(from, "Cleared saved passengers.");
//           s.state = "IDLE";
//           return res.sendStatus(200);
//         }
//       }
//     }
//     if (s.state === "SP_ADD_BULK" && msg.type === "text") {
//       const lines = msg.text.body.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
//       const parsed = [];
//       for (const ln of lines) {
//         const p = parsePassengerLine(ln);
//         if (p) parsed.push(p);
//       }
//       if (!parsed.length) {
//         await sendText(
//           from,
//           "Couldn’t parse. Use: *name age gender*. Example:\nAarav 28 M"
//         );
//       } else {
//         s.savedPassengers.push(...parsed);
//         await sendText(from, `Added ${parsed.length} passenger(s).`);
//       }
//       s.state = "IDLE";
//       return res.sendStatus(200);
//     }

//     // BOOK PICK (buttons)
//     if (s.state === "BOOK_PICK" && interactiveType === "button_reply") {
//       if (interactiveId === "BOOK_TRAIN") {
//         await sendText(
//           from,
//           "🚆 Train booking coming soon. For now, choose *Bus* in the menu."
//         );
//         s.state = "IDLE";
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "BOOK_INFO") {
//         await sendText(
//           from,
//           "We’ll ask a few quick questions and confirm with you before booking."
//         );
//         s.state = "IDLE";
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "BOOK_BUS") {
//         s.pendingBooking = {
//           id: null,
//           type: "BUS",
//           from: null,
//           to: null,
//           date: null,
//           timePref: null,
//           paxCount: null,
//           seatType: null,
//           passengers: [],
//           status: "Pending",
//           createdAt: Date.now(),
//         };
//         s.state = "BUS_FROM";
//         await askBusFrom(from);
//         return res.sendStatus(200);
//       }
//     }

//     // BUS FLOW – text steps + lists/buttons
//     if (s.state === "BUS_FROM" && msg.type === "text") {
//       s.pendingBooking.from = msg.text.body.trim();
//       s.state = "BUS_TO";
//       await askBusTo(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_TO" && msg.type === "text") {
//       s.pendingBooking.to = msg.text.body.trim();
//       s.state = "BUS_DATE";
//       await askBusDate(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_DATE" && msg.type === "text") {
//       const d = msg.text.body.trim();
//       if (!isValidDate(d)) {
//         await sendText(from, "Invalid date. Try again (e.g., 24 Feb 2026 or 2026-02-24)");
//         return res.sendStatus(200);
//       }
//       s.pendingBooking.date = normalizeDate(d);
//       s.state = "BUS_TIME";
//       await askTimePref(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_TIME") {
//       if (interactiveType !== "list_reply") {
//         await sendOopsTapOptions(from);
//         return res.sendStatus(200);
//       }
//       const map = {
//         TIME_MORNING: "Morning (5am–12pm)",
//         TIME_AFTERNOON: "Afternoon (12pm–5pm)",
//         TIME_EVENING: "Evening (5pm–9pm)",
//         TIME_NIGHT: "Night (9pm–2am)",
//       };
//       s.pendingBooking.timePref = map[interactiveId] || "Any";
//       s.state = "BUS_PAX";
//       await askPaxCount(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_PAX") {
//       if (interactiveType !== "list_reply") {
//         await sendOopsTapOptions(from);
//         return res.sendStatus(200);
//       }
//       s.pendingBooking.paxCount = parseInt(interactiveId.split("_")[1], 10);
//       s.state = "BUS_SEAT_TYPE";
//       await askSeatType(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_SEAT_TYPE") {
//       if (interactiveType !== "list_reply") {
//         await sendOopsTapOptions(from);
//         return res.sendStatus(200);
//       }
//       const map = {
//         SEAT_AC_SLEEPER: "AC Sleeper",
//         SEAT_AC_SEATER: "AC Seater",
//         SEAT_NONAC_SLEEPER: "Non-AC Sleeper",
//         SEAT_NONAC_SEATER: "Non-AC Seater",
//       };
//       s.pendingBooking.seatType = map[interactiveId] || "Any";
//       s.state = "BUS_PAX_MODE";
//       await askPassengerMode(from);
//       return res.sendStatus(200);
//     }

//     // Passenger mode pick (buttons)
//     if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
//       const total = s.pendingBooking.paxCount;
//       if (interactiveId === "PAX_BULK") {
//         s.state = "BUS_PAX_BULK";
//         await askBulkHint(from, total);
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "PAX_ONEBYONE") {
//         s.state = "BUS_PAX_ONE_NAME_WAIT";
//         s.pendingBooking.passengers = [];
//         s.__oneIndex = 1;
//         await askOneName(from, s.__oneIndex, total);
//         return res.sendStatus(200);
//       }
//     }

//     // Fast form (bulk)
//     if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
//       const want = s.pendingBooking.paxCount;
//       const lines = msg.text.body.split(/\n|,/).map((x) => x.trim()).filter(Boolean);
//       const parsed = [];
//       for (const ln of lines) {
//         const p = parsePassengerLine(ln);
//         if (p) parsed.push(p);
//       }
//       if (parsed.length !== want) {
//         await sendText(
//           from,
//           `I need exactly *${want}* passengers. You sent *${parsed.length}* I could read.\nFormat: *name age gender* (M/F/O)`
//         );
//         return res.sendStatus(200);
//       }
//       s.pendingBooking.passengers = parsed;
//       s.state = "BUS_SUMMARY";
//       await showBusSummary(from, s.pendingBooking);
//       return res.sendStatus(200);
//     }

//     // One-by-one
//     if (s.state === "BUS_PAX_ONE_NAME_WAIT" && msg.type === "text") {
//       s.__tmpName = msg.text.body.trim();
//       s.state = "BUS_PAX_ONE_AGE_WAIT";
//       await askOneAge(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_PAX_ONE_AGE_WAIT" && msg.type === "text") {
//       const age = parseInt(msg.text.body.trim(), 10);
//       if (isNaN(age) || age <= 0) {
//         await sendText(from, "Invalid age. Try again.");
//         return res.sendStatus(200);
//       }
//       s.__tmpAge = age;
//       s.state = "BUS_PAX_ONE_GENDER_WAIT";
//       await askOneGender(from);
//       return res.sendStatus(200);
//     }

//     if (s.state === "BUS_PAX_ONE_GENDER_WAIT" && interactiveType === "button_reply") {
//       const gender = interactiveId === "G_M" ? "M" : interactiveId === "G_F" ? "F" : "O";
//       s.pendingBooking.passengers.push({
//         name: s.__tmpName,
//         age: s.__tmpAge,
//         gender,
//       });
//       const total = s.pendingBooking.paxCount;
//       if (s.pendingBooking.passengers.length < total) {
//         s.__oneIndex++;
//         s.state = "BUS_PAX_ONE_NAME_WAIT";
//         await askOneName(from, s.__oneIndex, total);
//       } else {
//         s.state = "BUS_SUMMARY";
//         await showBusSummary(from, s.pendingBooking);
//       }
//       return res.sendStatus(200);
//     }

//     // Confirm / Edit / Cancel (buttons)
//     if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
//       if (interactiveId === "CONFIRM_BOOK") {
//         s.pendingBooking.id = nextBookingId();
//         s.pendingBooking.status = "Processing";
//         s.bookings.push({ ...s.pendingBooking, status: "Booked" }); // You can set to "Processing" if you want manual update later
//         await sendText(
//           from,
//           `✅ *Confirmed*\nYour booking ID is *${s.pendingBooking.id}*.\nWe’ll send details soon.`
//         );
//         s.pendingBooking = null;
//         s.state = "IDLE";
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "EDIT_BOOK") {
//         // Simple restart edit – go back to time pref (you can choose any step)
//         s.state = "BUS_TIME";
//         await askTimePref(from);
//         return res.sendStatus(200);
//       }
//       if (interactiveId === "CANCEL_BOOK") {
//         s.pendingBooking = null;
//         s.state = "IDLE";
//         await sendText(from, "Cancelled. No booking was created.");
//         return res.sendStatus(200);
//       }
//     }

//     // Track (text)
//     if (s.state === "TRACK_WAIT_ID" && msg.type === "text") {
//       const id = msg.text.body.trim().toUpperCase();
//       const found =
//         s.bookings.find((b) => b.id === id) ||
//         (s.pendingBooking && s.pendingBooking.id === id ? s.pendingBooking : null);
//       if (!found) {
//         await sendText(from, `No booking found for *${id}*.`);
//       } else {
//         await sendText(
//           from,
//           `*${id}* → ${found.from} → ${found.to}, ${found.date}\nStatus: *${found.status || "Pending"}*`
//         );
//       }
//       s.state = "IDLE";
//       return res.sendStatus(200);
//     }

//     // Fallbacks
//     if (msg.type === "interactive") {
//       await sendOopsTapOptions(from);
//       return res.sendStatus(200);
//     }

//     // If totally unknown text and not in a known waiting state → show menu
//     if (msg.type === "text") {
//       await mainMenuList(from);
//       return res.sendStatus(200);
//     }

//     res.sendStatus(200);
//   } catch (err) {
//     console.error("ERR:", err.response?.data || err.message);
//     res.sendStatus(200);
//   }
// });

// // ---------- Boot ----------
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));



// index.js (updated)
const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());

// ---------- Config ----------
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours session TTL
const CLEANUP_INTERVAL_MS = 1000 * 60 * 10; // every 10 minutes
const HMAC_SECRET = process.env.HMAC_SECRET || "please_set_HMAC_SECRET";
if (!process.env.HMAC_SECRET) {
  console.warn("Warning: HMAC_SECRET not set. Set a strong secret in env for privacy.");
}

// --------- Helpers: WhatsApp senders (safe wrapper) ----------
const WA = axios.create({
  baseURL: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}`,
  headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
});

// safe WA post wrapper that detects token expiry and logs clearly
const safeWA = async (path, body) => {
  try {
    return await WA.post(path, body);
  } catch (err) {
    const errData = err.response?.data;
    if (errData?.error?.code === 190) {
      // token expired/invalid
      console.error("WHATSAPP TOKEN ERROR: Token invalid/expired (OAuth 190). Replace WHATSAPP_TOKEN immediately.", errData);
      // Optionally: notify admin through email/slack here
    } else {
      console.error("WhatsApp API error:", errData || err.message);
    }
    throw err;
  }
};

const sendText = async (to, body) => {
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to,
    text: { body },
  });
};

const sendButtons = async (to, bodyText, buttons /* [{id,title}] max 3 */) => {
  const safeButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: { id: b.id, title: b.title },
  }));
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: safeButtons },
    },
  });
};

const sendList = async (to, bodyText, buttonText, sections) => {
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: { button: buttonText, sections },
    },
  });
};

const sendOopsTapOptions = (to) =>
  sendText(
    to,
    "Please use the on-screen options (buttons or the ‘Select’ list). If you can’t see them, update WhatsApp and try again. 🙂"
  );

// ---------- Privacy helpers ----------
const hmac = (s) => {
  return crypto.createHmac("sha256", HMAC_SECRET).update(String(s)).digest("hex");
};

// mask phone for logs: show +91···1234
const maskPhone = (ph) => {
  if (!ph) return "";
  const p = String(ph);
  const last = p.slice(-4);
  return `****${last}`;
};

// bucket age into range to reduce sensitivity (optional)
const ageBracket = (age) => {
  if (!age || isNaN(age)) return "unknown";
  const a = Number(age);
  if (a < 2) return "<2";
  if (a <= 12) return "2-12";
  if (a <= 18) return "13-18";
  if (a <= 30) return "19-30";
  if (a <= 45) return "31-45";
  if (a <= 65) return "46-65";
  return "65+";
};

// convert a passenger literal into anonymized record stored in sessions
const anonymizePassenger = (p) => {
  // p: {name, age, gender}
  const nameHash = hmac((p.name || "").toLowerCase().trim());
  return {
    id: nameHash, // anonymized identifier
    ageBracket: ageBracket(p.age),
    gender: p.gender || "O",
  };
};

// ---------- In-memory store (swap to DB later) ----------
// sessions keyed by hashed phone, and do NOT store the raw phone number
const sessions = new Map(); // phoneHash -> session
let bookingSequence = 10000;

const newSession = () => ({
  state: "IDLE",
  savedPassengers: [], // [{id, ageBracket, gender}] hashed
  pendingBooking: null, // transient (we still avoid saving raw names)
  bookings: [], // confirmed bookings (anonymized)
  lastMessageAt: Date.now(),
});

const startOrGet = (phone) => {
  const key = hmac(phone);
  if (!sessions.has(key)) sessions.set(key, newSession());
  const s = sessions.get(key);
  s.lastMessageAt = Date.now();
  return { session: s, key };
};

const nextBookingId = () => `QK-${++bookingSequence}`;

// keep processed message ids to dedupe (avoid repeated processing)
const processedMessages = new Set();
const isProcessed = (msgId) => processedMessages.has(msgId);
const markProcessed = (msgId) => {
  if (!msgId) return;
  processedMessages.add(msgId);
  // keep set trimmed: remove after 24h to avoid memory growth
  setTimeout(() => processedMessages.delete(msgId), 1000 * 60 * 60 * 24);
};

// ---------- Menu builders (same UX) ----------
const mainMenuList = (to) =>
  sendList(
    to,
    "🎉 Welcome to *Quickets!*\nFast, friendly ticket assistance.\n\nChoose an option:",
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

const bookPicker = (to) =>
  sendButtons(to, "What would you like to book?", [
    // removed train option from top UX if you want bus-only, keep as before or remove
    { id: "BOOK_BUS", title: "🚌 Bus" },
    { id: "BOOK_INFO", title: "ℹ️ Other info" },
  ]);

// ---------- Validators (improved) ----------
const isValidDate = (s) => {
  if (!s) return false;
  const tryA = Date.parse(s);
  if (!isNaN(tryA)) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(s) || /^\d{2}-\d{2}-\d{4}$/.test(s);
};

const normalizeDate = (s) => {
  if (!s) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d)) return s;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy}`;
};

const parsePassengerLine = (line) => {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const [name, ageStr, genderRaw] = [
    parts.slice(0, parts.length - 2).join(" "),
    parts[parts.length - 2],
    parts[parts.length - 1],
  ];
  const age = parseInt(ageStr, 10);
  const g = (genderRaw || "").toUpperCase();
  if (!name || isNaN(age) || age <= 0) return null;
  if (!["M", "F", "O", "MALE", "FEMALE", "OTHER"].includes(g)) return null;
  const gender = g.startsWith("M") ? "M" : g.startsWith("F") ? "F" : "O";
  return { name: name.trim(), age, gender };
};

// ---------- Bus flow askers (unchanged) ----------
const askBusFrom = (to) => sendText(to, "From city? (e.g., Hyderabad)");
const askBusTo = (to) => sendText(to, "To city? (e.g., Visakhapatnam)");
const askBusDate = (to) =>
  sendText(to, "Journey Date? (e.g., 24 Feb 2026 or 2026-02-24)");

const askTimePref = (to) =>
  sendList(
    to,
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

const askPaxCount = (to) =>
  sendList(
    to,
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

const askSeatType = (to) =>
  sendList(
    to,
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

const askPassengerMode = (to) =>
  sendButtons(to, "Passenger details input:", [
    { id: "PAX_BULK", title: "Fill at Once" },
    { id: "PAX_ONEBYONE", title: "Fill one by one" },
  ]);

const askBulkHint = (to, remaining) =>
  sendText(
    to,
    `Please paste *${remaining}* passenger(s) like:\n\n` +
      `• *Name<SPACE>Age<SPACE>Gender*\n` +
      `Example:\nVikram 28 M\nSita 26 F\n`
  );

const askOneName = (to, i, total) =>
  sendText(to, `Passenger ${i}/${total} – enter *Name*`);
const askOneAge = (to) => sendText(to, "Enter *Age*");
const askOneGender = (to) =>
  sendButtons(to, "Pick *Gender*:", [
    { id: "G_M", title: "Male" },
    { id: "G_F", title: "Female" },
    { id: "G_O", title: "Other" },
  ]);

const showBusSummary = async (to, b, phoneHash) => {
  // b.passengers are anonymized objects: {id, ageBracket, gender}
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
  await sendText(to, lines.join("\n"));
  return sendButtons(to, "Confirm this booking?", [
    { id: "CONFIRM_BOOK", title: "✅ Confirm" },
    { id: "EDIT_BOOK", title: "✏️ Edit" },
    { id: "CANCEL_BOOK", title: "❌ Cancel" },
  ]);
};

// --------- Webhook verify ----------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ---------- health endpoint ----------
app.get("/health", (req, res) => res.status(200).json({ ok: true, ts: Date.now() }));

// ---------- Webhook receiver ----------
app.post("/webhook", async (req, res) => {
  try {
    // Log minimal info — mask phone when present
    console.log("🔥 Webhook triggered (minimal):");
    // do not JSON.stringify full body (contains PII); log masked summary
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

    // --- Global states ---
    if (wantsMenu && s.state !== "BUS_PAX_ONE_GENDER_WAIT") {
      s.state = "IDLE";
      s.pendingBooking = null;
      await mainMenuList(from);
      return res.sendStatus(200);
    }

    // MAIN MENU selection (list)
    if (interactiveType === "list_reply") {
      if (interactiveId === "MENU_BOOK") {
        s.state = "BOOK_PICK";
        await bookPicker(from);
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
        await askBusFrom(from);
        return res.sendStatus(200);
      }
    }

    // BUS FLOW
    if (s.state === "BUS_FROM" && msg.type === "text") {
      s.pendingBooking.from = msg.text.body.trim();
      s.state = "BUS_TO";
      await askBusTo(from);
      return res.sendStatus(200);
    }

    if (s.state === "BUS_TO" && msg.type === "text") {
      s.pendingBooking.to = msg.text.body.trim();
      s.state = "BUS_DATE";
      await askBusDate(from);
      return res.sendStatus(200);
    }

    if (s.state === "BUS_DATE" && msg.type === "text") {
      const d = msg.text.body.trim();
      if (!isValidDate(d)) {
        await sendText(from, "Invalid date. Try again (e.g., 24 Feb 2026 or 2026-02-24)");
        return res.sendStatus(200);
      }
      s.pendingBooking.date = normalizeDate(d);
      s.state = "BUS_TIME";
      await askTimePref(from);
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
      await askPaxCount(from);
      return res.sendStatus(200);
    }

    if (s.state === "BUS_PAX") {
      if (interactiveType !== "list_reply") {
        await sendOopsTapOptions(from);
        return res.sendStatus(200);
      }
      s.pendingBooking.paxCount = parseInt(interactiveId.split("_")[1], 10);
      s.state = "BUS_SEAT_TYPE";
      await askSeatType(from);
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
      await askPassengerMode(from);
      return res.sendStatus(200);
    }

    // Passenger mode pick
    if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
      const total = s.pendingBooking.paxCount;
      if (interactiveId === "PAX_BULK") {
        s.state = "BUS_PAX_BULK";
        await askBulkHint(from, total);
        return res.sendStatus(200);
      }
      if (interactiveId === "PAX_ONEBYONE") {
        s.state = "BUS_PAX_ONE_NAME_WAIT";
        s.pendingBooking.passengers = [];
        s.__oneIndex = 1;
        await askOneName(from, s.__oneIndex, total);
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
      await showBusSummary(from, s.pendingBooking, sessionKey);
      return res.sendStatus(200);
    }

    // One-by-one
    if (s.state === "BUS_PAX_ONE_NAME_WAIT" && msg.type === "text") {
      s.__tmpName = msg.text.body.trim();
      s.state = "BUS_PAX_ONE_AGE_WAIT";
      await askOneAge(from);
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
      await askOneGender(from);
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
        await askOneName(from, s.__oneIndex, total);
      } else {
        s.state = "BUS_SUMMARY";
        await showBusSummary(from, s.pendingBooking, sessionKey);
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
        await askTimePref(from);
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
      await mainMenuList(from);
      return res.sendStatus(200);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("ERR:", err.response?.data || err.message);
    res.sendStatus(200);
  }
});

// ---------- Session cleanup ----------
setInterval(() => {
  const now = Date.now();
  for (const [key, s] of sessions.entries()) {
    if (now - s.lastMessageAt > SESSION_TTL_MS) {
      sessions.delete(key);
      console.log(`Session ${key.slice(0,6)}.. expired and removed`);
    }
  }
}, CLEANUP_INTERVAL_MS);

// ---------- Boot ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));
