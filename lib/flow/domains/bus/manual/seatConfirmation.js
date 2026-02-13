const { sendText } = require("../../../../waClient");
const BUS_STATES = require("./states");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

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

    /* ===== Send Confirmation To USER ===== */

    await sendText(
      from,
      `🎟️ Seat ${session.selectedSeat} confirmed successfully!\n\nPlease wait while we proceed with booking.`
    );

    /* ===== Notify ADMIN ===== */

    if (RAW_ADMIN) {
      try {
        await sendText(
          RAW_ADMIN,
          `🪑 *Seat Selected by User*\n\n` +
          `👤 User: ${from}\n` +
          `${session.bookingId ? `🆔 Booking ID: ${session.bookingId}\n` : ""}` +
          `Seat: ${session.selectedSeat}\n` +
          `Deck: ${session.selectedDeck}\n\n` +
          `⏳ Awaiting next step.`
        );
      } catch (err) {
        console.error("❌ Failed to notify admin:", err.message);
      }
    }

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
