// // lib/adminCommand.js
// const { sendText } = require("./waClient");
// const { findBookingById, updateBooking } = require("./bookingStore");
// const { parseBusOptions } = require("./flow/domains/bus/manual/adminParser");
// const { sendBusOptions } = require("./flow/domains/bus/manual/busOptions");

// /* ======================================================
//  * ADMIN CONFIG (Cloud API SAFE)
//  * ====================================================== */

// const RAW_ADMIN =
//   process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// function normalize(num = "") {
//   return String(num).replace(/\D/g, "");
// }

// if (!RAW_ADMIN) {
//   console.warn("⚠️ ADMIN_PHONE / ADMIN_NUMBER not set in .env");
// }

// /* ======================================================
//  * Admin Command Handler
//  * ====================================================== */

// async function handleAdminCommands(ctx) {
//   const from = ctx.from;

//   // 🔒 Reject non-admins
//   if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
//     return false;
//   }

//   // 🛡️ Only TEXT messages allowed
//   const text = ctx.msg?.text?.body?.trim();
//   if (!text) return true; // admin message handled, but nothing to do

//   console.log("🛂 ADMIN RAW TEXT:", text);

//   const upper = text.toUpperCase();

//   /* ======================================================
//    * HELP
//    * ====================================================== */
//   if (upper === "HELP") {
//     await sendText(
//       from,
//       "🛂 *Quickets Admin Commands*\n\n" +
//         "📦 *Booking*\n" +
//         "• PROCESS <BOOKING_ID>\n" +
//         "• CONFIRM <BOOKING_ID>\n" +
//         "• FAIL <BOOKING_ID> <reason>\n" +
//         "• CANCEL <BOOKING_ID> <reason>\n\n" +
//         "💳 *Payment (Manual)*\n" +
//         "• PAYSUCCESS <BOOKING_ID>\n" +
//         "• PAYFAIL <BOOKING_ID> <reason>\n" +
//         "• PAYCANCEL <BOOKING_ID> <reason>\n\n" +
//         "🚌 *Bus Manual Flow*\n" +
//         "• BUS / BUS_OPTIONS\n\n" +
//         "ℹ️ *Utility*\n" +
//         "• HELP"
//     );
//     return true;
//   }

//   /* ======================================================
//    * MANUAL BUS OPTIONS
//    * ====================================================== */
//   if (/^BUS(_OPTIONS)?/i.test(upper)) {
//     const parsed = parseBusOptions(text);

//     if (!parsed.ok) {
//       await sendText(from, `❌ ${parsed.error}`);
//       return true;
//     }

//     const store = require("./bookingStore")._store || {};
//     const booking = Object.values(store)
//       .reverse()
//       .find(
//         (b) => b.type === "BUS" && b.status === "PROCESSING"
//       );

//     if (!booking) {
//       await sendText(
//         from,
//         "❌ No active BUS booking waiting for options."
//       );
//       return true;
//     }

//     booking.busOptions = parsed.data;
//     booking.status = "BUS_OPTIONS_SENT";

//     await sendBusOptions({
//       session: { busOptions: parsed.data },
//       user: booking.user,
//     });

//     await sendText(from, "✅ Bus options sent to user.");
//     return true;
//   }

//   /* ======================================================
//    * COMMAND PARSING
//    * ====================================================== */
//   const parts = upper.split(/\s+/);
//   const command = parts[0];
//   const bookingId = parts[1];
//   const reason = parts.slice(2).join(" ");

//   console.log("🛂 ADMIN COMMAND:", command, bookingId, reason);

//   /* ======================================================
//    * COMMAND MAPS
//    * ====================================================== */
//   const BOOKING_COMMANDS = {
//     PROCESS: "PROCESSING",
//     CONFIRM: "CONFIRMED",
//     FAIL: "FAILED",
//     CANCEL: "CANCELLED",
//   };

//   const PAYMENT_COMMANDS = {
//     PAYSUCCESS: "SUCCESS",
//     PAYFAIL: "FAILED",
//     PAYCANCEL: "CANCELLED",
//   };

//   /* ======================================================
//    * UNKNOWN COMMAND
//    * ====================================================== */
//   if (!BOOKING_COMMANDS[command] && !PAYMENT_COMMANDS[command]) {
//     await sendText(
//       from,
//       "⚠️ Unknown admin command.\nSend *HELP* to see valid commands."
//     );
//     return true;
//   }

//   if (!bookingId) {
//     await sendText(
//       from,
//       "⚠️ Booking ID missing.\nExample: CONFIRM QB2026020501"
//     );
//     return true;
//   }

//   const booking = findBookingById(bookingId);
//   if (!booking) {
//     await sendText(from, `❌ Booking not found: ${bookingId}`);
//     return true;
//   }

//   const patch = {};

//   /* ======================================================
//    * BOOKING STATUS UPDATE
//    * ====================================================== */
//   if (BOOKING_COMMANDS[command]) {
//     patch.status = BOOKING_COMMANDS[command];
//   }

//   /* ======================================================
//    * PAYMENT STATUS UPDATE
//    * ====================================================== */
//   if (PAYMENT_COMMANDS[command]) {
//     if (!booking.payment) {
//       await sendText(
//         from,
//         "⚠️ Payment not generated yet."
//       );
//       return true;
//     }

//     patch.payment = {
//       ...booking.payment,
//       status: PAYMENT_COMMANDS[command],
//       timestamps: {
//         ...(booking.payment.timestamps || {}),
//         ...(command === "PAYSUCCESS" && {
//           paidAt: Date.now(),
//         }),
//         ...(command === "PAYFAIL" && {
//           failedAt: Date.now(),
//         }),
//       },
//     };

//     patch.status =
//       command === "PAYSUCCESS"
//         ? "CONFIRMED"
//         : "PAYMENT_FAILED";
//   }

//   if (reason) {
//     patch.meta = {
//       ...(booking.meta || {}),
//       reason,
//     };
//   }

//   updateBooking(bookingId, patch);

//   await sendText(
//     from,
//     `✅ Update successful\n\n` +
//       `🆔 ${bookingId}\n` +
//       `📦 Status: ${patch.status || booking.status}\n` +
//       `💳 Payment: ${
//         patch.payment?.status ||
//         booking.payment?.status ||
//         "N/A"
//       }`
//   );

//   return true;
// }

// module.exports = { handleAdminCommands };

// //Flow completed


const { sendText } = require("./waClient");
const { findBookingById, updateBooking } = require("./bookingStore");

/* ======================================================
 * ADMIN CONFIG
 * ====================================================== */

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

if (!RAW_ADMIN) {
  console.warn("⚠️ ADMIN_PHONE / ADMIN_NUMBER not set in .env");
}

/* ======================================================
 * Admin Command Handler (ROUTER ONLY)
 * ====================================================== */

async function handleAdminCommands(ctx) {
  const from = ctx.from;

  // 🔒 Reject non-admins
  if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
    return false;
  }

  // 🛡️ Only TEXT messages allowed
  const text = ctx.msg?.text?.body?.trim();
  if (!text) return true;

  console.log("🛂 ADMIN RAW TEXT:", text);

  const upper = text.toUpperCase();

  /* ======================================================
   * HELP
   * ====================================================== */
  if (upper === "HELP") {
    await sendText(
      from,
      "🛂 *Quickets Admin Commands*\n\n" +
        "📦 *Booking*\n" +
        "• PROCESS <BOOKING_ID>\n" +
        "• CONFIRM <BOOKING_ID>\n" +
        "• FAIL <BOOKING_ID> <reason>\n" +
        "• CANCEL <BOOKING_ID> <reason>\n\n" +
        "💳 *Payment*\n" +
        "• PAYSUCCESS <BOOKING_ID>\n" +
        "• PAYFAIL <BOOKING_ID> <reason>\n" +
        "• PAYCANCEL <BOOKING_ID> <reason>\n\n" +
        "🚌 *Bus Manual Flow*\n" +
        "• BUS / BUS_OPTIONS\n\n" +
        "ℹ️ *Utility*\n" +
        "• HELP"
    );
    return true;
  }

  /* ======================================================
   * BUS DOMAIN (DELEGATE ONLY)
   * ====================================================== */
  if (/^BUS(_OPTIONS)?/i.test(upper)) {
    const handleBusAdmin = require("./flow/domains/bus/manual");
    await handleBusAdmin(ctx, text);
    return true;
  }

  /* ======================================================
   * GENERIC COMMAND PARSING
   * ====================================================== */
  const parts = upper.split(/\s+/);
  const command = parts[0];
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

  console.log("🛂 ADMIN COMMAND:", command, bookingId, reason);

  const BOOKING_COMMANDS = {
    PROCESS: "PROCESSING",
    CONFIRM: "CONFIRMED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  };

  const PAYMENT_COMMANDS = {
    PAYSUCCESS: "SUCCESS",
    PAYFAIL: "FAILED",
    PAYCANCEL: "CANCELLED",
  };

  if (!BOOKING_COMMANDS[command] && !PAYMENT_COMMANDS[command]) {
    await sendText(
      from,
      "⚠️ Unknown admin command.\nSend *HELP* to see valid commands."
    );
    return true;
  }

  if (!bookingId) {
    await sendText(
      from,
      "⚠️ Booking ID missing.\nExample: CONFIRM QB2026020501"
    );
    return true;
  }

  const booking = findBookingById(bookingId);
  if (!booking) {
    await sendText(from, `❌ Booking not found: ${bookingId}`);
    return true;
  }

  const patch = {};

  /* ======================================================
   * BOOKING STATUS
   * ====================================================== */
  if (BOOKING_COMMANDS[command]) {
    patch.status = BOOKING_COMMANDS[command];
  }

  /* ======================================================
   * PAYMENT STATUS
   * ====================================================== */
  if (PAYMENT_COMMANDS[command]) {
    if (!booking.payment) {
      await sendText(from, "⚠️ Payment not generated yet.");
      return true;
    }

    patch.payment = {
      ...booking.payment,
      status: PAYMENT_COMMANDS[command],
      timestamps: {
        ...(booking.payment.timestamps || {}),
        ...(command === "PAYSUCCESS" && { paidAt: Date.now() }),
        ...(command === "PAYFAIL" && { failedAt: Date.now() }),
      },
    };

    patch.status =
      command === "PAYSUCCESS"
        ? "CONFIRMED"
        : "PAYMENT_FAILED";
  }

  if (reason) {
    patch.meta = {
      ...(booking.meta || {}),
      reason,
    };
  }

  updateBooking(bookingId, patch);

  await sendText(
    from,
    `✅ Update successful\n\n` +
      `🆔 ${bookingId}\n` +
      `📦 Status: ${patch.status || booking.status}\n` +
      `💳 Payment: ${
        patch.payment?.status ||
        booking.payment?.status ||
        "N/A"
      }`
  );

  return true;
}

module.exports = { handleAdminCommands };
