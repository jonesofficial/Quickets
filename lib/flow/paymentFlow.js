const { sendText, sendImage } = require("../waClient");
const {
  getLastBookingByUser,
  findBookingById,
  updateBooking,
} = require("../bookingStore");

const { generateQR } = require("../payments");
const { handleScreenshot } = require("../payments/paymentConfirmation");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   SAFE BOOKING FETCH
====================================================== */

async function getBookingFromContext(ctx) {
  try {
    if (ctx.session?.bookingId) {
      const booking = findBookingById(ctx.session.bookingId);
      if (booking) return booking;
    }

    return await getLastBookingByUser(ctx.from);
  } catch (err) {
    console.error("❌ Booking fetch failed", err);
    return null;
  }
}

module.exports = async function paymentFlow(ctx) {
  try {
    const { msg, from, interactiveId } = ctx;

    if (!ctx.session) ctx.session = {};

    const text = msg?.text?.body?.trim();
    const upperText = text?.toUpperCase();
    const buttonId = interactiveId || msg?.interactive?.button_reply?.id;

    const booking = await getBookingFromContext(ctx);
    if (!booking) return false;

    /* ======================================================
       STATUS VALIDATION
    ====================================================== */

    if (
      booking.status !== "PAYMENT_PENDING" &&
      booking.status !== "AWAITING_MANUAL_VERIFICATION"
    ) {
      return false;
    }

    if (!booking.payment || !booking.payment.link) {
      console.warn("⚠️ Payment object missing", {
        bookingId: booking.id,
      });

      await sendText(
        from,
        "⚠️ Payment session not initialized. Please contact support.",
      );

      return true;
    }

    const total = booking.payment.amount?.total;

    if (!total) {
      await sendText(
        from,
        "⚠️ Payment amount unavailable. Please contact Quickets support.",
      );
      return true;
    }

    const bookingId = booking.id;

    console.log("💳 PAYMENT FLOW ACTIVE", {
      bookingId,
      user: from,
      status: booking.status,
    });

    /* ======================================================
       PAY VIA UPI
    ====================================================== */

    if (buttonId === "PAY_UPI") {
      await sendText(
        from,
        `━━━━━━━━━━━━━━━━━━
🔒 *Quickets Secure Payment*
━━━━━━━━━━━━━━━━━━

🧾 Booking ID : *${bookingId}*
💰 Amount     : *₹${total}*

👉 Tap below to pay:
${booking.payment.link}

After payment:
• Send screenshot
OR
• Reply: *PAID <UTR_NUMBER>*`,
      );

      return true;
    }

    /* ======================================================
       PAY VIA QR
    ====================================================== */

    if (buttonId === "PAY_QR") {
      try {
        const qr = await generateQR(booking.payment.link);

        await sendImage(
          from,
          qr,
          `━━━━━━━━━━━━━━━━━━
🔒 *Quickets QR Payment*
━━━━━━━━━━━━━━━━━━

🧾 Booking ID : *${bookingId}*
💰 Amount     : *₹${total}*

Scan using any UPI app.`,
        );

        await sendText(
          from,
          `After payment:
• Send screenshot
OR
• Reply: *PAID <UTR_NUMBER>*`,
        );
      } catch (err) {
        console.error("❌ QR generation failed", {
          bookingId,
          error: err.message,
        });

        await sendText(
          from,
          "❌ Unable to generate QR. Please use the UPI link instead.",
        );

        if (RAW_ADMIN) {
          await sendText(
            RAW_ADMIN,
            `❌ QR generation failed

🆔 ${bookingId}
👤 ${from}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
User must use PAY_UPI instead.`,
          );
        }
      }

      return true;
    }

    /* ======================================================
       SCREENSHOT RECEIVED
    ====================================================== */

    if (msg?.type === "image" && msg?.image?.id) {
      if (booking.payment?.screenshotReceived) {
        await sendText(
          from,
          "✅ Screenshot already received. Please wait for verification.",
        );
        return true;
      }

      const handled = await handleScreenshot(ctx, booking);

      if (!handled) {
        console.error("❌ Screenshot handling failed", { bookingId });

        await sendText(
          from,
          "⚠️ Unable to process screenshot. Please try again.",
        );

        if (RAW_ADMIN) {
          await sendText(
            RAW_ADMIN,
            `❌ Screenshot processing failed

🆔 ${bookingId}
👤 ${from}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Check paymentConfirmation module.`,
          );
        }

        return true;
      }

      updateBooking(bookingId, {
        status: "AWAITING_MANUAL_VERIFICATION",
        meta: {
          ...(booking.meta || {}),
          screenshotReceivedAt: Date.now(),
        },
      });

      ctx.session.bookingId = bookingId;
      ctx.session.state = BUS_STATES.AWAITING_MANUAL_VERIFICATIO

      return true;
    }

    /* ======================================================
       UTR SUBMISSION
    ====================================================== */

    if (upperText?.startsWith("PAID")) {
      if (booking.payment?.utr) {
        await sendText(
          from,
          "✅ Payment already submitted. Please wait for verification.",
        );
        return true;
      }

      const parts = text.split(/\s+/);
      const utr = parts[1];

      if (!utr || utr.length < 6) {
        await sendText(from, "⚠️ Please send:\nPAID <UTR_NUMBER>");
        return true;
      }

      const fresh = findBookingById(bookingId);

      updateBooking(bookingId, {
        status: "AWAITING_MANUAL_VERIFICATION",
        payment: {
          ...(fresh?.payment || {}),
          utr,
        },
        meta: {
          ...(fresh?.meta || {}),
          userMarkedPaidAt: Date.now(),
        },
      });

      ctx.session.bookingId = bookingId;
      ctx.session.state = BUS_STATES.AWAITING_MANUAL_VERIFICATION;

      await sendText(
        from,
        `━━━━━━━━━━━━━━━━━━
✅ *Payment Submitted*
━━━━━━━━━━━━━━━━━━

🧾 Booking ID : *${bookingId}*
🔢 UTR Number : *${utr}*

⏳ We are verifying your payment.
You will be notified shortly.

— *Team Quickets*`,
      );

      return true;
    }

    return false;
  } catch (err) {
    console.error("🔥 FATAL PAYMENT FLOW ERROR", {
      bookingId: ctx?.session?.bookingId,
      user: ctx?.from,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong during payment. Please try again.",
    );

    return true;
  }
};
