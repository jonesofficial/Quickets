// const { sendText } = require("./waClient");
// const { findBookingById, updateBooking } = require("./bookingStore");
// const BUS_STATES = require("./flow/domains/bus/manual/states");

// const { parseSeatOptions } = require("./flow/domains/bus/manual/adminParser");
// const sendSeatLayout = require("./flow/domains/bus/manual/seatFlow");

// /* ======================================================
//  * ADMIN CONFIG
//  * ====================================================== */

// const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

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
//   if (!ctx || !ctx.msg) return false;

//   // 🛡️ ensure session always exists
//   ctx.session = ctx.session || {};

//   const from = ctx.from;

//   // 🔒 Reject non-admins
//   if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
//     return false;
//   }

//   // 📩 Read text OR image caption
//   const text =
//     ctx.msg?.text?.body?.trim() ||
//     ctx.msg?.image?.caption?.trim();

//   /* =========================
//    * IMAGE ONLY (NO CAPTION)
//    * ========================= */
//   if (ctx.msg?.image && !text) {
//     await sendText(
//       from,
//       "⚠️ Please send the seat layout image *with SEAT_OPTIONS as the caption*.",
//     );
//     return true;
//   }

//   if (!text) return true;

//   const upper = text.toUpperCase();
//   console.log("🛂 ADMIN RAW TEXT:", text);

//   /* =========================
//    * HELP
//    * ========================= */
//   if (upper === "HELP") {
//     await sendText(
//       from,
//       "🛂 *Quickets Admin Commands*\n\n" +
//         "📦 *Booking*\n" +
//         "• PROCESS <BOOKING_ID>\n" +
//         "• CONFIRM <BOOKING_ID>\n" +
//         "• FAIL <BOOKING_ID> <reason>\n" +
//         "• CANCEL <BOOKING_ID> <reason>\n\n" +
//         "💳 *Payment*\n" +
//         "• PAYSUCCESS <BOOKING_ID>\n" +
//         "• PAYFAIL <BOOKING_ID> <reason>\n" +
//         "• PAYCANCEL <BOOKING_ID> <reason>\n\n" +
//         "🚌 *Bus Manual Flow*\n" +
//         "• BUS / BUS_OPTIONS\n\n" +
//         "ℹ️ *Utility*\n" +
//         "• HELP",
//     );
//     return true;
//   }

//   /* =========================
//    * BUS DOMAIN
//    * ========================= */
//   if (/^BUS(_OPTIONS)?/i.test(upper)) {
//     const handleBusAdmin = require("./flow/domains/bus/manual");
//     await handleBusAdmin(ctx, text);
//     return true;
//   }

//   /* =========================
//    * SEAT OPTIONS
//    * ========================= */
//   if (/^SEAT[_\s]?OPTIONS/i.test(upper)) {
//     if (!ctx.msg?.image) {
//       await sendText(
//         from,
//         "❌ Seat layout image missing.\nSend *SEAT_OPTIONS as the image caption*.",
//       );
//       return true;
//     }

//     if (ctx.session.seatSelectionActive) {
//       await sendText(
//         from,
//         "⚠️ Seat selection already active for this booking.",
//       );
//       return true;
//     }

//     const parsed = parseSeatOptions(text);
//     if (!parsed.ok) {
//       await sendText(from, `❌ ${parsed.error}`);
//       return true;
//     }

//     if (!ctx.session.bookingId || !ctx.session.bookingUser) {
//       await sendText(
//         from,
//         "❌ No active BUS booking to attach seat layout.",
//       );
//       return true;
//     }

//     const booking = findBookingById(ctx.session.bookingId);
//     if (!booking || booking.type !== "BUS") {
//       await sendText(
//         from,
//         "❌ Seat layout is only valid for BUS bookings.",
//       );
//       return true;
//     }

//     const image = ctx.msg.image.id || ctx.msg.image.link;

//     if (typeof image !== "string") {
//       await sendText(
//         from,
//         "❌ Invalid seat image. Please resend.",
//       );
//       return true;
//     }

//     ctx.session.seatMap = parsed.data;
//     ctx.session.state = BUS_STATES.SEAT_LAYOUT_PENDING;

//     console.log("🪑 SEAT OPTIONS SENT", {
//       bookingId: ctx.session.bookingId,
//       seatMap: parsed.data,
//     });

//     // 🖼️ Send image to USER
//     await sendSeatLayout(
//       {
//         session: ctx.session,
//         user: ctx.session.bookingUser,
//       },
//       image,
//     );

//     // 🪑 Build seat text
//     const seatText =
//       "🪑 *Available Seats*\n\n" +
//       Object.entries(parsed.data)
//         .map(
//           ([deck, seats]) =>
//             `*${deck}*: ${seats.length ? seats.join(", ") : "None"}`
//         )
//         .join("\n");

//     // 📩 Send seat options to USER
//     await sendText(ctx.session.bookingUser, seatText);

//     // 📩 Confirm to ADMIN
//     await sendText(
//       from,
//       "✅ Seat layout & options sent to user.\n\n" + seatText,
//     );

//     ctx.session.state = BUS_STATES.SEAT_SELECTION;
//     ctx.session.seatSelectionActive = true;

//     return true;
//   }

//   /* =========================
//    * COMMAND PARSING
//    * ========================= */
//   const parts = upper.split(/\s+/);
//   const command = parts[0];
//   const bookingId = parts[1];
//   const reason = parts.slice(2).join(" ");

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

//   if (!BOOKING_COMMANDS[command] && !PAYMENT_COMMANDS[command]) {
//     await sendText(
//       from,
//       "⚠️ Unknown admin command.\nSend *HELP* to see valid commands.",
//     );
//     return true;
//   }

//   if (!bookingId) {
//     await sendText(
//       from,
//       "⚠️ Booking ID missing.\nExample: CONFIRM QB2026020501",
//     );
//     return true;
//   }

//   const booking = findBookingById(bookingId);
//   if (!booking) {
//     await sendText(from, `❌ Booking not found: ${bookingId}`);
//     return true;
//   }

//   const patch = {};

//   /* =========================
//    * BOOKING STATUS
//    * ========================= */
//   if (BOOKING_COMMANDS[command]) {
//     if (
//       command === "PROCESS" &&
//       ctx.session.bookingId === bookingId &&
//       ctx.session.state === BUS_STATES.BUS_SEARCH_PENDING
//     ) {
//       await sendText(
//         from,
//         "⚠️ Booking already in PROCESSING state.",
//       );
//       return true;
//     }

//     if (command === "CONFIRM" && booking.type === "BUS" && !booking.payment) {
//       await sendText(
//         from,
//         "⚠️ Cannot CONFIRM yet.\nPayment not completed.",
//       );
//       return true;
//     }

//     patch.status = BOOKING_COMMANDS[command];

//     if (command === "PROCESS" && booking.type === "BUS") {
//       ctx.session.bookingId = bookingId;
//       ctx.session.bookingUser = booking.user;
//       ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;
//       ctx.state = ctx.session.state;
//     }
//   }

//   /* =========================
//    * PAYMENT STATUS
//    * ========================= */
//   if (PAYMENT_COMMANDS[command]) {
//     if (!booking.payment) {
//       await sendText(
//         from,
//         "⚠️ Payment not generated yet.",
//       );
//       return true;
//     }

//     patch.payment = {
//       ...booking.payment,
//       status: PAYMENT_COMMANDS[command],
//       timestamps: {
//         ...(booking.payment.timestamps || {}),
//         ...(command === "PAYSUCCESS" && { paidAt: Date.now() }),
//         ...(command === "PAYFAIL" && { failedAt: Date.now() }),
//       },
//     };

//     patch.status =
//       command === "PAYSUCCESS"
//         ? "CONFIRMED"
//         : "PAYMENT_FAILED";

//     if (booking.type === "BUS") {
//       ctx.session.state = null;
//       ctx.state = null;
//       ctx.session.busOptions = null;
//       ctx.session.selectedBus = null;
//     }
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
//         patch.payment?.status || booking.payment?.status || "N/A"
//       }`,
//   );

//   return true;
// }

// module.exports = { handleAdminCommands };
const { sendText } = require("./waClient");
const {
  findBookingById,
  updateBooking,
  getAdminStats,
} = require("./bookingStore");

const BUS_STATES = require("./flow/domains/bus/manual/states");
const handleBusAdmin = require("./flow/domains/bus/manual");
const {
  handleAdminSeatSender,
} = require("./flow/domains/bus/manual/adminSeatSender");

/* ======================================================
 * ADMIN CONFIG
 * ====================================================== */

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

if (!RAW_ADMIN) {
  console.warn("⚠️ ADMIN_PHONE / ADMIN_NUMBER not set in .env");
}

/* ======================================================
 * Admin Command Handler
 * ====================================================== */

async function handleAdminCommands(ctx) {
  if (!ctx || !ctx.msg) return false;

  ctx.session = ctx.session || {};
  ctx.sendText = sendText;

  const from = ctx.from;

  if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
    return false;
  }

  const text =
    ctx.msg?.text?.body?.trim() ||
    ctx.msg?.image?.caption?.trim();

  if (!text) return true;

  const upper = text.toUpperCase();
  console.log("🛂 ADMIN RAW TEXT:", text);

  /* ======================================================
   * SEAT OPTIONS
   * ====================================================== */
  if (/^SEAT[_\s]?OPTIONS/i.test(upper)) {
    return await handleAdminSeatSender(ctx, text);
  }

  /* ======================================================
   * BUS MANUAL FLOW
   * ====================================================== */
  if (/^BUS(_OPTIONS)?/i.test(upper)) {
    await handleBusAdmin(ctx, text);
    return true;
  }

  /* ======================================================
   * CURRENT ACTIVE BOOKING (NEW - SAFE ADD)
   * ====================================================== */
  if (upper === "CURRENT") {
    if (!ctx.session.bookingId) {
      await sendText(from, "📭 No active booking.");
    } else {
      await sendText(
        from,
        `📌 *Current Active Booking*\n\n🆔 ${ctx.session.bookingId}`
      );
    }
    return true;
  }

  /* ======================================================
   * HELP
   * ====================================================== */
  if (upper === "HELP") {
    await sendText(
      from,
      "🛂 *Quickets Admin Commands*\n\n" +
        "📦 *Booking*\n" +
        "• PROCESS <BOOKING_ID>\n" +
        "• PAUSE <BOOKING_ID>\n" +
        "• RESUME <BOOKING_ID>\n" +
        "• CONFIRM <BOOKING_ID>\n" +
        "• FAIL <BOOKING_ID> <reason>\n" +
        "• CANCEL <BOOKING_ID> <reason>\n\n" +
        "💳 *Payment*\n" +
        "• PAYSUCCESS <BOOKING_ID>\n" +
        "• PAYFAIL <BOOKING_ID> <reason>\n" +
        "• PAYCANCEL <BOOKING_ID> <reason>\n\n" +
        "🚌 *Bus Manual Flow*\n" +
        "• BUS / BUS_OPTIONS\n" +
        "• SEAT_OPTIONS\n"
    );
    return true;
  }

  /* ======================================================
   * PARSE COMMAND
   * ====================================================== */

  const parts = upper.split(/\s+/);
  const command = parts[0];
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

  const BOOKING_COMMANDS = {
    PROCESS: "PROCESSING",
    CONFIRM: "CONFIRMED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
    PAUSE: "PAUSED",       // NEW
    RESUME: "PROCESSING",  // NEW
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
      "⚠️ Booking ID missing.\nExample: CONFIRM QB2026021201"
    );
    return true;
  }

  const booking = findBookingById(bookingId);

  if (!booking) {
    await sendText(from, `❌ Booking not found: ${bookingId}`);
    return true;
  }

  if (booking.type !== "BUS") {
    await sendText(
      from,
      "⚠️ This system currently supports BUS bookings only."
    );
    return true;
  }

  /* ======================================================
   * PROCESS (UNCHANGED)
   * ====================================================== */

  if (command === "PROCESS") {
    if (ctx.session.bookingId) {
      await sendText(
        from,
        `⚠️ Cannot process new booking.\n\n` +
          `📌 Active Booking: ${ctx.session.bookingId}\n\n` +
          `Finish or cancel it first.`
      );
      return true;
    }

    ctx.session.bookingId = bookingId;
    ctx.session.bookingUser = booking.user;
    ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;

    updateBooking(bookingId, { status: "PROCESSING" });

    if (booking.user) {
      await sendText(
        booking.user,
        `🕒 *Booking Update*\n\n` +
          `Our team has reviewed your booking request.\n\n` +
          `We are now processing your booking.\n` +
          `⏳ Estimated time: up to 10 minutes.\n\n` +
          `You will receive further updates shortly.\n\n` +
          `— *Team Quickets*`
      );
    }

    await sendText(
      from,
      `✅ Booking Activated\n\n🆔 ${bookingId}\n👤 User notified: Yes`
    );

    return true;
  }

  /* ======================================================
   * STRICT ACTIVE BOOKING CHECK
   * ====================================================== */

  if (!ctx.session.bookingId) {
    await sendText(
      from,
      "⚠️ No active booking.\nUse PROCESS <BOOKING_ID> first."
    );
    return true;
  }

  if (bookingId !== ctx.session.bookingId) {
    await sendText(
      from,
      `❌ Booking mismatch.\n\n` +
        `📌 Active Booking: ${ctx.session.bookingId}\n` +
        `❌ You sent: ${bookingId}\n\n` +
        `Finish or cancel the active booking first.`
    );
    return true;
  }

  const patch = {};

  /* ======================================================
   * PAUSE (NEW - SAFE ADD)
   * ====================================================== */

  if (command === "PAUSE") {
    patch.status = "PAUSED";

    if (booking.user) {
      await sendText(
        booking.user,
        `⏸ *Booking Paused*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n\n` +
          `Your booking has been paused due to no response.\n\n` +
          `Reply anytime to resume.\n\n` +
          `— *Team Quickets*`
      );
    }

    ctx.session.bookingId = null;
    ctx.session.bookingUser = null;
    ctx.session.state = null;
  }

  /* ======================================================
   * RESUME (NEW - SAFE ADD)
   * ====================================================== */

  if (command === "RESUME") {
    if (booking.status !== "PAUSED") {
      await sendText(
        from,
        "⚠️ Only paused bookings can be resumed."
      );
      return true;
    }

    patch.status = "PROCESSING";

    if (booking.user) {
      await sendText(
        booking.user,
        `▶️ *Booking Resumed*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n\n` +
          `We have resumed processing your booking.\n\n` +
          `— *Team Quickets*`
      );
    }
  }

  /* ======================================================
   * BOOKING STATUS COMMANDS (UNCHANGED)
   * ====================================================== */

  if (["CONFIRM", "FAIL", "CANCEL"].includes(command)) {
    patch.status = BOOKING_COMMANDS[command];

    if (command === "CONFIRM" && booking.user) {
      await sendText(
        booking.user,
        `🎉 *Booking Confirmed!*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n\n` +
          `Thank you for choosing Quickets.\n\n` +
          `— *Team Quickets*`
      );
    }

    if (command === "FAIL" && booking.user) {
      await sendText(
        booking.user,
        `❌ *Booking Update*\n\n` +
          `${reason ? `Reason: ${reason}\n\n` : ""}` +
          `Please try again.\n\n— *Team Quickets*`
      );
    }

    if (command === "CANCEL" && booking.user) {
      await sendText(
        booking.user,
        `🚫 *Booking Cancelled*\n\n` +
          `${reason ? `Reason: ${reason}\n\n` : ""}` +
          `— *Team Quickets*`
      );
    }

    ctx.session.bookingId = null;
    ctx.session.bookingUser = null;
    ctx.session.state = null;
  }

  /* ======================================================
   * PAYMENT COMMANDS (UNCHANGED)
   * ====================================================== */

  if (PAYMENT_COMMANDS[command]) {
    if (!booking.payment) {
      await sendText(from, "⚠️ Payment not generated yet.");
      return true;
    }

    patch.payment = {
      ...booking.payment,
      status: PAYMENT_COMMANDS[command],
    };

    patch.status =
      command === "PAYSUCCESS" ? "CONFIRMED" : "PAYMENT_FAILED";

    if (command === "PAYSUCCESS" && booking.user) {
      await sendText(
        booking.user,
        `💳 *Payment Successful!*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n\n` +
          `Your booking is now confirmed.\n\n` +
          `— *Team Quickets*`
      );
    }

    ctx.session.bookingId = null;
    ctx.session.bookingUser = null;
    ctx.session.state = null;
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
    `✅ Update successful\n\n🆔 ${bookingId}\n📦 Status: ${patch.status || booking.status}`
  );

  const stats = getAdminStats();

  await sendText(
    from,
    "📊 *Admin Status*\n\n" +
      `🕒 Pending Bus: ${stats.pendingBus}\n` +
      `💳 Payment Pending: ${stats.paymentPending}\n` +
      `✅ Confirmed: ${stats.confirmed}\n` +
      `❌ Failed: ${stats.failed}\n` +
      `🚫 Cancelled: ${stats.cancelled}`
  );

  return true;
}

module.exports = { handleAdminCommands };
