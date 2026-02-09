// const { sendText } = require("./waClient");
// const { findBookingById, updateBooking } = require("./bookingStore");
// const BUS_STATES = require("./flow/domains/bus/manual/states");

// const { parseSeatOptions } = require("./flow/domains/bus/manual/adminParser");
// const sendSeatLayout = require("./flow/domains/bus/manual/seatFlow");

// /* ======================================================
//  * ADMIN CONFIG
//  * ====================================================== */

// const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// // 🔐 Admin-scoped seat image cache
// const adminSeatImages = new Map();

// function normalize(num = "") {
//   return String(num).replace(/\D/g, "");
// }

// if (!RAW_ADMIN) {
//   console.warn("⚠️ ADMIN_PHONE / ADMIN_NUMBER not set in .env");
// }

// /* ======================================================
//  * Admin Command Handler (ROUTER ONLY)
//  * ====================================================== */

// async function handleAdminCommands(ctx) {
//   // console.log("🧪 ADMIN HANDLER INVOKED", {
//   //   hasImage: !!ctx.msg?.image,
//   //   hasText: !!ctx.msg?.text,
//   // });

//   if (!ctx || !ctx.msg) return false;

//   const from = ctx.from;
//   const adminKey = normalize(from);

//   /* =========================
//    * IMAGE HANDLING (SEAT MAP)
//    * ========================= */
//   let hasImage = false;

//   if (ctx.msg?.image) {
//     ctx.session.lastSeatImage = ctx.msg.image.media_id || ctx.msg.image.link;

//     hasImage = true;

//     console.log("🖼️ Seat layout image stored");
//   }

//   // 🔒 Reject non-admins
//   if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
//     return false;
//   }

//   // 🛡️ Only TEXT messages allowed
//   const text = ctx.msg?.text?.body?.trim();

//   // If image only, guide admin
//   if (!text && hasImage) {
//     await sendText(
//       from,
//       "🖼️ Image received.\nNow send *SEAT_OPTIONS* to continue.",
//     );
//     return true;
//   }
//   console.log("🧪 IMAGE CHECK", {
//     inlineImage: !!ctx.msg?.image,
//     cachedImage: adminSeatImages.get(adminKey),
//   });

//   if (!text) return true;

//   console.log("🛂 ADMIN RAW TEXT:", text);

//   const upper = text.toUpperCase();

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
//    * BUS DOMAIN (DELEGATE ONLY)
//    * ========================= */
//   if (/^BUS(_OPTIONS)?/i.test(upper)) {
//     const handleBusAdmin = require("./flow/domains/bus/manual");
//     await handleBusAdmin(ctx, text);
//     return true;
//   }

//   /* =========================
//    * SEAT OPTIONS (ADMIN → USER)
//    * ========================= */
//   if (/^SEAT_OPTIONS/i.test(upper)) {
//     const parsed = parseSeatOptions(text);

//     if (!parsed.ok) {
//       await sendText(from, `❌ ${parsed.error}`);
//       return true;
//     }

//     if (!ctx.session.bookingId || !ctx.session.bookingUser) {
//       await sendText(from, "❌ No active BUS booking to attach seat layout.");
//       return true;
//     }

//     ctx.session.seatMap = parsed.data;
//     ctx.session.state = BUS_STATES.SEAT_LAYOUT_PENDING;

//     console.log("🪑 SEAT OPTIONS ATTACHED", {
//       bookingId: ctx.session.bookingId,
//       seatMap: parsed.data,
//     });

//     const image =
//       ctx.msg?.image?.media_id ||
//       ctx.msg?.image?.link ||
//       adminSeatImages.get(adminKey);

//     if (!image) {
//       await sendText(
//         from,
//         "⚠️ Please send the seat layout *image first*, then send SEAT_OPTIONS.",
//       );
//       return true;
//     }

//     await sendSeatLayout(
//       {
//         session: ctx.session,
//         user: ctx.session.bookingUser,
//       },
//       image,
//     );

//     ctx.session.state = BUS_STATES.SEAT_SELECTION;
//     ctx.session.seatSelectionActive = true;

//     await sendText(from, "✅ Seat layout sent to user.");
//     return true;
//   }

//   /* =========================
//    * COMMAND PARSING
//    * ========================= */
//   const parts = upper.split(/\s+/);
//   const command = parts[0];
//   const bookingId = parts[1];
//   const reason = parts.slice(2).join(" ");

//   console.log("🛂 ADMIN COMMAND:", command, bookingId, reason);

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
//       await sendText(from, "⚠️ Booking is already in PROCESSING state.");
//       return true;
//     }

//     if (command === "CONFIRM" && booking.type === "BUS" && !booking.payment) {
//       await sendText(from, "⚠️ Cannot CONFIRM yet.\nPayment not completed.");
//       return true;
//     }

//     patch.status = BOOKING_COMMANDS[command];

//     if (command === "PROCESS" && booking.type === "BUS") {
//       ctx.session.bookingId = bookingId;
//       ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;
//       ctx.state = ctx.session.state;
//       ctx.session.bookingUser = booking.user;

//       console.log("🧪 ADMIN PROCESS ATTACH:", {
//         bookingId,
//         state: ctx.state,
//       });
//     }
//   }

//   /* =========================
//    * PAYMENT STATUS
//    * ========================= */
//   if (PAYMENT_COMMANDS[command]) {
//     if (!booking.payment) {
//       await sendText(from, "⚠️ Payment not generated yet.");
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

//     patch.status = command === "PAYSUCCESS" ? "CONFIRMED" : "PAYMENT_FAILED";

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
const { findBookingById, updateBooking } = require("./bookingStore");
const BUS_STATES = require("./flow/domains/bus/manual/states");

const { parseSeatOptions } = require("./flow/domains/bus/manual/adminParser");
const sendSeatLayout = require("./flow/domains/bus/manual/seatFlow");

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

  // 🛡️ ensure session always exists
  ctx.session = ctx.session || {};

  const from = ctx.from;

  // 🔒 Reject non-admins
  if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
    return false;
  }

  // 📩 Read text OR image caption
  const text =
    ctx.msg?.text?.body?.trim() ||
    ctx.msg?.image?.caption?.trim();

  /* =========================
   * IMAGE ONLY (NO CAPTION)
   * ========================= */
  if (ctx.msg?.image && !text) {
    await sendText(
      from,
      "⚠️ Please send the seat layout image *with SEAT_OPTIONS as the caption*.",
    );
    return true;
  }

  if (!text) return true;

  const upper = text.toUpperCase();
  console.log("🛂 ADMIN RAW TEXT:", text);

  /* =========================
   * HELP
   * ========================= */
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
        "• HELP",
    );
    return true;
  }

  /* =========================
   * BUS DOMAIN
   * ========================= */
  if (/^BUS(_OPTIONS)?/i.test(upper)) {
    const handleBusAdmin = require("./flow/domains/bus/manual");
    await handleBusAdmin(ctx, text);
    return true;
  }

  /* =========================
   * SEAT OPTIONS
   * ========================= */
  if (/^SEAT[_\s]?OPTIONS/i.test(upper)) {
    if (!ctx.msg?.image) {
      await sendText(
        from,
        "❌ Seat layout image missing.\nSend *SEAT_OPTIONS as the image caption*.",
      );
      return true;
    }

    if (ctx.session.seatSelectionActive) {
      await sendText(
        from,
        "⚠️ Seat selection already active for this booking.",
      );
      return true;
    }

    const parsed = parseSeatOptions(text);
    if (!parsed.ok) {
      await sendText(from, `❌ ${parsed.error}`);
      return true;
    }

    if (!ctx.session.bookingId || !ctx.session.bookingUser) {
      await sendText(
        from,
        "❌ No active BUS booking to attach seat layout.",
      );
      return true;
    }

    const booking = findBookingById(ctx.session.bookingId);
    if (!booking || booking.type !== "BUS") {
      await sendText(
        from,
        "❌ Seat layout is only valid for BUS bookings.",
      );
      return true;
    }

    const image = ctx.msg.image.id || ctx.msg.image.link;

    if (typeof image !== "string") {
      await sendText(
        from,
        "❌ Invalid seat image. Please resend.",
      );
      return true;
    }

    ctx.session.seatMap = parsed.data;
    ctx.session.state = BUS_STATES.SEAT_LAYOUT_PENDING;

    console.log("🪑 SEAT OPTIONS SENT", {
      bookingId: ctx.session.bookingId,
      seatMap: parsed.data,
    });

    // 🖼️ Send image to USER
    await sendSeatLayout(
      {
        session: ctx.session,
        user: ctx.session.bookingUser,
      },
      image,
    );

    // 🪑 Build seat text
    const seatText =
      "🪑 *Available Seats*\n\n" +
      Object.entries(parsed.data)
        .map(
          ([deck, seats]) =>
            `*${deck}*: ${seats.length ? seats.join(", ") : "None"}`
        )
        .join("\n");

    // 📩 Send seat options to USER
    await sendText(ctx.session.bookingUser, seatText);

    // 📩 Confirm to ADMIN
    await sendText(
      from,
      "✅ Seat layout & options sent to user.\n\n" + seatText,
    );

    ctx.session.state = BUS_STATES.SEAT_SELECTION;
    ctx.session.seatSelectionActive = true;

    return true;
  }

  /* =========================
   * COMMAND PARSING
   * ========================= */
  const parts = upper.split(/\s+/);
  const command = parts[0];
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

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
      "⚠️ Unknown admin command.\nSend *HELP* to see valid commands.",
    );
    return true;
  }

  if (!bookingId) {
    await sendText(
      from,
      "⚠️ Booking ID missing.\nExample: CONFIRM QB2026020501",
    );
    return true;
  }

  const booking = findBookingById(bookingId);
  if (!booking) {
    await sendText(from, `❌ Booking not found: ${bookingId}`);
    return true;
  }

  const patch = {};

  /* =========================
   * BOOKING STATUS
   * ========================= */
  if (BOOKING_COMMANDS[command]) {
    if (
      command === "PROCESS" &&
      ctx.session.bookingId === bookingId &&
      ctx.session.state === BUS_STATES.BUS_SEARCH_PENDING
    ) {
      await sendText(
        from,
        "⚠️ Booking already in PROCESSING state.",
      );
      return true;
    }

    if (command === "CONFIRM" && booking.type === "BUS" && !booking.payment) {
      await sendText(
        from,
        "⚠️ Cannot CONFIRM yet.\nPayment not completed.",
      );
      return true;
    }

    patch.status = BOOKING_COMMANDS[command];

    if (command === "PROCESS" && booking.type === "BUS") {
      ctx.session.bookingId = bookingId;
      ctx.session.bookingUser = booking.user;
      ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;
      ctx.state = ctx.session.state;
    }
  }

  /* =========================
   * PAYMENT STATUS
   * ========================= */
  if (PAYMENT_COMMANDS[command]) {
    if (!booking.payment) {
      await sendText(
        from,
        "⚠️ Payment not generated yet.",
      );
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

    if (booking.type === "BUS") {
      ctx.session.state = null;
      ctx.state = null;
      ctx.session.busOptions = null;
      ctx.session.selectedBus = null;
    }
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
        patch.payment?.status || booking.payment?.status || "N/A"
      }`,
  );

  return true;
}

module.exports = { handleAdminCommands };
