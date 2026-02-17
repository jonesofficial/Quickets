const { sendText, sendImage } = require("../../../../waClient");
const {
  getLastBookingByUser,
  updateBooking,
} = require("../../../../bookingStore");

const {
  createPayment,
  initiatePayment,
  generateQR,
} = require("../../../../payments");

const BUS_STATES = require("./states");

module.exports = async function handleFareConfirmation(ctx) {
  const text = ctx.msg?.text?.body?.trim();
  if (!text) return true;

  const booking = getLastBookingByUser(ctx.from);

  if (!booking) {
    await sendText(ctx.from, "⚠️ No active booking found.");
    return true;
  }

  /* ======================================================
   * STEP 1: USER CONFIRMS FARE (BOOKING IN PROCESSING)
   * ====================================================== */
  if (booking.status === "PROCESSING") {
    if (text === "1") {
      const fare = booking.fare;

      if (!fare) {
        await sendText(ctx.from, "⚠️ Fare not available. Please try again.");
        return true;
      }

      // Prevent duplicate payment creation
      if (!booking.payment) {
        booking.payment = createPayment({
          bookingId: booking.id || booking.bookingId,
          amount: {
            baseFare: fare.base,
            taxes: fare.gst,
            fee: fare.agent,
            total: fare.total,
          },
        });

        initiatePayment(booking);
      }

      updateBooking(booking.id || booking.bookingId, {
        payment: booking.payment,
        status: "PAYMENT_PENDING",
      });

      ctx.session.state = BUS_STATES.PAYMENT_PENDING;

      await sendText(
        ctx.from,
        `💳 *Complete Your Payment*

🧾 Booking ID: *${booking.id || booking.bookingId}*
💰 Amount: *₹${fare.total}*

Choose payment option:

1️⃣ Pay via UPI Link  
2️⃣ Get QR Code  

Reply with 1 or 2.

— *Team Quickets*`,
      );

      return true;
    }

    if (text === "2") {
      updateBooking(booking.id || booking.bookingId, {
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

— *Team Quickets*`,
      );

      return true;
    }

    await sendText(
      ctx.from,
      "Please reply with:\n\n1️⃣ Proceed to Payment\n2️⃣ Cancel Booking",
    );

    return true;
  }

  /* ======================================================
   * STEP 2: PAYMENT OPTIONS (BOOKING IN PAYMENT_PENDING)
   * ====================================================== */
  if (booking.status === "PAYMENT_PENDING") {
    if (!booking.payment || !booking.payment.link) {
      await sendText(ctx.from, "⚠️ Payment not initialized properly.");
      return true;
    }

    const total = booking.payment.amount.total;

    // Send UPI link
    if (text === "1") {
      await sendText(
        ctx.from,
        `🔒 *Quickets Secure UPI Payment*

🧾 Booking ID: *${booking.id || booking.bookingId}*
💰 Amount: *₹${total}*

👉 Tap below to pay using any UPI app:

${booking.payment.link}

After payment, reply:
*PAID <UTR_NUMBER>*`,
      );
      return true;
    }

    // Send QR
    if (text === "2") {
      try {
        const qr = await generateQR(booking.payment.link);

        await sendImage(
          ctx.from,
          qr,
          `🔒 *Quickets Secure QR Payment*

🧾 Booking ID: ${booking.id || booking.bookingId}
💰 Amount: ₹${total}

Scan using any UPI app.

After payment, reply:
*PAID <UTR_NUMBER>*`,
        );
      } catch (err) {
        await sendText(
          ctx.from,
          "❌ Unable to generate QR. Please use UPI link instead.",
        );
      }

      return true;
    }

    // UTR submission
    if (text.toUpperCase().startsWith("PAID")) {
      if (booking.payment.utr) {
        await sendText(
          ctx.from,
          "✅ Payment already submitted. Please wait for verification.",
        );
        return true;
      }

      const parts = text.split(/\s+/);
      const utr = parts[1];

      if (!utr || utr.length < 6) {
        await sendText(
          ctx.from,
          "⚠️ Please send in this format:\n\nPAID <UTR_NUMBER>",
        );
        return true;
      }

      updateBooking(booking.id || booking.bookingId, {
        payment: {
          ...booking.payment,
          utr,
        },
        meta: {
          ...(booking.meta || {}),
          userMarkedPaidAt: Date.now(),
        },
      });

      await sendText(
        ctx.from,
        `✅ *Payment Submitted*

🧾 Booking ID: *${booking.id || booking.bookingId}*
🔢 UTR: *${utr}*

⏱ Verification usually takes 5–15 minutes.

You will receive confirmation shortly.

— *Team Quickets*`,
      );

      return true;
    }

    await sendText(
      ctx.from,
      "Reply with:\n\n1️⃣ UPI Link\n2️⃣ QR Code\n\nOr send:\nPAID <UTR_NUMBER>",
    );

    return true;
  }

  return true;
};
