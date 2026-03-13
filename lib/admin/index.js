// const { sendText } = require("../waClient");

// /* =========================
//    ADMIN COMMAND HANDLERS
// ========================= */
// const handleBookingCommands = require("./commands/bookings");
// const handlePaymentCommands = require("./commands/payments");
// const handleTicketCommands = require("./commands/tickets");
// const handleFareCommands = require("./commands/fares");
// const handleReplyCommands = require("./commands/reply");

// /* =========================
//    BUS FLO
// ========================= */
// const handleBusAdmin = require("../flow/domains/bus/manual");

// const {
//   handleAdminSeatSender,
// } = require("../flow/domains/bus/manual/adminSeatSender");

// const {
//   handleBoardingPoints,
//   handleDroppingPoints,
// } = require("../flow/domains/bus/manual/boardingDropping");

// /* =========================
//    TRAIN FLOW
// ========================= */
// const handleTrainManual = require("../flow/domains/train/manual");

// const RAW_ADMIN =
//   process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// /* =========================
//    PHONE NORMALIZER
// ========================= */
// function normalize(num = "") {
//   return String(num).replace(/\D/g, "");
// }

// /* ======================================================
//    SHORT BOOKING ID EXPANDER
//    QB07 -> QB2026031207
//    QT07 -> QT2026031207
// ====================================================== */

// function getTodayDatePart() {
//   const d = new Date();

//   const yyyy = d.getFullYear();
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const dd = String(d.getDate()).padStart(2, "0");

//   return `${yyyy}${mm}${dd}`;
// }

// function expandShortBookingIds(text = "") {
//   const date = getTodayDatePart();

//   return text.replace(/\b(QB|QT)(\d{1,2})\b/gi, (match, prefix, num) => {
//     const n = String(num).padStart(2, "0");
//     return `${prefix.toUpperCase()}${date}${n}`;
//   });
// }

// /* ======================================================
//    ADMIN CONTROLLER
// ====================================================== */

// async function handleAdminCommands(ctx) {
//   try {
//     if (!ctx || !ctx.msg) return false;

//     ctx.session = ctx.session || {};
//     ctx.sendText = sendText;

//     const from = ctx.from;

//     /* =====================================================
//        ADMIN AUTH CHECK
//     ===================================================== */

//     if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
//       return false;
//     }

//     /* =====================================================
//        PDF UPLOAD → SEND TICKET
//     ===================================================== */

//     if (ctx.msg?.type === "document" && ctx.msg?.document?.id) {
//       return await handleTicketCommands(ctx, null);
//     }

//     /* =====================================================
//        TEXT EXTRACTION
//     ===================================================== */

//     const text =
//       ctx.msg?.text?.body?.trim() ||
//       ctx.msg?.image?.caption?.trim() ||
//       "";

//     /* =====================================================
//        EXPAND SHORT BOOKING IDS
//     ===================================================== */

//     const expandedText = expandShortBookingIds(text);

//     const upper = expandedText.toUpperCase();

//     /* =====================================================
//        ADMIN DIRECT REPLY
//     ===================================================== */

//     if (/^REPLY(\s|$)/i.test(upper)) {
//       return await handleReplyCommands(ctx, expandedText);
//     }

//     /* =====================================================
//        GLOBAL BOOKING COMMANDS
//     ===================================================== */

//     const handled = await handleBookingCommands(ctx, expandedText);

//     if (handled) {
//       return true;
//     }

//     /* =====================================================
//        FARE COMMAND
//     ===================================================== */

//     if (/^TICKET_PRICE/i.test(upper)) {
//       return await handleFareCommands(ctx, expandedText);
//     }

//     /* =====================================================
//        PAYMENT COMMAND
//     ===================================================== */

//     if (/^PAYMENT(\s|$)/i.test(upper)) {
//       return await handlePaymentCommands(ctx, expandedText);
//     }

//     /* =====================================================
//        SEND TICKET
//     ===================================================== */

//     if (/^SEND\s+TICKET/i.test(upper)) {
//       return await handleTicketCommands(ctx, expandedText);
//     }

//     /* =====================================================
//        BUS FLOW
//     ===================================================== */

//     if (
//       /^SEAT[_\s]?OPTIONS/i.test(upper) ||
//       /^SEAT[_\s]?SELECTED/i.test(upper)
//     ) {
//       return await handleAdminSeatSender(ctx, expandedText);
//     }

//     if (/^B_POINTS/i.test(upper)) {
//       return await handleBoardingPoints(ctx, expandedText);
//     }

//     if (/^D_POINTS/i.test(upper)) {
//       return await handleDroppingPoints(ctx, expandedText);
//     }

//     if (/^BUS(\s|_|$)/i.test(upper)) {
//       await handleBusAdmin(ctx, expandedText);
//       return true;
//     }

//     /* =====================================================
//        TRAIN FLOW
//     ===================================================== */

//     const trainHandled = await handleTrainManual(ctx, expandedText);

//     if (trainHandled) {
//       return true;
//     }

//     /* =====================================================
//        UNKNOWN COMMAND
//     ===================================================== */

//     await sendText(
//       from,
//       "⚠️ Unknown admin command.\nSend *HELP*."
//     );

//     return true;
//   } catch (err) {
//     console.error("🔥 ADMIN ERROR:", err);

//     await sendText(
//       ctx?.from,
//       "❌ Internal admin error."
//     );

//     return true;
//   }
// }

// module.exports = { handleAdminCommands };

const { sendText } = require("../waClient");

/* =========================
   ADMIN COMMAND HANDLERS
========================= */

const handleBookingCommands = require("./commands/bookings");
const handlePaymentCommands = require("./commands/payments");
const handleTicketCommands = require("./commands/tickets");
const handleFareCommands = require("./commands/fares");
const handleReplyCommands = require("./commands/reply");

/* =========================
   BOOKING STORE
========================= */

const {
  findBookingById,
  findBookingsByUser,
  getPendingManualBookings,
  updateBooking,
} = require("../bookingStore");

/* =========================
   BUS FLOW
========================= */

const handleBusAdmin = require("../flow/domains/bus/manual");

const {
  handleAdminSeatSender,
} = require("../flow/domains/bus/manual/adminSeatSender");

const {
  handleBoardingPoints,
  handleDroppingPoints,
} = require("../flow/domains/bus/manual/boardingDropping");

/* =========================
   TRAIN FLOW
========================= */

const handleTrainManual = require("../flow/domains/train/manual");

/* =========================
   ADMIN CONFIG
========================= */

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* =========================
   PHONE NORMALIZER
========================= */

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

/* ======================================================
   SHORT BOOKING ID EXPANDER
   QB07 -> QB2026031207
   QT07 -> QT2026031207
====================================================== */

function getTodayDatePart() {
  const d = new Date();

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}${mm}${dd}`;
}

function expandShortBookingIds(text = "") {

  const date = getTodayDatePart();

  return text.replace(/\b(QB|QT)(\d{1,2})\b/gi, (match, prefix, num) => {
    const n = String(num).padStart(2, "0");
    return `${prefix.toUpperCase()}${date}${n}`;
  });
}

/* ======================================================
   ADMIN CONTROLLER
====================================================== */

async function handleAdminCommands(ctx) {

  try {

    if (!ctx || !ctx.msg) return false;

    ctx.session = ctx.session || {};
    ctx.sendText = sendText;

    const from = ctx.from;

    /* ================= ADMIN AUTH ================= */

    if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
      return false;
    }

    /* ================= PDF UPLOAD ================= */

    if (ctx.msg?.type === "document" && ctx.msg?.document?.id) {
      return await handleTicketCommands(ctx, null);
    }

    /* ================= TEXT EXTRACTION ================= */

    const text =
      ctx.msg?.text?.body?.trim() ||
      ctx.msg?.image?.caption?.trim() ||
      "";

    const expandedText = expandShortBookingIds(text);

    const upper = expandedText.toUpperCase();

    /* ======================================================
       ADMIN HELP
    ====================================================== */

    if (upper === "HELP") {

      await sendText(
        from,
`📖 *Admin Commands*

PROCESS <ID>
CONFIRM <ID>
FAIL <ID>
CANCEL <ID>

PAYMENT <ID>
SEND TICKET <ID>
TICKET_PRICE <ID>

BOOKING <ID>
SEARCH <PHONE>

PENDING
TODAY
REVENUE`
      );

      return true;
    }

    /* ======================================================
       PENDING BOOKINGS
    ====================================================== */

    if (upper === "PENDING") {

      const pendingTrain = getPendingManualBookings("TRAIN");
      const pendingBus = getPendingManualBookings("BUS");

      let msg = "⏳ *Pending Bookings*\n\n";

      if (!pendingTrain.length && !pendingBus.length) {
        msg += "No pending bookings.";
      }

      pendingTrain.forEach(b => {
        msg += `🚆 ${b.id}\n`;
      });

      pendingBus.forEach(b => {
        msg += `🚌 ${b.id}\n`;
      });

      await sendText(from, msg);

      return true;
    }

    /* ======================================================
       BOOKING DETAILS
    ====================================================== */

    if (upper.startsWith("BOOKING ")) {

      const id = expandedText.split(" ")[1];

      const booking = findBookingById(id);

      if (!booking) {
        await sendText(from, "❌ Booking not found.");
        return true;
      }

      let msg =
        `📦 *Booking Details*\n\n` +
        `ID: ${booking.id}\n` +
        `Type: ${booking.type}\n` +
        `User: ${booking.user}\n` +
        `${booking.from ? `From: ${booking.from}\n` : ""}` +
        `${booking.to ? `To: ${booking.to}\n` : ""}` +
        `${booking.date ? `Date: ${booking.date}\n` : ""}` +
        `Status: ${booking.status}`;

      await sendText(from, msg);

      return true;
    }

    /* ======================================================
       SEARCH USER BOOKINGS
    ====================================================== */

    if (upper.startsWith("SEARCH ")) {

      const phone = expandedText.split(" ")[1];

      const bookings = findBookingsByUser(phone);

      if (!bookings.length) {
        await sendText(from, "❌ No bookings found for this user.");
        return true;
      }

      let msg = `📱 *Bookings for ${phone}*\n\n`;

      bookings.forEach(b => {
        msg += `${b.id} - ${b.status}\n`;
      });

      await sendText(from, msg);

      return true;
    }

    /* ======================================================
       CANCEL BOOKING
    ====================================================== */

    if (upper.startsWith("CANCEL ")) {

      const id = expandedText.split(" ")[1];

      const booking = updateBooking(id, { status: "CANCELLED" });

      if (!booking) {
        await sendText(from, "❌ Booking not found.");
        return true;
      }

      await sendText(from, `🚫 Booking cancelled: ${id}`);

      return true;
    }

    /* ======================================================
       FAIL BOOKING
    ====================================================== */

    if (upper.startsWith("FAIL ")) {

      const id = expandedText.split(" ")[1];

      const booking = updateBooking(id, { status: "FAILED" });

      if (!booking) {
        await sendText(from, "❌ Booking not found.");
        return true;
      }

      await sendText(from, `❌ Booking marked FAILED: ${id}`);

      return true;
    }

    /* ======================================================
       ADMIN DIRECT REPLY
    ====================================================== */

    if (/^REPLY(\s|$)/i.test(upper)) {
      return await handleReplyCommands(ctx, expandedText);
    }

    /* ======================================================
       GLOBAL BOOKING COMMANDS
    ====================================================== */

    const handled = await handleBookingCommands(ctx, expandedText);

    if (handled) return true;

    /* ======================================================
       FARE COMMAND
    ====================================================== */

    if (/^TICKET_PRICE/i.test(upper)) {
      return await handleFareCommands(ctx, expandedText);
    }

    /* ======================================================
       PAYMENT COMMAND
    ====================================================== */

    if (/^PAYMENT(\s|$)/i.test(upper)) {
      return await handlePaymentCommands(ctx, expandedText);
    }

    /* ======================================================
       SEND TICKET
    ====================================================== */

    if (/^SEND\s+TICKET/i.test(upper)) {
      return await handleTicketCommands(ctx, expandedText);
    }

    /* ======================================================
       BUS FLOW
    ====================================================== */

    if (
      /^SEAT[_\s]?OPTIONS/i.test(upper) ||
      /^SEAT[_\s]?SELECTED/i.test(upper)
    ) {
      return await handleAdminSeatSender(ctx, expandedText);
    }

    if (/^B_POINTS/i.test(upper)) {
      return await handleBoardingPoints(ctx, expandedText);
    }

    if (/^D_POINTS/i.test(upper)) {
      return await handleDroppingPoints(ctx, expandedText);
    }

    if (/^BUS(\s|_|$)/i.test(upper)) {
      await handleBusAdmin(ctx, expandedText);
      return true;
    }

    /* ======================================================
       TRAIN FLOW
    ====================================================== */

    const trainHandled = await handleTrainManual(ctx, expandedText);

    if (trainHandled) return true;

    /* ======================================================
       UNKNOWN COMMAND
    ====================================================== */

    await sendText(
      from,
      "⚠️ Unknown admin command.\nSend *HELP*."
    );

    return true;

  } catch (err) {

    console.error("🔥 ADMIN ERROR:", err);

    await sendText(
      ctx?.from,
      "❌ Internal admin error."
    );

    return true;
  }
}

module.exports = { handleAdminCommands };