const { sendText } = require("../../../../waClient");
const STATES = require("./states");

async function handleQuickBook(ctx) {
  const { session, from, text } = ctx;
  const input = text?.trim();

  if (!input && session.state !== STATES.START) return true;

  switch (session.state) {

    /* ================= START ================= */
    case STATES.START:
      session.quick = {};
      session.state = STATES.FROM;
      await sendText(from, "📍 Enter From City:");
      return true;

    /* ================= FROM ================= */
    case STATES.FROM:
      if (!input || input.length < 2) {
        await sendText(from, "Please enter a valid From city.");
        return true;
      }

      session.quick.from = input;
      session.state = STATES.TO;
      await sendText(from, "📍 Enter To City:");
      return true;

    /* ================= TO ================= */
    case STATES.TO:
      if (!input || input.length < 2) {
        await sendText(from, "Please enter a valid To city.");
        return true;
      }

      session.quick.to = input;
      session.state = STATES.DATE;
      await sendText(from, "📅 Enter Journey Date (DD-MM-YYYY):");
      return true;

    /* ================= DATE ================= */
    case STATES.DATE:
      if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) {
        await sendText(from, "Invalid format. Use DD-MM-YYYY.");
        return true;
      }

      session.quick.date = input;
      session.state = STATES.OPERATOR;
      await sendText(from, "🚌 Enter Bus Operator Name:");
      return true;

    /* ================= OPERATOR ================= */
    case STATES.OPERATOR:
      if (!input || input.length < 3) {
        await sendText(from, "Please enter a valid operator name.");
        return true;
      }

      session.quick.operator = input;
      session.state = STATES.TIME;
      await sendText(from, "⏰ Enter Departure Time:");
      return true;

    /* ================= TIME ================= */
    case STATES.TIME:
      if (!input || input.length < 3) {
        await sendText(from, "Please enter valid time. Example: 9:30 PM");
        return true;
      }

      session.quick.time = input;
      session.state = STATES.SEAT;
      await sendText(from, "🪑 Enter Seat Number (Example: L5 or 12):");
      return true;

    /* ================= SEAT ================= */
    case STATES.SEAT:
      if (!input) {
        await sendText(from, "Please enter a seat number.");
        return true;
      }

      session.quick.seat = input.toUpperCase();

      /* ================= HANDOVER TO MAIN FLOW ================= */

      session.pendingBooking = {
        type: "BUS",
        user: from,
        from: session.quick.from,
        to: session.quick.to,
        date: session.quick.date,
        operator: session.quick.operator,
        departureTime: session.quick.time,
        status: "DRAFT",
        quickMode: true,
      };

      // Activate seat engine
      session.seatSelectionActive = true;
      session.selectedSeat = null;

      // Move into seat selection system
      // Your seat handler checks seatSelectionActive
      await sendText(
        from,
        `🪑 Please confirm your seat selection.\n\nType the seat number again to validate:`
      );

      return true;
  }

  return false;
}

module.exports = handleQuickBook;