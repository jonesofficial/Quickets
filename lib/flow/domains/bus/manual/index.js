const STATES = require("./states");
const { parseBusOptions } = require("./adminParser");
const sendBusOptions = require("./busOptions");
const { sendText } = require("../../../../waClient");
const { startOrGet } = require("../../../../lib/sessionStore"); // 🔑 IMPORTANT

/**
 * Handle all BUS-related admin commands
 * SINGLE source of truth for BUS admin state
 */
module.exports = async function handleBusAdmin(ctx, text) {
  console.log("🟢 HANDLE BUS ADMIN START");

  try {
    const admin = ctx.from;
    const message = text.trim();

    console.log("🧪 ADMIN INPUT", { admin, message });

    /* ===============================
     * Restore admin state
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
     * Safety check
     * =============================== */
    if (!ctx.session?.bookingId || !ctx.session?.bookingUser) {
      await sendText(
        admin,
        "❌ No active booking context found.\n" +
          "User must start a BUS booking first."
      );
      return;
    }

    /* ===============================
     * BUS_OPTIONS command
     * =============================== */
    if (/^BUS(_OPTIONS)?/i.test(message)) {
      console.log("🧪 BUS_OPTIONS COMMAND DETECTED");

      // State enforcement (admin side)
      if (ctx.state !== STATES.BUS_SEARCH_PENDING) {
        await sendText(
          admin,
          "❌ Booking is not waiting for bus options.\n" +
            `Current state: ${ctx.state}`
        );
        return;
      }

      // Parse admin message
      const result = parseBusOptions(message);
      if (!result.ok) {
        await sendText(admin, `❌ Bus list error:\n${result.error}`);
        return;
      }

      const userPhone = ctx.session.bookingUser;

      /* ===============================
       * 🔑 CRITICAL FIX
       * Write into USER session
       * =============================== */
      const { session: userSession } = startOrGet(userPhone);

      userSession.busOptions = result.data;
      userSession.state = STATES.BUS_OPTION_SELECTION;

      console.log("🧠 USER SESSION UPDATED", {
        user: userPhone,
        state: userSession.state,
        busCount: userSession.busOptions.length,
      });

      /* ===============================
       * Send buses to USER
       * =============================== */
      await sendBusOptions({
        user: userPhone,
        session: userSession,
      });

      console.log("✅ BUS OPTIONS SENT TO USER");

      /* ===============================
       * Admin confirmation
       * =============================== */
      await sendText(
        admin,
        `✅ ${result.data.length} bus(es) sent to user.\n` +
          "Waiting for user selection."
      );

      console.log("🟢 HANDLE BUS ADMIN END — SUCCESS");
      return;
    }

    /* ===============================
     * Unknown admin input
     * =============================== */
    await sendText(
      admin,
      "⚠️ Unknown BUS admin command.\n" +
        "Use:\n" +
        "• BUS_OPTIONS"
    );

  } catch (err) {
    console.error("🔥🔥 FATAL BUS ADMIN ERROR", err);

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while handling the BUS admin command.\nPlease try again."
      );
    } catch (_) {}
  }
};
