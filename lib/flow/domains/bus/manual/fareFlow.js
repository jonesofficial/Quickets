const { sendText, sendButtons } = require("../../../../waClient");
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
      console.warn("⚠️ Fare incomplete", {
        bookingId: booking.id,
        fare,
      });

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
      console.error("❌ Invalid fare values", {
        bookingId: booking.id,
        fare,
      });

      await sendText(
        booking.user,
        "❌ Invalid fare received. Please try again."
      );

      return false;
    }

    const total = Number((base + gst + agent).toFixed(2));

    /* ==========================================
       LOCK FARE IN BOOKING
    ========================================== */
    try {
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

      console.log("💰 Fare locked", {
        bookingId: booking.id,
        total,
      });

    } catch (err) {
      console.error("🔥 Failed updating booking with fare", {
        bookingId: booking.id,
        error: err.message,
      });

      await sendText(
        booking.user,
        "❌ Unable to lock fare. Please try again."
      );

      return false;
    }

    if (ctx?.session) {
      ctx.session.state = BUS_STATES.FARE_PENDING;
    }

    /* ==========================================
       SEND BUTTONS TO USER
    ========================================== */
    try {
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
    } catch (err) {
      console.error("🔥 Failed sending fare buttons", {
        bookingId: booking.id,
        error: err.message,
      });

      await sendText(
        booking.user,
        "❌ Unable to send fare confirmation. Please try again."
      );

      return false;
    }

    /* ==========================================
       NOTIFY ADMIN
    ========================================== */
    if (RAW_ADMIN) {
      try {
        await sendText(
          RAW_ADMIN,
          `💰 *Fare Sent to User*

🆔 Booking ID: ${booking.id}
👤 User: ${booking.user}
💰 Total: ₹${formatINR(total)}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Wait for user to confirm payment.
After payment:
PAYMENT RECEIVED ${booking.id}`
        );
      } catch (err) {
        console.error("❌ Failed notifying admin about fare", {
          bookingId: booking.id,
          error: err.message,
        });
      }
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
