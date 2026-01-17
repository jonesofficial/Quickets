// lib/flow/summaryFlow.js

const { sendText } = require("../waClient");
const { saveBooking } = require("../bookingStore");
const { notifyAdmin } = require("../utils/adminNotify");

const buildBusSummary = require("./domains/bus/summary");

module.exports = async function summaryFlow(ctx) {
  const { session: s, interactiveId, from } = ctx;

  console.log("🧾 summaryFlow hit", {
    state: s?.state,
    interactiveId,
  });

  if (!s || !s.pendingBooking) return false;

  /* ===============================
   * CONFIRM BOOKING (USER)
   * =============================== */
  if (s.state === "BOOKING_REVIEW" && interactiveId === "CONFIRM_BOOKING") {
    const pending = s.pendingBooking;

    // 🔢 ENSURE AMOUNT EXISTS
    const totalAmount =
      pending.amount?.total ||
      pending.total ||
      pending.fare;

    if (!totalAmount) {
      await sendText(
        from,
        "❌ Unable to confirm booking.\nFare missing. Please try again."
      );
      return true;
    }

    const booking = {
      ...pending,

      // ⛔ NOT CONFIRMED YET
      status: "PROCESSING",

      amount: {
        total: totalAmount,
      },

      createdAt: Date.now(),
    };

    // 💾 PERSIST BOOKING
    const saved = saveBooking(booking);

    // 🔐 RESET SESSION
    s.pendingBooking = null;
    s.state = null;

    // ✅ USER MESSAGE
    await sendText(
      from,
      "✅ *Booking request received!*\n\n" +
        "We are checking availability and fares.\n" +
        "You will receive confirmation shortly."
    );

    await sendText(from, buildBusSummary(saved));

    // 👮 ADMIN NOTIFY
    await notifyAdmin(
      `🆕 *NEW BOOKING REQUEST*\n\n${buildBusSummary(saved)}`
    );

    console.log("📤 Admin notified:", saved.id);

    return true;
  }

  return false;
};
