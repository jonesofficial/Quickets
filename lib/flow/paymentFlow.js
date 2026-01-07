const {
  handleUpiQr,
  handlePaymentLink,
} = require("../payments");

const { sendText } = require("../waClient");

module.exports = async function paymentFlow(ctx) {
  const { interactiveId, session: s, from } = ctx;

  if (!s || !s.pendingBooking) return false;

  switch (interactiveId) {
    case "PAY_UPI_QR":
      await handleUpiQr(ctx);
      return true;

    case "PAY_LINK":
      await handlePaymentLink(ctx);
      return true;

    case "PAY_DONE":
      s.pendingBooking.payment.status = "SUBMITTED";

      await sendText(
        from,
        "✅ Payment noted.\n⏳ Waiting for admin verification."
      );

      // notify admin (simple for now)
      console.log("PAYMENT SUBMITTED:", s.pendingBooking.id);
      return true;
  }

  return false;
};
