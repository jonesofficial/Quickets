const { sendText } = require("../../../../waClient");
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
  const text = ctx.msg?.text?.body?.trim();
  if (!text) return true;

  // Always fetch booking by user number
  const booking = getLastBookingByUser(ctx.from);

  if (!booking) {
    await sendText(ctx.from, "⚠️ No active booking found.");
    return true;
  }

  // Only proceed if still in PROCESSING state
  if (booking.status !== "PROCESSING") {
    return true;
  }

  /* =========================================
     USER PRESSES 1 → PROCEED TO PAYMENT
  ========================================= */
  if (text === "1") {
    // 🔥 Only trust bookingStore
    const fare = booking.fare;

    if (!fare) {
      await sendText(
        ctx.from,
        "⚠️ Fare not available. Please try again."
      );
      return true;
    }

    // Create payment
    booking.payment = createPayment({
      bookingId: booking.bookingId,
      amount: {
        baseFare: fare.base,
        taxes: fare.gst,
        fee: fare.agent,
        total: fare.total,
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

Amount: ₹${fare.total}

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
        ...(booking.meta || {}),
        reason: "User cancelled at fare stage",
      },
    });

    ctx.session.state = null;

    await sendText(
      ctx.from,
      `🚫 *Booking Cancelled*

Your booking has been cancelled successfully.

If you wish to book again, type *Hi*.

— *Team Quickets*`
    );

    return true;
  }

  await sendText(
    ctx.from,
    "Please reply with:\n\n1️⃣ Proceed to Payment\n2️⃣ Cancel Booking"
  );

  return true;
};
