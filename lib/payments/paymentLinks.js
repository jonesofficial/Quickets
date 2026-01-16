// lib/payments/paymentLinks.js

/**
 * Build a universal UPI payment link
 * Works with ALL UPI apps (GPay, PhonePe, Paytm, BHIM, banks)
 */
function buildUPILink({ upiId, name, amount, note }) {
  return (
    "upi://pay" +
    `?pa=${encodeURIComponent(upiId)}` +
    `&pn=${encodeURIComponent(name)}` +
    `&am=${amount}` +
    `&cu=INR` +
    `&tn=${encodeURIComponent(note)}`
  );
}

module.exports = {
  buildUPILink,
};
