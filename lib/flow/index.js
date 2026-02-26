// lib/flow/index.js
require("dotenv").config();

const { buildContext } = require("./context");

/* ======================================================
 * CORE FLOWS
 * ====================================================== */
const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const summaryFlow = require("./summaryFlow");
const trackingFlow = require("./trackingFlow");
const paymentFlow = require("./paymentFlow");
const fallbackFlow = require("./fallbackFlow");
const { handleDebug } = require("../dev/debugController");

/* ======================================================
 * BUS MANUAL FLOW HANDLERS
 * ====================================================== */
const handleBusSelection = require("./domains/bus/manual/busSelection");
const handleSeatSelection = require("./domains/bus/manual/seatSelection");
const handleSeatConfirmation = require("./domains/bus/manual/seatConfirmation");
const BUS_STATES = require("./domains/bus/manual/states");
const {
  handleBoardingSelection,
  handleDroppingSelection,
} = require("./domains/bus/manual/boardingDropping");
const {
  handleFinalConfirmation,
} = require("./domains/bus/manual/finalConfirmation");

/* ======================================================
 * BOOKING STORE
 * ====================================================== */
const {
  getLastBookingByUser,
  findBookingById,
  sendBookingStatus,
} = require("../bookingStore");

const { sendText } = require("../waClient");

/* ======================================================
 * ADMIN & SESSION
 * ====================================================== */
const { handleAdminCommands } = require("../admin/index");
const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

/* ======================================================
 * ADMIN CONFIG
 * ====================================================== */
const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "");
}

function isAdminNumber(from) {
  if (!RAW_ADMIN) return false;
  return normalize(from) === normalize(RAW_ADMIN);
}

/* ======================================================
 * MAIN ROUTER
 * ====================================================== */
module.exports = async function route(req, res) {
  const msg = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  if (!msg || !msg.from || !msg.id) return;

  const from = msg.from;

  /* ======================================================
   * 🛡 DUPLICATE MESSAGE PROTECTION
   * ====================================================== */
  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  /* ======================================================
   * ================= ADMIN FLOW =================
   * ====================================================== */
  if (isAdminNumber(from)) {
    const { session } = startOrGet(from);
    session.__isAdmin = true;

    const ctx = buildContext(req, session);
    if (!ctx) return;

    if (msg.type === "text") {
      const text = msg.text?.body?.trim().toUpperCase();

      if (text === "STATUS") {
        const booking = getLastBookingByUser(from);
        if (!booking) {
          await sendText(from, "❌ No recent booking found.");
          return;
        }
        await sendBookingStatus(booking);
        return;
      }

      if (text.startsWith("STATUS ")) {
        const id = text.split(" ")[1]?.trim();
        const booking = findBookingById(id);
        if (!booking) {
          await sendText(from, "❌ Booking not found.");
          return;
        }
        await sendBookingStatus(booking);
        return;
      }
    }

    const handled = await handleAdminCommands(ctx);

    if (!handled) {
      await sendText(
        from,
        "⚠️ Unknown admin command.\nSend *HELP* to see valid commands.",
      );
    }

    return;
  }

  /* ======================================================
   * ================= USER FLOW =================
   * ====================================================== */
  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  /* ======================================================
   * 🌍 GLOBAL COMMANDS (Highest Priority)
   * ====================================================== */
  if (msg.type === "text") {
    const text = msg.text?.body?.trim().toUpperCase();

    /* STATUS */
    if (text === "STATUS") {
      const booking = getLastBookingByUser(from);
      if (!booking) {
        await sendText(from, "❌ No active booking found.");
        return;
      }
      await sendBookingStatus(booking);
      return;
    }

    /* HELP */
    if (text === "HELP") {
      await sendText(
        from,
        `📖 *Quickets Help*\n\n` +
          `Available commands:\n\n` +
          `• STATUS – Check booking status\n` +
          `• BOOK AGAIN – Start new booking\n` +
          `• RETRY – Repeat current step\n` +
          `• HELP – Show this menu`,
      );
      return;
    }

    /* BOOK AGAIN */
    if (text === "BOOK AGAIN") {
      session.state = null;
      session.busOptions = null;
      session.selectedBus = null;
      session.selectedSeat = null;
      session.seatSelectionActive = false;

      await sendText(from, "🔄 Starting a new booking...");
      await menuFlow(ctx);
      return;
    }

    /* RETRY */
    if (text === "RETRY") {
      await sendText(from, "🔁 Retrying current step...");

      /* ======================================================
       * 🔒 SEAT + FINAL BUS CONFIRMATION MODE
       * ====================================================== */
      if (
        session.state === BUS_STATES.SEAT_CONFIRMATION ||
        session.state === BUS_STATES.FINAL_CONFIRM
      ) {
        await handleSeatConfirmation(ctx);
        return;
      }

      if (session.seatSelectionActive && !session.selectedSeat) {
        await handleSeatSelection(ctx);
        return;
      }

      if (await handleBoardingSelection(ctx)) return;
      if (await handleDroppingSelection(ctx)) return;

      if (session.state === BUS_STATES.FINAL_CONFIRMATION) {
        await handleFinalConfirmation(ctx);
        return;
      }

      if (session.state === BUS_STATES.FARE_SENT) {
        const handleFareConfirmation = require("./domains/bus/manual/fareConfirmation");
        await handleFareConfirmation(ctx);
        return;
      }

      if (session.state === BUS_STATES.PAYMENT_PENDING) {
        if (await paymentFlow(ctx)) return;
      }

      await fallbackFlow(ctx);
      return;
    }
  }

  /* ======================================================
   * 🔒 BUS SELECTION MODE
   * ====================================================== */
  if (
    Array.isArray(session.busOptions) &&
    session.busOptions.length > 0 &&
    !session.selectedBus
  ) {
    if (msg.type === "text" && /^\d+$/.test(msg.text?.body)) {
      await handleBusSelection(ctx);
      return;
    }

    await sendText(
      from,
      "🚌 Please select a bus by replying with the *bus number* shown above.",
    );
    return;
  }

  /* ======================================================
   * 🔒 SEAT CONFIRMATION MODE
   * ====================================================== */
  if (session.state === BUS_STATES.SEAT_CONFIRMATION) {
    await handleSeatConfirmation(ctx);
    return;
  }

  /* ======================================================
   * 🔒 SEAT SELECTION MODE
   * ====================================================== */
  if (session.seatSelectionActive && !session.selectedSeat) {
    if (msg.type === "text") {
      await handleSeatSelection(ctx);
      return;
    }

    await sendText(
      from,
      "🪑 Please select a seat by replying with the *seat number* shown in the layout.",
    );
    return;
  }

  /* ======================================================
   * 🔒 BOARDING / DROPPING
   * ====================================================== */
  if (await handleBoardingSelection(ctx)) return;
  if (await handleDroppingSelection(ctx)) return;

  /* ======================================================
   * 🔒 FINAL CONFIRMATION
   * ====================================================== */
  if (session.state === BUS_STATES.FINAL_CONFIRMATION) {
    await handleFinalConfirmation(ctx);
    return;
  }

  /* ======================================================
   * 🔒 FARE CONFIRMATION
   * ====================================================== */
  {
    const handleFareConfirmation = require("./domains/bus/manual/fareConfirmation");
    if (await handleFareConfirmation(ctx)) return;
  }

  /* ======================================================
   * 🔒 PAYMENT FLOW
   * ====================================================== */
  if (await paymentFlow(ctx)) return;

  /* ======================================================
   * 🌐 NORMAL FLOW
   * ====================================================== */
  if (await handleDebug(ctx)) return;
  if (await languageFlow(ctx)) return;
  if (await menuFlow(ctx)) return;
  if (await passengerFlow(ctx)) return;
  if (await summaryFlow(ctx)) return;
  if (await bookingFlow(ctx)) return;
  if (await trackingFlow(ctx)) return;

  /* ======================================================
   * 🤖 FALLBACK
   * ====================================================== */
  await fallbackFlow(ctx);
};
