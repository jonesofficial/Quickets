// lib/flow/bookingFlow.js

const busBookingFlow = require("./domains/bus/booking");
const trainBookingFlow = require("./domains/train/booking");
const flightBookingFlow = require("./domains/flight/booking"); // create later

const { sendText } = require("../waClient");

/* ======================================================
 * Domain Registry
 * ====================================================== */
const DOMAIN_HANDLERS = {
  BUS: busBookingFlow,
  TRAIN: trainBookingFlow,
  FLIGHT: flightBookingFlow,
};

/* ======================================================
 * COMMON BOOKING FLOW (ROUTER ONLY)
 * ====================================================== */
module.exports = async function bookingFlow(ctx) {
  const { session: s, msg, text, interactiveId, from, get } = ctx;

  if (!s) return false;

  /* ================= GLOBAL COMMANDS ================= */

  // MENU always resets booking
  if (msg.type === "text" && text?.trim().toUpperCase() === "MENU") {
    s.state = null;
    s.pendingBooking = null;
    return false; // let menuFlow handle menu UI
  }

  // HELP fallback
  if (
    (msg.type === "text" && text?.trim().toUpperCase() === "HELP") ||
    interactiveId === "MENU_HELP"
  ) {
    await sendText(from, get("HELP_TEXT"));
    return true;
  }

  /* ================= DOMAIN ROUTING ================= */

  const bookingType = s.pendingBooking?.type;
  if (!bookingType) return false;

  const handler = DOMAIN_HANDLERS[bookingType];
  if (!handler) {
    console.error("❌ No handler for booking type:", bookingType);
    await sendText(from, "⚠️ Unsupported booking type.\nType *MENU*");
    return true;
  }

  return handler(ctx);
};
