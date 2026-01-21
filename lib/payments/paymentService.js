// lib/payments/paymentService.js

const { canTransition } = require("./paymentRules");
const { buildUPILink } = require("./paymentLinks");

function initiatePayment(booking) {
  const payment = booking.payment;

  if (!canTransition(payment.status, "PENDING")) {
    throw new Error("Invalid payment state transition");
  }

  const note = `Booking ${booking.bookingId}`;
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
