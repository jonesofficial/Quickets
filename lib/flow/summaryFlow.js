// // lib/flow/summaryFlow.js

// const { sendText } = require("../waClient");
// const { saveBooking } = require("../bookingStore");
// const { notifyAdmin } = require("../utils/adminNotify");

// const buildBusSummary = require("./domains/bus/summary");
// const buildTrainSummary = require("./domains/train/summary");

// /* ======================================================
//  * SUMMARY PICKER
//  * ====================================================== */
// function buildSummary(booking) {
//   switch (booking.type) {
//     case "TRAIN":
//       return buildTrainSummary(booking);
//     case "BUS":
//       return buildBusSummary(booking);
//     default:
//       return "❌ Summary unavailable.";
//   }
// }

// module.exports = async function summaryFlow(ctx) {
//   const { session: s, interactiveId, from } = ctx;

//   if (!s || s.state !== "BOOKING_REVIEW") return false;
//   if (!s.pendingBooking) return false;

//   console.log("🧾 summaryFlow hit", {
//     state: s?.state,
//     interactiveId,
//   });

//   /* ======================================================
//    * CONFIRM BOOKING (USER)
//    * ====================================================== */
//   if (interactiveId === "CONFIRM_BOOKING") {
//     const pending = s.pendingBooking;

//     const booking = {
//       ...pending,

//       // ⛔ NOT FINAL CONFIRMED
//       status: "PROCESSING",

//       amount: {
//         total: 2, // placeholder
//       },

//       createdAt: Date.now(),
//     };

//     // 💾 SAVE BOOKING
//     const saved = saveBooking(booking);

//     s.bookingId = saved.id;
//     s.state = "BOOKING_SAVED";
//     delete s.pendingBooking;
//     /* ===============================
//        2️⃣ BOOKING SUMMARY
//     =============================== */
//     const summaryText = buildSummary(saved);
//     await sendText(from, summaryText);

//     /* ===============================
//        4️⃣ ADMIN NOTIFICATION
//     =============================== */
//     await notifyAdmin(`🆕 *NEW BOOKING REQUEST*\n\n${summaryText}`);

//     console.log("📤 Admin notified:", saved.id);

//     return true;
//   }

//   return false;
// };

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

/* ======================================================
 * SUMMARY FLOW
 * ====================================================== */
module.exports = async function summaryFlow(ctx) {
  const { session: s, interactiveId, from } = ctx;

  if (!s) return false;
  if (s.state !== "BOOKING_REVIEW") return false;
  if (!s.pendingBooking) return false;

  console.log("🧾 summaryFlow hit", {
    state: s.state,
    interactiveId,
  });

  /* ======================================================
   * CONFIRM BOOKING
   * ====================================================== */
  if (interactiveId === "CONFIRM_BOOKING") {
    const pending = s.pendingBooking;

    const booking = {
      ...pending,
      status: "PROCESSING", // Not final confirmed yet
      amount: {
        total: 2, // Placeholder (admin updates later)
      },
      createdAt: Date.now(),
    };

    // 💾 SAVE BOOKING
    const saved = saveBooking(booking);

    /* ===============================
       SESSION MANAGEMENT
    =============================== */

    s.bookingId = saved.id;       // Needed for paymentFlow
    s.state = "BOOKING_SAVED";    // Neutral state
    delete s.pendingBooking;      // Clean pending data

    /* ===============================
       USER SUMMARY
    =============================== */
    const summaryText = buildSummary(saved);
    await sendText(from, summaryText);

    /* ===============================
       ADMIN NOTIFICATION
    =============================== */
    await notifyAdmin(
      `🆕 *NEW BOOKING REQUEST*\n\n${summaryText}`
    );

    console.log("📤 Admin notified:", saved.id);

    return true;
  }

  /* ======================================================
   * EDIT BOOKING
   * ====================================================== */
  if (interactiveId === "EDIT_BOOKING") {
    const type = s.pendingBooking?.type;

    // Reset only booking data
    delete s.pendingBooking;

    // Route back based on type
    if (type === "BUS") {
      s.state = "BUS_FROM";
      await sendText(
        from,
        "🔄 Let's modify your booking.\n\nPlease enter departure city:"
      );
    } else if (type === "TRAIN") {
      s.state = "TRAIN_FROM";
      await sendText(
        from,
        "🔄 Let's modify your booking.\n\nPlease enter departure station:"
      );
    } else {
      s.state = null;
      await sendText(
        from,
        "🔄 Let's start again.\n\nType *BOOK* to begin."
      );
    }

    return true;
  }

  return false;
};