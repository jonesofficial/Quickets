const { sendText } = require("../../../../waClient");
const { updateBooking } = require("../../../../bookingStore");
const BUS_STATES = require("./states");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

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
      console.error("❌ sendFare called without booking");
      await sendText(ctx?.from, "⚠️ No active booking found.");
      return false;
    }

    if (!booking.user) {
      console.error("❌ Booking missing user phone", {
        bookingId: booking.id,
      });
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
        "❌ Invalid fare received. Please try again."
      );
      return false;
    }

    const total = Number((base + gst + agent).toFixed(2));

    /* ==========================================
       LOCK FARE + SET STATUS TO PRICE_SENT
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
      status: "PRICE_SENT",
    });

    if (ctx?.session) {
      ctx.session.state = BUS_STATES.PRICE_SENT;
    }

    /* ==========================================
       SEND PRICE ONLY (NO BUTTONS)
    ========================================== */
    await sendText(
      booking.user,
      `
🧾 *Ticket Price Received*

🎫 Ticket Cost      : ₹${formatINR(base)}
🧾 Bus GST          : ₹${formatINR(gst)}
💼 Service Charge   : ₹${formatINR(agent)}

━━━━━━━━━━━━━━━━━━
💰 *Total Payable* : ₹${formatINR(total)}
━━━━━━━━━━━━━━━━━━

⏳ Final booking details will be shared shortly for your confirmation.
      `.trim()
    );

    /* ==========================================
       NOTIFY ADMIN
    ========================================== */
    if (RAW_ADMIN) {
      await sendText(
        RAW_ADMIN,
        `💰 *Price Sent (Awaiting Details Approval)*

🆔 Booking ID: ${booking.id}
👤 User: ${booking.user}
💰 Total: ₹${formatINR(total)}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
SEND DETAILS ${booking.id}`
      );
    }

    return true;

  } catch (err) {
    console.error("🔥 FATAL sendFare Error:", {
      bookingId: booking?.id,
      error: err.message,
    });

    if (booking?.user) {
      await sendText(
        booking.user,
        "⚠️ Something went wrong while processing fare. Please try again."
      );
    }

    return false;
  }
};