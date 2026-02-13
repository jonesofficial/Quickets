const { sendText } = require("../../../../waClient");
const BUS_STATES = require("./states");

module.exports = async function handleSeatSelection(ctx) {
  const { session, msg, from } = ctx;

  if (!session.seatSelectionActive || session.selectedSeat) return false;
  if (msg.type !== "text") return true;

  const seat = msg.text?.body?.trim().toUpperCase();
  if (!seat) return true;

  const seatMap = session.seatMap || {};
  const gender = session.passengers?.[0]?.gender || "Male";

  const upper = seatMap.availableUpper || [];
  const lower = seatMap.availableLower || [];
  const ladies = seatMap.ladies || [];

  const allAvailable = [...upper, ...lower];

  /* ================= VALIDATION ================= */

  if (!allAvailable.includes(seat)) {
    await sendText(
      from,
      "❌ This seat is not available. Please choose another."
    );
    return true;
  }

  if (ladies.includes(seat) && gender === "Male") {
    await sendText(
      from,
      "🚺 This seat is reserved for ladies. Please choose another seat."
    );
    return true;
  }

  /* ================= STORE TEMP SEAT ================= */

  let deck = "";
  if (upper.includes(seat)) deck = "Upper Deck";
  if (lower.includes(seat)) deck = "Lower Deck";

  session.tempSelectedSeat = seat;
  session.tempSelectedDeck = deck;
  session.state = BUS_STATES.SEAT_CONFIRMATION;

  /* ================= ASK CONFIRMATION ================= */

  await sendText(
    from,
    `✅ Seat Number ${seat} has been selected\n` +
    `🚌 ${deck}\n\n` +
    `Please confirm the seat\n\n` +
    `1️⃣ Confirm\n` +
    `2️⃣ Change`
  );

  return true;
};
