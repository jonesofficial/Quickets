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

// const handleBusSelection = require("./domains/bus/manual/busSelection");

// const handleSeatSelection = require("./domains/bus/manual/seatSelection");
// const handleSeatConfirmation = require("./domains/bus/manual/seatConfirmation");

// const { handleAdminCommands } = require("../adminCommand");
// const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

// /* ======================================================
//  * ADMIN CONFIG
//  * ====================================================== */

// const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

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
//   const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
//   if (!msg || !msg.from || !msg.id) return;

//   const from = msg.from;

//   /* ================= ADMIN ================= */

//   if (isAdminNumber(from)) {
//     if (isProcessed(msg.id)) return;
//     markProcessed(msg.id);

//     const { session } = startOrGet(from);
//     session.__isAdmin = true;

//     const ctx = buildContext(req, session);
//     if (!ctx) return;

//     const handled = await handleAdminCommands(ctx);

//     if (!handled) {
//       const { sendText } = require("../waClient");
//       await sendText(
//         from,
//         "⚠️ Unknown admin command.\nSend *HELP* to see valid commands.",
//       );
//     }
//     return;
//   }

//   /* ================= USER ================= */

//   if (isProcessed(msg.id)) return;
//   markProcessed(msg.id);

//   const { session } = startOrGet(from);
//   const ctx = buildContext(req, session);
//   if (!ctx) return;

//   /* ======================================================
//    * 🔒 BUS SELECTION MODE (HARD LOCK)
//    * ====================================================== */
//   if (
//     Array.isArray(session.busOptions) &&
//     session.busOptions.length > 0 &&
//     !session.selectedBus
//   ) {
//     // ONLY allow numeric bus selection
//     if (msg.type === "text" && /^\d+$/.test(msg.text?.body)) {
//       console.log("🟢 BUS SELECTION MODE", {
//         from,
//         choice: msg.text.body,
//         busCount: session.busOptions.length,
//       });

//       await handleBusSelection(ctx);
//       return;
//     }

//     // Block everything else
//     const { sendText } = require("../waClient");
//     await sendText(
//       from,
//       "🚌 Please select a bus by replying with the *bus number* shown above.",
//     );
//     return;
//   }

//   /* ======================================================
//    * 🔒 SEAT CONFIRMATION MODE
//    * ====================================================== */

//   if (session.state === "SEAT_CONFIRMATION") {
//     await handleSeatConfirmation(ctx);
//     return;
//   }

//   /* ======================================================
//    * 🔒 SEAT SELECTION MODE
//    * ====================================================== */

//   if (session.seatSelectionActive && !session.selectedSeat) {
//     if (msg.type === "text") {
//       await handleSeatSelection(ctx);
//       return;
//     }

//     const { sendText } = require("../waClient");
//     await sendText(
//       from,
//       "🪑 Please select a seat by replying with the *seat number* shown in the layout.",
//     );
//     return;
//   }

//   /* ======================================================
//    * 🌐 NORMAL FLOWS (RESUME AFTER BUS SELECTION)
//    * ====================================================== */

//   if (await languageFlow(ctx)) return;
//   if (await menuFlow(ctx)) return;
//   if (await passengerFlow(ctx)) return;
//   if (await summaryFlow(ctx)) return;

//   // 💳 Payment
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

/* ======================================================
 * CORE FLOWS
 * ====================================================== */
const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const summaryFlow = require("./summaryFlow");
const trackingFlow = require("./trackingFlow");
const paymentFlow = require("./paymentFlow");
const fallbackFlow = require("./fallbackFlow");

/* ======================================================
 * BUS MANUAL FLOW HANDLERS
 * ====================================================== */
const handleBusSelection = require("./domains/bus/manual/busSelection");
const handleSeatSelection = require("./domains/bus/manual/seatSelection");
const handleSeatConfirmation = require("./domains/bus/manual/seatConfirmation");
const BUS_STATES = require("./domains/bus/manual/states");
const {
  handleBoardingSelection,
  handleDroppingSelection,
} = require("./domains/bus/manual/boardingDropping");

/* ======================================================
 * ADMIN & SESSION
 * ====================================================== */
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
 * MAIN ROUTER
 * ====================================================== */
module.exports = async function route(req, res) {
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || !msg.from || !msg.id) return;

  const from = msg.from;

  /* ======================================================
   * 🛡 DUPLICATE MESSAGE PROTECTION
   * ====================================================== */
  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  /* ======================================================
   * ================= ADMIN FLOW =================
   * ====================================================== */
  if (isAdminNumber(from)) {
    const { session } = startOrGet(from);
    session.__isAdmin = true;

    const ctx = buildContext(req, session);
    if (!ctx) return;

    const handled = await handleAdminCommands(ctx);

    if (!handled) {
      const { sendText } = require("../waClient");
      await sendText(
        from,
        "⚠️ Unknown admin command.\nSend *HELP* to see valid commands.",
      );
    }

    return;
  }

  /* ======================================================
   * ================= USER FLOW =================
   * ====================================================== */
  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  /* ======================================================
   * 🔒 BUS SELECTION MODE (Hard Lock)
   * ====================================================== */
  if (
    Array.isArray(session.busOptions) &&
    session.busOptions.length > 0 &&
    !session.selectedBus
  ) {
    if (msg.type === "text" && /^\d+$/.test(msg.text?.body)) {
      console.log("🟢 BUS SELECTION MODE", {
        from,
        choice: msg.text.body,
        busCount: session.busOptions.length,
      });

      await handleBusSelection(ctx);
      return;
    }

    const { sendText } = require("../waClient");
    await sendText(
      from,
      "🚌 Please select a bus by replying with the *bus number* shown above.",
    );
    return;
  }

  /* ======================================================
   * 🔒 SEAT CONFIRMATION MODE (Highest Seat Priority)
   * ====================================================== */
  if (session.state === BUS_STATES.SEAT_CONFIRMATION) {
    await handleSeatConfirmation(ctx);
    return;
  }

  /* ======================================================
   * 🔒 SEAT SELECTION MODE
   * ====================================================== */
  if (session.seatSelectionActive && !session.selectedSeat) {
    if (msg.type === "text") {
      await handleSeatSelection(ctx);
      return;
    }

    const { sendText } = require("../waClient");
    await sendText(
      from,
      "🪑 Please select a seat by replying with the *seat number* shown in the layout.",
    );
    return;
  }

  /* ======================================================
   * 🔒 BOARDING SELECTION MODE (NEW)
   * ====================================================== */
  if (await handleBoardingSelection(ctx)) return;

  /* ======================================================
   * 🔒 DROPPING SELECTION MODE (NEW)
   * ====================================================== */
  if (await handleDroppingSelection(ctx)) return;

  /* ======================================================
   * 🌐 NORMAL FLOW RESUMPTION
   * ====================================================== */

  if (await languageFlow(ctx)) return;
  if (await menuFlow(ctx)) return;
  if (await passengerFlow(ctx)) return;
  if (await summaryFlow(ctx)) return;
  if (await paymentFlow(ctx)) return;
  if (await bookingFlow(ctx)) return;
  if (await trackingFlow(ctx)) return;

  /* ======================================================
   * 🤖 FALLBACK
   * ====================================================== */
  await fallbackFlow(ctx);
};
