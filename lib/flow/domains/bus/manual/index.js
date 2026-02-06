const STATES = require("./states");
const { parseBusOptions } = require("./adminParser");
const sendBusOptions = require("./busOptions");
const { sendText } = require("../../../../waClient");

/**
 * Handle all BUS-related admin commands
 * SINGLE source of truth for BUS admin state
 */
module.exports = async function handleBusAdmin(ctx, text) {
  console.log("🟢 HANDLE BUS ADMIN START");

  try {
    let admin, message;

    /* ===============================
     * STEP 1: Extract context
     * =============================== */
    try {
      admin = ctx.from;
      message = text.trim();

      console.log("🧪 ADMIN INPUT", {
        admin,
        message,
      });
    } catch (err) {
      console.error("🔥 ERROR EXTRACTING ADMIN INPUT", err);
      throw err;
    }

    /* ===============================
     * STEP 2: Restore state (CRITICAL)
     * =============================== */
    try {
      if (!ctx.state && ctx.session?.state) {
        ctx.state = ctx.session.state;
      }

      console.log("🔁 BUS ADMIN CONTEXT", {
        bookingId: ctx.session?.bookingId,
        state: ctx.state,
        bookingUser: ctx.session?.bookingUser,
      });
    } catch (err) {
      console.error("🔥 ERROR RESTORING STATE", err);
      throw err;
    }

    /* ===============================
     * STEP 3: Safety check — active booking
     * =============================== */
    try {
      if (!ctx.session?.bookingId) {
        console.log("❌ NO ACTIVE BOOKING");

        await sendText(
          admin,
          "❌ No active booking context found.\n" +
            "User must start a BUS booking first."
        );
        return;
      }
    } catch (err) {
      console.error("🔥 ERROR IN BOOKING SAFETY CHECK", err);
      throw err;
    }

    /* ===============================
     * STEP 4: BUS OPTIONS command
     * =============================== */
    if (/^BUS(_OPTIONS)?/i.test(message)) {
      console.log("🧪 BUS_OPTIONS COMMAND DETECTED");

      /* ---- State enforcement ---- */
      try {
        if (ctx.state !== STATES.BUS_SEARCH_PENDING) {
          console.log("❌ INVALID STATE FOR BUS_OPTIONS", ctx.state);

          await sendText(
            admin,
            "❌ Booking is not waiting for bus options.\n" +
              `Current state: ${ctx.state}`
          );
          return;
        }
      } catch (err) {
        console.error("🔥 ERROR IN STATE ENFORCEMENT", err);
        throw err;
      }

      /* ---- Parse admin message ---- */
      let result;
      try {
        result = parseBusOptions(message);

        if (!result.ok) {
          console.log("❌ BUS OPTIONS PARSE ERROR");

          await sendText(admin, `❌ Bus list error:\n${result.error}`);
          return;
        }
      } catch (err) {
        console.error("🔥 ERROR PARSING BUS OPTIONS", err);
        throw err;
      }

      /* ---- Ensure booking user exists ---- */
      try {
        if (!ctx.session.bookingUser) {
          console.log("❌ BOOKING USER MISSING");

          await sendText(
            admin,
            "❌ Cannot send bus options.\nUser number missing in session."
          );
          return;
        }
      } catch (err) {
        console.error("🔥 ERROR CHECKING BOOKING USER", err);
        throw err;
      }

      /* ---- Save buses ---- */
      try {
        ctx.session.busOptions = result.data;
        console.log("🧪 BUS OPTIONS SAVED", {
          count: result.data.length,
        });
      } catch (err) {
        console.error("🔥 ERROR SAVING BUS OPTIONS", err);
        throw err;
      }

      /* ---- Advance state ---- */
      try {
        ctx.session.state = STATES.BUS_OPTION_SELECTION;
        ctx.state = ctx.session.state;

        console.log("🧪 STATE ADVANCED", ctx.state);
      } catch (err) {
        console.error("🔥 ERROR ADVANCING STATE", err);
        throw err;
      }

      /* ---- Attach target user ---- */
      try {
        ctx.user = ctx.session.bookingUser;
        console.log("🧪 TARGET USER SET", ctx.user);
      } catch (err) {
        console.error("🔥 ERROR SETTING TARGET USER", err);
        throw err;
      }

      /* ---- Send buses to user ---- */
      try {
        await sendBusOptions(ctx);
        console.log("✅ BUS OPTIONS SENT TO USER");
      } catch (err) {
        console.error("🔥 ERROR SENDING BUS OPTIONS TO USER", err);
        throw err;
      }

      /* ---- Admin confirmation ---- */
      try {
        await sendText(
          admin,
          `✅ ${result.data.length} bus(es) sent to user.\n` +
            "Waiting for user selection."
        );
      } catch (err) {
        console.error("🔥 ERROR SENDING ADMIN CONFIRMATION", err);
        throw err;
      }

      console.log("🟢 HANDLE BUS ADMIN END — SUCCESS");
      return;
    }

    /* ===============================
     * STEP 5: Unknown admin input
     * =============================== */
    try {
      console.log("⚠️ UNKNOWN BUS ADMIN COMMAND");

      await sendText(
        admin,
        "⚠️ Unknown BUS admin command.\n" +
          "Use:\n" +
          "• BUS_OPTIONS"
      );
    } catch (err) {
      console.error("🔥 ERROR HANDLING UNKNOWN COMMAND", err);
      throw err;
    }

  } catch (err) {
    console.error("🔥🔥 FATAL BUS ADMIN ERROR", err);

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while handling the BUS admin command.\nPlease try again."
      );
    } catch (sendErr) {
      console.error("🔥 ERROR SENDING ADMIN FAILURE MESSAGE", sendErr);
    }
  }
};
