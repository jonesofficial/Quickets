// lib/payments/paymentService.js

const { canMove } = require("./paymentRules");
const { buildPaytmLink, buildPhonePeLink } = require("./paymentLinks");

function initiatePayment(booking, method = "PAYTM") {
  const payment = booking.payment;

  if (!canMove(payment.status, "PENDING")) {
    throw new Error("Invalid payment state transition");
  }

  const note = `Quickets | ${booking.bookingId}`;
  const amount = payment.amount.total;
  const upiId = process.env.QUICKETS_UPI_ID;

  payment.link =
    method === "PHONEPE"
      ? buildPhonePeLink({ upiId, amount, note })
      : buildPaytmLink({ upiId, amount, note });

  payment.method = method;
  payment.status = "PENDING";
  payment.attempts += 1;

  return payment;
}

function markPaymentSuccess(payment) {
  if (!canMove(payment.status, "SUCCESS")) {
    throw new Error("Invalid transition");
  }

  payment.status = "SUCCESS";
  payment.timestamps.paidAt = new Date();
}

function markPaymentFailed(payment, reason) {
  if (!canMove(payment.status, "FAILED")) {
    throw new Error("Invalid transition");
  }

  payment.status = "FAILED";
  payment.timestamps.failedAt = new Date();
  payment.reason = reason;
}

module.exports = {
  initiatePayment,
  markPaymentSuccess,
  markPaymentFailed,
};
