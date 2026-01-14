// lib/adminCommand.js

const { sendText } = require("./waClient");
const { findBookingById, updateBooking } = require("./bookingStore");

/* ======================================================
 * Admin Command Handler (NO PAYMENTS)
 * ====================================================== */

async function handleAdminCommands(ctx) {
  const text = ctx.msg.text?.body?.trim();
  const from = ctx.from;

  if (!text) return false;

  const [rawCommand, rawBookingId] = text.split(/\s+/);
  const command = rawCommand?.toUpperCase();
  const bookingId = rawBookingId;

  console.log("🛂 ADMIN COMMAND:", command, bookingId);

  if (!bookingId) {
    await sendText(from, "⚠️ Booking ID missing.\nExample: APPROVE QK-123");
    return true;
  }

  const booking = findBookingById(bookingId);
  if (!booking) {
    await sendText(from, `❌ Booking not found: ${bookingId}`);
    return true;
  }

  /* =========================
   * APPROVE BOOKING
   * ========================= */
  if (command === "APPROVE") {
    updateBooking(bookingId, {
      status: "APPROVED_BY_ADMIN",
    });

    await sendText(
      booking.user,
      `✅ *Your booking is approved!*\n\n🆔 Booking ID: *${bookingId}*\n⏳ Our team will contact you shortly with next steps.`
    );

    await sendText(
      from,
      `✅ Booking *${bookingId}* approved successfully.`
    );

    return true;
  }

  /* =========================
   * REJECT / CANCEL
   * ========================= */
  if (command === "REJECT" || command === "CANCEL") {
    updateBooking(bookingId, {
      status: "REJECTED_BY_ADMIN",
    });

    await sendText(
      booking.user,
      `❌ *Your booking was rejected*\n\n🆔 Booking ID: *${bookingId}*\nIf you have questions, reply *HELP*.`
    );

    await sendText(
      from,
      `🚫 Booking *${bookingId}* rejected.`
    );

    return true;
  }

  /* =========================
   * UNKNOWN COMMAND
   * ========================= */
  await sendText(
    from,
    "⚠️ Unknown admin command.\n\n" +
      "Available commands:\n" +
      "• APPROVE <BOOKING_ID>\n" +
      "• REJECT <BOOKING_ID>"
  );

  return true;
}

module.exports = { handleAdminCommands };
