const { sendText, sendImage } = require("../waClient");
const { getLastBookingByUser, updateBooking } = require("../bookingStore");
const { generateQR } = require("../payments");
const { handleScreenshot } = require("../payments/paymentConfirmation");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER?.replace(/\D/g, "");

module.exports = async function paymentFlow(ctx) {
  const { msg, from, interactiveId } = ctx;

  const text = msg?.text?.body?.trim();
  const upperText = text?.toUpperCase();
  const buttonId = interactiveId || msg?.interactive?.button_reply?.id;

  const booking = getLastBookingByUser(from);
  if (!booking) return false;

  // ✅ Allow both stages
  if (
    booking.status !== "PAYMENT_PENDING" &&
    booking.status !== "AWAITING_MANUAL_VERIFICATION"
  ) return false;

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
   * PAY WITH UPI
   * ====================================================== */
  if (buttonId === "PAY_UPI" || upperText === "UPI") {
    await sendText(
      from,
      `🔒 *Quickets Secure Payment*\n\n` +
        `🧾 Booking ID: *${bookingId}*\n` +
        `💰 Amount: *₹${total}*\n\n` +
        `👉 Tap below to pay using any UPI app:\n` +
        `${booking.payment.link}\n\n` +
        `After payment:\n• Send screenshot\nOR\n• Reply: *PAID <UTR_NUMBER>*`
    );

    if (ADMIN_NUMBER) {
      await sendText(
        ADMIN_NUMBER,
        `💳 *Payment Initiated*\n\n` +
          `🆔 Booking ID: ${bookingId}\n` +
          `💰 Amount: ₹${total}\n\n` +
          `Waiting for screenshot or UTR.`
      );
    }

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
        `After payment:\n• Send screenshot\nOR\n• Reply: *PAID <UTR_NUMBER>*`
      );

      if (ADMIN_NUMBER) {
        await sendText(
          ADMIN_NUMBER,
          `💳 *Payment Initiated*\n\n` +
            `🆔 Booking ID: ${bookingId}\n` +
            `💰 Amount: ₹${total}\n\n` +
            `Waiting for screenshot or UTR.`
        );
      }

      return true;
    } catch (err) {
      console.error("❌ QR generation failed", err);
      await sendText(from, "❌ Unable to generate QR. Please use UPI link.");
      return true;
    }
  }

  /* ======================================================
   * SCREENSHOT RECEIVED
   * ====================================================== */
  if (msg?.type === "image" && msg?.image?.id) {
    if (booking.payment?.screenshotReceived) {
      await sendText(
        from,
        "✅ Payment screenshot already received.\nPlease wait while we verify."
      );
      return true;
    }

    const handled = await handleScreenshot(ctx, booking);

    if (!handled) {
      await sendText(
        from,
        "⚠️ Unable to process screenshot at this stage."
      );
      return true;
    }

    if (ADMIN_NUMBER) {
      await sendImage(
        ADMIN_NUMBER,
        msg.image.id,
        `🧾 *Payment Screenshot Received*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n` +
          `💰 Amount: *₹${total}*\n` +
          `📱 User: *${from.replace(/(\d{5})\d+/, "$1XXXXX")}*\n\n` +
          `Status: AWAITING_MANUAL_VERIFICATION`
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
        "✅ Payment already submitted.\nPlease wait for verification."
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

    // ✅ ALWAYS send UTR to admin
    if (ADMIN_NUMBER) {
      await sendText(
        ADMIN_NUMBER,
        `🧾 *UTR Submitted*\n\n` +
          `🆔 Booking ID: ${bookingId}\n` +
          `💰 Amount: ₹${total}\n` +
          `🔢 UTR: ${utr}\n\n` +
          `Status: AWAITING_MANUAL_VERIFICATION`
      );
    }

    await sendText(
      from,
      `✅ *Payment Submitted Successfully*\n\n` +
        `🧾 Booking ID: *${bookingId}*\n` +
        `🔢 Transaction ID: *${utr}*\n\n` +
        `⏳ Kindly send the screenshot of payment.\n` +
        `You will be notified once the screenshot is verified by our team.\n\n` +
        `— *Team Quickets*`
    );

    return true;
  }

  return false;
};
