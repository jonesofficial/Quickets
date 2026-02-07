const STATES = require("./states");

/**
 * Handle USER bus selection (1 / 2 / 3)
 */
module.exports = async function handleBusSelection(ctx) {
  console.log("🟢 HANDLE BUS SELECTION START");

  const { session: s, from, text, msg, sendText } = ctx;

  try {
    /* ================================
     * STEP 1: State validation
     * ================================ */
    console.log("🧪 CONTEXT EXTRACTED", {
      state: s?.state,
      busOptionsCount: s?.busOptions?.length,
    });

    if (s.state !== STATES.BUS_OPTION_SELECTION) {
      console.log("⏭️ WRONG STATE — SKIPPING", s.state);
      return false;
    }

    /* ================================
     * STEP 2: Input extraction
     * ================================ */
    const input =
      (typeof text === "string" && text.trim()) ||
      msg?.text?.body?.trim();

    console.log("🧪 USER INPUT:", input);

    if (!input) {
      console.log("⏭️ EMPTY INPUT — SKIPPING");
      return false;
    }

    /* ================================
     * STEP 3: Input validation
     * ================================ */
    if (!/^\d+$/.test(input)) {
      await sendText(
        from,
        "❌ Please reply with the bus number (e.g. 1, 2, 3)."
      );
      return true;
    }

    const choice = Number(input);
    const buses = Array.isArray(s.busOptions) ? s.busOptions : [];

    if (!buses.length) {
      console.error("❌ BUS OPTIONS MISSING IN SESSION");
      await sendText(
        from,
        "❌ Bus options expired. Please type *RETRY* to search again."
      );
      return true;
    }

    if (choice < 1 || choice > buses.length) {
      await sendText(
        from,
        `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`
      );
      return true;
    }

    /* ================================
     * STEP 4: Selection
     * ================================ */
    const selectedBus = buses[choice - 1];

    console.log("✅ BUS SELECTED", {
      name: selectedBus.name,
      time: selectedBus.time,
    });

    // Save selection
    s.selectedBus = selectedBus;
    s.state = STATES.SEAT_LAYOUT_PENDING;

    /* ================================
     * STEP 5: User confirmation message
     * ================================ */
    await sendText(
      from,
      `🚌 *You have selected your bus*\n\n` +
        `*Operator:* ${selectedBus.name}\n` +
        `*Seat Type:* ${selectedBus.type}\n` +
        `*Departure:* ${selectedBus.time}\n` +
        `*Duration:* ${selectedBus.duration}\n` +
        `*Available Seats:* ${selectedBus.seats}\n` +
        `*Fare:* ₹${selectedBus.price}\n\n` +
        `⏳ Please wait...\nOur team is now fetching the seat layout for you.`
    );

    console.log("🟢 HANDLE BUS SELECTION END — SUCCESS");
    return true;
  } catch (err) {
    console.error("🔥🔥 FATAL BUS SELECTION ERROR", err);

    try {
      await ctx.sendText(
        from,
        "❌ Something went wrong while selecting the bus.\nPlease try again."
      );
    } catch (_) {}

    return true; // prevent flow break
  }
};
