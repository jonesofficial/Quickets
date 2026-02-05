const STATES = require("./states");
const { parseBusOptions } = require("./adminParser");
const sendBusOptions = require("./busOptions");
const { sendText } = require("../../../../waClient");

/**
 * Handle all BUS-related admin commands
 * This file is the SINGLE source of truth for BUS admin state
 */
module.exports = async function handleBusAdmin(ctx, text) {
  const admin = ctx.from;
  const message = text.trim();

  // Restore state from session (CRITICAL)
  if (!ctx.state && ctx.session?.state) {
    ctx.state = ctx.session.state;
  }

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
    // ✅ State enforcement (MOST IMPORTANT)
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

    // Save buses in session (flow truth)
    ctx.session.busOptions = result.data;

    // Move state forward
    ctx.session.state = STATES.BUS_OPTION_SELECTION;
    ctx.state = ctx.session.state;

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
    "⚠️ Unknown BUS admin command.\n" + "Use:\n" + "• BUS_OPTIONS\n",
  );

  console.log("🔁 STATE RESTORE CHECK", {
    ctxState: ctx.state,
    sessionState: ctx.session?.state,
    bookingId: ctx.session?.bookingId,
  });
};
