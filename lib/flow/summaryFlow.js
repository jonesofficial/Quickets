// lib/flow/summaryFlow.js

const { sendText } = require("../waClient");
const { saveBooking } = require("../bookingStore");
const { notifyAdmin } = require("../utils/adminNotify");

const buildBusSummary = require("./domains/bus/summary");
const buildTrainSummary = require("./domains/train/summary");

/* ======================================================
 * SUMMARY PICKER
 * ====================================================== */
function buildSummary(booking) {
  switch (booking.type) {
    case "TRAIN":
      return buildTrainSummary(booking);
    case "BUS":
      return buildBusSummary(booking);
    default:
      return "❌ Summary unavailable.";
  }
}

module.exports = async function summaryFlow(ctx) {
  const { session: s, interactiveId, from } = ctx;

  if (!s || s.state !== "BOOKING_REVIEW") return false;
  if (!s.pendingBooking) return false;

  console.log("🧾 summaryFlow hit", {
    state: s?.state,
    interactiveId,
  });

  /* ======================================================
   * CONFIRM BOOKING (USER)
   * ====================================================== */
  if (interactiveId === "CONFIRM_BOOKING") {
    const pending = s.pendingBooking;

    const booking = {
      ...pending,

      // ⛔ NOT FINAL CONFIRMED
      status: "PROCESSING",

      amount: {
        total: 2, // placeholder
      },

      createdAt: Date.now(),
    };

    // 💾 SAVE BOOKING
    const saved = saveBooking(booking);

    // 🔐 RESET SESSION
    s.pendingBooking = null;
    s.state = null;

    /* ===============================
       2️⃣ BOOKING SUMMARY
    =============================== */
    const summaryText = buildSummary(saved);
    await sendText(from, summaryText);

    
    /* ===============================
       4️⃣ ADMIN NOTIFICATION
    =============================== */
    await notifyAdmin(
      `🆕 *NEW BOOKING REQUEST*\n\n${summaryText}`
    );

    console.log("📤 Admin notified:", saved.id);

    return true;
  }

  return false;
};
