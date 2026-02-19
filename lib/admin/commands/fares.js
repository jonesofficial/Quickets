const { sendText } = require("../../waClient");
const {
  updateBooking,
  findBookingById,
} = require("../../bookingStore");

const sendFare = require("../../flow/domains/bus/manual/fareFlow");

module.exports = async function handleFareCommands(ctx, text) {
  const from = ctx.from;

  if (!ctx.session.bookingId) {
    return sendText(from, "⚠️ No active booking.");
  }

  const bookingId = ctx.session.bookingId;

  const booking = findBookingById(bookingId);

  if (!booking) {
    return sendText(from, "❌ Booking not found.");
  }

  /* =====================================================
     PARSE ADMIN INPUT
  ===================================================== */

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

    const upperKey = key.toUpperCase();

    if (upperKey === "COST") fareData.base = value;
    if (upperKey === "GST") fareData.gst = value;
    if (upperKey === "AGENT") fareData.agent = value;
  }

  if (fareData.base == null) {
    return sendText(
      from,
      "❌ COST required.\n\nExample:\nTICKET_PRICE\nCOST 942\nGST 46\nAGENT 11"
    );
  }

  fareData.gst = fareData.gst || 0;
  fareData.agent = fareData.agent || 0;

  const total = Number(
    (fareData.base + fareData.gst + fareData.agent).toFixed(2)
  );

  /* =====================================================
     UPDATE BOOKING
  ===================================================== */

  updateBooking(bookingId, {
    fare: { ...fareData, total },
  });

  /* =====================================================
     SEND ADMIN CONFIRMATION
  ===================================================== */

  await sendText(
    from,
    `✅ Fare Processed Successfully\n\n` +
      `🎫 COST   : ₹${fareData.base}\n` +
      `🧾 GST    : ₹${fareData.gst}\n` +
      `💼 AGENT  : ₹${fareData.agent}\n` +
      `━━━━━━━━━━━━━━\n` +
      `💰 TOTAL  : ₹${total}`
  );

  /* =====================================================
     SEND FARE TO USER
  ===================================================== */

  const success = await sendFare({ booking, ctx });

  if (!success) {
    await sendText(
      from,
      "⚠️ Fare stored but failed to send to user."
    );
    return true;
  }

  await sendText(
    from,
    `💰 Fare Sent to User\n\n` +
      `🆔 Booking ID: ${bookingId}\n` +
      `👤 User: ${booking.user}\n` +
      `💰 Total: ₹${total}`
  );

  /* =====================================================
     NEXT STEP GUIDANCE
  ===================================================== */

  await sendText(
    from,
    "━━━━━━━━━━━━━━━━━━\n" +
      "👉 NEXT STEP:\n\n" +
      `After user completes payment:\n` +
      `PAYMENT RECEIVED ${bookingId}\n\n` +
      `OR\n\n` +
      `PAYMENT FAILED ${bookingId} <reason>`
  );

  return true;
};
