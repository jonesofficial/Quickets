const { sendText, sendImage } = require("../../../../waClient");

/* ======================================================
 * Normalize Seat Map
 * ====================================================== */
function normalizeSeatMap(seatMap = {}) {
  return {
    upper: Array.isArray(seatMap.availableUpper)
      ? seatMap.availableUpper
      : [],
    lower: Array.isArray(seatMap.availableLower)
      ? seatMap.availableLower
      : [],
    ladies: Array.isArray(seatMap.ladies)
      ? seatMap.ladies
      : [],
  };
}

/* ======================================================
 * Build Seat Selection Message
 * ====================================================== */
function buildSeatMessage(seatMap, gender) {
  const { upper, lower, ladies } = normalizeSeatMap(seatMap);

  const showLadies = gender === "Female";

  let msg = "🪑 *Choose your seat* 👇\n\n";
  msg += "🟢 *Available Seats*\n\n";

  if (upper.length) {
    msg += "⬆️ *Upper Deck*\n";
    msg += upper.join(", ");
    msg += "\n\n";
  }

  if (lower.length) {
    msg += "⬇️ *Lower Deck*\n";
    msg += lower.join(", ");
    msg += "\n\n";
  }

  if (showLadies && ladies.length) {
    msg += "🚺 *Ladies Seats*\n";
    msg += ladies.join(", ");
    msg += "\n\n";
  }

  msg +=
    "👉 Reply with the *seat code only*\n\n" +
    "Examples:\n" +
    "• `U11`\n" +
    "• `L15`\n\n" +
    "⚠️ Please verify the seat from the image above before replying.";

  return msg;
}

/* ======================================================
 * Send Seat Layout (Image + Text)
 * ====================================================== */
async function sendSeatLayout(ctx, image) {
  const { session } = ctx;

  if (!session?.bookingUser) {
    console.warn("⚠️ sendSeatLayout: Missing bookingUser");
    return;
  }

  if (!session?.seatMap) {
    console.warn("⚠️ sendSeatLayout: Missing seatMap");
    return;
  }

  const user = session.bookingUser;
  const gender = session.passengers?.[0]?.gender || "Male";

  /* =========================
   * Send Image
   * ========================= */
  await sendImage(user, image);

  /* =========================
   * Send Seat Text
   * ========================= */
  const message = buildSeatMessage(session.seatMap, gender);
  await sendText(user, message);

  /* =========================
   * Activate Seat Selection Mode (USER SESSION)
   * ========================= */
  session.seatSelectionActive = true;
  session.selectedSeat = null;
  session.tempSelectedSeat = null;
  session.tempSelectedDeck = null;

  console.log("🪑 Seat layout sent to user:", user);
}

module.exports = sendSeatLayout;
