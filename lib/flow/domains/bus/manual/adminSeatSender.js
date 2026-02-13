const { sendText, sendImage } = require("../../../../waClient");
const { findBookingById } = require("../../../../bookingStore");
const { startOrGet } = require("../../../../sessionStore");
const BUS_STATES = require("./states");
const { parseSeatOptions } = require("./adminParser");
const sendSeatLayout = require("./seatFlow");

/**
 * Admin Seat Sender
 * Responsibility:
 * - Handle SEAT_OPTIONS
 * - Handle SEAT_SELECTED (confirmation image)
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
      "❌ Seat layout image missing.\nSend *SEAT_OPTIONS* or *SEAT_SELECTED* as the image caption."
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
   * LOAD USER SESSION
   * ====================================================== */
  const userPhone = ctx.session.bookingUser;
  const { session: userSession } = startOrGet(userPhone);

  // Ensure user session knows its own phone
  userSession.bookingUser = userPhone;

  /* ======================================================
   * EXTRACT IMAGE SAFELY
   * ====================================================== */
  const image =
    ctx.msg?.image?.id ||
    ctx.msg?.image?.link ||
    null;

  if (!image) {
    await sendText(
      from,
      "❌ Could not extract seat image. Please resend."
    );
    return true;
  }

  /* ======================================================
   * 🟢 SEAT_SELECTED (CONFIRMATION IMAGE FLOW)
   * ====================================================== */
  if (/^SEAT_SELECTED/i.test(text)) {
    try {
      await sendImage(userPhone, image);

      await sendText(
        userPhone,
        "✅ The seat has been selected."
      );

      await sendText(
        from,
        "✅ Seat confirmation image sent to user."
      );

      console.log("🪑 Seat confirmation image forwarded to user:", userPhone);
    } catch (err) {
      console.error("❌ Failed forwarding seat confirmation image:", err.message);
      await sendText(from, "❌ Failed to send seat confirmation image.");
    }

    return true;
  }

  /* ======================================================
   * 🟢 SEAT_OPTIONS (ORIGINAL FLOW — UNCHANGED)
   * ====================================================== */

  const parsed = parseSeatOptions(text);
  if (!parsed.ok) {
    await sendText(from, `❌ ${parsed.error}`);
    return true;
  }

  if (userSession.seatSelectionActive) {
    await sendText(
      from,
      "⚠️ Seat selection already active for this booking."
    );
    return true;
  }

  userSession.seatMap = parsed.data;
  userSession.state = BUS_STATES.SEAT_SELECTION;

  console.log("🪑 USER SEAT OPTIONS ATTACHED", {
    bookingId: userSession.bookingId,
    user: userPhone,
    seatMap: parsed.data,
  });

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

  await sendText(
    from,
    "✅ Seat layout sent to user.\nWaiting for seat selection."
  );

  return true;
}

module.exports = {
  handleAdminSeatSender,
};
