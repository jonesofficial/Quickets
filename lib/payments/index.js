const { handleUpiQr } = require("./upi");
const { handlePaymentLink } = require("./links");
const {
  handleAdminApproval,
  handleAdminVerification,
} = require("./admin");

module.exports = {
  handleUpiQr,
  handlePaymentLink,
  handleAdminApproval,
  handleAdminVerification,
};
console.log("✅ Payments module loaded");
