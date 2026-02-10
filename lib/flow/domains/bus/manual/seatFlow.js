const { sendText, sendImage } = require("../../../../waClient");

/* ================================
 * Normalize Seat Map
 * ================================ */
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

/* ================================
 * Build Seat Selection Message
 * ================================ */
function buildSeatMessage(seatMap, gender) {
  const { upper, lower, ladies } = normalizeSeatMap(seatMap);
  const showLadies = gender === "Female";

  let msg = "🪑 *Choose your seat* 👇\n\n";
  msg += "🟢 *Available Seats*\n\n";

  /* -------- Upper Deck -------- */
  if (upper.length) {
    msg += "⬆️ *Upper Deck*\n";
    msg += upper.join(", ");
    msg += "\n\n";
  }

  /* -------- Lower Deck -------- */
  if (lower.length) {
    msg += "⬇️ *Lower Deck*\n";
    msg += lower.join(", ");
    msg += "\n\n";
  }

  /* -------- Ladies Seats -------- */
  if (showLadies && ladies.length) {
    msg += "🚺 *Ladies Seats*\n";
    msg += ladies.join(", ");
    msg += "\n\n";
  }

  /* -------- Footer -------- */
  msg +=
    "👉 Reply with the *seat code only*\n" +
    "Examples:\n" +
    "• `U11`\n" +
    "• `L15`\n\n" +
    "⚠️ Please verify the seat from the image above before replying.";

  return msg;
}

/* ================================
 * Send Seat Layout (Image + Text)
 * ================================ */
module.exports = async function sendSeatLayout(ctx, image) {
  const { session } = ctx;
  if (!session?.bookingUser || !session?.seatMap) return;

  const user = session.bookingUser;
  const gender = session.passengers?.[0]?.gender || "Male";

  /* =========================
   * Normalize image for Cloud API
   * ========================= */
  const imagePayload =
    typeof image === "string"
      ? image.startsWith("http")
        ? { link: image }
        : { id: image }
      : image;

  /* =========================
   * 1️⃣ Send seat layout image
   * ========================= */
  await sendImage(user, imagePayload);

  /* =========================
   * 2️⃣ Send seat instructions
   * ========================= */
  const message = buildSeatMessage(session.seatMap, gender);
  await sendText(user, message);

  /* =========================
   * 3️⃣ Activate seat selection
   * ========================= */
  session.seatSelectionActive = true;
  session.selectedSeat = null;

  console.log("🪑 Seat layout sent to user:", user);
};
