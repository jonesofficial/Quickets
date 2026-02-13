const { sendText } = require("../../../../waClient");

const BUS_STATES = require("./states");


function formatINR(amount) {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

module.exports = async function sendFare(ctx) {
  try {
    const fare = ctx.session?.fare;

    if (!fare || fare.base == null || fare.gst == null || fare.agent == null) {
      await sendText(
        ctx.from,
        "❌ Fare details are unavailable.\nPlease wait while we verify the price.",
      );
      return false;
    }

    const base = Number(fare.base);
    const gst = Number(fare.gst);
    const agent = Number(fare.agent);

    if ([base, gst, agent].some(isNaN)) {
      await sendText(
        ctx.from,
        "❌ Invalid fare received from provider. Please try again.",
      );
      return false;
    }

    // Prevent floating point issues
    const total = Number((base + gst + agent).toFixed(2));

    // 🔒 Lock final fare in session
    ctx.session.lockedFare = {
      base,
      gst,
      agent,
      total,
      currency: "INR",
      source: "SEATSELLER",
      createdAt: Date.now(),
      accepted: false,
    };

    // Move to fare confirmation state
    ctx.session.state = BUS_STATES.FARE_SENT;

    await sendText(
      ctx.from,
      `🧾 *Fare Summary*

🎫 Ticket Cost      : ₹${formatINR(base)}
🧾 Bus GST           : ₹${formatINR(gst)}
💼 Service Charge    : ₹${formatINR(agent)}

━━━━━━━━━━━━━━━━━━
💰 *Total Payable* : ₹${formatINR(total)}
━━━━━━━━━━━━━━━━━━

Please confirm your booking:

1️⃣ Proceed to Payment  
2️⃣ Cancel Booking`,
    );

    return true;
  } catch (err) {
    console.error("sendFare Error:", err);

    await sendText(
      ctx.from,
      "⚠️ Something went wrong while fetching fare details. Please try again.",
    );

    return false;
  }
};
