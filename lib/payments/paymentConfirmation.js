// const { sendText } = require("../waClient");
// const { findBookingById, updateBooking } = require("../bookingStore");
// const { markPaymentSuccess, markPaymentFailed } = require("../payments");

// function normalize(num = "") {
//   return String(num).replace(/\D/g, "");
// }

// /* ======================================================
//  * HANDLE SCREENSHOT RECEIVED (NO BAILEYS)
//  * ====================================================== */

// async function handleScreenshot(ctx, booking) {
//   try {
//     if (!booking) return false;

//     if (
//       booking.status !== "PAYMENT_PENDING" &&
//       booking.status !== "AWAITING_MANUAL_VERIFICATION"
//     ) {
//       return false;
//     }

//     if (booking.payment?.screenshotReceived) return true;

//     // ✅ Cloud API image detection
//     if (ctx.msg?.type !== "image" || !ctx.msg?.image?.id) {
//       return false;
//     }

//     const mediaId = ctx.msg.image.id;

//     /* ===============================
//        Update Booking
//     =============================== */

//     updateBooking(booking.id, {
//       status: "AWAITING_MANUAL_VERIFICATION",
//       payment: {
//         ...booking.payment,
//         screenshotReceived: true,
//       },
//       meta: {
//         ...(booking.meta || {}),
//         screenshotReceivedAt: Date.now(),
//       },
//     });

//     /* ===============================
//        Notify User
//     =============================== */

//     if (booking.user) {
//       await sendText(
//         booking.user,
// `📸 *Screenshot Received*

// 🧾 Booking ID: *${booking.id}*

// ⏳ Your payment is under manual verification.
// You will be notified once confirmed.

// — *Team Quickets*`
//       );
//     }

//     /* ===============================
//        Send SAME Screenshot to Admin
//     =============================== */

//     const ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

//     if (ADMIN) {
//       const { sendImage } = require("../waClient");

//       await sendImage(
//         ADMIN,
//         mediaId, // 🔥 reuse original media ID
//         `📥 *Payment Screenshot Received*

// 🧾 Booking ID: *${booking.id}*
// 💰 Amount: ₹${booking.payment?.amount?.total || "N/A"}
// 👤 User: ${booking.user}

// Status: AWAITING_MANUAL_VERIFICATION`
//       );
//     }

//     return true;
//   } catch (err) {
//     console.error("❌ Screenshot handling failed", err);
//     return false;
//   }
// }

// /* ======================================================
//  * ADMIN: PAYMENT RECEIVED
//  * ====================================================== */

// async function handleAdminPaymentReceived(from, bookingId) {
//   const booking = await findBookingById(bookingId);
//   if (!booking) return { error: "Booking not found." };

//   if (booking.status === "CONFIRMED") {
//     return { error: "Booking already confirmed." };
//   }

//   if (!booking.payment?.screenshotReceived && !booking.payment?.utr) {
//     return { error: "No payment proof received." };
//   }

//   markPaymentSuccess(booking);

//   updateBooking(bookingId, {
//     payment: booking.payment,
//     status: "CONFIRMED",
//     meta: {
//       ...(booking.meta || {}),
//       manuallyVerifiedAt: Date.now(),
//       manuallyVerifiedBy: normalize(from),
//     },
//   });

//   if (booking.user) {
//     await sendText(
//       booking.user,
// `💳 *Payment Verified Successfully!*

// 🧾 Booking ID: *${bookingId}*

// 🎟️ Your ticket is being processed.

// — *Team Quickets*`
//     );
//   }

//   return { success: true };
// }

// /* ======================================================
//  * ADMIN: PAYMENT FAILED
//  * ====================================================== */

// async function handleAdminPaymentFailed(from, bookingId, reason) {
//   const booking = await findBookingById(bookingId);
//   if (!booking) return { error: "Booking not found." };

//   markPaymentFailed(booking);

//   updateBooking(bookingId, {
//     payment: booking.payment,
//     status: "PAYMENT_FAILED",
//     meta: {
//       ...(booking.meta || {}),
//       paymentFailureReason: reason || "Manual rejection",
//       manuallyVerifiedBy: normalize(from),
//       manuallyVerifiedAt: Date.now(),
//     },
//   });

//   if (booking.user) {
//     await sendText(
//       booking.user,
// `❌ *Payment Verification Failed*

// 🧾 Booking ID: *${bookingId}*
// ${reason ? `Reason: ${reason}\n` : ""}

// Please contact support.

// — *Team Quickets*`
//     );
//   }

//   return { success: true };
// }

// module.exports = {
//   handleScreenshot,
//   handleAdminPaymentReceived,
//   handleAdminPaymentFailed,
// };

const { sendText } = require("../waClient");
const { findBookingById, updateBooking } = require("../bookingStore");
const { markPaymentSuccess, markPaymentFailed } = require("../payments");

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

/* ======================================================
   RESOLVE USER PHONE (BUS + TRAIN QUICKBOOK + SEARCH)
====================================================== */

function getUserPhone(booking) {
  if (!booking) return null;

  if (booking.type === "TRAIN") {
    return booking.quickMode ? booking.user : booking.phone;
  }

  if (booking.type === "BUS") {
    return booking.user;
  }

  return booking.phone || booking.user || booking.contactPhone;
}

/* ======================================================
   HANDLE SCREENSHOT RECEIVED
====================================================== */

async function handleScreenshot(ctx, booking) {
  try {
    if (!booking) return false;

    if (
      booking.status !== "PAYMENT_PENDING" &&
      booking.status !== "AWAITING_MANUAL_VERIFICATION"
    ) {
      return false;
    }

    if (booking.payment?.screenshotReceived) return true;

    if (ctx.msg?.type !== "image" || !ctx.msg?.image?.id) {
      return false;
    }

    const mediaId = ctx.msg.image.id;
    const userPhone = getUserPhone(booking);

    /* ===============================
       Update Booking
    =============================== */

    updateBooking(booking.id, {
      status: "AWAITING_MANUAL_VERIFICATION",
      payment: {
        ...booking.payment,
        screenshotReceived: true,
      },
      meta: {
        ...(booking.meta || {}),
        screenshotReceivedAt: Date.now(),
      },
    });

    /* ===============================
       Notify User
    =============================== */

    if (userPhone) {
      await sendText(
        userPhone,
`📸 *Screenshot Received*

🧾 Booking ID: *${booking.id}*

⏳ Your payment is under manual verification.
You will be notified once confirmed.

— *Team Quickets*`
      );
    }

    /* ===============================
       Send Screenshot to Admin
    =============================== */

    const ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

    if (ADMIN) {
      const { sendImage } = require("../waClient");

      await sendImage(
        ADMIN,
        mediaId,
`📥 *Payment Screenshot Received*

🧾 Booking ID: *${booking.id}*
💰 Amount: ₹${booking.payment?.amount?.total || "N/A"}
👤 User: ${userPhone}

Status: AWAITING_MANUAL_VERIFICATION`
      );
    }

    return true;

  } catch (err) {
    console.error("❌ Screenshot handling failed", err);
    return false;
  }
}

/* ======================================================
   ADMIN: PAYMENT RECEIVED
====================================================== */

async function handleAdminPaymentReceived(from, bookingId) {
  const booking = await findBookingById(bookingId);
  if (!booking) return { error: "Booking not found." };

  if (booking.status === "CONFIRMED") {
    return { error: "Booking already confirmed." };
  }

  if (!booking.payment?.screenshotReceived && !booking.payment?.utr) {
    return { error: "No payment proof received." };
  }

  const userPhone = getUserPhone(booking);

  markPaymentSuccess(booking);

  updateBooking(bookingId, {
    payment: booking.payment,
    status: "CONFIRMED",
    meta: {
      ...(booking.meta || {}),
      manuallyVerifiedAt: Date.now(),
      manuallyVerifiedBy: normalize(from),
    },
  });

  if (userPhone) {
    await sendText(
      userPhone,
`💳 *Payment Verified Successfully!*

🧾 Booking ID: *${bookingId}*

🎟️ Your ticket is being processed.

— *Team Quickets*`
    );
  }

  return { success: true };
}

/* ======================================================
   ADMIN: PAYMENT FAILED
====================================================== */

async function handleAdminPaymentFailed(from, bookingId, reason) {
  const booking = await findBookingById(bookingId);
  if (!booking) return { error: "Booking not found." };

  const userPhone = getUserPhone(booking);

  markPaymentFailed(booking);

  updateBooking(bookingId, {
    payment: booking.payment,
    status: "PAYMENT_FAILED",
    meta: {
      ...(booking.meta || {}),
      paymentFailureReason: reason || "Manual rejection",
      manuallyVerifiedBy: normalize(from),
      manuallyVerifiedAt: Date.now(),
    },
  });

  if (userPhone) {
    await sendText(
      userPhone,
`❌ *Payment Verification Failed*

🧾 Booking ID: *${bookingId}*
${reason ? `Reason: ${reason}\n` : ""}

Please contact support.

— *Team Quickets*`
    );
  }

  return { success: true };
}

module.exports = {
  handleScreenshot,
  handleAdminPaymentReceived,
  handleAdminPaymentFailed,
};