const { sendText, sendButtons } = require("../../waClient");
const {
  updateBooking,
  findBookingById,
} = require("../../bookingStore");

const sendFare = require("../../flow/domains/bus/manual/fareFlow");
const {
  buildFinalSummary,
} = require("../../flow/domains/bus/manual/finalConfirmation");

module.exports = async function handleFareCommands(ctx, text) {
  const from = ctx.from;

  /* =====================================================
     SEND DETAILS COMMAND
  ===================================================== */
  if (/^SEND DETAILS/i.test(text)) {
    const parts = text.trim().split(/\s+/);
    const bookingIdFromCmd = parts[2];

    if (!bookingIdFromCmd) {
      return sendText(from, "❌ Usage: SEND DETAILS <bookingId>");
    }

    const booking = findBookingById(bookingIdFromCmd);

    if (!booking) {
      return sendText(from, "❌ Booking not found.");
    }

    if (!booking.fare || !booking.fare.total) {
      return sendText(from, "⚠️ Fare not available yet.");
    }

    const summaryText = await buildFinalSummary({
      from: booking.user,
      session: { bookingId: booking.id },
    });

    await sendButtons(
      booking.user,
      summaryText,
      [
        { id: "PROCEED_PAYMENT", title: "✅ Proceed to Payment" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel Booking" },
      ]
    );

    updateBooking(booking.id, {
      status: "DETAILS_SENT",
    });

    await sendText(
      from,
      `📤 Details sent to user.\n\n🆔 ${booking.id}`
    );

    return true;
  }

  /* =====================================================
     TICKET_PRICE HANDLING
  ===================================================== */

  if (!ctx.session.bookingId) {
    return sendText(from, "⚠️ No active booking.");
  }

  const bookingId = ctx.session.bookingId;
  const booking = findBookingById(bookingId);

  if (!booking) {
    return sendText(from, "❌ Booking not found.");
  }

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

  updateBooking(bookingId, {
    fare: { ...fareData, total },
  });

  await sendText(
    from,
    `✅ Fare Processed Successfully\n\n` +
      `🎫 COST   : ₹${fareData.base}\n` +
      `🧾 GST    : ₹${fareData.gst}\n` +
      `💼 AGENT  : ₹${fareData.agent}\n` +
      `━━━━━━━━━━━━━━\n` +
      `💰 TOTAL  : ₹${total}`
  );

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
    `💰 Price sent to user.\n\n🆔 Booking ID: ${bookingId}\n` +
      `👉 NEXT STEP:\nSEND DETAILS ${bookingId}`
  );

  return true;
};