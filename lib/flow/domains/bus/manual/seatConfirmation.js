const { sendText, sendButtons } = require("../../../../waClient");
const BUS_STATES = require("./states");
const { updateBooking, getLastBookingByUser } = require("../../../../bookingStore");

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleSeatConfirmation(ctx) {
  try {
    const { session, msg, from } = ctx;

    if (!session) return false;

    /* ======================================================
       STEP 1 — SEAT CONFIRMATION
    ====================================================== */
    if (session.state === BUS_STATES.SEAT_CONFIRMATION) {

      const buttonId =
        msg?.interactive?.button_reply?.id;
      const textInput =
        msg?.text?.body?.trim()?.toLowerCase();

      /* ================= CONFIRM SEAT ================= */
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

        /* 🔥 MOVE TO FINAL CONFIRM STATE */
        session.state = BUS_STATES.FINAL_CONFIRM;

        await sendButtons(
          from,
          `🪑 *Seat Selected*\n\n` +
            `Seat: *${session.selectedSeat}*\n` +
            `Deck: *${session.selectedDeck}*\n\n` +
            `🚌 Bus: *${session.tempSelectedBus?.name || "Selected Bus"}*\n\n` +
            `What would you like to do?`,
          [
            { id: "CONFIRM_BUS_FINAL", title: "✅ Confirm Bus & Seat" },
            { id: "CHANGE_BUS", title: "🔁 Change Bus" },
          ]
        );

        return true;
      }

      /* ================= CHANGE SEAT ================= */
      if (
        buttonId === "CHANGE_SEAT" ||
        textInput === "no" ||
        textInput === "change"
      ) {
        session.tempSelectedSeat = null;
        session.tempSelectedDeck = null;
        session.state = BUS_STATES.SEAT_SELECTION;

        await sendText(
          from,
          "🔁 Please select a new seat from the available options."
        );

        return true;
      }

      await sendText(
        from,
        "⚠️ Please use the buttons to confirm or change the seat."
      );

      return true;
    }

    /* ======================================================
       STEP 2 — FINAL BUS CONFIRMATION
    ====================================================== */
    if (session.state === BUS_STATES.FINAL_CONFIRM) {

      const buttonId =
        msg?.interactive?.button_reply?.id;

      /* ================= FINAL CONFIRM ================= */
      if (buttonId === "CONFIRM_BUS_FINAL") {

        const booking = await getLastBookingByUser(from);
        if (!booking) {
          await sendText(from, "⚠️ No active booking found.");
          return true;
        }

        /* 🔥 COMMIT TO BOOKING STORE NOW */
        updateBooking(booking.id, {
          selectedBus: session.tempSelectedBus,
          selectedSeat: session.selectedSeat,
          selectedDeck: session.selectedDeck,
          status: "BUS_CONFIRMED",
        });

        session.selectedBus = session.tempSelectedBus;
        session.state = null;

        await sendText(
          from,
          `🎟️ *Bus & Seat Confirmed Successfully!*\n\n` +
            `Seat: *${session.selectedSeat}*\n` +
            `Bus: *${session.selectedBus?.name}*\n\n` +
            `⏳ Proceeding to boarding details...\n\n` +
            `— *Team Quickets*`
        );

        /* ===== Notify ADMIN ===== */
        if (RAW_ADMIN) {
          await sendText(
            RAW_ADMIN,
            `🚌 *Bus & Seat Confirmed*\n\n` +
              `👤 User: ${from}\n` +
              `🆔 Booking ID: ${booking.id}\n` +
              `Operator: ${session.selectedBus?.name}\n` +
              `Seat: ${session.selectedSeat}\n` +
              `Deck: ${session.selectedDeck}\n\n` +
              `━━━━━━━━━━━━━━━━━━\n` +
              `👉 NEXT STEP:\nSend boarding points using:\n\nB_POINTS\nLocation - Time`
          );
        }

        return true;
      }

      /* ================= CHANGE BUS ================= */
      if (buttonId === "CHANGE_BUS") {

        session.selectedSeat = null;
        session.selectedDeck = null;
        session.tempSelectedSeat = null;
        session.tempSelectedDeck = null;
        session.seatSelectionActive = false;

        session.state = BUS_STATES.BUS_OPTION_SELECTION;

        await sendText(
          from,
          "🔁 No problem!\n\nPlease select another bus from the available options."
        );

        return true;
      }

      return true;
    }

    return false;

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