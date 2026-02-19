const { sendText } = require("../../waClient");
const {
  handleAdminPaymentReceived,
  handleAdminPaymentFailed,
} = require("../../payments/paymentConfirmation");

module.exports = async function handlePaymentCommands(ctx, text) {
  const from = ctx.from;
  const upper = text.toUpperCase();

  if (/^PAYMENT\s+RECEIVED/i.test(upper)) {
    const parts = text.split(/\s+/);
    if (parts.length < 3)
      return sendText(from, "⚠️ PAYMENT RECEIVED <ID>");

    const result = await handleAdminPaymentReceived(from, parts[2]);
    return sendText(
      from,
      result.error ? `❌ ${result.error}` : "✅ Payment confirmed"
    );
  }

  if (/^PAYMENT\s+FAILED/i.test(upper)) {
    const parts = text.split(/\s+/);
    if (parts.length < 3)
      return sendText(from, "⚠️ PAYMENT FAILED <ID>");

    const reason = parts.slice(3).join(" ");
    const result = await handleAdminPaymentFailed(
      from,
      parts[2],
      reason
    );

    return sendText(
      from,
      result.error ? `❌ ${result.error}` : "❌ Payment marked failed"
    );
  }

  return false;
};
