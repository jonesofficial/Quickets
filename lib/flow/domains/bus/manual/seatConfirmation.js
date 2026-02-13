const { sendText } = require("../../../../waClient");
const BUS_STATES = require("./states");

module.exports = async function handleSeatConfirmation(ctx) {
  const { session, msg, from } = ctx;

  if (session.state !== BUS_STATES.SEAT_CONFIRMATION) return false;
  if (msg.type !== "text") return true;

  const input = msg.text?.body?.trim().toLowerCase();
  if (!input) return true;

  /* ================= CONFIRM ================= */

  if (input === "1" || input === "confirm") {
    session.selectedSeat = session.tempSelectedSeat;
    session.selectedDeck = session.tempSelectedDeck;

    session.tempSelectedSeat = null;
    session.tempSelectedDeck = null;

    session.seatSelectionActive = false;
    session.state = BUS_STATES.PRICE_CONFIRMATION;

    await sendText(
      from,
      `🎟️ Seat ${session.selectedSeat} confirmed successfully!\n\nPlease wait while we proceed with booking.`
    );

    return true;
  }

  /* ================= CHANGE ================= */

  if (input === "2" || input === "change") {
    session.tempSelectedSeat = null;
    session.tempSelectedDeck = null;

    session.state = BUS_STATES.SEAT_SELECTION;

    await sendText(
      from,
      "🔁 Please select a new seat."
    );

    return true;
  }

  /* ================= INVALID ================= */

  await sendText(
    from,
    "Please reply with:\n1️⃣ Confirm\n2️⃣ Change"
  );

  return true;
};
