const { sendText } = require("../../waClient");
const {
  findBookingById,
  updateBooking,
  getAdminStats,
} = require("../../bookingStore");

const BUS_STATES = require("../../flow/domains/bus/manual/states");

/* =====================================================
   DELAY HELPER
===================================================== */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async function handleBookingCommands(ctx, text) {
  const upper = text.toUpperCase();
  const from = ctx.from;

  /* =====================================================
     HELP
  ===================================================== */
  if (upper === "HELP") {
    await sendText(
      from,
      "🛂 *Admin Commands*\n\n" +
        "PROCESS <ID>\nPAUSE <ID>\nRESUME <ID>\n" +
        "CONFIRM <ID>\nFAIL <ID>\nCANCEL <ID>\n\n" +
        "TICKET_PRICE\nPAYMENT RECEIVED\nSEND TICKET"
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nPROCESS <BOOKING_ID>"
    );

    return true;
  }

  /* =====================================================
     CURRENT
  ===================================================== */
  if (upper === "CURRENT") {
    if (!ctx.session.bookingId) {
      return sendText(from, "📭 No active booking.");
    }

    await sendText(
      from,
      `📌 Current Active Booking\n\n🆔 ${ctx.session.bookingId}`
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nContinue booking flow (BUS / SEAT_OPTIONS / TICKET_PRICE)"
    );

    return true;
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

  if (!bookingId) {
    return sendText(from, "⚠️ Booking ID missing.");
  }

  const booking = findBookingById(bookingId);

  if (!booking) {
    return sendText(from, `❌ Booking not found: ${bookingId}`);
  }

  /* =====================================================
     PROCESS
  ===================================================== */
  if (command === "PROCESS") {
    if (ctx.session.bookingId) {
      return sendText(
        from,
        `⚠️ Active booking exists: ${ctx.session.bookingId}`
      );
    }

    ctx.session.bookingId = bookingId;
    ctx.session.bookingUser = booking.user;
    ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;

    updateBooking(bookingId, { status: "PROCESSING" });

    /* ===============================
       ADMIN CONFIRMATION
    =============================== */
    await sendText(
      from,
      `✅ Booking Activated\n\n🆔 ${bookingId}\n👤 User: ${booking.user}`
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nSend BUS or SEAT_OPTIONS"
    );

    /* ===============================
       USER NOTIFICATION
    =============================== */

    const userPhone = booking.from;

    await sendText(
      userPhone,
`👀 *Your booking request has been viewed by our team.*

🆔 Booking ID: ${bookingId}

Our team has started processing your request.`
    );

    /* ===============================
       DELAY → SEARCHING MESSAGE
    =============================== */

    await delay(4000);

    let searchMsg = "🔎 Searching for available tickets...";

    if (booking.type === "bus") {
      searchMsg = "🚌 Searching for available buses...";
    }

    if (booking.type === "train") {
      searchMsg = "🚆 Searching for available trains...";
    }

    if (booking.type === "flight") {
      searchMsg = "✈️ Searching for available flights...";
    }

    await sendText(userPhone, searchMsg);

    return true;
  }

  /* =====================================================
     STRICT ACTIVE BOOKING CHECK
  ===================================================== */

  if (!ctx.session.bookingId) {
    return sendText(from, "⚠️ No active booking.");
  }

  if (bookingId !== ctx.session.bookingId) {
    return sendText(from, "❌ Booking mismatch.");
  }

  const patch = { status: COMMANDS[command] };

  if (reason) {
    patch.meta = { ...(booking.meta || {}), reason };
  }

  updateBooking(bookingId, patch);

  ctx.session.bookingId = null;
  ctx.session.bookingUser = null;
  ctx.session.state = null;

  await sendText(
    from,
    `✅ Updated → ${patch.status}\n\n🆔 ${bookingId}`
  );

  /* =====================================================
     NEXT STEP GUIDANCE
  ===================================================== */

  if (command === "CONFIRM") {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nPROCESS <NEW_BOOKING_ID>"
    );
  }

  if (command === "FAIL" || command === "CANCEL") {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nPROCESS <NEW_BOOKING_ID>"
    );
  }

  if (command === "PAUSE") {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nRESUME <BOOKING_ID> when ready"
    );
  }

  if (command === "RESUME") {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nContinue booking flow"
    );
  }

  /* =====================================================
     ADMIN STATS
  ===================================================== */

  const stats = getAdminStats();

  await sendText(
    from,
    `📊 Admin Status\n\n🕒 Pending Bus: ${stats.pendingBus}\n` +
      `💳 Payment Pending: ${stats.paymentPending}\n` +
      `✅ Confirmed: ${stats.confirmed}\n` +
      `❌ Failed: ${stats.failed}\n` +
      `🚫 Cancelled: ${stats.cancelled}`
  );

  return true;
};