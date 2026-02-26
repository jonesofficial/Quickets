const STATES = require("./states");
const { parseBusOptions } = require("./adminParser");
const sendBusOptions = require("./busOptions");
const { sendText } = require("../../../../waClient");
const { startOrGet } = require("../../../../sessionStore");

module.exports = async function handleBusAdmin(ctx, text) {
  console.log("🟢 HANDLE BUS ADMIN START");

  try {
    const admin = ctx.from;
    const message = text?.trim();

    if (!message) {
      await sendText(admin, "⚠️ Empty admin message.");
      return true;
    }

    console.log("🧪 ADMIN INPUT", {
      admin,
      message,
      bookingId: ctx.session?.bookingId,
      state: ctx.session?.state,
    });

    /* ===============================
       Restore admin state
    =============================== */
    if (!ctx.state && ctx.session?.state) {
      ctx.state = ctx.session.state;
    }

    /* ===============================
       Safety check
    =============================== */
    if (!ctx.session?.bookingId || !ctx.session?.bookingUser) {
      await sendText(
        admin,
        "❌ No active booking context found.\nUser must start a BUS booking first.\n\n━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nUse PROCESS <BOOKING_ID>"
      );
      return true;
    }

    /* =====================================================
       BUS_OPTIONS command
    ====================================================== */
    if (/^BUS(_OPTIONS)?/i.test(message)) {
      console.log("🧪 BUS_OPTIONS COMMAND DETECTED");

      /* 🔥 ALLOW in BOTH states */
      if (
        ctx.state !== STATES.BUS_SEARCH_PENDING &&
        ctx.state !== STATES.BUS_OPTION_SELECTION
      ) {
        await sendText(
          admin,
          `❌ Booking is not waiting for bus options.\n` +
            `Current state: ${ctx.state}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nCheck booking state or use CURRENT`
        );
        return true;
      }

      /* ===============================
         Parse admin message
      =============================== */
      let result;
      try {
        result = parseBusOptions(message);
      } catch (err) {
        console.error("🔥 parseBusOptions crashed", err);
        await sendText(
          admin,
          "❌ Internal error while parsing bus list.\nPlease check format."
        );
        return true;
      }

      if (!result.ok) {
        await sendText(
          admin,
          `❌ Bus list error:\n${result.error}\n\n━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nFix the format and resend BUS_OPTIONS`
        );
        return true;
      }

      const userPhone = ctx.session.bookingUser;

      /* ===============================
         Write into USER session
      =============================== */
      const { session: userSession } = startOrGet(userPhone);

      /* 🔥 Reset previous selections */
      userSession.selectedBus = null;
      userSession.selectedSeat = null;
      userSession.selectedDeck = null;
      userSession.tempSelectedSeat = null;
      userSession.tempSelectedDeck = null;
      userSession.seatSelectionActive = false;

      userSession.busOptions = result.data;
      userSession.state = STATES.BUS_OPTION_SELECTION;
      userSession.bookingId = ctx.session.bookingId;

      console.log("🧠 USER SESSION UPDATED", {
        user: userPhone,
        bookingId: ctx.session.bookingId,
        state: userSession.state,
        busCount: userSession.busOptions.length,
      });

      /* ===============================
         Send buses to USER
      =============================== */
      try {
        await sendBusOptions({
          user: userPhone,
          session: userSession,
        });
      } catch (err) {
        console.error("🔥 sendBusOptions failed", {
          bookingId: ctx.session.bookingId,
          error: err.message,
        });

        await sendText(
          admin,
          "❌ Failed to send bus options to user.\nPlease try again."
        );

        return true;
      }

      /* ===============================
         Admin confirmation
      =============================== */
      await sendText(
        admin,
        `✅ ${result.data.length} bus(es) sent to user.
Waiting for user selection.

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Wait for user to reply with bus number.`
      );

      console.log("🟢 HANDLE BUS ADMIN END — SUCCESS");

      return true;
    }

    /* ===============================
       Unknown admin input
    =============================== */
    await sendText(
      admin,
      "⚠️ Unknown BUS admin command.\n\nUse:\n• BUS_OPTIONS\n\n━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nSend BUS_OPTIONS with bus list."
    );

    return true;
  } catch (err) {
    console.error("🔥🔥 FATAL BUS ADMIN ERROR", {
      bookingId: ctx?.session?.bookingId,
      error: err.message,
    });

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while handling the BUS admin command.\nPlease try again."
      );
    } catch (_) {}

    return true;
  }
};