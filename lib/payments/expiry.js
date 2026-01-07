const { sendText } = require("../waClient");
const { PAYMENT_EXPIRED } = require("./paymentStates");

function startPaymentExpiry(session, minutes = 10) {
  setTimeout(async () => {
    const b = session.pendingBooking;

    if (b?.payment?.status === "PENDING") {
      b.payment.status = PAYMENT_EXPIRED;
      session.state = PAYMENT_EXPIRED;

      await sendText(
        session.from,
        "⏰ Payment expired.\nPlease restart booking if needed."
      );
    }
  }, minutes * 60 * 1000);
}

module.exports = { startPaymentExpiry };
