const { sendText, sendImage, sendButtons } = require("../../../../waClient");
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
  const buttonId = ctx.msg?.interactive?.button_reply?.id;
  const text = ctx.msg?.text?.body?.trim();

  const booking = getLastBookingByUser(ctx.from);

  if (!booking) {
    await sendText(ctx.from, "⚠️ No active booking found.");
    return true;
  }

  /* ======================================================
   * STEP 1: USER CONFIRMS FARE
   * ====================================================== */
  if (booking.status === "PROCESSING") {

    /* ✅ PROCEED TO PAYMENT */
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

      updateBooking(booking.id, {
        payment: booking.payment,
        status: "PAYMENT_PENDING",
      });

      ctx.session.state = BUS_STATES.PAYMENT_PENDING;

      await sendButtons(
        ctx.from,
        `💳 *Complete Your Payment*

🧾 Booking ID: *${booking.id}*
💰 Amount: *₹${fare.total}*

Choose a payment method:`,
        [
          { id: "PAY_UPI", title: "🔗 Pay via UPI" },
          { id: "PAY_QR", title: "📷 Get QR Code" },
        ],
      );

      return true;
    }

    /* ❌ CANCEL BOOKING */
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
        `🚫 *Booking Cancelled*

Your booking has been cancelled successfully.

If you wish to book again, type *Hi*.

— *Team Quickets*`,
      );

      return true;
    }

    /* DEFAULT → SEND CONFIRM BUTTONS */
    await sendButtons(
      ctx.from,
      `💰 *Fare Confirmation*

🧾 Booking ID: *${booking.id}*
💰 Total Fare: *₹${booking.fare?.total}*

Please confirm to proceed.`,
      [
        { id: "PROCEED_PAYMENT", title: "✅ Proceed to Payment" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel Booking" },
      ],
    );

    return true;
  }

  /* ======================================================
   * STEP 2: PAYMENT OPTIONS
   * ====================================================== */
  if (booking.status === "PAYMENT_PENDING") {

    const total = booking.payment?.amount?.total;

    if (!total) {
      await sendText(ctx.from, "⚠️ Payment not initialized properly.");
      return true;
    }

    /* 🔗 PAY VIA UPI */
    if (buttonId === "PAY_UPI") {
      await sendText(
        ctx.from,
        `🔒 *Quickets Secure UPI Payment*

🧾 Booking ID: *${booking.id}*
💰 Amount: *₹${total}*

👉 Tap below to pay:

${booking.payment.link}

After payment, reply:
*PAID <UTR_NUMBER>*`,
      );

      return true;
    }

    /* 📷 PAY VIA QR */
    if (buttonId === "PAY_QR") {
      try {
        const qr = await generateQR(booking.payment.link);

        await sendImage(
          ctx.from,
          qr,
          `🔒 *Quickets Secure QR Payment*

🧾 Booking ID: ${booking.id}
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

    /* 🧾 UTR SUBMISSION */
    if (text?.toUpperCase().startsWith("PAID")) {
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

      updateBooking(booking.id, {
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

🧾 Booking ID: *${booking.id}*
🔢 Transaction ID: *${utr}*

⏱ Verification usually takes 5–15 minutes.

You will receive confirmation shortly.

— *Team Quickets*`,
      );

      return true;
    }

    /* DEFAULT PAYMENT BUTTONS */
    await sendButtons(
      ctx.from,
      `💳 *Payment Options*

Choose a payment method below:`,
      [
        { id: "PAY_UPI", title: "🔗 Pay via UPI" },
        { id: "PAY_QR", title: "📷 Get QR Code" },
      ],
    );

    return true;
  }

  return true;
};
