const { sendText } = require("../../../../waClient");

module.exports = async function handleSeatSelection(ctx) {
  const { session, msg, from } = ctx;

  if (!session.seatSelectionActive || session.selectedSeat) return false;

  if (msg.type !== "text") return true;

  const seat = msg.text?.body?.trim().toUpperCase();
  if (!seat) return true;

  const { seatMap } = session;
  const gender = session.passengers?.[0]?.gender || "Male";

  const allAvailable = [
    ...(seatMap.availableUpper || []),
    ...(seatMap.availableLower || []),
  ];

  if (!allAvailable.includes(seat)) {
    await sendText(from, "❌ This seat is not available. Please choose another.");
    return true;
  }

  if (seatMap.ladies?.includes(seat) && gender === "Male") {
    await sendText(
      from,
      "🚺 This seat is reserved for ladies. Please choose another seat."
    );
    return true;
  }

  // ✅ Valid selection
  session.selectedSeat = seat;
  session.seatSelectionActive = false;

  await sendText(
    from,
    `✅ *Seat ${seat} selected successfully*\n\nPlease wait while we continue your booking.`
  );

  console.log("✅ Seat selected:", seat);
  return true;
};
