const { sendText } = require("../../../../waClient");
const { findBookingById } = require("../../../../bookingStore");
const BUS_STATES = require("./states");
const { parseSeatOptions } = require("./adminParser");
const sendSeatLayout = require("./seatFlow");

/**
 * Admin Seat Sender
 * Responsibility:
 * - Handle SEAT_OPTIONS
 * - Validate admin input
 * - Save seat map
 * - Delegate image + seat text sending to seatFlow
 */
async function handleAdminSeatSender(ctx, text) {
  ctx.session = ctx.session || {};
  const from = ctx.from;

  /* =========================
   * IMAGE REQUIRED
   * ========================= */
  if (!ctx.msg?.image) {
    await sendText(
      from,
      "❌ Seat layout image missing.\nSend *SEAT_OPTIONS as the image caption*."
    );
    return true;
  }

  /* =========================
   * PREVENT DUPLICATES
   * ========================= */
  if (ctx.session.seatSelectionActive) {
    await sendText(
      from,
      "⚠️ Seat selection already active for this booking."
    );
    return true;
  }

  /* =========================
   * PARSE SEAT OPTIONS
   * ========================= */
  const parsed = parseSeatOptions(text);
  if (!parsed.ok) {
    await sendText(from, `❌ ${parsed.error}`);
    return true;
  }

  /* =========================
   * VALIDATE BOOKING
   * ========================= */
  if (!ctx.session.bookingId || !ctx.session.bookingUser) {
    await sendText(
      from,
      "❌ No active BUS booking to attach seat layout."
    );
    return true;
  }

  const booking = findBookingById(ctx.session.bookingId);
  if (!booking || booking.type !== "BUS") {
    await sendText(
      from,
      "❌ Seat layout is only valid for BUS bookings."
    );
    return true;
  }

  /* =========================
   * EXTRACT IMAGE (MEDIA ID / LINK)
   * ========================= */
  const image = ctx.msg.image.id || ctx.msg.image.link;
  if (typeof image !== "string") {
    await sendText(
      from,
      "❌ Invalid seat image. Please resend."
    );
    return true;
  }

  /* =========================
   * SAVE SEAT MAP
   * ========================= */
  ctx.session.seatMap = parsed.data;
  ctx.session.state = BUS_STATES.SEAT_LAYOUT_PENDING;

  console.log("🪑 ADMIN SEAT OPTIONS ATTACHED", {
    bookingId: ctx.session.bookingId,
    seatMap: parsed.data,
  });

  /* =========================
   * SEND SEAT LAYOUT (IMAGE + TEXT)
   * ========================= */
  await sendSeatLayout(
    {
      session: ctx.session,
    },
    image
  );

  /* =========================
   * CONFIRM TO ADMIN
   * ========================= */
  await sendText(from, "✅ Seat layout sent to user.");

  /* =========================
   * ACTIVATE SEAT FLOW
   * ========================= */
  ctx.session.state = BUS_STATES.SEAT_SELECTION;
  ctx.session.seatSelectionActive = true;

  return true;
}

module.exports = {
  handleAdminSeatSender,
};
