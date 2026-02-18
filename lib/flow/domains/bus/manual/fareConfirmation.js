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

  const booking = getLastBookingByUser(ctx.from);
  if (!booking) {
    await sendText(ctx.from, "⚠️ No active booking found.");
    return true;
  }

  // Only handle fare stage
  if (booking.status !== "PROCESSING") {
    return false; // let paymentFlow handle next stages
  }

  /* ===========================
     PROCEED TO PAYMENT
  =========================== */
  if (buttonId === "PROCEED_PAYMENT") {
    const fare = booking.fare;

    if (!fare) {
      await sendText(ctx.from, "⚠️ Fare not available. Please try again.");
      return true;
    }

    if (!booking.payment) {
      booking.payment = createPayment({
        bookingId: booking.id,
        amount: {
          baseFare: fare.base,
          taxes: fare.gst,
          fee: fare.agent,
          total: fare.total,
        },
      });

      initiatePayment(booking);
    }

    // Update state BEFORE sending message
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
        💰 Amount: *₹${fare.total}*

        Choose a payment method:
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
      `.trim(),
    );

    return true;
  }

  /* ===========================
     DEFAULT → SHOW CONFIRMATION
  =========================== */
  await sendButtons(
    ctx.from,
    `
      💰 *Fare Confirmation*

      🧾 Booking ID: *${booking.id}*
      💰 Total Fare: *₹${booking.fare?.total}*

      Please confirm to proceed.
    `.trim(),
    [
      { id: "PROCEED_PAYMENT", title: "✅ Proceed to Payment" },
      { id: "CANCEL_BOOKING", title: "❌ Cancel Booking" },
    ],
  );

  return true;
};
