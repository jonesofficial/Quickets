// lib/payments/paymentService.js

const { canTransition } = require("./paymentRules");
const { buildUPILink } = require("./paymentLinks");

/* ======================================================
 * INITIATE PAYMENT
 * ====================================================== */
function initiatePayment(booking) {
  const payment = booking.payment;

  if (!payment) {
    throw new Error("Payment object missing");
  }

  if (!payment.amount || !payment.amount.total) {
    throw new Error("Invalid payment amount");
  }

  if (!process.env.QUICKETS_UPI_ID) {
    throw new Error("QUICKETS_UPI_ID not configured");
  }

  if (!canTransition(payment.status, "PENDING")) {
    throw new Error("Invalid payment state transition");
  }

  const note = `Booking ${booking.id || booking.bookingId}`;
  const amount = payment.amount.total;

  payment.link = buildUPILink({
    upiId: process.env.QUICKETS_UPI_ID,
    name: "Quickets",
    amount,
    note,
  });

  payment.method = "UPI";
  payment.status = "PENDING";
  payment.attempts += 1;

  return payment;
}

/* ======================================================
 * MARK SUCCESS
 * ====================================================== */
function markPaymentSuccess(booking) {
  const payment = booking.payment;

  if (!payment) {
    throw new Error("Payment object missing");
  }

  if (!canTransition(payment.status, "SUCCESS")) {
    throw new Error("Invalid transition to SUCCESS");
  }

  payment.status = "SUCCESS";
  payment.timestamps.paidAt = Date.now();
  payment.timestamps.failedAt = null;

  return payment;
}

/* ======================================================
 * MARK FAILED
 * ====================================================== */
function markPaymentFailed(booking) {
  const payment = booking.payment;

  if (!payment) {
    throw new Error("Payment object missing");
  }

  if (!canTransition(payment.status, "FAILED")) {
    throw new Error("Invalid transition to FAILED");
  }

  payment.status = "FAILED";
  payment.timestamps.failedAt = Date.now();
  payment.timestamps.paidAt = null;

  return payment;
}

module.exports = {
  initiatePayment,
  markPaymentSuccess,
  markPaymentFailed,
};
