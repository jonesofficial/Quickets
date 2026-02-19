const { sendText, sendButtons } = require("../../../../waClient");
const BUS_STATES = require("./states");

module.exports = async function handleSeatSelection(ctx) {
  try {
    const { session, msg, from } = ctx;

    if (!session) {
      console.error("❌ Missing session in handleSeatSelection");
      return false;
    }

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

    console.log("🪑 Seat temporarily selected", {
      bookingId: session.bookingId,
      user: from,
      seat,
      deck,
    });

    /* ================= ASK CONFIRMATION (BUTTONS) ================= */

    try {
      await sendButtons(
        from,
        `🪑 *Confirm Your Seat*

Seat Number: *${seat}*
Deck: *${deck}*

Please confirm your selection.`,
        [
          { id: "CONFIRM_SEAT", title: "✅ Confirm" },
          { id: "CHANGE_SEAT", title: "🔁 Change Seat" },
        ]
      );
    } catch (err) {
      console.error("❌ Failed sending seat confirmation buttons", {
        bookingId: session.bookingId,
        error: err.message,
      });

      await sendText(
        from,
        `Seat Number ${seat} selected.\nReply YES to confirm or NO to change.`
      );
    }

    return true;

  } catch (err) {
    console.error("🔥 FATAL handleSeatSelection error", {
      bookingId: ctx?.session?.bookingId,
      user: ctx?.from,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong while selecting seat. Please try again."
    );

    return true;
  }
};
