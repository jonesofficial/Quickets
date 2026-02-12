const STATES = require("./states");
const { sendText } = require("../../../../waClient");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

/**
 * Handle USER bus selection (1 / 2 / 3)
 */
module.exports = async function handleBusSelection(ctx) {
  console.log("🟢 HANDLE BUS SELECTION START");

  try {
    let s, from, text, msg;

    /* ================================
     * STEP 1: Context extraction
     * ================================ */
    ({ session: s, from, text, msg } = ctx);

    /* ================================
     * STEP 2: Eligibility check
     * ================================ */
    if (!Array.isArray(s.busOptions) || s.busOptions.length === 0) {
      return false;
    }

    if (s.selectedBus) {
      return false;
    }

    /* ================================
     * STEP 3: Input extraction
     * ================================ */
    const input =
      (typeof text === "string" && text.trim()) ||
      msg?.text?.body?.trim();

    if (!input) return false;

    /* ================================
     * STEP 4: Validation
     * ================================ */
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
     * STEP 5: Update state
     * ================================ */
    s.selectedBus = selectedBus;
    s.state = STATES.SEAT_LAYOUT_PENDING;

    /* ================================
     * STEP 6: Notify USER
     * ================================ */
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
     * STEP 7: Notify ADMIN
     * ================================ */
    if (RAW_ADMIN) {
      try {
        await sendText(
          RAW_ADMIN,
          `🚌 *Bus Selected by User*\n\n` +
          `👤 User: ${from}\n` +
          `${s.bookingId ? `🆔 Booking ID: ${s.bookingId}\n` : ""}\n` +
          `Operator: ${selectedBus.name}\n` +
          `Type: ${selectedBus.type}\n` +
          `Departure: ${selectedBus.time}\n` +
          `Duration: ${selectedBus.duration}\n` +
          `Price: ₹${selectedBus.price}\n\n` +
          `⏳ Awaiting seat layout.`
        );
      } catch (err) {
        console.error("❌ Failed to notify admin:", err);
      }
    }

    console.log("🟢 HANDLE BUS SELECTION END — SUCCESS");
    return true;

  } catch (err) {
    console.error("🔥 FATAL BUS SELECTION ERROR", err);

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while selecting the bus.\nPlease try again."
      );
    } catch {}

    return true;
  }
};
