const { sendText, sendButtons } = require("../../../../waClient");
const {
  updateBooking,
  findBookingById,
} = require("../../../../bookingStore");

const TRAIN_STATES = require("./states");

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ==========================================
   TRAIN CONSTANT CHARGES
========================================== */
const IRCTC_FEE = 17.7;
const AGENT_FEE = 20;

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
   SEND TRAIN FARE (BOOKING-DRIVEN)
   ADMIN ONLY PROVIDES:
   - fare.base (Train Ticket Cost)
   - fare.pg   (PG Charges)
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

    /* ==========================================
       RE-FETCH LATEST BOOKING (SAFETY)
    ========================================== */
    const freshBooking = findBookingById(booking.id);

    if (!freshBooking) {
      await sendText(
        ctx?.from,
        "⚠️ Booking not found while sending fare."
      );
      return false;
    }

    const fare = freshBooking.fare;

    if (!fare || fare.base == null || fare.pg == null) {
      await sendText(
        freshBooking.user,
        "❌ Fare details unavailable.\nPlease wait while we verify the train fare."
      );
      return false;
    }

    const ticketCost = Number(fare.base);
    const pgCharge = Number(fare.pg);

    if ([ticketCost, pgCharge].some(isNaN)) {
      await sendText(
        freshBooking.user,
        "❌ Invalid fare received. Please contact support."
      );
      return false;
    }

    const irctcFee = IRCTC_FEE;
    const agentFee = AGENT_FEE;

    const total = Number(
      (ticketCost + irctcFee + agentFee + pgCharge).toFixed(2)
    );

    /* ==========================================
       LOCK FARE + SET STATUS TO FARE_SENT
    ========================================== */
    updateBooking(freshBooking.id, {
      fare: {
        ticketCost,
        irctcFee,
        agentFee,
        pgCharge,
        total,
        currency: "INR",
        source: "IRCTC_MANUAL",
        lockedAt: Date.now(),
      },
      status: "FARE_SENT",
    });

    if (ctx?.session) {
      ctx.session.state = TRAIN_STATES.FARE_SENT;
      ctx.session.bookingId = freshBooking.id;
    }

    /* ==========================================
       SEND PRICE WITH BUTTONS TO USER
    ========================================== */
    await sendButtons(
      freshBooking.user,
      `
🚆 *Final Train Ticket Price*

🎫 Train Fare      : ₹${formatINR(ticketCost)}
🏛 IRCTC Fee       : ₹${formatINR(irctcFee)}
💳 PG Charges      : ₹${formatINR(pgCharge)}
💼 Agent Fee       : ₹${formatINR(agentFee)}

━━━━━━━━━━━━━━━━━━
💰 *Total Payable* : ₹${formatINR(total)}
━━━━━━━━━━━━━━━━━━

Please confirm to proceed with payment.
      `.trim(),
      [
        { id: "PROCEED_PAYMENT", title: "💳 Proceed" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" },
      ]
    );

    /* ==========================================
       NOTIFY ADMIN
    ========================================== */
    if (RAW_ADMIN) {
      await sendText(
        RAW_ADMIN,
        `💰 *Train Fare Sent to User*

🆔 Booking ID: ${freshBooking.id}
👤 User: ${freshBooking.user}

🎫 Train Fare : ₹${formatINR(ticketCost)}
🏛 IRCTC Fee  : ₹${formatINR(irctcFee)}
💳 PG Charge  : ₹${formatINR(pgCharge)}
💼 Agent Fee  : ₹${formatINR(agentFee)}

━━━━━━━━━━━━━━━━━━
💰 Total: ₹${formatINR(total)}

Waiting for user confirmation.`
      );
    }

    return true;
  } catch (err) {
    console.error("🔥 FATAL TRAIN sendFare Error:", {
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