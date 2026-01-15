const { sendText, sendButtons } = require("../waClient");
const buildBusSummary = require("./domains/bus/summary");
const buildTrainSummary = require("./domains/train/summary");

module.exports = async function summaryFlow(ctx) {
  const { session: s, from } = ctx;

  if (!s || s.state !== "REVIEW_BOOKING") return false;

  const booking = s.pendingBooking;

  let summary = "";
  if (booking.type === "BUS") summary = buildBusSummary(booking);
  if (booking.type === "TRAIN") summary = buildTrainSummary(booking);

  await sendText(
    from,
    `🧾 *Please review your booking*\n\n${summary}`
  );

  await sendButtons(from, "What would you like to do?", [
    { id: "CONFIRM_BOOKING", title: "✅ Confirm" },
    { id: "EDIT_BOOKING", title: "✏️ Edit" },
    { id: "CANCEL_BOOKING", title: "❌ Cancel" },
  ]);

  return true;
};
