const STATES = require("./states");
const { sendText } = require("../../../../waClient");

/**
 * Handle USER bus selection (1 / 2 / 3)
 * Triggered only when waiting for BUS_OPTION_SELECTION
 */
module.exports = async function handleBusSelection(ctx) {
  const { session: s, msg, from } = ctx;

  // Restore state if needed
  if (!s.state || s.state !== STATES.BUS_OPTION_SELECTION) {
    return false;
  }

  if (msg.type !== "text") {
    await sendText(
      from,
      "❌ Please reply with the bus number (e.g. 1, 2, 3)."
    );
    return true;
  }

  const text = msg.text?.body?.trim();

  if (!/^\d+$/.test(text)) {
    await sendText(
      from,
      "❌ Please reply with the bus number (e.g. 1, 2, 3)."
    );
    return true;
  }

  const choice = Number(text);
  const buses = s.busOptions || [];

  const selectedBus = buses.find((b) => b.id === choice);

  if (!selectedBus) {
    await sendText(
      from,
      `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`
    );
    return true;
  }

  // ✅ Save selected bus
  s.selectedBus = selectedBus;

  // ✅ Move state forward
  s.state = STATES.SEAT_LAYOUT_PENDING;

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
};
