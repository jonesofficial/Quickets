// lib/payments/paymentFactory.js

function createPayment({ bookingId, amount }) {
  return {
    paymentId: `PAY_${Date.now()}`,
    bookingId,

    amount, // { baseFare, taxes, fee, total }
    currency: "INR",

    provider: "UPI", // PAYTM / PHONEPE
    method: null,    // set when link is generated

    status: "INITIATED",
    attempts: 0,

    link: null, // payment link
    qr: null,   // optional QR (on request)

    timestamps: {
      initiatedAt: Date.now(),
      paidAt: null,
      failedAt: null,
    },
  };
}

module.exports = { createPayment };
