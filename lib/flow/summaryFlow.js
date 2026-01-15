const { sendText } = require("../waClient");
const { saveBooking } = require("../bookingStore");
const { notifyAdmin } = require("../utils/adminNotify");

const buildBusSummary = require("./domains/bus/summary"); // adjust path
// later you can switch based on booking.type

module.exports = async function summaryFlow(ctx) {
  const { session: s, interactiveId, from } = ctx;
  if (!s || !s.pendingBooking) return false;

  /* ===============================
   * CONFIRM BOOKING
   * =============================== */
  if (s.state === "BOOKING_REVIEW" && interactiveId === "CONFIRM_BOOKING") {
    const booking = {
      ...s.pendingBooking,
      status: "CONFIRMED",
      createdAt: Date.now(),
    };

    // ✅ Save booking
    const saved = saveBooking(booking);

    // ✅ Reset user session FIRST (prevents loops)
    s.pendingBooking = null;
    s.state = null;

    // ✅ Send to USER
    await sendText(from, "✅ *Booking Confirmed!*");
    await sendText(from, buildBusSummary(saved));

    // ✅ Send to ADMIN (🔥 THIS IS WHAT YOU WANT)
    await notifyAdmin(
      `🆕 *NEW BOOKING CONFIRMED*\n\n${buildBusSummary(saved)}`
    );

    return true;
  }

  return false;
};
