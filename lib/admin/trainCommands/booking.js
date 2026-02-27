const { sendText, sendButtons, sendImage } = require("../../waClient");
const {
  findBookingById,
  updateBooking,
} = require("../../bookingStore");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleTrainBookingCommands(ctx, text) {
  try {
    const from = ctx.from;

    /* =========================================
       IMAGE + CAPTION FORWARD
    ========================================= */
    if (ctx.msg?.type === "image" && ctx.msg?.image?.caption) {
      const caption = ctx.msg.image.caption.trim();
      const upperCaption = caption.toUpperCase();

      const bookingId = upperCaption
        .split(/\s+/)
        .find((p) => p.startsWith("QT"));

      if (!bookingId) {
        await sendText(from, "⚠️ Booking ID missing in caption.");
        return true;
      }

      const booking = findBookingById(bookingId);

      if (!booking || booking.type !== "TRAIN") {
        await sendText(from, `❌ Train booking not found: ${bookingId}`);
        return true;
      }

      if (!booking.user) {
        await sendText(from, "❌ Booking has no user linked.");
        return true;
      }

      // Forward image
      await sendImage(booking.user, ctx.msg.image.id);

      // Forward caption
      await sendText(booking.user, caption);

      await sendText(
        from,
        `✅ Availability forwarded to user.\n\n🆔 ${bookingId}`
      );

      return true;
    }

    /* =========================================
       STATUS COMMANDS
    ========================================= */

    const upper = text.toUpperCase().trim();
    const bookingId = upper.split(/\s+/).find((p) => p.startsWith("QT"));

    if (!bookingId) {
      await sendText(from, "⚠️ Booking ID missing.");
      return true;
    }

    const booking = findBookingById(bookingId);

    if (!booking || booking.type !== "TRAIN") {
      await sendText(from, `❌ Train booking not found: ${bookingId}`);
      return true;
    }

    if (!booking.user) {
      await sendText(from, "❌ Booking has no user linked.");
      return true;
    }

    const userNumber = booking.user;

    /* =========================================
       🟢 AVAILABLE
    ========================================= */
    if (upper.startsWith("AVAILABLE")) {
      updateBooking(bookingId, { status: "AVAILABLE" });

      await sendButtons(
        userNumber,
        "🟢 *Seats Available*\n\nYou can proceed with booking.",
        [
          { id: "TRAIN_CONFIRM", title: "Confirm" },
          { id: "TRAIN_CANCEL", title: "Cancel" },
        ]
      );

      await notifyAdmin(bookingId, "AVAILABLE");
      return true;
    }

    /* =========================================
       🟡 WAITING LIST
    ========================================= */
    if (upper.startsWith("WAITING LIST")) {
      updateBooking(bookingId, { status: "WAITING_LIST" });

      await sendButtons(
        userNumber,
        "🟡 *Waiting List*\n\n⚠️ Confirmation is not guaranteed.",
        [
          { id: "TRAIN_CONFIRM", title: "Confirm" },
          { id: "TRAIN_CANCEL", title: "Cancel" },
        ]
      );

      await notifyAdmin(bookingId, "WAITING_LIST");
      return true;
    }

    /* =========================================
       🟠 RAC
    ========================================= */
    if (upper.startsWith("RAC")) {
      updateBooking(bookingId, { status: "RAC" });

      await sendButtons(
        userNumber,
        "🟠 *RAC (Reservation Against Cancellation)*\n\nSeat confirmation depends on cancellations.",
        [
          { id: "TRAIN_CONFIRM", title: "Confirm" },
          { id: "TRAIN_CANCEL", title: "Cancel" },
        ]
      );

      await notifyAdmin(bookingId, "RAC");
      return true;
    }

    /* =========================================
       🔴 NO CHANCE
    ========================================= */
    if (upper.startsWith("NO CHANCE")) {
      updateBooking(bookingId, { status: "NO_CHANCE" });

      await sendButtons(
        userNumber,
        "🔴 *No Chance of Confirmation*\n\nThis train is highly unlikely to confirm.",
        [
          { id: "TRAIN_CHANGE_DATE", title: "Change Date" },
          { id: "TRAIN_CANCEL", title: "Cancel" },
        ]
      );

      await notifyAdmin(bookingId, "NO_CHANCE");
      return true;
    }

    return false;
  } catch (err) {
    console.error("🔥 TRAIN ADMIN ERROR:", err);
    await sendText(ctx?.from, "❌ Train admin internal error.");
    return true;
  }
};

async function notifyAdmin(bookingId, status) {
  if (!RAW_ADMIN) return;

  await sendText(
    RAW_ADMIN,
    `📢 Train Booking Status Updated\n\n🆔 ${bookingId}\nStatus → ${status}`
  );
}