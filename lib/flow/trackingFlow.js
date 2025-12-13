// lib/flow/trackingFlow.js
const { sendText } = require("../waClient");

async function handleTracking(ctx) {
  const { session: s, msg, from, get } = ctx;
  if (s.state !== "TRACK_WAIT_ID" || msg.type !== "text") return false;

  const id = msg.text.body.trim().toUpperCase();
  const found =
    s.bookings.find((b) => b.id === id) ||
    (s.pendingBooking && s.pendingBooking.id === id);

  if (!found) {
    await sendText(from, get("NO_BOOKING_FOUND", { id }));
  } else {
    await sendText(
      from,
      get("TRACK_STATUS_LINE", {
        id,
        from: found.from,
        to: found.to,
        date: found.date,
        status: found.status || "Pending",
      })
    );
  }

  s.state = "IDLE";
  return true;
}

module.exports = { handleTracking };
