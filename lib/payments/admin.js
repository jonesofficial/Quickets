const { sendText } = require("../waClient");
const {
  PAYMENT_PENDING_APPROVAL,
  PAYMENT_VERIFIED,
} = require("./paymentStates");

async function handleAdminApproval(booking) {
  booking.state = PAYMENT_PENDING_APPROVAL;

  await sendText(
    booking.from,
    `✅ Booking Approved\n\n💰 Amount: ₹${booking.amount}\nPlease proceed with payment.`
  );
}

async function handleAdminVerification(booking) {
  booking.payment.status = "VERIFIED";
  booking.state = PAYMENT_VERIFIED;

  await sendText(
    booking.from,
    "🎉 Payment verified!\n🎟 Ticket will be issued shortly."
  );

  console.log("PAYMENT VERIFIED:", booking.id);
}

module.exports = {
  handleAdminApproval,
  handleAdminVerification,
};
