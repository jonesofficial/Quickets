// lib/adminCommand.js

const { sendText } = require("./waClient");
const {
  findBookingById,
  updateBooking,
} = require("./bookingStore");

/* ======================================================
 * Admin Command Handler (STATUS ONLY)
 * ====================================================== */

async function handleAdminCommands(ctx) {
  const text = ctx.msg?.text?.body?.trim();
  const from = ctx.from;

  if (!text) return false;

  const parts = text.split(/\s+/);
  const command = parts[0]?.toUpperCase();
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

  console.log("🛂 ADMIN COMMAND:", command, bookingId, reason);

  const COMMANDS = {
    PROCESS: "PROCESSING",
    CONFIRM: "CONFIRMED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  };

  if (!COMMANDS[command]) {
    await sendText(
      from,
      "⚠️ Unknown admin command.\n\n" +
        "Available commands:\n" +
        "• PROCESS <BOOKING_ID>\n" +
        "• CONFIRM <BOOKING_ID>\n" +
        "• FAIL <BOOKING_ID> <reason>\n" +
        "• CANCEL <BOOKING_ID> <reason>"
    );
    return true;
  }

  if (!bookingId) {
    await sendText(
      from,
      "⚠️ Booking ID missing.\nExample: CONFIRM QK-123456"
    );
    return true;
  }

  const booking = findBookingById(bookingId);
  if (!booking) {
    await sendText(from, `❌ Booking not found: ${bookingId}`);
    return true;
  }

  const patch = {
    status: COMMANDS[command],
  };

  if (reason) {
    patch.meta = {
      ...(booking.meta || {}),
      reason,
    };
  }

  // 🔔 Auto-notify will trigger from bookingStore
  updateBooking(bookingId, patch);

  await sendText(
    from,
    `✅ Booking updated successfully.\n\n` +
      `🆔 ${bookingId}\n` +
      `New Status: ${COMMANDS[command]}`
  );

  return true;
}

module.exports = { handleAdminCommands };
