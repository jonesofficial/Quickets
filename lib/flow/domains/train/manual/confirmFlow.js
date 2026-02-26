const { sendText } = require("../../../../waClient");
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
const { sendText } = require("../../../../waClient");
const TRAIN_STATES = require("./states");

module.exports = async function confirmFlow(ctx) {
  const { msg, session: s, from } = ctx;

  if (s.state !== TRAIN_STATES.WAITING_CONFIRMATION) return false;

  let action = null;

  // Button reply
  if (msg?.type === "interactive") {
    action = msg?.interactive?.button_reply?.id;
  }

  // Text fallback
  if (!action && msg?.text?.body) {
    const text = msg.text.body.trim().toUpperCase();
    if (text === "CONFIRM") action = "TRAIN_CONFIRM";
    if (text === "CANCEL") action = "TRAIN_CANCEL";
  }

  if (!action) return false;

  if (action === "TRAIN_CONFIRM") {
    s.state = TRAIN_STATES.CONFIRMED;
    s.pendingBooking.status = "CONFIRMED";

    await sendText(
      from,
      "✅ *Booking confirmed*\n\nProceeding with passenger details."
    );

    return true;
  }

  if (action === "TRAIN_CANCEL") {
    s.state = TRAIN_STATES.CANCELLED;
    s.pendingBooking.status = "CANCELLED";
    s.pendingBooking = null;

    await sendText(
      from,
      "❌ *Booking cancelled*\n\nYou can start a new booking anytime."
    );

    return true;
  }

  return false;
};