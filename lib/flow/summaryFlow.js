const { sendText } = require("../waClient");
const { saveBooking } = require("../bookingStore");
const { notifyAdmin } = require("../utils/adminNotify");

const buildBusSummary = require("./domains/bus/summary");

module.exports = async function summaryFlow(ctx) {
  // ✅ FIRST: destructure
  const { session: s, interactiveId, from } = ctx;

  // ✅ NOW safe to log
  console.log("🧾 summaryFlow hit", {
    state: s?.state,
    interactiveId,
  });

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

    const saved = saveBooking(booking);

    // 🔐 reset FIRST
    s.pendingBooking = null;
    s.state = null;

    // ✅ user
    await sendText(from, "✅ *Booking Confirmed!*");
    await sendText(from, buildBusSummary(saved));

    // ✅ admin
    await notifyAdmin(
      `🆕 *NEW BOOKING CONFIRMED*\n\n${buildBusSummary(saved)}`
    );

    console.log("📤 Admin notified:", saved.id);

    return true;
  }

  return false;
};
