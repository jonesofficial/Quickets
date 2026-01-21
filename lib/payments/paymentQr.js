// lib/payments/paymentQR.js

const QRCode = require("qrcode");

async function generateQR(upiLink) {
  return QRCode.toDataURL(upiLink, {
    errorCorrectionLevel: "M",
    type: "image/png",
    margin: 2,
    scale: 8, // critical for WhatsApp scanning
  });
}

module.exports = { generateQR };
