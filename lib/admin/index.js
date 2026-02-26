const { sendText } = require("../waClient");

/* =========================
   BUS COMMANDS
========================= */
const handleBookingCommands = require("./commands/bookings");
const handlePaymentCommands = require("./commands/payments");
const handleTicketCommands = require("./commands/tickets");
const handleFareCommands = require("./commands/fares");

const handleBusAdmin = require("../flow/domains/bus/manual");
const {
  handleAdminSeatSender,
} = require("../flow/domains/bus/manual/adminSeatSender");
const {
  handleBoardingPoints,
  handleDroppingPoints,
} = require("../flow/domains/bus/manual/boardingDropping");

/* =========================
   TRAIN COMMANDS
========================= */
const handleTrainBookingCommands = require("./trainCommands/booking");
const handleTrainPaymentCommands = require("./trainCommands/payments");
const handleTrainTicketCommands = require("./trainCommands/tickets");
const handleTrainFareCommands = require("./trainCommands/fares");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

async function handleAdminCommands(ctx) {
  try {
    if (!ctx || !ctx.msg) return false;

    ctx.session = ctx.session || {};
    ctx.sendText = sendText;

    const from = ctx.from;

    /* =====================================================
       🔒 ALLOW ONLY ADMIN
    ===================================================== */
    if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
      return false;
    }

    /* =====================================================
       📄 PDF Upload (Shared Ticket Upload)
    ===================================================== */
    if (ctx.msg?.type === "document" && ctx.msg?.document?.id) {
      return await handleTicketCommands(ctx, null);
    }

    /* =====================================================
       TEXT EXTRACTION (Text OR Image Caption)
    ===================================================== */
    const text =
      ctx.msg?.text?.body?.trim() ||
      ctx.msg?.image?.caption?.trim() ||
      "";

    if (!text) return true;

    const upper = text.toUpperCase();

    /* =====================================================
       🚌 BUS FLOW (PRIORITY)
    ===================================================== */

    if (
      /^SEAT[_\s]?OPTIONS/i.test(upper) ||
      /^SEAT[_\s]?SELECTED/i.test(upper)
    ) {
      return await handleAdminSeatSender(ctx, text);
    }

    if (/^B_POINTS/i.test(upper)) {
      return await handleBoardingPoints(ctx, text);
    }

    if (/^D_POINTS/i.test(upper)) {
      return await handleDroppingPoints(ctx, text);
    }

    if (/^BUS(\s|_|$)/i.test(upper)) {
      await handleBusAdmin(ctx, text);
      return true;
    }

    /* =====================================================
       🚆 TRAIN COMMANDS (NEW)
    ===================================================== */

    if (
      /^(AVAILABLE|WAITING\s+LIST|RAC|NO\s+CHANCE)\s+QT/i.test(upper)
    ) {
      return await handleTrainBookingCommands(ctx, text);
    }

    if (/^TRAIN\s+TICKET_PRICE/i.test(upper)) {
      return await handleTrainFareCommands(ctx, text);
    }

    if (/^TRAIN\s+PAYMENT/i.test(upper)) {
      return await handleTrainPaymentCommands(ctx, text);
    }

    if (/^TRAIN\s+SEND\s+TICKET/i.test(upper)) {
      return await handleTrainTicketCommands(ctx, text);
    }

    /* =====================================================
       💰 SHARED FARE / PAYMENT / TICKET
    ===================================================== */

    if (/^TICKET_PRICE/i.test(upper)) {
      return await handleFareCommands(ctx, text);
    }

    if (/^PAYMENT/i.test(upper)) {
      return await handlePaymentCommands(ctx, text);
    }

    if (/^SEND\s+TICKET/i.test(upper)) {
      return await handleTicketCommands(ctx, text);
    }

    /* =====================================================
       📦 BUS BOOKING COMMANDS (Fallback)
    ===================================================== */

    const handled = await handleBookingCommands(ctx, text);
    if (handled) return true;

    /* =====================================================
       ❓ UNKNOWN COMMAND SAFETY
    ===================================================== */

    await sendText(from, "⚠️ Unknown admin command. Send HELP.");
    return true;

  } catch (err) {
    console.error("🔥 ADMIN ERROR:", err);
    await sendText(ctx?.from, "❌ Internal admin error.");
    return true;
  }
}

module.exports = { handleAdminCommands };