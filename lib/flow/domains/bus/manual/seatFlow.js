const { sendText, sendImage } = require("../../../../waClient");

function buildSeatMessage(seatMap, gender) {
  const showLadies = gender === "Female";

  let msg = `🪑 *Seat Selection*\n\n`;

  msg += `🟢 *Available Seats*\n\n`;

  if (seatMap.availableUpper?.length) {
    msg += `⬆️ *Upper Deck*\n${seatMap.availableUpper.join(", ")}\n\n`;
  }

  if (seatMap.availableLower?.length) {
    msg += `⬇️ *Lower Deck*\n${seatMap.availableLower.join(", ")}\n\n`;
  }

  if (showLadies && seatMap.ladies?.length) {
    msg += `🚺 *Ladies Seats*\n${seatMap.ladies.join(", ")}\n\n`;
  }

  msg +=
    "👉 Reply with the *seat number only*\n" +
    "Example: `U11` or `L15`\n\n" +
    "⚠️ Please check the seat number carefully from the image.";

  return msg;
}

module.exports = async function sendSeatLayout(ctx, imageUrl) {
  const { session } = ctx;

  if (!session?.bookingUser) return;

  const user = session.bookingUser;
  const gender = session.passengers?.[0]?.gender || "Male";

  // 1️⃣ Send image
  await sendImage(user, imageUrl);

  // 2️⃣ Send instructions
  const message = buildSeatMessage(session.seatMap, gender);
  await sendText(user, message);

  // 3️⃣ Activate seat selection mode
  session.seatSelectionActive = true;
  session.selectedSeat = null;

  console.log("🪑 Seat layout sent to user:", user);
};
