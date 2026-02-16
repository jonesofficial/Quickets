const { sendText } = require("../../../../waClient");
const { findBookingById, updateBooking } = require("../../../../bookingStore");
const {
  createPayment,
  initiatePayment,
} = require("../../../../payments");
const BUS_STATES = require("./states");

module.exports = async function handleFareConfirmation(ctx) {
  const text = ctx.msg?.text?.body?.trim();

  if (!ctx.session?.bookingId) {
    await sendText(ctx.from, "⚠️ No active booking found.");
    return true;
  }

  if (!text) {
    return true;
  }

  const booking = findBookingById(ctx.session.bookingId);

  if (!booking) {
    await sendText(ctx.from, "⚠️ Booking not found.");
    return true;
  }

  /* =========================================
     USER PRESSES 1 → PROCEED TO PAYMENT
  ========================================= */
  if (text === "1") {
    const lockedFare = ctx.session.lockedFare;

    if (!lockedFare) {
      await sendText(ctx.from, "⚠️ Fare expired. Please try again.");
      return true;
    }

    // Create payment
    booking.payment = createPayment({
      bookingId: booking.bookingId,
      amount: {
        baseFare: lockedFare.base,
        taxes: lockedFare.gst,
        fee: lockedFare.agent,
        total: lockedFare.total,
      },
    });

    // Initiate payment
    initiatePayment(booking);

    updateBooking(booking.bookingId, {
      payment: booking.payment,
      status: "PAYMENT_PENDING",
    });

    ctx.session.state = BUS_STATES.PAYMENT_PENDING;

    await sendText(
      ctx.from,
      `💳 *Complete Your Payment*

Amount: ₹${lockedFare.total}

Click below to pay:

🔗 ${booking.payment.link}

After payment, we will confirm your ticket.

— *Team Quickets*`
    );

    return true;
  }

  /* =========================================
     USER PRESSES 2 → CANCEL BOOKING
  ========================================= */
  if (text === "2") {
    updateBooking(booking.bookingId, {
      status: "CANCELLED",
      meta: {
        reason: "User cancelled at fare stage",
      },
    });

    ctx.session.bookingId = null;
    ctx.session.bookingUser = null;
    ctx.session.state = null;
    ctx.session.lockedFare = null;

    await sendText(
      ctx.from,
      `🚫 *Booking Cancelled*

Your booking has been cancelled successfully.

If you wish to book again, type *Hi*.

— *Team Quickets*`
    );

    return true;
  }

  // Invalid input
  await sendText(
    ctx.from,
    "Please reply with:\n\n1️⃣ Proceed to Payment\n2️⃣ Cancel Booking"
  );

  return true;
};
