const { sendText } = require("../../waClient");
const {
  handleAdminPaymentReceived,
  handleAdminPaymentFailed,
} = require("../../payments/paymentConfirmation");

module.exports = async function handlePaymentCommands(ctx, text) {
  const from = ctx.from;
  const upper = text.toUpperCase();

  /* =====================================================
     PAYMENT RECEIVED
  ===================================================== */

  if (/^PAYMENT\s+RECEIVED/i.test(upper)) {
    const parts = text.split(/\s+/);

    if (parts.length < 3) {
      return sendText(from, "⚠️ PAYMENT RECEIVED <BOOKING_ID>");
    }

    const bookingId = parts[2];

    const result = await handleAdminPaymentReceived(from, bookingId);

    if (result?.error) {
      return sendText(from, `❌ ${result.error}`);
    }

    await sendText(
      from,
      `✅ Payment Confirmed Successfully\n\n🆔 ${bookingId}`
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n" +
        "👉 NEXT STEP:\n\n" +
        "1️⃣ Upload ticket PDF\n\n" +
        `2️⃣ SEND TICKET ${bookingId}`
    );

    return true;
  }

  /* =====================================================
     PAYMENT FAILED
  ===================================================== */

  if (/^PAYMENT\s+FAILED/i.test(upper)) {
    const parts = text.split(/\s+/);

    if (parts.length < 3) {
      return sendText(from, "⚠️ PAYMENT FAILED <BOOKING_ID> <reason>");
    }

    const bookingId = parts[2];
    const reason = parts.slice(3).join(" ");

    const result = await handleAdminPaymentFailed(
      from,
      bookingId,
      reason
    );

    if (result?.error) {
      return sendText(from, `❌ ${result.error}`);
    }

    await sendText(
      from,
      `❌ Payment Marked Failed\n\n🆔 ${bookingId}`
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n" +
        "👉 NEXT STEP:\n\n" +
        "PROCESS <NEW_BOOKING_ID>"
    );

    return true;
  }

  return false;
};
