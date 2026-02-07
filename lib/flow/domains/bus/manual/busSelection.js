const STATES = require("./states");
const { sendText } = require("../../../../waClient");

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
    try {
      ({ session: s, from, text, msg } = ctx);

      console.log("🧪 CONTEXT EXTRACTED", {
        state: s?.state,
        busOptionsCount: s?.busOptions?.length,
      });
    } catch (err) {
      console.error("🔥 ERROR IN CONTEXT EXTRACTION", err);
      throw err;
    }

    /* ================================
     * STEP 2: State validation
     * ================================ */
    /* ================================
     * STEP 2: Eligibility check (state-agnostic)
     * ================================ */

    // Allow bus selection if options exist and not selected yet
    if (!Array.isArray(s.busOptions) || s.busOptions.length === 0) {
      console.log("⏭️ NO BUS OPTIONS — SKIPPING");
      return false;
    }

    if (s.selectedBus) {
      console.log("⏭️ BUS ALREADY SELECTED — SKIPPING");
      return false;
    }

    /* ================================
     * STEP 3: Input extraction
     * ================================ */
    let input;
    try {
      input =
        (typeof text === "string" && text.trim()) || msg?.text?.body?.trim();

      console.log("🧪 USER INPUT:", input);
    } catch (err) {
      console.error("🔥 ERROR IN INPUT EXTRACTION", err);
      throw err;
    }

    if (!input) {
      console.log("⏭️ EMPTY INPUT — SKIPPING");
      return false;
    }

    /* ================================
     * STEP 4: Input validation
     * ================================ */
    try {
      if (!/^\d+$/.test(input)) {
        console.log("❌ NON-NUMERIC INPUT:", input);

        await sendText(
          from,
          "❌ Please reply with the bus number (e.g. 1, 2, 3).",
        );
        return true;
      }
    } catch (err) {
      console.error("🔥 ERROR IN INPUT VALIDATION", err);
      throw err;
    }

    /* ================================
     * STEP 5: Selection logic
     * ================================ */
    let selectedBus;
    try {
      const choice = Number(input);
      const buses = Array.isArray(s.busOptions) ? s.busOptions : [];

      console.log("🧪 BUS CHOICE:", choice, "TOTAL:", buses.length);

      if (choice < 1 || choice > buses.length) {
        console.log("❌ OUT OF RANGE SELECTION");

        await sendText(
          from,
          `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`,
        );
        return true;
      }

      selectedBus = buses[choice - 1];
    } catch (err) {
      console.error("🔥 ERROR IN BUS SELECTION LOGIC", err);
      throw err;
    }

    /* ================================
     * STEP 6: State update
     * ================================ */
    try {
      s.selectedBus = selectedBus;
      s.state = STATES.SEAT_LAYOUT_PENDING;

      console.log("✅ BUS SELECTED", {
        name: selectedBus?.name,
        nextState: s.state,
      });
    } catch (err) {
      console.error("🔥 ERROR WHILE UPDATING STATE", err);
      throw err;
    }

    /* ================================
     * STEP 7: User confirmation message
     * ================================ */
    try {
      await sendText(
        from,
        `🚌 *${selectedBus.name} selected*

Type: ${selectedBus.type}
Time: ${selectedBus.time}
Duration: ${selectedBus.duration}
Price: ₹${selectedBus.price}

🪑 Fetching seat layout...`,
      );
    } catch (err) {
      console.error("🔥 ERROR SENDING CONFIRMATION MESSAGE", err);
      throw err;
    }

    console.log("🟢 HANDLE BUS SELECTION END — SUCCESS");
    return true;
  } catch (err) {
    console.error("🔥🔥 FATAL BUS SELECTION ERROR", err);

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while selecting the bus.\nPlease try again.",
      );
    } catch (sendErr) {
      console.error("🔥 ERROR SENDING FAILURE MESSAGE", sendErr);
    }

    return true; // prevent flow break
  }
};
