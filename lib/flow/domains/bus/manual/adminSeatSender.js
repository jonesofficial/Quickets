const { sendText } = require("../../../../waClient");
const { findBookingById } = require("../../../../bookingStore");
const { startOrGet } = require("../../../../sessionStore");
const BUS_STATES = require("./states");
const { parseSeatOptions } = require("./adminParser");
const sendSeatLayout = require("./seatFlow");

/**
 * Admin Seat Sender
 * Responsibility:
 * - Handle SEAT_OPTIONS
 * - Validate admin input
 * - Save seat map into USER session
 * - Send image + seat text to USER
 */
async function handleAdminSeatSender(ctx, text) {
  const from = ctx.from;

  /* ======================================================
   * IMAGE REQUIRED
   * ====================================================== */
  if (!ctx.msg?.image) {
    await sendText(
      from,
      "❌ Seat layout image missing.\nSend *SEAT_OPTIONS as the image caption*."
    );
    return true;
  }

  /* ======================================================
   * VALIDATE BOOKING CONTEXT (ADMIN SIDE)
   * ====================================================== */
  if (!ctx.session?.bookingId || !ctx.session?.bookingUser) {
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

  /* ======================================================
   * PARSE SEAT OPTIONS
   * ====================================================== */
  const parsed = parseSeatOptions(text);
  if (!parsed.ok) {
    await sendText(from, `❌ ${parsed.error}`);
    return true;
  }

  /* ======================================================
   * LOAD USER SESSION (CRITICAL FIX)
   * ====================================================== */
  const userPhone = ctx.session.bookingUser;
  const { session: userSession } = startOrGet(userPhone);

  // 🔥 Ensure user session knows its own phone
  userSession.bookingUser = userPhone;

  /* ======================================================
   * PREVENT DUPLICATE SEAT ACTIVATION (USER SIDE)
   * ====================================================== */
  if (userSession.seatSelectionActive) {
    await sendText(
      from,
      "⚠️ Seat selection already active for this booking."
    );
    return true;
  }

  /* ======================================================
   * EXTRACT IMAGE SAFELY (MEDIA ID OR LINK)
   * ====================================================== */
  const image =
    ctx.msg?.image?.id ||
    ctx.msg?.image?.link ||
    null;

  if (!image) {
    await sendText(
      from,
      "❌ Could not extract seat image. Please resend the image."
    );
    return true;
  }

  /* ======================================================
   * SAVE SEAT MAP INTO USER SESSION
   * ====================================================== */
  userSession.seatMap = parsed.data;
  userSession.state = BUS_STATES.SEAT_SELECTION;

  console.log("🪑 USER SEAT OPTIONS ATTACHED", {
    bookingId: userSession.bookingId,
    user: userPhone,
    seatMap: parsed.data,
  });

  /* ======================================================
   * SEND SEAT LAYOUT TO USER
   * ====================================================== */
  try {
    await sendSeatLayout(
      { session: userSession },
      image
    );
  } catch (err) {
    console.error("❌ Failed sending seat layout:", err.message);
    await sendText(from, "❌ Failed to send seat layout to user.");
    return true;
  }

  /* ======================================================
   * CONFIRM TO ADMIN
   * ====================================================== */
  await sendText(
    from,
    "✅ Seat layout sent to user.\nWaiting for seat selection."
  );

  return true;
}

module.exports = {
  handleAdminSeatSender,
};
