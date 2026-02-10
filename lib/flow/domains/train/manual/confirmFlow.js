const { sendText } = require("../../../waClient");
const TRAIN_STATES = require("./states");

/**
 * Handles CONFIRM / CANCEL from user
 */
module.exports = async function confirmFlow(ctx) {
  const { msg, session: s, from } = ctx;

  if (!msg?.text?.body) return false;
  if (s.state !== TRAIN_STATES.WAITING_CONFIRMATION) return false;

  const reply = msg.text.body.trim().toUpperCase();

  if (reply === "CONFIRM") {
    s.state = TRAIN_STATES.CONFIRMED;
    s.pendingBooking.status = "CONFIRMED";

    await sendText(
      from,
      "✅ *Booking confirmed*\n\nProceeding with passenger details."
    );

    // continue normal passenger flow
    return true;
  }

  if (reply === "CANCEL") {
    s.state = TRAIN_STATES.CANCELLED;
    s.pendingBooking.status = "CANCELLED";

    await sendText(
      from,
      "❌ *Booking cancelled*\n\nYou can start a new booking anytime."
    );

    s.pendingBooking = null;
    return true;
  }

  await sendText(
    from,
    "⚠️ Invalid reply\n\nPlease reply *CONFIRM* or *CANCEL*"
  );

  return true;
};
