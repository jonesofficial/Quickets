const { sendText, sendImage } = require("../waClient");
const {
  getLastBookingByUser,
  findBookingById,
  updateBooking,
} = require("../bookingStore");

const { generateQR } = require("../payments");
const { handleScreenshot } = require("../payments/paymentConfirmation");

/* ======================================================
   SAFE BOOKING FETCH
====================================================== */

async function getBookingFromContext(ctx) {
  if (ctx.session?.bookingId) {
    const booking = findBookingById(ctx.session.bookingId);
    if (booking) return booking;
  }

  return await getLastBookingByUser(ctx.from);
}

module.exports = async function paymentFlow(ctx) {
  const { msg, from, interactiveId } = ctx;

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

  if (!booking.payment || !booking.payment.link) return false;

  const total = booking.payment.amount?.total;

  if (!total) {
    await sendText(
      from,
      "⚠️ Payment amount unavailable. Please contact Quickets support."
    );
    return true;
  }

  const bookingId = booking.id;

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
• Reply: *PAID <UTR_NUMBER>*`
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

Scan using any UPI app.`
      );

      await sendText(
        from,
`After payment:
• Send screenshot
OR
• Reply: *PAID <UTR_NUMBER>*`
      );

      return true;
    } catch (err) {
      await sendText(from, "❌ Unable to generate QR. Please use UPI link.");
      return true;
    }
  }

  /* ======================================================
     SCREENSHOT RECEIVED
  ====================================================== */

  if (msg?.type === "image" && msg?.image?.id) {
    if (booking.payment?.screenshotReceived) {
      await sendText(
        from,
        "✅ Screenshot already received. Please wait for verification."
      );
      return true;
    }

    const handled = await handleScreenshot(ctx, booking);

    if (!handled) {
      await sendText(from, "⚠️ Unable to process screenshot.");
      return true;
    }

    updateBooking(bookingId, {
      status: "AWAITING_MANUAL_VERIFICATION",
    });

    ctx.session.bookingId = bookingId;
    ctx.session.state = "AWAITING_MANUAL_VERIFICATION";

    return true;
  }

  /* ======================================================
     UTR SUBMISSION
  ====================================================== */

  if (upperText?.startsWith("PAID")) {
    if (booking.payment?.utr) {
      await sendText(
        from,
        "✅ Payment already submitted. Please wait for verification."
      );
      return true;
    }

    const parts = text.split(/\s+/);
    const utr = parts[1];

    if (!utr || utr.length < 6) {
      await sendText(from, "⚠️ Please send:\nPAID <UTR_NUMBER>");
      return true;
    }

    updateBooking(bookingId, {
      status: "AWAITING_MANUAL_VERIFICATION",
      payment: {
        ...booking.payment,
        utr,
      },
      meta: {
        ...(booking.meta || {}),
        userMarkedPaidAt: Date.now(),
      },
    });

    ctx.session.bookingId = bookingId;
    ctx.session.state = "AWAITING_MANUAL_VERIFICATION";

    await sendText(
      from,
`━━━━━━━━━━━━━━━━━━
✅ *Payment Submitted*
━━━━━━━━━━━━━━━━━━

🧾 Booking ID : *${bookingId}*
🔢 UTR Number : *${utr}*

⏳ We are verifying your payment.
You will be notified shortly.

— *Team Quickets*`
    );

    return true;
  }

  return false;
};
