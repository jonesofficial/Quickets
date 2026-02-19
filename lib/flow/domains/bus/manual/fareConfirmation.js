const { sendText, sendButtons } = require("../../../../waClient");
const {
  getLastBookingByUser,
  updateBooking,
} = require("../../../../bookingStore");

const {
  createPayment,
  initiatePayment,
} = require("../../../../payments");

const BUS_STATES = require("./states");

module.exports = async function handleFareConfirmation(ctx) {
  const buttonId = ctx.msg?.interactive?.button_reply?.id;

  /* ===========================
     FETCH BOOKING (ALWAYS AWAIT)
  =========================== */
  const booking = await getLastBookingByUser(ctx.from);

  if (!booking) {
    await sendText(ctx.from, "⚠️ No active booking found.");
    return true;
  }

  /* ===========================
     ONLY HANDLE FARE STAGE
  =========================== */
  if (
    booking.status !== "FARE_PENDING" &&
    booking.status !== "PROCESSING"
  ) {
    return false; // allow next handler (payment flow) to take over
  }

  const fare = booking.fare;

  /* ===========================
     PROCEED TO PAYMENT
  =========================== */
  if (buttonId === "PROCEED_PAYMENT") {
    if (!fare || !fare.total) {
      await sendText(
        ctx.from,
        "⚠️ Fare not available yet. Please wait for admin confirmation."
      );
      return true;
    }

    /* Prevent duplicate payment creation */
    if (!booking.payment) {
      const payment = createPayment({
        bookingId: booking.id,
        amount: {
          baseFare: fare.base || 0,
          taxes: fare.gst || 0,
          fee: fare.agent || 0,
          total: fare.total,
        },
      });

      booking.payment = payment;
      initiatePayment(booking);
    }

    /* Update booking */
    updateBooking(booking.id, {
      payment: booking.payment,
      status: "PAYMENT_PENDING",
    });

    ctx.session.state = BUS_STATES.PAYMENT_PENDING;

    await sendButtons(
      ctx.from,
      `
💳 *Complete Your Payment*

🧾 Booking ID: *${booking.id}*
💰 Total Amount: *₹${fare.total}*

Choose your payment method:
      `.trim(),
      [
        { id: "PAY_UPI", title: "🔗 Pay via UPI" },
        { id: "PAY_QR", title: "📷 Get QR Code" },
      ],
    );

    return true;
  }

  /* ===========================
     CANCEL BOOKING
  =========================== */
  if (buttonId === "CANCEL_BOOKING") {
    updateBooking(booking.id, {
      status: "CANCELLED",
      meta: {
        ...(booking.meta || {}),
        cancelledAt: Date.now(),
        reason: "User cancelled at fare stage",
      },
    });

    ctx.session.state = null;

    await sendText(
      ctx.from,
      `
🚫 *Booking Cancelled*

Your booking has been cancelled successfully.

If you wish to book again, type *Hi*.

— *Team Quickets*
      `.trim()
    );

    return true;
  }

  /* ===========================
     DEFAULT → SHOW FARE CONFIRMATION
  =========================== */
  if (!fare || !fare.total) {
    await sendText(
      ctx.from,
      "⏳ Fare is being calculated. Please wait..."
    );
    return true;
  }

  await sendButtons(
    ctx.from,
    `
💰 *Fare Confirmation*

🧾 Booking ID: *${booking.id}*

Base Fare : ₹${fare.base || 0}
GST       : ₹${fare.gst || 0}
Agent Fee : ₹${fare.agent || 0}
━━━━━━━━━━━━━━━━
Total     : *₹${fare.total}*

Please confirm to proceed.
    `.trim(),
    [
      { id: "PROCEED_PAYMENT", title: "✅ Proceed to Payment" },
      { id: "CANCEL_BOOKING", title: "❌ Cancel Booking" },
    ],
  );

  return true;
};
