// // lib/flow/paymentFlow.js

// const { sendText, sendImage } = require("../waClient");
// const { getLastBookingByUser, updateBooking } = require("../bookingStore");
// const { generateQR } = require("../payments/paymentQr");

// module.exports = async function paymentFlow(ctx) {
//   const { msg, from, interactiveId } = ctx;

//   const text = msg?.text?.body?.trim().toUpperCase();
//   const buttonId = interactiveId || msg?.interactive?.button_reply?.id;

//   const booking = getLastBookingByUser(from);
//   if (!booking) return false;

//   if (booking.status !== "PAYMENT_PENDING") return false;
//   if (!booking.payment || !booking.payment.link) return false;

//   const total = booking.payment.amount?.total;
//   if (!total) {
//     await sendText(
//       from,
//       "⚠️ Payment amount unavailable. Please contact support."
//     );
//     return true;
//   }

//   /* =========================
//    * PAY WITH UPI (LINK)
//    * ========================= */
//   if (buttonId === "PAY_UPI" || text === "UPI") {
//     await sendText(
//       from,
//       `💳 *Pay using any UPI app*\n\n` +
//         `Amount: ₹${total}\n\n` +
//         `${booking.payment.link}\n\n` +
//         `Tap the link to complete payment`
//     );
//     return true;
//   }

//   /* =========================
//    * PAY WITH QR
//    * ========================= */
//   if (buttonId === "PAY_QR" || text === "QR") {
//     try {
//       const qr = await generateQR(booking.payment.link);

//       await sendImage(
//         from,
//         qr,
//         `📷 *Scan to Pay*\n\nAmount: ₹${total}`
//       );
//       return true;
//     } catch (err) {
//       console.error("❌ QR generation failed", err);
//       await sendText(
//         from,
//         "❌ Unable to generate QR. Please use the UPI link instead."
//       );
//       return true;
//     }
//   }

//   /* =========================
//    * PAYMENT DONE (UTR)
//    * ========================= */
//   if (text && text.startsWith("PAID")) {
//     if (booking.payment.utr) {
//       await sendText(
//         from,
//         "✅ Payment already submitted.\nPlease wait for verification."
//       );
//       return true;
//     }

//     const parts = msg.text.body.trim().split(/\s+/);
//     const utr = parts[1];

//     if (!utr || utr.length < 6) {
//       await sendText(
//         from,
//         "⚠️ Please send payment like this:\n\nPAID <UTR_NUMBER>"
//       );
//       return true;
//     }

//     updateBooking(booking.id, {
//       payment: {
//         ...booking.payment,
//         utr,
//       },
//       meta: {
//         ...(booking.meta || {}),
//         userMarkedPaidAt: Date.now(),
//       },
//     });

//     await sendText(
//       from,
//       "✅ Payment noted.\n\n" +
//         "Our team will verify and confirm your booking shortly."
//     );

//     return true;
//   }

//   return false;
// };

// lib/flow/paymentFlow.js

const { sendText, sendImage } = require("../waClient");
const { getLastBookingByUser, updateBooking } = require("../bookingStore");
const { generateQR } = require("../payments/paymentQr");

/* ======================================================
 * PAYMENT FLOW (TRUST OPTIMISED)
 * ====================================================== */

module.exports = async function paymentFlow(ctx) {
  const { msg, from, interactiveId } = ctx;

  const text = msg?.text?.body?.trim().toUpperCase();
  const buttonId = interactiveId || msg?.interactive?.button_reply?.id;

  // Get latest booking
  const booking = getLastBookingByUser(from);
  if (!booking) return false;

  // Only proceed if payment is pending
  if (booking.status !== "PAYMENT_PENDING") return false;
  if (!booking.payment || !booking.payment.link) return false;

  const total = booking.payment.amount?.total;
  if (!total) {
    await sendText(
      from,
      "⚠️ Payment amount unavailable. Please contact Quickets support."
    );
    return true;
  }

  /* =========================
   * PAY WITH UPI LINK
   * ========================= */
  if (buttonId === "PAY_UPI" || text === "UPI") {
    await sendText(
      from,
      `🔒 *Quickets Secure Payment*\n\n` +
        `🧾 Booking ID: *${booking.bookingId}*\n` +
        `💰 Amount: *₹${total}*\n\n` +
        `You are paying *Quickets* via UPI.\n\n` +
        `👉 Tap the link below to pay using any UPI app:\n` +
        `${booking.payment.link}\n\n` +
        `After successful payment, please reply:\n` +
        `*PAID <UTR_NUMBER>*`
    );
    return true;
  }

  /* =========================
   * PAY WITH QR
   * ========================= */
  if (buttonId === "PAY_QR" || text === "QR") {
    try {
      const qr = await generateQR(booking.payment.link);

      await sendImage(
        from,
        qr,
        `🔒 Quickets Secure UPI Payment\n\n` +
          `🧾 Booking ID: ${booking.bookingId}\n` +
          `💰 Amount: ₹${total}\n\n` +
          `Scan with any UPI app to pay`
      );

      // Helpful follow-up text (trust anchor)
      await sendText(
        from,
        `After completing payment, please reply:\n` +
          `*PAID <UTR_NUMBER>*\n\n` +
          `Your booking will be verified shortly.`
      );

      return true;
    } catch (err) {
      console.error("❌ QR generation failed", err);
      await sendText(
        from,
        "❌ Unable to generate QR at the moment.\n\n" +
          "Please use the UPI payment link instead."
      );
      return true;
    }
  }

  /* =========================
   * PAYMENT DONE (UTR)
   * ========================= */
  if (text && text.startsWith("PAID")) {
    // Prevent duplicate submission
    if (booking.payment.utr) {
      await sendText(
        from,
        "✅ Payment details already received.\n" +
          "Please wait while we verify your payment."
      );
      return true;
    }

    const parts = msg.text.body.trim().split(/\s+/);
    const utr = parts[1];

    if (!utr || utr.length < 6) {
      await sendText(
        from,
        "⚠️ Please send payment confirmation in this format:\n\n" +
          "*PAID <UTR_NUMBER>*"
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
      `✅ *Payment details submitted successfully*\n\n` +
        `🧾 Booking ID: *${booking.bookingId}*\n` +
        `🔢 UTR: *${utr}*\n\n` +
        `⏱ Payment verification usually takes *5–15 minutes*.\n` +
        `You will receive a confirmation message once verified.\n\n` +
        `Thank you for choosing *Quickets* 🙏`
    );

    return true;
  }

  return false;
};
