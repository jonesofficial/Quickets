// lib/adminCommand.js

const {
  handleAdminApproval,
  handleAdminVerification,
} = require("./payments");

const { findBookingById } = require("./bookingStore");

function handleAdminCommands(ctx) {
  const text = ctx.msg.text?.body?.trim();
  console.log("🛂 ADMIN COMMAND CHECK:", text);

  if (!text) return false;

  // APPROVE
  if (text.startsWith("APPROVE")) {
    const bookingId = text.split(" ")[1];
    if (!bookingId) return true;

    const booking = findBookingById(bookingId);
    if (!booking) {
      console.log("❌ Booking not found:", bookingId);
      return true;
    }

    handleAdminApproval(booking);
    return true;
  }

  // PAID
  if (text.startsWith("PAID")) {
    const bookingId = text.split(" ")[1];
    if (!bookingId) return true;

    const booking = findBookingById(bookingId);
    if (!booking) {
      console.log("❌ Booking not found:", bookingId);
      return true;
    }

    handleAdminVerification(booking);
    return true;
  }

  return false;
}

module.exports = { handleAdminCommands };
