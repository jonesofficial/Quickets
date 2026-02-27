const { sendText, sendButtons } = require("../../../../waClient");
const { findBookingById, updateBooking } = require("../../../../bookingStore");

module.exports = async function handleTrainAdmin(ctx, text) {
  console.log("🟢 HANDLE TRAIN ADMIN START");

  try {
    const admin = ctx.from;
    const message = text?.trim();

    if (!message) {
      await sendText(admin, "⚠️ Empty admin message.");
      return true;
    }

    const upper = message.toUpperCase();
    const bookingId = upper.split(/\s+/).find((p) => p.startsWith("QT"));

    if (!bookingId) {
      await sendText(admin, "❌ Booking ID missing.");
      return true;
    }

    const booking = findBookingById(bookingId);

    if (!booking || booking.type !== "TRAIN") {
      await sendText(admin, `❌ Train booking not found: ${bookingId}`);
      return true;
    }

    if (!booking.user) {
      await sendText(admin, "❌ Booking has no user linked.");
      return true;
    }

    /* ===========================================
       AVAILABLE
    =========================================== */
    if (upper.startsWith("AVAILABLE")) {
      updateBooking(bookingId, { status: "AVAILABLE" });

      await sendButtons(
        booking.user,
        `🟢 *Seats Available*

🆔 Booking ID: *${bookingId}*

Good news! Seats are available for your selected train.

Would you like to proceed with booking?`,
        [
          { id: `TRAIN_CONFIRM_${bookingId}`, title: "Proceed" },
          { id: `TRAIN_CANCEL_${bookingId}`, title: "Cancel" },
        ]
      );

      await sendText(
        admin,
        `✅ User notified.

🆔 ${bookingId}
Status → AVAILABLE`
      );

      return true;
    }

    /* ===========================================
       WAITING LIST
    =========================================== */
    if (upper.startsWith("WAITING LIST")) {
      updateBooking(bookingId, { status: "WAITING_LIST" });

      await sendButtons(
        booking.user,
        `🟡 *Waiting List Update*

🆔 Booking ID: *${bookingId}*

Your ticket is currently on *Waiting List*.

⚠️ Confirmation is not guaranteed.

Would you like to proceed?`,
        [
          { id: `TRAIN_CONFIRM_${bookingId}`, title: "Proceed" },
          { id: `TRAIN_CANCEL_${bookingId}`, title: "Cancel" },
        ]
      );

      await sendText(
        admin,
        `📤 User notified.

🆔 ${bookingId}
Status → WAITING_LIST`
      );

      return true;
    }

    /* ===========================================
       RAC
    =========================================== */
    if (upper.startsWith("RAC")) {
      updateBooking(bookingId, { status: "RAC" });

      await sendButtons(
        booking.user,
        `🟠 *RAC (Reservation Against Cancellation)*

🆔 Booking ID: *${bookingId}*

You currently have RAC status.
You will be allowed to travel but seat sharing may apply.

Proceed with booking?`,
        [
          { id: `TRAIN_CONFIRM_${bookingId}`, title: "Proceed" },
          { id: `TRAIN_CANCEL_${bookingId}`, title: "Cancel" },
        ]
      );

      await sendText(
        admin,
        `📤 User notified.

🆔 ${bookingId}
Status → RAC`
      );

      return true;
    }

    /* ===========================================
       NO CHANCE
    =========================================== */
    if (upper.startsWith("NO CHANCE")) {
      updateBooking(bookingId, { status: "NO_CHANCE" });

      await sendButtons(
        booking.user,
        `🔴 *Low Confirmation Probability*

🆔 Booking ID: *${bookingId}*

This train has very low confirmation chances.

Would you like to:
• Change Date
• Cancel booking`,
        [
          { id: `TRAIN_CHANGE_${bookingId}`, title: "Change Date" },
          { id: `TRAIN_CANCEL_${bookingId}`, title: "Cancel" },
        ]
      );

      await sendText(
        admin,
        `📤 User notified.

🆔 ${bookingId}
Status → NO_CHANCE`
      );

      return true;
    }

    await sendText(
      admin,
      "⚠️ Unknown TRAIN admin command.\nUse:\n• AVAILABLE QTxxxx\n• WAITING LIST QTxxxx\n• RAC QTxxxx\n• NO CHANCE QTxxxx"
    );

    return true;
  } catch (err) {
    console.error("🔥 TRAIN ADMIN ERROR:", err);
    await sendText(ctx.from, "❌ Train admin internal error.");
    return true;
  }
};