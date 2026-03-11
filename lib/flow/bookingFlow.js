// lib/flow/bookingFlow.js

const busBookingFlow = require("./domains/bus/booking");
const trainBookingFlow = require("./domains/train/booking");
const flightBookingFlow = require("./domains/flight/booking");

const { sendText } = require("../waClient");
const { findBookingById } = require("../bookingStore");

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
  const { session: s, from } = ctx;

  if (!s) return false;

  /* ======================================================
   * RESOLVE BOOKING TYPE
   * ====================================================== */

  let bookingType = s.pendingBooking?.type;

  /* fallback if pendingBooking lost */
  if (!bookingType && s.bookingId) {
    const booking = findBookingById(s.bookingId);
    bookingType = booking?.type;
  }

  if (!bookingType) return false;

  const handler = DOMAIN_HANDLERS[bookingType];

  if (!handler) {
    console.error("❌ No handler for booking type:", bookingType);

    await sendText(
      from,
      "⚠️ Unsupported booking type.\nType *BOOK AGAIN* to start over."
    );

    return true;
  }

  return handler(ctx);
};