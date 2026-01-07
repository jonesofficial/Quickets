const { sendText } = require("../waClient");

async function handlePaymentLink(ctx) {
  const { from, session: s } = ctx;

  // Placeholder until PG integration
  await sendText(
    from,
    "💳 Card / NetBanking will be available soon.\n\nPlease use UPI for faster confirmation."
  );

  s.pendingBooking.payment = {
    method: "LINK",
    status: "PENDING",
  };
}

module.exports = { handlePaymentLink };
