const { sendText } = require("../../waClient");
const { updateBooking } = require("../../bookingStore");

module.exports = async function handleFareCommands(ctx, text) {
  const from = ctx.from;

  if (!ctx.session.bookingId)
    return sendText(from, "⚠️ No active booking.");

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^TICKET_PRICE/i.test(l));

  const fareData = {};

  for (const line of lines) {
    const [key, val] = line.split(/\s+/);
    if (!key || !val) continue;

    const value = Number(val);
    if (isNaN(value)) continue;

    if (key.toUpperCase() === "COST") fareData.base = value;
    if (key.toUpperCase() === "GST") fareData.gst = value;
    if (key.toUpperCase() === "AGENT") fareData.agent = value;
  }

  if (!fareData.base)
    return sendText(from, "❌ COST required.");

  fareData.gst = fareData.gst || 0;
  fareData.agent = fareData.agent || 0;

  const total = fareData.base + fareData.gst + fareData.agent;

  updateBooking(ctx.session.bookingId, {
    fare: { ...fareData, total },
  });

  await sendText(
    from,
    `💰 TOTAL: ₹${total}`
  );

  return true;
};
