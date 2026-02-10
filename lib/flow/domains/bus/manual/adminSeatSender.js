const { sendText } = require("../../../../waClient");
const { findBookingById } = require("../../../../bookingStore");
const BUS_STATES = require("./states");
const { parseSeatOptions } = require("./adminParser");

/**
 * Admin Seat Sender
 * Responsibility:
 * - Handle SEAT_OPTIONS
 * - Forward seat layout image to user
 * - Start seat selection flow
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
   * EXTRACT IMAGE (ID / LINK)
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
   * SEND IMAGE TO USER
   * ========================= */
  await dispatchSeatLayoutImage({
    user: ctx.session.bookingUser,
    image,
  });

  /* =========================
   * SEND SEAT TEXT TO USER
   * ========================= */
  const seatText =
    "🪑 *Available Seats*\n\n" +
    Object.entries(parsed.data)
      .map(
        ([deck, seats]) =>
          `*${deck}*: ${seats.length ? seats.join(", ") : "None"}`
      )
      .join("\n");

  await sendText(ctx.session.bookingUser, seatText);

  /* =========================
   * CONFIRM TO ADMIN
   * ========================= */
  await sendText(
    from,
    "✅ Seat layout & options sent to user.\n\n" + seatText
  );

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
