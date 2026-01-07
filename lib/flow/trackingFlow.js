// lib/flow/trackingFlow.js

const { sendText } = require("../waClient");

module.exports = async function trackingFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;
  const { session: s, msg, from, get } = ctx;

  if (!s) return false;

  /* ==================================================
   * HARD BLOCKS
   * ================================================== */
  if (s.pendingBooking) return false;
  if (s.state !== "TRACK_WAIT_ID") return false;

  /* ==================================================
   * INPUT VALIDATION
   * ================================================== */
  if (msg.type !== "text") {
    await sendText(from, get("OOPS_TAP_OPTIONS"));
    return true;
  }

  const id = msg.text.body.trim().toUpperCase();
  if (!id) {
    await sendText(from, get("INVALID_BOOKING_ID"));
    return true;
  }

  /* ==================================================
   * LOOKUP
   * ================================================== */
  const bookings = Array.isArray(s.bookings) ? s.bookings : [];

  const found =
    bookings.find((b) => b.id === id) || null;

  /* ==================================================
   * RESPONSE
   * ================================================== */
  if (!found) {
    await sendText(from, get("NO_BOOKING_FOUND", { id }));
  } else {
    await sendText(
      from,
      get("TRACK_STATUS_LINE", {
        id: found.id,
        from: found.from,
        to: found.to,
        date: found.date,
        status: found.status ?? "Pending",
      })
    );
  }

  /* ==================================================
   * RESET
   * ================================================== */
  s.state = "IDLE";
  return true;
};
