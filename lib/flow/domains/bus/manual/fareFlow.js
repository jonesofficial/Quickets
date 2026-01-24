const { sendText } = require("../../../../waClient");

module.exports = async function sendFare(ctx) {
  const fare = ctx.session?.fare;

  if (!fare || fare.base == null || fare.gst == null || fare.agent == null) {
    await sendText(
      ctx.user,
      "❌ Fare details are missing. Please wait while we verify the price."
    );
    return;
  }

  const base = Number(fare.base);
  const gst = Number(fare.gst);
  const agent = Number(fare.agent);

  const total = base + gst + agent;

  await sendText(
    ctx.user,
`💰 Fare Details

Ticket Cost: ₹${base}
Bus GST: ₹${gst}
Agent Charge: ₹${agent}

-------------------
Total: ₹${total}
-------------------

Reply:
1️⃣ Accept & Proceed to Payment
2️⃣ Cancel Booking`
  );
};
