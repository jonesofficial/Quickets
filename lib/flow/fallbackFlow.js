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
const summaryFlow = require("./summaryFlow");

const {
  getLastBookingByUser,
  saveBooking,
  generateReadableBookingId,
} = require("../bookingStore");

const ADMIN_CHAT_LINK = "https://wa.me/919894381195"; // auto-masked

module.exports = async function fallbackFlow(ctx) {
  const { session: s, msg, from, get } = ctx;
  if (!msg) return false;

  const text = getText(msg);
  const upperText = text?.toUpperCase();

  /* ================= STATUS ================= */
  if (upperText === "STATUS") {
    await sendStatus(ctx);
    return true;
  }

  if (!s) return false;

  /* ================= GLOBAL TEXT ================= */
  if (msg.type === "text" && upperText) {
    if (upperText === "HELP") {
      await sendButtons(
        from,
        `🆘 *Need help?*\n\nYou can chat directly with our team.\n\nYou can also type anytime:\n• HELP\n• RETRY\n• BOOK AGAIN`,
        [{ id: "CHAT_ADMIN", title: "💬 Chat with us" }]
      );
      return true;
    }

    if (upperText === "RETRY") {
      if (!s.pendingBooking) {
        await sendText(
          from,
          "No active booking to retry.\n\nType *BOOK AGAIN* to start a new booking."
        );
        return true;
      }
      return retryCurrentStep(ctx);
    }

    if (upperText === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.currentStep = null;
      s.state = "IDLE";
      await menuFlow(ctx);
      return true;
    }
  }

  /* ================= INTERACTIVE ================= */
  if (msg.type === "interactive") {
    const id = msg.interactive?.button_reply?.id;

    // 💬 CHAT ADMIN
    if (id === "CHAT_ADMIN") {
      await sendText(from, `💬 Chat with our team here:\n${ADMIN_CHAT_LINK}`);
      return true;
    }

    // ✅ CONFIRM BOOKING
    if (id === "CONFIRM_BOOKING" && s.pendingBooking) {
      const booking = s.pendingBooking;

      const bookingId = generateReadableBookingId(booking.type);

      saveBooking({
        ...booking,
        id: bookingId,
        status: "CONFIRMED",
        createdAt: Date.now(),
      });

      s.pendingBooking = null;
      s.state = "IDLE"; // ✅ FIXED

      await sendText(
        from,
        `🎟 *Booking Confirmed!*\n🆔 Booking ID: *${bookingId}*`
      );
      return true;
    }

    // ✏️ EDIT BOOKING
    if (id === "EDIT_BOOKING" && s.pendingBooking) {
      const booking = s.pendingBooking; // ✅ FIXED
      s.state = booking.type === "BUS" ? "BUS_FROM" : "TRAIN_FROM";
      await sendText(from, "✏️ Let’s edit your booking. Starting again.");
      return true;
    }

    // ❌ CANCEL BOOKING
    if (id === "CANCEL_BOOKING") {
      s.pendingBooking = null;
      s.state = "IDLE"; // ✅ CONSISTENT
      await sendText(
        from,
        "❌ Booking cancelled.\n\nType *BOOK AGAIN* to start a new booking."
      );
      return true;
    }

    await sendOopsTapOptions(from);
    return true;
  }

  /* ================= IDLE ================= */
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

  return false;
};

/* ================= RETRY HANDLER ================= */
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

/* ================= STATUS ================= */
async function sendStatus(ctx) {
  const { session: s, from } = ctx;

  if (s?.pendingBooking) {
    const b = s.pendingBooking;

    await sendText(
      from,
      `📌 *Booking in progress*\n\n` +
        `Type: ${b.type}\n` +
        `${b.from ? `From: ${b.from}\n` : ""}` +
        `${b.to ? `To: ${b.to}\n` : ""}` +
        `${b.date ? `Date: ${b.date}\n` : ""}` +
        `\nCurrent step: ${s.state}\n\n` +
        `You can type:\n• RETRY\n• BOOK AGAIN\n• HELP`
    );
    return;
  }

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

  await sendText(
    from,
    `ℹ️ No active or past booking found.\n\nType *BOOK AGAIN* to start a new booking.`
  );
}

/* ================= SAFE TEXT ================= */
function getText(msg) {
  if (!msg) return null;
  if (typeof msg.text === "string") return msg.text.trim();
  if (msg.text?.body) return msg.text.body.trim();
  return null;
}
