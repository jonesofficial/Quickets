const { sendText, sendButtons } = require("../../../../waClient");
const { updateBooking } = require("../../../../bookingStore");
const BUS_STATES = require("./states");

/* ==========================================
   FORMAT INR
========================================== */
function formatINR(amount) {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* ==========================================
   SEND FARE (BOOKING-DRIVEN)
========================================== */
module.exports = async function sendFare({ booking, ctx }) {
  try {
    if (!booking) {
      await sendText(ctx?.from, "⚠️ No active booking found.");
      return false;
    }

    const fare = booking.fare;

    if (
      !fare ||
      fare.base == null ||
      fare.gst == null ||
      fare.agent == null
    ) {
      await sendText(
        booking.user,
        "❌ Fare details are unavailable.\nPlease wait while we verify the price."
      );
      return false;
    }

    const base = Number(fare.base);
    const gst = Number(fare.gst);
    const agent = Number(fare.agent);

    if ([base, gst, agent].some(isNaN)) {
      await sendText(
        booking.user,
        "❌ Invalid fare received from provider. Please try again."
      );
      return false;
    }

    const total = Number((base + gst + agent).toFixed(2));

    /* ==========================================
       LOCK FARE IN BOOKING
    ========================================== */
    updateBooking(booking.id, {
      fare: {
        base,
        gst,
        agent,
        total,
        currency: "INR",
        source: "SEATSELLER",
        lockedAt: Date.now(),
      },
      status: "FARE_PENDING",
    });

    if (ctx?.session) {
      ctx.session.state = BUS_STATES.FARE_PENDING;
    }

    /* ==========================================
       SEND BUTTONS TO USER
    ========================================== */
    await sendButtons(
      booking.user,
      `
🧾 *Fare Summary*

🎫 Ticket Cost      : ₹${formatINR(base)}
🧾 Bus GST          : ₹${formatINR(gst)}
💼 Service Charge   : ₹${formatINR(agent)}

━━━━━━━━━━━━━━━━━━
💰 *Total Payable* : ₹${formatINR(total)}
━━━━━━━━━━━━━━━━━━

Please confirm to proceed.
      `.trim(),
      [
        { id: "PROCEED_PAYMENT", title: "✅ Proceed to Payment" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel Booking" },
      ]
    );

    return true;
  } catch (err) {
    console.error("sendFare Error:", err);

    if (booking?.user) {
      await sendText(
        booking.user,
        "⚠️ Something went wrong while fetching fare details. Please try again."
      );
    }

    return false;
  }
};
