const {
  handleAdminApproval,
  handleAdminVerification,
} = require("./payments");

function handleAdminCommands(ctx) {
  const { msg } = ctx;
  const text = msg.text?.body?.trim();

  if (!text) return false;

  // APPROVE COMMAND
  if (text.startsWith("APPROVE")) {
    const bookingId = text.split(" ")[1];
    if (!bookingId) return true;

    const booking = findBookingById(bookingId);
    if (!booking) return true;

    handleAdminApproval(booking);
    return true;
  }

  // PAID COMMAND
  if (text.startsWith("PAID")) {
    const bookingId = text.split(" ")[1];
    if (!bookingId) return true;

    const booking = findBookingById(bookingId);
    if (!booking) return true;

    handleAdminVerification(booking);
    return true;
  }

  return false;
}

module.exports = { handleAdminCommands };
