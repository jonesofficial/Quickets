const STATES = require("./states");
const { sendText } = require("../../../../waClient");

/**
 * Handle USER bus selection (1 / 2 / 3)
 */
module.exports = async function handleBusSelection(ctx) {
  try {
    const { session: s, from, text, msg } = ctx;

    console.log("🧪 BUS SELECTION ENTRY", {
      state: s.state,
      ctxText: text,
      msgText: msg?.text?.body,
      busOptionsCount: s.busOptions?.length,
    });

    // ✅ Only act in correct state
    if (s.state !== STATES.BUS_OPTION_SELECTION) {
      console.log("⏭️ BUS SELECTION SKIPPED (wrong state)");
      return false;
    }

    // ✅ Safely extract user input
    const input =
      (typeof text === "string" && text.trim()) ||
      msg?.text?.body?.trim();

    console.log("🧪 BUS SELECTION INPUT:", input);

    if (!input) {
      console.log("⏭️ BUS SELECTION SKIPPED (no input)");
      return false;
    }

    // ✅ Must be numeric
    if (!/^\d+$/.test(input)) {
      console.log("❌ BUS SELECTION INVALID INPUT:", input);

      await sendText(
        from,
        "❌ Please reply with the bus number (e.g. 1, 2, 3)."
      );
      return true;
    }

    const choice = Number(input);
    const buses = Array.isArray(s.busOptions) ? s.busOptions : [];

    console.log("🧪 BUS SELECTION CHOICE:", choice);

    // ✅ Index-based selection (MOST IMPORTANT FIX)
    if (choice < 1 || choice > buses.length) {
      console.log("❌ BUS SELECTION OUT OF RANGE", {
        choice,
        totalBuses: buses.length,
      });

      await sendText(
        from,
        `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`
      );
      return true;
    }

    const selectedBus = buses[choice - 1];

    // ✅ Save selection
    s.selectedBus = selectedBus;

    // ✅ Move state forward
    s.state = STATES.SEAT_LAYOUT_PENDING;

    console.log("✅ BUS SELECTED SUCCESSFULLY", {
      selectedBus,
      newState: s.state,
    });

    await sendText(
      from,
`🚌 *${selectedBus.name} selected*

Type: ${selectedBus.type}
Time: ${selectedBus.time}
Duration: ${selectedBus.duration}
Price: ₹${selectedBus.price}

🪑 Fetching seat layout...`
    );

    return true;
  } catch (err) {
    console.error("🔥 BUS SELECTION ERROR", err);

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while selecting the bus.\nPlease try again."
      );
    } catch (_) {}

    return true; // prevent flow break
  }
};
