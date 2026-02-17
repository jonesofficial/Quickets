// paymentConfirmation.js

const { sendText } = require("../waClient");
const { findBookingById, updateBooking } = require("../bookingStore");
const { markPaymentSuccess, markPaymentFailed } = require("../payments");

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

/* ======================================================
 * HANDLE SCREENSHOT RECEIVED
 * ====================================================== */

async function handleScreenshot(ctx, booking) {
  if (!booking) return false;

  if (booking.status !== "PAYMENT_PENDING") return false;

  updateBooking(booking.id, {
    status: "AWAITING_MANUAL_VERIFICATION",
    payment: {
      ...booking.payment,
      screenshotReceived: true,
    },
    meta: {
      ...(booking.meta || {}),
      screenshotReceivedAt: Date.now(),
    },
  });

  await sendText(
    booking.user,
    `📸 *Screenshot Received*

🧾 Booking ID: *${booking.id}*

⏳ Your payment is under manual verification.
You will be notified once confirmed.

— *Team Quickets*`,
  );

  return true;
}

/* ======================================================
 * ADMIN: PAYMENT RECEIVED
 * ====================================================== */

async function handleAdminPaymentReceived(from, bookingId) {
  const booking = findBookingById(bookingId);
  if (!booking) return { error: "Booking not found." };

  if (!booking.payment?.screenshotReceived) {
    return { error: "No screenshot received for this booking." };
  }

  if (booking.status !== "AWAITING_MANUAL_VERIFICATION") {
    return { error: `Invalid status: ${booking.status}` };
  }

  markPaymentSuccess(booking);

  updateBooking(bookingId, {
    payment: booking.payment,
    status: "CONFIRMED",
    meta: {
      ...(booking.meta || {}),
      manuallyVerifiedAt: Date.now(),
      manuallyVerifiedBy: normalize(from),
    },
  });

  if (booking.user) {
    await sendText(
      booking.user,
      `💳 *Payment Verified Successfully!*

🧾 Booking ID: *${bookingId}*

🎉 Your booking is now confirmed.

— *Team Quickets*`,
    );
  }

  return { success: true };
}

/* ======================================================
 * ADMIN: PAYMENT FAILED
 * ====================================================== */

async function handleAdminPaymentFailed(from, bookingId, reason) {
  const booking = findBookingById(bookingId);
  if (!booking) return { error: "Booking not found." };

  markPaymentFailed(booking);

  updateBooking(bookingId, {
    payment: booking.payment,
    status: "PAYMENT_FAILED",
    meta: {
      ...(booking.meta || {}),
      paymentFailureReason: reason || "Manual rejection",
      manuallyVerifiedBy: normalize(from),
    },
  });

  if (booking.user) {
    await sendText(
      booking.user,
      `❌ *Payment Verification Failed*

🧾 Booking ID: *${bookingId}*

${reason ? `Reason: ${reason}\n\n` : ""}
Please contact support or try again.

— *Team Quickets*`,
    );
  }

  return { success: true };
}

module.exports = {
  handleScreenshot,
  handleAdminPaymentReceived,
  handleAdminPaymentFailed,
};
