const { sendText } = require("../../../../waClient");
const BUS_STATES = require("./states");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleSeatConfirmation(ctx) {
  try {
    const { session, msg, from } = ctx;

    if (!session) return false;
    if (session.state !== BUS_STATES.SEAT_CONFIRMATION) return false;

    const buttonId = msg?.interactive?.button_reply?.id;
    const textInput = msg?.text?.body?.trim().toLowerCase();

    /* ================= CONFIRM ================= */

    if (
      buttonId === "CONFIRM_SEAT" ||
      textInput === "yes" ||
      textInput === "confirm"
    ) {
      if (!session.tempSelectedSeat) {
        await sendText(
          from,
          "⚠️ No seat selected. Please choose a seat again."
        );
        session.state = BUS_STATES.SEAT_SELECTION;
        return true;
      }

      session.selectedSeat = session.tempSelectedSeat;
      session.selectedDeck = session.tempSelectedDeck;

      session.tempSelectedSeat = null;
      session.tempSelectedDeck = null;

      session.seatSelectionActive = false;
      session.state = BUS_STATES.PRICE_CONFIRMATION;

      console.log("🪑 Seat confirmed", {
        bookingId: session.bookingId,
        user: from,
        seat: session.selectedSeat,
      });

      /* ===== Notify USER ===== */
      await sendText(
        from,
        `🎟️ *Seat Confirmed Successfully!*

Seat: *${session.selectedSeat}*
Deck: *${session.selectedDeck}*

⏳ Please wait while we proceed with the booking.

— *Team Quickets*`
      );

      /* ===== Notify ADMIN ===== */
      if (RAW_ADMIN) {
        try {
          await sendText(
            RAW_ADMIN,
            `🪑 *Seat Confirmed by User*

👤 User: ${from}
${session.bookingId ? `🆔 Booking ID: ${session.bookingId}\n` : ""}Seat: ${session.selectedSeat}
Deck: ${session.selectedDeck}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Send seat confirmation image using:
SEAT_SELECTED (as image caption)`
          );
        } catch (err) {
          console.error("❌ Failed to notify admin:", err.message);
        }
      }

      return true;
    }

    /* ================= CHANGE ================= */

    if (
      buttonId === "CHANGE_SEAT" ||
      textInput === "no" ||
      textInput === "change"
    ) {
      session.tempSelectedSeat = null;
      session.tempSelectedDeck = null;
      session.state = BUS_STATES.SEAT_SELECTION;

      console.log("🔁 User chose to change seat", {
        bookingId: session.bookingId,
        user: from,
      });

      await sendText(
        from,
        "🔁 Please select a new seat from the available options."
      );

      return true;
    }

    /* ================= INVALID ================= */

    await sendText(
      from,
      "⚠️ Please use the buttons to confirm or change the seat."
    );

    return true;

  } catch (err) {
    console.error("🔥 FATAL handleSeatConfirmation error", {
      bookingId: ctx?.session?.bookingId,
      user: ctx?.from,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong while confirming seat. Please try again."
    );

    return true;
  }
};
