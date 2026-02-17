const { sendText, sendImage } = require("../waClient");
const { getLastBookingByUser, updateBooking } = require("../bookingStore");
const { generateQR } = require("../payments");
const {
  handleScreenshot,
} = require("../payments/paymentConfirmation");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

/* ======================================================
 * PAYMENT FLOW (MANUAL MODE - STRUCTURED)
 * ====================================================== */

module.exports = async function paymentFlow(ctx) {
  const { msg, from, interactiveId } = ctx;

  const text = msg?.text?.body?.trim();
  const upperText = text?.toUpperCase();
  const buttonId = interactiveId || msg?.interactive?.button_reply?.id;

  // Get latest booking
  const booking = getLastBookingByUser(from);
  if (!booking) return false;

  // Only handle payment stage
  if (booking.status !== "PAYMENT_PENDING") return false;
  if (!booking.payment || !booking.payment.link) return false;

  if (booking.status === "CONFIRMED") {
  return { error: "Booking already confirmed." };
}


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
   * PAY WITH UPI LINK
   * ====================================================== */
  if (buttonId === "PAY_UPI" || upperText === "UPI") {
    await sendText(
      from,
      `🔒 *Quickets Secure Payment*\n\n` +
        `🧾 Booking ID: *${bookingId}*\n` +
        `💰 Amount: *₹${total}*\n\n` +
        `👉 Tap below to pay using any UPI app:\n` +
        `${booking.payment.link}\n\n` +
        `After successful payment, please:\n` +
        `• Send payment screenshot\n` +
        `OR\n` +
        `• Reply: *PAID <UTR_NUMBER>*`
    );
    return true;
  }

  /* ======================================================
   * PAY WITH QR
   * ====================================================== */
  if (buttonId === "PAY_QR" || upperText === "QR") {
    try {
      const qr = await generateQR(booking.payment.link);

      await sendImage(
        from,
        qr,
        `🔒 *Quickets Secure UPI Payment*\n\n` +
          `🧾 Booking ID: ${bookingId}\n` +
          `💰 Amount: ₹${total}\n\n` +
          `Scan using any UPI app to pay.`
      );

      await sendText(
        from,
        `After payment, please:\n` +
          `• Send screenshot\n` +
          `OR\n` +
          `• Reply: *PAID <UTR_NUMBER>*`
      );

      return true;
    } catch (err) {
      console.error("❌ QR generation failed", err);
      await sendText(
        from,
        "❌ Unable to generate QR.\nPlease use the UPI link instead."
      );
      return true;
    }
  }

  /* ======================================================
   * SCREENSHOT RECEIVED
   * ====================================================== */
  if (msg?.image) {
    // Prevent duplicate submissions
    if (booking.payment?.screenshotReceived) {
      await sendText(
        from,
        "✅ Payment screenshot already received.\nPlease wait while we verify."
      );
      return true;
    }

    // Update status via centralized handler
    const handled = await handleScreenshot(ctx, booking);

    if (!handled) return true;

    // Forward screenshot to admin
    if (ADMIN_NUMBER) {
      await sendImage(
        ADMIN_NUMBER,
        msg.image.id,
        `🧾 *Payment Screenshot Received*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n` +
          `💰 Amount: *₹${total}*\n` +
          `📱 User: *${from.replace(/(\d{5})\d+/, "$1XXXXX")}*\n\n` +
          `Status moved to AWAITING_MANUAL_VERIFICATION`
      );
    }

    return true;
  }

  /* ======================================================
   * UTR SUBMISSION
   * ====================================================== */
  if (upperText?.startsWith("PAID")) {
    if (booking.payment?.utr) {
      await sendText(
        from,
        "✅ Payment details already submitted.\nPlease wait for verification."
      );
      return true;
    }

    const parts = text.split(/\s+/);
    const utr = parts[1];

    if (!utr || utr.length < 6) {
      await sendText(
        from,
        "⚠️ Please send in this format:\n\nPAID <UTR_NUMBER>"
      );
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

    if (ADMIN_NUMBER) {
      await sendText(
        ADMIN_NUMBER,
        `🧾 *UTR Submitted*\n\n` +
          `🆔 Booking ID: ${bookingId}\n` +
          `💰 Amount: ₹${total}\n` +
          `🔢 UTR: ${utr}`
      );
    }

    await sendText(
      from,
      `✅ *Payment Submitted Successfully*\n\n` +
        `🧾 Booking ID: *${bookingId}*\n` +
        `🔢 UTR: *${utr}*\n\n` +
        `⏳ Verification usually takes 5–15 minutes.\n` +
        `You will be notified once confirmed.\n\n` +
        `— *Team Quickets*`
    );

    return true;
  }

  return false;
};
