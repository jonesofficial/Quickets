const STATES = require("./states");
const { parseBusOptions } = require("./adminParser");
const sendBusOptions = require("./busOptions");
const { sendText } = require("../../../../waClient");

/**
 * Handle all BUS-related admin commands
 * SINGLE source of truth for BUS admin state
 */
module.exports = async function handleBusAdmin(ctx, text) {
  const admin = ctx.from;
  const message = text.trim();

  /* ===============================
   * RESTORE STATE (CRITICAL)
   * =============================== */
  if (!ctx.state && ctx.session?.state) {
    ctx.state = ctx.session.state;
  }

  console.log("🔁 BUS ADMIN CONTEXT", {
    bookingId: ctx.session?.bookingId,
    state: ctx.state,
    bookingUser: ctx.session?.bookingUser,
  });

  /* ===============================
   * SAFETY CHECKS
   * =============================== */

  // Must have active booking
  if (!ctx.session?.bookingId) {
    await sendText(
      admin,
      "❌ No active booking context found.\n" +
        "User must start a BUS booking first.",
    );
    return;
  }

  /* ===============================
   * BUS OPTIONS
   * =============================== */
  if (/^BUS(_OPTIONS)?/i.test(message)) {
    // State enforcement
    if (ctx.state !== STATES.BUS_SEARCH_PENDING) {
      await sendText(
        admin,
        "❌ Booking is not waiting for bus options.\n" +
          `Current state: ${ctx.state}`,
      );
      return;
    }

    // Parse admin message
    const result = parseBusOptions(message);
    if (!result.ok) {
      await sendText(admin, `❌ Bus list error:\n${result.error}`);
      return;
    }

    // Ensure we know which user to send to
    if (!ctx.session.bookingUser) {
      await sendText(
        admin,
        "❌ Cannot send bus options.\nUser number missing in session.",
      );
      return;
    }

    // Save buses
    ctx.session.busOptions = result.data;

    // Advance state (persisted)
    ctx.session.state = STATES.BUS_OPTION_SELECTION;
    ctx.state = ctx.session.state;

    // Attach target user explicitly
    ctx.user = ctx.session.bookingUser;

    // Send buses to user
    await sendBusOptions(ctx);

    // Admin confirmation
    await sendText(
      admin,
      `✅ ${result.data.length} bus(es) sent to user.\n` +
        "Waiting for user selection.",
    );

    return;
  }

  /* ===============================
   * UNKNOWN BUS ADMIN INPUT
   * =============================== */
  await sendText(
    admin,
    "⚠️ Unknown BUS admin command.\n" +
      "Use:\n" +
      "• BUS_OPTIONS",
  );
};
