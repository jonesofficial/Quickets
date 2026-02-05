// // lib/flow/index.js

// require("dotenv").config();
// const { buildContext } = require("./context");

// const languageFlow = require("./languageFlow");
// const menuFlow = require("./menuFlow");
// const bookingFlow = require("./bookingFlow");
// const passengerFlow = require("./passengerFlow");
// const summaryFlow = require("./summaryFlow");
// const trackingFlow = require("./trackingFlow");
// const paymentFlow = require("./paymentFlow");
// const fallbackFlow = require("./fallbackFlow");

// const { handleAdminCommands } = require("../adminCommand");
// const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

// const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

// /* ==============================
//  * Helpers
//  * ============================== */
// function normalize(num = "") {
//   return String(num).replace(/\D/g, "").slice(-10);
// }

// function isAdminNumber(from) {
//   return normalize(from) === normalize(ADMIN_NUMBER);
// }

// /* ==============================
//  * FLOW BRAIN
//  * ============================== */
// module.exports = async function route(req, res) {
//   const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
//   if (!msg || !msg.from) return;

//   const from = msg.from;

//   /* 🔐 ADMIN */
//   if (isAdminNumber(from)) {
//     const { session } = startOrGet(from);
//     session.__isAdmin = true;

//     const ctx = buildContext(req, session);
//     if (!ctx) return;

//     await handleAdminCommands(ctx);
//     return;
//   }

//   /* 🧑 USER */
//   if (isProcessed(msg.id)) return;
//   markProcessed(msg.id);

//   const { session } = startOrGet(from);
//   const ctx = buildContext(req, session);
//   if (!ctx) return;

//   // 🌐 Core flows
//   if (await languageFlow(ctx)) return;
//   if (await menuFlow(ctx)) return;
//   if (await passengerFlow(ctx)) return;
//   if (await summaryFlow(ctx)) return;

//   // 💳 PAYMENT MUST COME EARLY
//   if (await paymentFlow(ctx)) return;

//   // 📦 Booking & tracking
//   if (await bookingFlow(ctx)) return;
//   if (await trackingFlow(ctx)) return;

//   // 🤖 Fallback
//   await fallbackFlow(ctx);
// };

// lib/flow/index.js

require("dotenv").config();

const { buildContext } = require("./context");

const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const summaryFlow = require("./summaryFlow");
const trackingFlow = require("./trackingFlow");
const paymentFlow = require("./paymentFlow");
const fallbackFlow = require("./fallbackFlow");

const { handleAdminCommands } = require("../adminCommand");
const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

/* ======================================================
 * ADMIN CONFIG (ENV-BASED, EXACT MATCH)
 * ====================================================== */

const ADMIN_RAW =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// Normalize once → WhatsApp JID
const ADMIN_JID = ADMIN_RAW
  ? ADMIN_RAW.replace(/\D/g, "") + "@c.us"
  : null;

if (!ADMIN_JID) {
  console.warn("⚠️ ADMIN_PHONE / ADMIN_NUMBER not set");
}

function isAdminNumber(from) {
  return ADMIN_JID && from === ADMIN_JID;
}

/* ======================================================
 * FLOW ROUTER (BRAIN)
 * ====================================================== */

module.exports = async function route(req, res) {
  const msg =
    req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!msg || !msg.from || !msg.id) return;

  const from = msg.from;

  console.log("🔍 FROM RAW:", from);
console.log("🔍 ADMIN_JID:", ADMIN_JID);


  /* ======================================================
   * 🔐 ADMIN FLOW (DEDUPED)
   * ====================================================== */
  if (isAdminNumber(from)) {
    if (isProcessed(msg.id)) return;
    markProcessed(msg.id);

    const { session } = startOrGet(from);
    session.__isAdmin = true;

    const ctx = buildContext(req, session);
    if (!ctx) return;

    await handleAdminCommands(ctx);
    return;
  }

  /* ======================================================
   * 🧑 USER FLOW (DEDUPED)
   * ====================================================== */
  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  /* ======================================================
   * 🌐 CORE FLOWS (ORDER MATTERS)
   * ====================================================== */

  if (await languageFlow(ctx)) return;
  if (await menuFlow(ctx)) return;
  if (await passengerFlow(ctx)) return;
  if (await summaryFlow(ctx)) return;

  /* 💳 Payment must run early */
  if (await paymentFlow(ctx)) return;

  /* 📦 Booking & tracking */
  if (await bookingFlow(ctx)) return;
  if (await trackingFlow(ctx)) return;

  /* 🤖 Fallback */
  await fallbackFlow(ctx);
};
