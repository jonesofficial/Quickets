const { sendText, sendButtons } = require("../../../../waClient");
const { updateBooking, findBookingById } = require("../../../../bookingStore");

const { buildUPILink } = require("../../../../payments/paymentLinks");

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
      await sendText(ctx?.from, "⚠️ No active booking found fareflow.");
      return false;
    }

    if (!booking.user) {
      console.error("❌ Booking missing user phone", {
        bookingId: booking.id,
      });
      return false;
    }

    /* ==========================================
       RE-FETCH LATEST BOOKING (SAFETY)
    ========================================== */
    const freshBooking = findBookingById(booking.id);
    if (!freshBooking) {
      await sendText(ctx?.from, "⚠️ Booking not found while sending fare.");
      return false;
    }

    const fare = freshBooking.fare;

    if (!fare || fare.base == null || fare.gst == null || fare.agent == null) {
      await sendText(
        freshBooking.user,
        "❌ Fare details unavailable.\nPlease wait while we verify the price.",
      );
      return false;
    }

    const base = Number(fare.base);
    const gst = Number(fare.gst);
    const agent = Number(fare.agent);

    if ([base, gst, agent].some(isNaN)) {
      await sendText(
        freshBooking.user,
        "❌ Invalid fare received. Please contact support.",
      );
      return false;
    }

    const total = Number((base + gst + agent).toFixed(2));

    const paymentLink = buildUPILink({
      upiId: process.env.UPI_ID || "yourupi@bank",
      name: "Quickets",
      amount: total,
      note: `Booking ${freshBooking.id}`,
    });

    /* ==========================================
       LOCK FARE + SET STATUS TO FARE_SENT
    ========================================== */
    await updateBooking(freshBooking.id, {
      fare: {
        base,
        gst,
        agent,
        total,
        currency: "INR",
        source: "SEATSELLER",
        lockedAt: Date.now(),
      },

      payment: {
        link: paymentLink,
        status: "CREATED",
        amount: {
          total,
          currency: "INR",
        },
        attempts: 0,
        timestamps: {
          createdAt: Date.now(),
          paidAt: null,
          failedAt: null,
        },
      },

      status: "FARE_SENT",
    });

    if (ctx?.session) {
      ctx.session.state = BUS_STATES.FARE_CONFIRMATION;
      ctx.session.bookingId = freshBooking.id;
    }

    /* ==========================================
       SEND PRICE WITH BUTTONS
    ========================================== */
    await sendButtons(
      freshBooking.user,
      `
🧾 *Final Ticket Price*

🎫 Ticket Cost      : ₹${formatINR(base)}
🧾 Bus GST          : ₹${formatINR(gst)}
💼 Service Charge   : ₹${formatINR(agent)}

━━━━━━━━━━━━━━━━━━
💰 *Total Payable* : ₹${formatINR(total)}
━━━━━━━━━━━━━━━━━━

Please confirm to proceed with payment.
      `.trim(),
      [
        { id: "PROCEED_PAYMENT", title: "💳 Proceed" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" },
      ],
    );

    /* ==========================================
       NOTIFY ADMIN
    ========================================== */
    if (RAW_ADMIN) {
      await sendText(
        RAW_ADMIN,
        `💰 *Fare Sent to User*

🆔 Booking ID: ${freshBooking.id}
👤 User: ${freshBooking.user}
💰 Total: ₹${formatINR(total)}

━━━━━━━━━━━━━━━━━━
Waiting for user confirmation.`,
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
        "⚠️ Something went wrong while processing fare. Please try again.",
      );
    }

    return false;
  }
};
