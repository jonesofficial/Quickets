// lib/payments/paymentQR.js

const QRCode = require("qrcode");

async function generateQR(upiLink) {
  return await QRCode.toDataURL(upiLink);
}

module.exports = { generateQR };
