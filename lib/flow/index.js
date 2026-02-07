// // // lib/flow/index.js

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

// /* ======================================================
//  * ADMIN CONFIG (ENV BASED)
//  * ====================================================== */

// const RAW_ADMIN =
//   process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// function normalize(num = "") {
//   return String(num).replace(/\D/g, "");
// }

// function isAdminNumber(from) {
//   if (!RAW_ADMIN) return false;
//   return normalize(from) === normalize(RAW_ADMIN);
// }

// /* ======================================================
//  * FLOW BRAIN
//  * ====================================================== */

// module.exports = async function route(req, res) {
//   const msg =
//     req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

//   if (!msg || !msg.from || !msg.id) return;

//   const from = msg.from;

//   /* ======================================================
//    * 🔐 ADMIN FLOW — ABSOLUTE OVERRIDE
//    * ====================================================== */
//   if (isAdminNumber(from)) {
//     // 🔒 Dedupe admin messages
//     if (isProcessed(msg.id)) return;
//     markProcessed(msg.id);

//     const { session } = startOrGet(from);
//     session.__isAdmin = true;

//     const ctx = buildContext(req, session);
//     if (!ctx) return;

//     const handled = await handleAdminCommands(ctx);

//     // 🔔 Optional feedback if admin sent junk
//     if (!handled) {
//       const { sendText } = require("../waClient");
//       await sendText(
//         from,
//         "⚠️ Unknown admin command.\nSend *HELP* to see valid commands."
//       );
//     }

//     // 🚨 CRITICAL: admin NEVER enters user flows
//     return;
//   }

//   /* ======================================================
//    * 🧑 USER FLOW
//    * ====================================================== */

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

//   // 💳 Payment must run early
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
 * ADMIN CONFIG
 * ====================================================== */

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

function isAdminNumber(from) {
  if (!RAW_ADMIN) return false;
  return normalize(from) === normalize(RAW_ADMIN);
}

/* ======================================================
 * FLOW BRAIN
 * ====================================================== */

module.exports = async function route(req, res) {
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || !msg.from || !msg.id) return;

  const from = msg.from;

  /* ================= ADMIN ================= */

  if (isAdminNumber(from)) {
    if (isProcessed(msg.id)) return;
    markProcessed(msg.id);

    const { session } = startOrGet(from);
    session.__isAdmin = true;

    const ctx = buildContext(req, session);
    if (!ctx) return;

    const handled = await handleAdminCommands(ctx);

    if (!handled) {
      const { sendText } = require("../waClient");
      await sendText(
        from,
        "⚠️ Unknown admin command.\nSend *HELP* to see valid commands."
      );
    }
    return;
  }

  /* ================= USER ================= */

  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  /* ======================================================
   * 🔥 BUS OPTION SELECTION (TEXT: 1 / 2 / 3)
   * ====================================================== */

  if (
    session.state === "BUS_OPTION_SELECTION" &&
    msg.type === "text" &&
    /^\d+$/.test(msg.text?.body)
  ) {
    console.log("🟢 ROUTING BUS SELECTION (TEXT)", {
      from,
      choice: msg.text.body,
      busCount: session.busOptions?.length
    });

    const handled = await bookingFlow(ctx);
    if (handled) return;
  }

  /* ======================================================
   * 🌐 NORMAL FLOWS
   * ====================================================== */

  if (await languageFlow(ctx)) return;
  if (await menuFlow(ctx)) return;
  if (await passengerFlow(ctx)) return;
  if (await summaryFlow(ctx)) return;

  // 💳 Payment
  if (await paymentFlow(ctx)) return;

  // 📦 Booking & tracking
  if (await bookingFlow(ctx)) return;
  if (await trackingFlow(ctx)) return;

  // 🤖 Fallback
  await fallbackFlow(ctx);
};
