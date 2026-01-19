// // lib/flow/index.js
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

function matchIntent(text, list) {
  return list.some(
    (k) => text === k || text.startsWith(k + " ")
  );
}

/* ==============================
 * FLOW BRAIN
 * ============================== */
module.exports = async function route(req, res) {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || !msg.from) return;

  const from = msg.from;

  /* 🔐 ADMIN */
  if (isAdminNumber(from)) {
    const { session } = startOrGet(from);
    session.__isAdmin = true;

    const ctx = buildContext(req, session);
    if (!ctx) return;

    await handleAdminCommands(ctx);
    return;
  }

  /* 🧑 USER */
  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  /* =================================================
   * 🌍 FIRST MESSAGE / INTENT HANDLER
   * ================================================= */
  const text = msg?.text?.body?.trim()?.toLowerCase();

  if (text) {
    const GREETINGS = [
      "hi", "hii", "hello", "hey", "hai", "yo",
      "namaste", "vanakkam", "வணக்கம்", "नमस्ते",
      "🙏", "👋"
    ];

    const BOOK_INTENT = [
      "book", "booking", "ticket", "tickets",
      "book ticket", "book tickets",
      "reserve", "reservation",
      "journey", "travel", "bus", "train", "flight"
    ];

    const TRACK_INTENT = [
      "track", "tracking", "pnr",
      "status", "check status", "booking status"
    ];

    const RESET_INTENT = [
      "restart", "reset", "start",
      "menu", "home", "start over"
    ];

    // 👋 Greeting → soft reset + language
    if (matchIntent(text, GREETINGS)) {
      session.state = null;
      session.pendingBooking = null;
      await languageFlow(ctx);
      return;
    }

    // 🎟️ Booking intent → menu
    if (matchIntent(text, BOOK_INTENT)) {
      session.state = "IDLE";
      await menuFlow(ctx);
      return;
    }

    // 📍 Tracking intent
    if (matchIntent(text, TRACK_INTENT)) {
      session.state = "TRACK";
      await trackingFlow(ctx);
      return;
    }

    // 🔄 Reset intent
    if (matchIntent(text, RESET_INTENT)) {
      session.state = null;
      session.pendingBooking = null;
      await menuFlow(ctx);
      return;
    }
  }

  /* =================================================
   * 🌐 LANGUAGE (ENTRY POINT)
   * ================================================= */
  if (await languageFlow(ctx)) return;

  /* =================================================
   * 🏠 MAIN MENU
   * ================================================= */
  if (await menuFlow(ctx)) return;

  /* =================================================
   * 📦 BOOKING CORE
   * ================================================= */
  if (await bookingFlow(ctx)) return;

  /* =================================================
   * 👥 PASSENGER FLOW
   * ================================================= */
  if (await passengerFlow(ctx)) return;

  /* =================================================
   * 💳 PAYMENT
   * ================================================= */
  if (await paymentFlow(ctx)) return;

  /* =================================================
   * 🧾 SUMMARY
   * ================================================= */
  if (await summaryFlow(ctx)) return;

  /* =================================================
   * 📍 TRACKING
   * ================================================= */
  if (await trackingFlow(ctx)) return;

  /* =================================================
   * 🤖 FALLBACK (NEVER SILENT)
   * ================================================= */
  await fallbackFlow(ctx);
};
