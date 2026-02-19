const { sendText } = require("../waClient");

const handleBookingCommands = require("./commands/bookings");
const handlePaymentCommands = require("./commands/payments");
const handleTicketCommands = require("./commands/tickets");
const handleFareCommands = require("./commands/fares");

const handleBusAdmin = require("../flow/domains/bus/manual");
const { handleAdminSeatSender } = require("../flow/domains/bus/manual/adminSeatSender");
const {
  handleBoardingPoints,
  handleDroppingPoints,
} = require("../flow/domains/bus/manual/boardingDropping");

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

    if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
      return false;
    }

    /* ==============================
       PDF Upload → Tickets Module
    ============================== */

    if (
      ctx.msg?.document &&
      ctx.msg?.document?.mimetype === "application/pdf"
    ) {
      return await handleTicketCommands(ctx, null, "PDF_UPLOAD");
    }

    const text =
      ctx.msg?.text?.body?.trim() ||
      ctx.msg?.image?.caption?.trim();

    if (!text) return true;

    const upper = text.toUpperCase();

    /* ==============================
       BUS FLOW (MUST COME FIRST)
    ============================== */

    if (/^SEAT[_\s]?OPTIONS/i.test(upper) ||
        /^SEAT[_\s]?SELECTED/i.test(upper)) {
      return await handleAdminSeatSender(ctx, text);
    }

    if (/^B_POINTS/i.test(upper))
      return await handleBoardingPoints(ctx, text);

    if (/^D_POINTS/i.test(upper))
      return await handleDroppingPoints(ctx, text);

    if (/^BUS(_OPTIONS)?/i.test(upper)) {
      await handleBusAdmin(ctx, text);
      return true;
    }

    /* ==============================
       Modular Commands
    ============================== */

    if (/^TICKET_PRICE/i.test(upper))
      return await handleFareCommands(ctx, text);

    if (/^PAYMENT/i.test(upper))
      return await handlePaymentCommands(ctx, text);

    if (/^SEND\s+TICKET/i.test(upper))
      return await handleTicketCommands(ctx, text);

    // Everything else → bookings
    return await handleBookingCommands(ctx, text);

  } catch (err) {
    console.error("🔥 ADMIN ERROR:", err);
    await sendText(ctx?.from, "❌ Internal admin error.");
    return true;
  }
}

module.exports = { handleAdminCommands };
