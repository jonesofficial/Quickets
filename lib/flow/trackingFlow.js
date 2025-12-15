// lib/flow/trackingFlow.js
const { sendText } = require("../waClient");

module.exports=async function trackingFlow(ctx) {
  const { session: s, msg, from, get } = ctx;

  // 🛡 Safety checks
  if (!s) return false;
  if (s.state !== "TRACK_WAIT_ID") return false;

  // Only text input allowed
  if (msg.type !== "text") {
    await sendText(from, get("OOPS_TAP_OPTIONS"));
    return true;
  }

  const id = msg.text.body.trim().toUpperCase();

  const bookings = Array.isArray(s.bookings) ? s.bookings : [];

  const found =
    bookings.find((b) => b.id === id) ||
    (s.pendingBooking && s.pendingBooking.id === id
      ? s.pendingBooking
      : null);

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
        status: found.status || "Pending",
      })
    );
  }

  // 🔁 Always return to idle
  s.state = "IDLE";
  return true;
}

