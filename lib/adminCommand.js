// lib/adminCommand.js

const { sendText } = require("./waClient");
const {
  handleAdminApproval,
  handleAdminVerification,
} = require("./payments");

const {
  findBookingById,
  updateBooking,
} = require("./bookingStore");

/* ======================================================
 * Admin Command Handler
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
    const updated = updateBooking(bookingId, {
      status: "APPROVED_BY_ADMIN",
    });

    await handleAdminApproval(updated);

    await sendText(
      from,
      `✅ Booking *${bookingId}* approved successfully.`
    );

    return true;
  }

  /* =========================
   * MARK AS PAID
   * ========================= */
  if (command === "PAID") {
    const updated = updateBooking(bookingId, {
      payment: { status: "PAID" },
      status: "PAYMENT_CONFIRMED",
    });

    await handleAdminVerification(updated);

    await sendText(
      from,
      `💰 Payment confirmed for *${bookingId}*.`
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
      `❌ Your booking *${bookingId}* was rejected by admin.\nIf any payment was made, it will be refunded.`
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
      "• PAID <BOOKING_ID>\n" +
      "• REJECT <BOOKING_ID>"
  );

  return true;
}

module.exports = { handleAdminCommands };
