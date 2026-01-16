// lib/flow/paymentFlow.js

const { sendText, sendImage } = require("../waClient");
const {
  getLastBookingByUser,
  updateBooking,
} = require("../bookingStore");
const QRCode = require("qrcode");

/* ======================================================
 * PAYMENT FLOW
 * Handles:
 *  - Button clicks: PAY_UPI / PAY_QR
 *  - Text fallback: UPI / QR
 *  - PAID <UTR>
 * ====================================================== */

module.exports = async function paymentFlow(ctx) {
  const { msg, from, interactiveId } = ctx;

  const text = msg?.text?.body?.trim().toUpperCase();
  const buttonId =
    interactiveId ||
    msg?.interactive?.button_reply?.id;

  // Get latest booking of user
  const booking = getLastBookingByUser(from);
  if (!booking) return false;

  // Only when payment is pending
  if (booking.status !== "PAYMENT_PENDING") return false;
  if (!booking.payment || !booking.payment.link) return false;

  /* =========================
   * PAY WITH UPI (BUTTON / TEXT)
   * ========================= */
  if (buttonId === "PAY_UPI" || text === "UPI") {
    await sendText(
      from,
      `💳 *Pay using UPI*\n\n` +
        `Amount: ₹${booking.payment.amount.total}\n\n` +
        `${booking.payment.link}`
    );
    return true;
  }

  /* =========================
   * QR CODE (BUTTON / TEXT)
   * ========================= */
  if (buttonId === "PAY_QR" || text === "QR") {
    try {
      const qr = await QRCode.toDataURL(booking.payment.link);

      await sendImage(
        from,
        qr,
        `📷 *Scan to Pay*\n\nAmount: ₹${booking.payment.amount.total}`
      );
      return true;
    } catch (err) {
      console.error("❌ QR generation failed", err);
      await sendText(
        from,
        "❌ Unable to generate QR. Please use the UPI link instead."
      );
      return true;
    }
  }

  /* =========================
   * PAYMENT DONE (UTR)
   * ========================= */
  if (text && text.startsWith("PAID")) {
    const parts = msg.text.body.trim().split(/\s+/);
    const utr = parts[1];

    if (!utr || utr.length < 6) {
      await sendText(
        from,
        "⚠️ Please send payment like this:\n\nPAID <UTR_NUMBER>"
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
      from,
      "✅ Payment noted.\n\n" +
        "Our team will verify and confirm your booking shortly."
    );

    return true;
  }

  return false;
};
