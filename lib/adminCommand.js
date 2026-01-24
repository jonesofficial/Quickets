// lib/adminCommand.js

const { sendText } = require("./waClient");
const { findBookingById, updateBooking } = require("./bookingStore");

const { parseBusOptions } = require("../flow/domains/bus/manual/adminParser");

const { sendBusOptions } = require("../flow/domains/bus/manual");

const BUS_STATES = require("../flow/domains/bus/manual/states");

/* ======================================================
 * Admin Command Handler (STATUS + MANUAL PAYMENT)
 * ====================================================== */

async function handleAdminCommands(ctx) {
  /* =========================
   * MANUAL BUS OPTIONS
   * ========================= */
  if (/^BUS(_OPTIONS)?/i.test(text)) {
    const parsed = parseBusOptions(text);

    if (!parsed.ok) {
      await sendText(from, `❌ ${parsed.error}`);
      return true;
    }

    // 🔍 Find latest BUS booking waiting for admin
    const booking = Object.values(require("./bookingStore")._store || {})
      .reverse()
      .find((b) => b.type === "BUS" && b.status === "PROCESSING");

    if (!booking) {
      await sendText(from, "❌ No active BUS booking waiting for options.");
      return true;
    }

    // Attach options
    booking.busOptions = parsed.data;
    booking.status = "BUS_OPTIONS_SENT";

    // Send to user
    await sendBusOptions({
      session: { busOptions: parsed.data },
      user: booking.user,
    });

    await sendText(from, "✅ Bus options sent to user.");
    return true;
  }

  const text = ctx.msg?.text?.body?.trim();
  const from = ctx.from;

  if (!text) return false;

  const parts = text.split(/\s+/);
  const command = parts[0]?.toUpperCase();
  const bookingId = parts[1];
  const reason = parts.slice(2).join(" ");

  console.log("🛂 ADMIN COMMAND:", command, bookingId, reason);

  /* =========================
   * BOOKING STATUS COMMANDS
   * ========================= */
  const BOOKING_COMMANDS = {
    PROCESS: "PROCESSING",
    CONFIRM: "CONFIRMED", // 🔔 triggers notify → payment activation
    FAIL: "FAILED",
    CANCEL: "CANCELLED",
  };

  /* =========================
   * PAYMENT STATUS COMMANDS
   * (Manual UPI verification)
   * ========================= */
  const PAYMENT_COMMANDS = {
    PAYSUCCESS: "SUCCESS",
    PAYFAIL: "FAILED",
    PAYCANCEL: "CANCELLED",
  };

  if (!BOOKING_COMMANDS[command] && !PAYMENT_COMMANDS[command]) {
    await sendText(
      from,
      "⚠️ Unknown admin command.\n\n" +
        "📦 *Booking Commands*\n" +
        "• PROCESS <BOOKING_ID>\n" +
        "• CONFIRM <BOOKING_ID>\n" +
        "• FAIL <BOOKING_ID> <reason>\n" +
        "• CANCEL <BOOKING_ID> <reason>\n\n" +
        "💳 *Payment Commands (Manual UPI)*\n" +
        "• PAYSUCCESS <BOOKING_ID>\n" +
        "• PAYFAIL <BOOKING_ID> <reason>\n" +
        "• PAYCANCEL <BOOKING_ID> <reason>",
    );
    return true;
  }

  if (!bookingId) {
    await sendText(
      from,
      "⚠️ Booking ID missing.\nExample: CONFIRM QB2026011601",
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
   * BOOKING STATUS UPDATE
   * ========================= */
  if (BOOKING_COMMANDS[command]) {
    patch.status = BOOKING_COMMANDS[command];
  }

  /* =========================
   * PAYMENT STATUS UPDATE
   * ========================= */
  if (PAYMENT_COMMANDS[command]) {
    if (!booking.payment) {
      await sendText(
        from,
        "⚠️ Payment not yet generated for this booking.\n" +
          "Confirm booking first.",
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

    // 🔁 Sync booking status with payment result
    if (command === "PAYSUCCESS") {
      patch.status = "CONFIRMED";
    }

    if (command === "PAYFAIL" || command === "PAYCANCEL") {
      patch.status = "PAYMENT_FAILED";
    }
  }

  if (reason) {
    patch.meta = {
      ...(booking.meta || {}),
      reason,
    };
  }

  // 🔔 bookingStore handles:
  // - user notification
  // - payment activation after CONFIRMED message
  updateBooking(bookingId, patch);

  await sendText(
    from,
    `✅ Update successful.\n\n` +
      `🆔 ${bookingId}\n` +
      `📦 Booking Status: ${patch.status || booking.status}\n` +
      `💳 Payment Status: ${
        patch.payment?.status || booking.payment?.status || "N/A"
      }`,
  );

  return true;
}

module.exports = { handleAdminCommands };
