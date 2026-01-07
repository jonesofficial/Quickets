// // lib/flow/index.js

// const { buildContext } = require("./context");

// const languageFlow = require("./languageFlow");
// const menuFlow = require("./menuFlow");
// const bookingFlow = require("./bookingFlow");
// const passengerFlow = require("./passengerFlow");
// const trackingFlow = require("./trackingFlow");
// const fallbackFlow = require("./fallbackFlow");

// const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

// module.exports = async function route(req, res) {
//   try {
//     const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

//     // Ignore non-message webhooks
//     if (!msg || !msg.from) {
//       return res.sendStatus(200);
//     }

//     // Deduplicate message IDs
//     if (isProcessed(msg.id)) {
//       return res.sendStatus(200);
//     }
//     markProcessed(msg.id);

//     // Session init
//     const { session } = startOrGet(msg.from);

//     // Build context
//     const ctx = buildContext(req, session);
//     if (!ctx) {
//       return res.sendStatus(200);
//     }

//     /* ==================================================
//      * FLOW PRIORITY (TOP → BOTTOM)
//      * ================================================== */

//     // 1️⃣ Language selection (global)
//     if (await languageFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 2️⃣ Passenger flow (active booking only)
//     if (await passengerFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 3️⃣ Booking flow (active booking only)
//     if (await bookingFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 4️⃣ Tracking flow (explicit user action)
//     if (await trackingFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 5️⃣ Menu (idle users only)
//     if (await menuFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 6️⃣ Final fallback
//     await fallbackFlow(ctx);
//     return res.sendStatus(200);
//   } catch (err) {
//     console.error("Webhook handler error:", err);
//     return res.sendStatus(200); // never retry
//   }
// };

// lib/flow/index.js
// lib/flow/index.js

const { buildContext } = require("./context");

const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const trackingFlow = require("./trackingFlow");
const fallbackFlow = require("./fallbackFlow");
const paymentFlow = require("./paymentFlow");

const { handleAdminCommands } = require("../adminCommand");
const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

/* ==============================
 * Helpers
 * ============================== */
function normalize(num = "") {
  return String(num).replace(/\D/g, "").slice(-10);
}

function isAdminNumber(from) {
  return normalize(from) === normalize(ADMIN_NUMBER);
}

/* ==============================
 * FLOW BRAIN
 * ============================== */
module.exports = async function route(req, res) {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || !msg.from) return;

  const from = msg.from;
  const text = msg.type === "text" ? msg.text.body.trim() : "";

  

console.log("📞 RAW FROM:", from);
console.log("📞 RAW ADMIN:", process.env.ADMIN_NUMBER);

const normFrom = normalize(from);
const normAdmin = normalize(process.env.ADMIN_NUMBER);

console.log("📞 NORM FROM:", normFrom);
console.log("📞 NORM ADMIN:", normAdmin);
console.log("📞 IS ADMIN?:", normFrom === normAdmin);


  /* ==================================================
   * 🔐 ADMIN COMMAND INTERCEPT (HIGHEST PRIORITY)
   * ================================================== */

  if (isAdminNumber(from)) {
  console.log("🛂 ADMIN MESSAGE:", text || msg.type);

  // ⚠️ Create a TEMP admin session ONLY for context
  const { session } = startOrGet(from);
  session.__isAdmin = true;

  const ctx = buildContext(req, session);
  if (!ctx) return;

  handleAdminCommands(ctx);

  // 🚫 ABSOLUTE STOP — admin never enters flows
  return;
}


  /* ==================================================
   * NORMAL USER FLOW
   * ================================================== */

  // Deduplicate messages
  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  // 1️⃣ Payment
  if (await paymentFlow(ctx)) return;

  // 2️⃣ Language
  if (await languageFlow(ctx)) return;

  // 3️⃣ Passenger
  if (await passengerFlow(ctx)) return;

  // 4️⃣ Booking
  if (await bookingFlow(ctx)) return;

  // 5️⃣ Tracking
  if (await trackingFlow(ctx)) return;

  // 6️⃣ Menu
  if (await menuFlow(ctx)) return;

  // 7️⃣ Fallback
  await fallbackFlow(ctx);
};
