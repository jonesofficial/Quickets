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

    /* ===========================
       FETCH BOOKING
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
      return false;
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

      try {
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

      /* 🔔 Notify Admin */
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

    /* ===========================
       CANCEL BOOKING
    =========================== */
    if (buttonId === "CANCEL_BOOKING") {
      try {
        updateBooking(booking.id, {
          status: "CANCELLED",
          meta: {
            ...(booking.meta || {}),
            cancelledAt: Date.now(),
            reason: "User cancelled at fare stage",
          },
        });

        ctx.session.state = null;

      } catch (err) {
        console.error("🔥 Cancel booking error", {
          bookingId: booking.id,
          error: err.message,
        });
      }

      await sendText(
        ctx.from,
        `
🚫 *Booking Cancelled*

Your booking has been cancelled successfully.

If you wish to book again, type *Hi*.

— *Team Quickets*
        `.trim()
      );

      /* 🔔 Notify Admin */
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

    /* ===========================
       DEFAULT → SHOW FARE
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
      ]
    );

    return true;

  } catch (err) {
    console.error("🔥 FATAL ERROR IN handleFareConfirmation", {
      user: ctx?.from,
      bookingId: ctx?.session?.bookingId,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong during fare confirmation."
    );

    return true;
  }
};
