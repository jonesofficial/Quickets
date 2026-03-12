const { sendText } = require("../../waClient");

const {
  findBookingById,
  updateBooking,
  getAdminStats,
} = require("../../bookingStore");

const BUS_STATES = require("../../flow/domains/bus/manual/states");
const TRAIN_STATES = require("../../flow/domains/train/quickbook/states");

const trainsBetween = require("../../flow/domains/train/api/trainsBetween");
const formatTrains = require("../../flow/domains/train/utils/formatTrains");

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
      `📌 Current Active Booking

🆔 ${ctx.session.bookingId}`,
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

    // const userPhone = booking.user || booking.from;
    // const userPhone = booking.phone || booking.from || booking.user;

    const userPhone = booking.user || booking.phone;

    ctx.session.bookingId = bookingId;
    ctx.session.bookingUser = userPhone;

    /* ===============================
       DOMAIN STATE SETUP
    =============================== */

    if (booking.type === "BUS") {
      ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;
    }

    if (booking.type === "TRAIN") {
      ctx.session.state = TRAIN_STATES.START;
    }

    updateBooking(bookingId, { status: "PROCESSING" });

    console.log("🚀 PROCESS → booking activated:", bookingId);

    /* ===============================
       ADMIN CONFIRMATION
    =============================== */

    await sendText(
      from,
      `✅ Booking Activated

🆔 ${bookingId}
👤 ${userPhone}`,
    );

    let nextStep = "";

    if (booking.type === "BUS") {
      nextStep = "Send BUS or SEAT_OPTIONS";
    }

    if (booking.type === "TRAIN") {
      if (booking.quickMode) {
        nextStep = "QuickBook → send availability screenshot";
      } else {
        nextStep = "Searching trains automatically...";
      }
    }

    await sendText(
      from,
      `━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
${nextStep}`,
    );

    /* ===============================
       USER NOTIFICATION
    =============================== */

    console.log("📨 PROCESS → notifying user:", userPhone);

    if (!userPhone) {
      console.error("❌ No user phone found:", bookingId);
      return true;
    }

    await sendText(
      userPhone,
      `🚆 *Quickets Booking In Progress*

🆔 *Booking ID:* ${bookingId}

Our team has started processing your booking request.

⏳ Please hold on while we check ticket availability.
We will update you shortly.`,
    );

    /* =====================================================
       QUICKBOOK → STOP HERE
    ===================================================== */

    if (booking.type === "TRAIN" && booking.quickMode) {
      return true;
    }

    /* ===============================
       DELAY BEFORE SEARCH
    =============================== */

    await delay(15000);

    let searchMsg = "🔎 Searching for available tickets...";

    if (booking.type === "BUS") {
      searchMsg = "🚌 Searching for available buses...";
    }

    if (booking.type === "TRAIN") {
      searchMsg = "🚆 Searching for available trains...";
    }

    if (booking.type === "FLIGHT") {
      searchMsg = "✈️ Searching for available flights...";
    }

    await sendText(userPhone, searchMsg);

    /* =====================================================
       TRAIN SEARCH EXECUTION
    ===================================================== */

    if (booking.type === "TRAIN") {
      try {
        const trains = await trainsBetween(
          booking.origin?.code,
          booking.destination?.code,
        );

        if (!trains || !trains.length) {
          await sendText(
            userPhone,
            "❌ No trains available for this route on the selected date.",
          );

          return true;
        }

        const trainMsg = formatTrains(trains, booking.from, booking.to);

        await sendText(userPhone, trainMsg);

        updateBooking(bookingId, {
          availableTrains: trains,
          status: "TRAIN_LIST_SENT",
        });
      } catch (err) {
        console.error("🚆 Train search error:", err);

        await sendText(
          userPhone,
          "⚠️ Unable to fetch train list right now. Please try again.",
        );
      }
    }

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
