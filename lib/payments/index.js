// lib/payments/index.js

const { createPayment } = require("./paymentFactory");
const {
  initiatePayment,
  markPaymentSuccess,
  markPaymentFailed,
} = require("./paymentService");
const { generateQR } = require("./paymentQR");

module.exports = {
  createPayment,
  initiatePayment,
  markPaymentSuccess,
  markPaymentFailed,
  generateQR,
};
