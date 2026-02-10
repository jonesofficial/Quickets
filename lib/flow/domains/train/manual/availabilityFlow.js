const { sendText } = require("../../../../waClient");
const TRAIN_STATES = require("./states");

/**
 * Entry point after user confirms booking request
 */
module.exports = async function availabilityFlow(ctx) {
  const { session: s, from } = ctx;

  if (!s.pendingBooking || s.pendingBooking.type !== "TRAIN") return false;

  s.state = TRAIN_STATES.INIT;

  await sendText(
    from,
    "⏳ Please wait while we check train availability…"
  );

  await sendText(
    from,
    "👨‍✈️ Admin will update availability shortly."
  );

  return true;
};
