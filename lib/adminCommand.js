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

const { markPaymentSuccess, markPaymentFailed } = require("./payments");
const {
  handleBoardingPoints,
  handleDroppingPoints,
} = require("./flow/domains/bus/manual/boardingDropping");

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

  const text = ctx.msg?.text?.body?.trim() || ctx.msg?.image?.caption?.trim();

  if (!text) return true;

  const upper = text.toUpperCase();
  console.log("🛂 ADMIN RAW TEXT:", text);

  /* ======================================================
   * SEAT OPTIONS
   * ====================================================== */
  if (/^SEAT[_\s]?OPTIONS/i.test(upper) || /^SEAT[_\s]?SELECTED/i.test(upper)) {
    return await handleAdminSeatSender(ctx, text);
  }

  /* ======================================================
   * BoARDING AND DEPARTURE POINTS
   * ====================================================== */

  if (/^B_POINTS/i.test(upper)) {
    return await handleBoardingPoints(ctx, text);
  }

  if (/^D_POINTS/i.test(upper)) {
    return await handleDroppingPoints(ctx, text);
  }

  /* ======================================================
   * BUS MANUAL FLOW
   * ====================================================== */
  if (/^BUS(_OPTIONS)?/i.test(upper)) {
    await handleBusAdmin(ctx, text);
    return true;
  }

  /* ======================================================
   * TICKET PRICE (AUTO TOTAL + AGENT SUPPORT)
   * ====================================================== */

  if (/^TICKET_PRICE/i.test(upper)) {
    if (!ctx.session.bookingId) {
      await sendText(
        from,
        "⚠️ No active booking.\nUse PROCESS <BOOKING_ID> first.",
      );
      return true;
    }

    if (!ctx.session.bookingUser) {
      await sendText(from, "⚠️ No booking user found in session.");
      return true;
    }

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^TICKET_PRICE/i.test(l));

    const fareData = {};

    for (const line of lines) {
      const [keyRaw, valueRaw] = line.split(/\s+/);
      if (!keyRaw || !valueRaw) continue;

      const key = keyRaw.toUpperCase();
      const value = Number(valueRaw);

      if (isNaN(value) || value < 0) continue;

      if (key === "COST") fareData.base = value;
      if (key === "GST") fareData.gst = value;
      if (key === "AGENT") fareData.agent = value;
    }

    if (fareData.base == null) {
      await sendText(
        from,
        "❌ COST is required.\n\nExample:\nTICKET_PRICE\nCOST 782\nGST 52\nAGENT 20",
      );
      return true;
    }

    // Defaults
    fareData.gst = fareData.gst || 0;
    fareData.agent = fareData.agent || 0;

    const total = Number(
      (fareData.base + fareData.gst + fareData.agent).toFixed(2),
    );

    // 🔒 Save to session
    ctx.session.fare = {
      base: fareData.base,
      gst: fareData.gst,
      agent: fareData.agent,
      total,
      source: "ADMIN",
      createdAt: Date.now(),
    };

    await sendText(
      from,
      `✅ Fare Processed Successfully\n\n` +
        `🎫 COST   : ₹${fareData.base}\n` +
        `🧾 GST    : ₹${fareData.gst}\n` +
        `💼 AGENT  : ₹${fareData.agent}\n` +
        `━━━━━━━━━━━━━━\n` +
        `💰 TOTAL  : ₹${total}`,
    );

    // Send fare to user
    const sendFare = require("./flow/domains/bus/manual/fareFlow");
    await sendFare(ctx);

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
        `📌 *Current Active Booking*\n\n🆔 ${ctx.session.bookingId}`,
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
        "• SEAT_OPTIONS\n",
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
    PAUSE: "PAUSED", // NEW
    RESUME: "PROCESSING", // NEW
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
      "⚠️ Booking ID missing.\nExample: CONFIRM QB2026021201",
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
      "⚠️ This system currently supports BUS bookings only.",
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
          `Finish or cancel it first.`,
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
          `— *Team Quickets*`,
      );
    }

    await sendText(
      from,
      `✅ Booking Activated\n\n🆔 ${bookingId}\n👤 User notified: Yes`,
    );

    return true;
  }

  /* ======================================================
   * STRICT ACTIVE BOOKING CHECK
   * ====================================================== */

  if (!ctx.session.bookingId) {
    await sendText(
      from,
      "⚠️ No active booking.\nUse PROCESS <BOOKING_ID> first.",
    );
    return true;
  }

  if (bookingId !== ctx.session.bookingId) {
    await sendText(
      from,
      `❌ Booking mismatch.\n\n` +
        `📌 Active Booking: ${ctx.session.bookingId}\n` +
        `❌ You sent: ${bookingId}\n\n` +
        `Finish or cancel the active booking first.`,
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
          `— *Team Quickets*`,
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
      await sendText(from, "⚠️ Only paused bookings can be resumed.");
      return true;
    }

    patch.status = "PROCESSING";

    if (booking.user) {
      await sendText(
        booking.user,
        `▶️ *Booking Resumed*\n\n` +
          `🆔 Booking ID: *${bookingId}*\n\n` +
          `We have resumed processing your booking.\n\n` +
          `— *Team Quickets*`,
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
          `— *Team Quickets*`,
      );
    }

    if (command === "FAIL" && booking.user) {
      await sendText(
        booking.user,
        `❌ *Booking Update*\n\n` +
          `${reason ? `Reason: ${reason}\n\n` : ""}` +
          `Please try again.\n\n— *Team Quickets*`,
      );
    }

    if (command === "CANCEL" && booking.user) {
      await sendText(
        booking.user,
        `🚫 *Booking Cancelled*\n\n` +
          `${reason ? `Reason: ${reason}\n\n` : ""}` +
          `— *Team Quickets*`,
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

    try {
      if (command === "PAYSUCCESS") {
        markPaymentSuccess(booking);
        patch.status = "CONFIRMED";
      }

      if (command === "PAYFAIL" || command === "PAYCANCEL") {
        markPaymentFailed(booking);
        patch.status = "PAYMENT_FAILED";
      }

      // Save updated payment + booking status
      updateBooking(bookingId, {
        payment: booking.payment,
        status: patch.status,
      });

      if (command === "PAYSUCCESS" && booking.user) {
        await sendText(
          booking.user,
            `💳 *Payment Successful!*

            🆔 Booking ID: *${bookingId}*

            Your booking is now confirmed.

            — *Team Quickets*`,
        );
      }

      if ((command === "PAYFAIL" || command === "PAYCANCEL") && booking.user) {
        await sendText(
          booking.user,
          `❌ *Payment Failed*

            🆔 Booking ID: *${bookingId}*

            Your payment was not successful.
            Please try again.

            — *Team Quickets*`,
        );
      }

      // Reset admin session
      ctx.session.bookingId = null;
      ctx.session.bookingUser = null;
      ctx.session.state = null;

      await sendText(
        from,
        `✅ Payment updated successfully\n\n🆔 ${bookingId}\n📦 Status: ${patch.status}`,
      );
    } catch (err) {
      await sendText(from, `❌ ${err.message}`);
    }

    return true;
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
    `✅ Update successful\n\n🆔 ${bookingId}\n📦 Status: ${patch.status || booking.status}`,
  );

  const stats = getAdminStats();

  await sendText(
    from,
    "📊 *Admin Status*\n\n" +
      `🕒 Pending Bus: ${stats.pendingBus}\n` +
      `💳 Payment Pending: ${stats.paymentPending}\n` +
      `✅ Confirmed: ${stats.confirmed}\n` +
      `❌ Failed: ${stats.failed}\n` +
      `🚫 Cancelled: ${stats.cancelled}`,
  );

  return true;
}

module.exports = { handleAdminCommands };
