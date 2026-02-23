const STATES = require("./states");
const { sendText } = require("../../../../waClient");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/**
 * Handle USER bus selection (1 / 2 / 3)
 */
module.exports = async function handleBusSelection(ctx) {
  console.log("🟢 HANDLE BUS SELECTION START");

  try {
    const { session: s, from, text, msg } = ctx;

    if (!s) {
      console.error("❌ Missing session in bus selection", ctx);
      return false;
    }

    /* ================================
       STEP 0: STRICT STATE GUARD
       (🔥 Prevents boarding conflict)
    ================================= */
    if (s.state !== STATES.BUS_SELECTION) {
      return false;
    }

    /* ================================
       STEP 1: Eligibility check
    ================================= */
    if (!Array.isArray(s.busOptions) || s.busOptions.length === 0) {
      return false;
    }

    if (s.selectedBus) {
      return false;
    }

    /* ================================
       STEP 2: Input extraction
    ================================= */
    const input =
      (typeof text === "string" && text.trim()) ||
      msg?.text?.body?.trim();

    if (!input) return false;

    /* ================================
       STEP 3: Validation
    ================================= */
    if (!/^\d+$/.test(input)) {
      await sendText(
        from,
        "❌ Please reply with the bus number (e.g. 1, 2, 3)."
      );
      return true;
    }

    const choice = Number(input);
    const buses = s.busOptions;

    if (choice < 1 || choice > buses.length) {
      await sendText(
        from,
        `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`
      );
      return true;
    }

    const selectedBus = buses[choice - 1];

    /* ================================
       STEP 4: Update state
    ================================= */
    s.selectedBus = selectedBus;

    // Move forward in flow
    s.state = STATES.SEAT_LAYOUT_PENDING;

    /* ================================
       STEP 5: Notify USER
    ================================= */
    await sendText(
      from,
      `🚌 *Bus Selected Successfully*\n\n` +
        `Operator: *${selectedBus.name}*\n` +
        `Type: ${selectedBus.type}\n` +
        `Departure: ${selectedBus.time}\n` +
        `Duration: ${selectedBus.duration}\n` +
        `Price: ₹${selectedBus.price}\n\n` +
        `🪑 Fetching seat layout...\n\n` +
        `— *Team Quickets*`
    );

    /* ================================
       STEP 6: Notify ADMIN
    ================================= */
    if (RAW_ADMIN) {
      try {
        await sendText(
          RAW_ADMIN,
          `🚌 *Bus Selected by User*\n\n` +
            `👤 User: ${from}\n` +
            `${s.bookingId ? `🆔 Booking ID: ${s.bookingId}\n` : ""}` +
            `Operator: ${selectedBus.name}\n` +
            `Type: ${selectedBus.type}\n` +
            `Departure: ${selectedBus.time}\n` +
            `Duration: ${selectedBus.duration}\n` +
            `Price: ₹${selectedBus.price}\n\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👉 NEXT STEP:\nSend SEAT_OPTIONS with seat layout image.`
        );
      } catch (err) {
        console.error("❌ Failed to notify admin", {
          bookingId: s.bookingId,
          error: err.message,
        });
      }
    }

    console.log("🟢 HANDLE BUS SELECTION END — SUCCESS", {
      bookingId: s.bookingId,
      user: from,
    });

    return true;

  } catch (err) {
    console.error("🔥 FATAL BUS SELECTION ERROR", {
      bookingId: ctx?.session?.bookingId,
      user: ctx?.from,
      error: err.message,
    });

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while selecting the bus.\nPlease try again."
      );
    } catch (notifyErr) {
      console.error(
        "🔥 Failed to notify user after bus selection error",
        notifyErr
      );
    }

    return true;
  }
};