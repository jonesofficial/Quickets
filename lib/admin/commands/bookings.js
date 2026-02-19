const { sendText } = require("../../waClient");
const {
  findBookingById,
  updateBooking,
  getAdminStats,
} = require("../../bookingStore");

const BUS_STATES = require("../../flow/domains/bus/manual/states");

module.exports = async function handleBookingCommands(ctx, text) {
  const upper = text.toUpperCase();
  const from = ctx.from;

  if (upper === "HELP") {
    await sendText(
      from,
      "🛂 *Admin Commands*\n\n" +
        "PROCESS <ID>\nPAUSE <ID>\nRESUME <ID>\n" +
        "CONFIRM <ID>\nFAIL <ID>\nCANCEL <ID>\n\n" +
        "TICKET_PRICE\nPAYMENT RECEIVED\nSEND TICKET",
    );
    return true;
  }

  if (upper === "CURRENT") {
    if (!ctx.session.bookingId) return sendText(from, "📭 No active booking.");
    return sendText(from, `📌 Active: ${ctx.session.bookingId}`);
  }

  const parts = upper.split(/\s+/);
  const command = parts[0];
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

  const COMMANDS = {
    PROCESS: "PROCESSING",
    CONFIRM: "CONFIRMED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
    PAUSE: "PAUSED",
    RESUME: "PROCESSING",
  };

  if (!COMMANDS[command]) return false;
  if (!bookingId) return sendText(from, "⚠️ Booking ID missing.");

  const booking = findBookingById(bookingId);
  if (!booking) return sendText(from, `❌ Booking not found: ${bookingId}`);

  if (command === "PROCESS") {
    if (ctx.session.bookingId)
      return sendText(
        from,
        `⚠️ Active booking exists: ${ctx.session.bookingId}`,
      );

    ctx.session.bookingId = bookingId;
    ctx.session.bookingUser = booking.user;
    ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;

    updateBooking(bookingId, { status: "PROCESSING" });

    await sendText(from, `✅ Booking Activated: ${bookingId}`);
    return true;
  }

  if (!ctx.session.bookingId) return sendText(from, "⚠️ No active booking.");

  if (bookingId !== ctx.session.bookingId)
    return sendText(from, "❌ Booking mismatch.");

  const patch = { status: COMMANDS[command] };

  if (reason) patch.meta = { ...(booking.meta || {}), reason };

  updateBooking(bookingId, patch);

  ctx.session.bookingId = null;
  ctx.session.bookingUser = null;
  ctx.session.state = null;

  await sendText(from, `✅ Updated → ${patch.status}`);

  const stats = getAdminStats();

  await sendText(
    from,
    `📊 Pending: ${stats.pendingBus}\nConfirmed: ${stats.confirmed}`,
  );

  return true;
};
