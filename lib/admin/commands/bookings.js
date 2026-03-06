const { sendText } = require("../../waClient");
const {
  findBookingById,
  updateBooking,
  getAdminStats,
} = require("../../bookingStore");

const BUS_STATES = require("../../flow/domains/bus/manual/states");

/* =====================================================
   DELAY HELPER
===================================================== */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = async function handleBookingCommands(ctx, text) {
  const upper = text.toUpperCase().trim();
  const from = ctx.from;

  /* =====================================================
     HELP
  ===================================================== */
  if (upper === "HELP") {
    await sendText(
      from,
      `🛂 *Admin Commands*

PROCESS <ID>
PAUSE <ID>
RESUME <ID>

CONFIRM <ID>
FAIL <ID>
CANCEL <ID>

TICKET_PRICE
PAYMENT RECEIVED
SEND TICKET`,
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nPROCESS <BOOKING_ID>",
    );

    return true;
  }

  /* =====================================================
     CURRENT
  ===================================================== */
  if (upper === "CURRENT") {
    if (!ctx.session.bookingId) {
      return sendText(from, "📭 No active booking.");
    }

    await sendText(
      from,
      `📌 Current Active Booking\n\n🆔 ${ctx.session.bookingId}`,
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nContinue booking flow",
    );

    return true;
  }

  const parts = upper.split(/\s+/);
  const command = parts[0];
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

  const COMMANDS = {
    PROCESS: "PROCESSING",
    CONFIRM: "CONFIRMED",
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
    PAUSE: "PAUSED",
    RESUME: "PROCESSING",
  };

  if (!COMMANDS[command]) return false;

  if (!bookingId) {
    return sendText(from, "⚠️ Booking ID missing.");
  }

  const booking = findBookingById(bookingId);

  console.log("📦 BOOKING DATA:", booking);

  if (!booking) {
    return sendText(from, `❌ Booking not found: ${bookingId}`);
  }

  /* =====================================================
     PROCESS BOOKING
  ===================================================== */
  if (command === "PROCESS") {
    if (ctx.session.bookingId) {
      return sendText(
        from,
        `⚠️ Active booking exists: ${ctx.session.bookingId}`,
      );
    }

    ctx.session.bookingId = bookingId;
    ctx.session.bookingUser = booking.phone;
    ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;

    updateBooking(bookingId, { status: "PROCESSING" });

    console.log("🚀 PROCESS → booking activated:", bookingId);

    /* ===============================
       ADMIN CONFIRMATION
    =============================== */

    await sendText(
      from,
      `✅ Booking Activated

🆔 ${bookingId}
👤 ${booking.phone}`,
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nSend BUS or SEAT_OPTIONS",
    );

    /* ===============================
       USER NOTIFICATION
    =============================== */

    /* ===============================
   USER NOTIFICATION
=============================== */

    const userPhone = booking.type === "TRAIN" ? booking.from : booking.user;

    console.log("📨 PROCESS → notifying user:", userPhone);

    if (!userPhone) {
      console.error("❌ No user phone found:", bookingId);
      return true;
    }
    await sendText(
      userPhone,
      `🚆 *Quickets Booking In Progress*

🆔 *Booking ID:* ${bookingId}

Our team has started processing your booking request and is checking the latest ticket availability and fare details.

⏳ Please hold on while we confirm the best option for your journey.  
We'll update you shortly.`,
    );
    /* ===============================
       DELAY → SEARCHING MESSAGE
    =============================== */

    await delay(10000);

    let searchMsg = "🔎 Searching for available tickets...";

    if (booking.type === "bus") {
      searchMsg = "🚌 Searching for available buses...";
    }

    if (booking.type === "train") {
      searchMsg = "🚆 Searching for available trains...";
    }

    if (booking.type === "flight") {
      searchMsg = "✈️ Searching for available flights...";
    }

    await sendText(userPhone, searchMsg);

    return true;
  }

  /* =====================================================
     STRICT ACTIVE BOOKING CHECK
  ===================================================== */

  if (!ctx.session.bookingId) {
    return sendText(from, "⚠️ No active booking.");
  }

  if (bookingId !== ctx.session.bookingId) {
    return sendText(from, "❌ Booking mismatch.");
  }

  const patch = {
    status: COMMANDS[command],
    meta: {
      ...(booking.meta || {}),
      ...(reason ? { reason } : {}),
    },
  };

  updateBooking(bookingId, patch);

  ctx.session.bookingId = null;
  ctx.session.bookingUser = null;
  ctx.session.state = null;

  await sendText(
    from,
    `✅ Booking Updated

🆔 ${bookingId}
📌 Status → ${patch.status}`,
  );

  /* =====================================================
     NEXT STEP GUIDANCE
  ===================================================== */

  if (["CONFIRM", "FAIL", "CANCEL"].includes(command)) {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nPROCESS <NEW_BOOKING_ID>",
    );
  }

  if (command === "PAUSE") {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nRESUME <BOOKING_ID>",
    );
  }

  if (command === "RESUME") {
    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n👉 NEXT STEP:\nContinue booking flow",
    );
  }

  /* =====================================================
     ADMIN STATS
  ===================================================== */

  const stats = getAdminStats();

  await sendText(
    from,
    `📊 Admin Status

🕒 Pending Bus: ${stats.pendingBus}
💳 Payment Pending: ${stats.paymentPending}
✅ Confirmed: ${stats.confirmed}
❌ Failed: ${stats.failed}
🚫 Cancelled: ${stats.cancelled}`,
  );

  return true;
};
