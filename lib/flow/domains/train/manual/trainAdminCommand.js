const TRAIN_STATES = require("./states");
const sendAvailabilityImage = require("./sendAvailabilityImage");

const {
  findBookingById,
  getPendingManualBookings,
} = require("../../../../bookingStore");

/**
 * Handles admin commands:
 * AVAILABLE QT
 * AVAILABLE QT2026021001
 * WAITING LIST QT
 * WAITING LIST QT2026021001
 */
module.exports = async function trainAdminCommands(ctx) {
  const { msg, from, session: s } = ctx;

  if (!msg?.text?.body) return false;

  const text = msg.text.body.trim();
  const upper = text.toUpperCase();

  // Extract image (image message OR quoted image)
  const image =
    msg.image?.id ||
    msg.image?.link ||
    msg.context?.quoted_message?.image?.id ||
    null;

  /* =========================
   * COMMAND PARSING
   * ========================= */

  const isAvailable = upper.startsWith("AVAILABLE");
  const isWaiting = upper.startsWith("WAITING LIST");

  if (!isAvailable && !isWaiting) return false;

  let booking = null;

  /* ======================================================
   * 1️⃣ SESSION-BASED RESOLUTION (PRIMARY)
   * ====================================================== */

  if (
    s?.pendingBooking &&
    s.pendingBooking.type === "TRAIN" &&
    s.state === TRAIN_STATES.INIT
  ) {
    booking = s.pendingBooking;
  }

  /* ======================================================
   * 2️⃣ BOOKINGSTORE FALLBACK (SECONDARY)
   * ====================================================== */

  if (!booking) {
    const parts = upper.split(/\s+/);
    const possibleBookingId = parts.find((p) => p.startsWith("QT"));

    if (possibleBookingId) {
      booking = findBookingById(possibleBookingId);

      if (!booking || booking.type !== "TRAIN") {
        await ctx.sendText(
          from,
          `❌ Train booking not found: ${possibleBookingId}`
        );
        return true;
      }
    } else {
      const pending = getPendingManualBookings("TRAIN");

      if (pending.length === 0) {
        await ctx.sendText(from, "ℹ️ No pending TRAIN bookings.");
        return true;
      }

      if (pending.length > 1) {
        await ctx.sendText(
          from,
          "⚠️ Multiple TRAIN bookings pending.\n\n" +
            "Please use:\nAVAILABLE <BOOKING_ID>"
        );
        return true;
      }

      booking = pending[0];
    }
  }

  if (!booking) {
    await ctx.sendText(from, "❌ Train booking not found.");
    return true;
  }

  /* =========================
   * APPLY ADMIN ACTION
   * ========================= */

  if (isAvailable) {
    await sendAvailabilityImage({
      from: booking.user,
      image,
      statusText: "🟢 *Seats Available*",
    });

    booking.manualTrainStatus = "AVAILABLE";
    s.state = TRAIN_STATES.WAITING_CONFIRMATION;
    return true;
  }

  if (isWaiting) {
    await sendAvailabilityImage({
      from: booking.user,
      image,
      statusText:
        "🟡 *Waiting List*\n⚠️ Confirmation is not guaranteed",
    });

    booking.manualTrainStatus = "WAITING_LIST";
    s.state = TRAIN_STATES.WAITING_CONFIRMATION;
    return true;
  }

  return false;
};
