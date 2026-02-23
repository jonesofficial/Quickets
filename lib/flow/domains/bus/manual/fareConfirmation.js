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

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleFareConfirmation(ctx) {
  try {
    const buttonId = ctx.msg?.interactive?.button_reply?.id;

    const booking = await getLastBookingByUser(ctx.from);

    if (!booking) {
      await sendText(ctx.from, "⚠️ No active booking found.");
      return true;
    }

    /* ==========================================
       ONLY ALLOW AFTER DETAILS_SENT
    ========================================== */
    if (booking.status !== "DETAILS_SENT") {
      return false;
    }

    const fare = booking.fare;

    /* ==========================================
       PROCEED TO PAYMENT
    ========================================== */
    if (buttonId === "PROCEED_PAYMENT") {
      if (!fare || !fare.total) {
        await sendText(
          ctx.from,
          "⚠️ Fare not available yet. Please wait for admin confirmation."
        );
        return true;
      }

      try {
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

          await initiatePayment(booking);
        }

        updateBooking(booking.id, {
          payment: booking.payment,
          status: "PAYMENT_PENDING",
        });

        ctx.session.state = BUS_STATES.PAYMENT_PENDING;

      } catch (err) {
        console.error("🔥 Payment creation error", {
          bookingId: booking.id,
          error: err.message,
        });

        await sendText(
          ctx.from,
          "❌ Unable to initiate payment. Please try again."
        );

        return true;
      }

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
        ]
      );

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `💳 *User Proceeded to Payment*

👤 User: ${ctx.from}
🆔 Booking ID: ${booking.id}
💰 Amount: ₹${fare.total}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Wait for PAYMENT RECEIVED ${booking.id}`
        );
      }

      return true;
    }

    /* ==========================================
       CANCEL BOOKING
    ========================================== */
    if (buttonId === "CANCEL_BOOKING") {
      updateBooking(booking.id, {
        status: "CANCELLED",
        meta: {
          ...(booking.meta || {}),
          cancelledAt: Date.now(),
          reason: "User cancelled at details stage",
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

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚫 *Booking Cancelled by User*

👤 User: ${ctx.from}
🆔 Booking ID: ${booking.id}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
No action required.`
        );
      }

      return true;
    }

    return false;

  } catch (err) {
    console.error("🔥 FATAL ERROR IN handleFareConfirmation", {
      user: ctx?.from,
      bookingId: ctx?.session?.bookingId,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong during payment confirmation."
    );

    return true;
  }
};