// lib/flow/fallbackFlow.js
const {
  sendList,
  sendOopsTapOptions,
  sendText,
  sendButtons,
} = require("../waClient");

const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const summaryFlow = require("./summary");
const { getLastBookingByUser } = require("../bookingStore");

const ADMIN_CHAT_LINK = "https://wa.me/919894381195"; // auto-masked as per your preference

module.exports = async function fallbackFlow(ctx) {
  const { session: s, msg, from, get } = ctx;

  // 📌 STATUS
  if (msg.type === "text" && msg.text.trim().toUpperCase() === "STATUS") {
    await sendStatus(ctx);
    return true;
  }

  // 🛡 Safety guard
  if (!s || !msg) return false;

  /* ======================================================
   * 🌍 GLOBAL TEXT COMMANDS (WORK ANYWHERE)
   * ====================================================== */
  if (msg.type === "text") {
    const text = msg.text.trim().toUpperCase();

    // 🆘 HELP
    if (text === "HELP") {
      await sendButtons(
        from,
        `🆘 *Need help?*\n\nYou can chat directly with our team.\n\nYou can also type anytime:\n• HELP\n• RETRY\n• BOOK AGAIN`,
        [{ id: "CHAT_ADMIN", title: "💬 Chat with us" }]
      );
      return true;
    }

    // 🔁 RETRY
    if (text === "RETRY") {
      if (!s.pendingBooking || !s.currentStep) {
        await sendText(
          from,
          "No active booking to retry.\n\nType *BOOK AGAIN* to start a new booking."
        );
        return true;
      }

      return retryCurrentStep(ctx);
    }

    // 🔄 BOOK AGAIN
    if (text === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.currentStep = null;
      s.state = "IDLE";
      await menuFlow(ctx);
      return true;
    }
  }

  /* ======================================================
   * 🔘 INTERACTIVE FALLBACK
   * ====================================================== */
  if (msg.type === "interactive") {
    // Handle "Chat with us" button
    if (msg.interactive?.button_reply?.id === "CHAT_ADMIN") {
      await sendText(from, `💬 Chat with our team here:\n${ADMIN_CHAT_LINK}`);
      return true;
    }

    await sendOopsTapOptions(from);
    return true;
  }

  /* ======================================================
   * 🏠 IDLE TEXT FALLBACK (MAIN MENU)
   * ====================================================== */
  if (msg.type === "text" && s.state === "IDLE") {
    await sendList(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
      get("MAIN"),
      [
        {
          title: get("MAIN"),
          rows: [
            { id: "MENU_BOOK", title: get("MENU_BOOK") },
            { id: "MENU_TRACK", title: get("MENU_TRACK") },
            { id: "MENU_HELP", title: get("MENU_HELP") },
            { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
          ],
        },
      ]
    );
    return true;
  }

  // Otherwise let other flows continue
  return false;
};

/* ======================================================
 * 🔁 RETRY HANDLER
 * ====================================================== */
async function retryCurrentStep(ctx) {
  const step = ctx.session.currentStep;

  switch (step) {
    case "ASK_SOURCE":
    case "ASK_DESTINATION":
    case "ASK_DATE":
      return bookingFlow(ctx);

    case "ASK_PASSENGERS":
      return passengerFlow(ctx);

    case "CONFIRM_SUMMARY":
      return summaryFlow(ctx);

    default:
      return sendText(
        ctx.from,
        "⚠️ Unable to retry this step.\n\nType *BOOK AGAIN* to start fresh."
      );
  }
}

async function sendStatus(ctx) {
  const { session: s, from } = ctx;

  // 1️⃣ Booking in progress
  if (s?.pendingBooking) {
    const b = s.pendingBooking;

    await sendText(
      from,
      `📌 *Booking in progress*\n\n` +
      `Type: ${b.type}\n` +
      `${b.from ? `From: ${b.from}\n` : ""}` +
      `${b.to ? `To: ${b.to}\n` : ""}` +
      `${b.date ? `Date: ${b.date}\n` : ""}` +
      `\nCurrent step: ${s.state || "Starting"}\n\n` +
      `You can type:\n• RETRY\n• BOOK AGAIN\n• HELP`
    );
    return;
  }

  // 2️⃣ Last saved booking (if any)
  const last = getLastBookingByUser?.(from);

  if (last) {
    await sendText(
      from,
      `📄 *Last Booking Status*\n\n` +
      `🆔 Booking ID: ${last.id}\n` +
      `Type: ${last.type}\n` +
      `From: ${last.from}\n` +
      `To: ${last.to}\n` +
      `Date: ${last.date}\n` +
      `Status: ${last.status}\n\n` +
      `Need help? Type *HELP*`
    );
    return;
  }

  // 3️⃣ No booking at all
  await sendText(
    from,
    `ℹ️ No active or past booking found.\n\nType *BOOK AGAIN* to start a new booking.`
  );
}
