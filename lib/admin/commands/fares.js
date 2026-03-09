const { sendText } = require("../../waClient");
const {
  updateBooking,
  findBookingById,
} = require("../../bookingStore");

const sendBusFare = require("../../flow/domains/bus/manual/fareFlow");
const sendTrainFare = require("../../flow/domains/train/manual/fareFlow");

module.exports = async function handleFareCommands(ctx, text) {

  const from = ctx.from;

  /* =====================================================
     COMMAND CHECK
  ===================================================== */

  if (!/^TICKET_PRICE/i.test(text)) {
    return false;
  }

  if (!ctx.session.bookingId) {
    return sendText(from, "⚠️ No active booking.");
  }

  const bookingId = ctx.session.bookingId;
  const booking = findBookingById(bookingId);

  if (!booking) {
    return sendText(from, "❌ Booking not found.");
  }

  const mode = booking.mode?.toUpperCase();

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^TICKET_PRICE/i.test(l));

  const data = {};

  for (const line of lines) {

    const [key, val] = line.split(/\s+/);

    if (!key || !val) continue;

    const value = Number(val);
    if (isNaN(value)) continue;

    const upperKey = key.toUpperCase();

    /* ===============================
       BUS FARE
    =============================== */

    if (mode === "BUS") {

      if (upperKey === "COST") data.base = value;
      if (upperKey === "GST") data.gst = value;
      if (upperKey === "AGENT") data.agent = value;

    }

    /* ===============================
       TRAIN FARE
    =============================== */

    if (mode === "TRAIN") {

      if (upperKey === "COST") data.base = value;
      if (upperKey === "PG") data.pg = value;

    }

  }

  /* =====================================================
     VALIDATION
  ===================================================== */

  if (data.base == null) {

    if (mode === "BUS") {

      return sendText(
        from,
`❌ COST required.

Example:
TICKET_PRICE
COST 942
GST 46
AGENT 11`
      );

    }

    if (mode === "TRAIN") {

      return sendText(
        from,
`❌ COST required.

Example:
TICKET_PRICE
COST 942
PG 12`
      );

    }

  }

  /* =====================================================
     BUS TOTAL
  ===================================================== */

  if (mode === "BUS") {

    data.gst = data.gst || 0;
    data.agent = data.agent || 0;

    const total = Number(
      (data.base + data.gst + data.agent).toFixed(2)
    );

    updateBooking(bookingId, {
      fare: { ...data, total },
    });

    await sendText(
      from,
`✅ Bus Fare Processed

🎫 COST   : ₹${data.base}
🧾 GST    : ₹${data.gst}
💼 AGENT  : ₹${data.agent}
━━━━━━━━━━━━━━
💰 TOTAL  : ₹${total}`
    );

    const success = await sendBusFare({ booking, ctx });

    if (!success) {
      await sendText(
        from,
        "⚠️ Fare stored but failed to send to user."
      );
      return true;
    }

    await sendText(
      from,
      `💰 Price sent to user.\n\n🆔 Booking ID: ${bookingId}`
    );

    return true;

  }

  /* =====================================================
     TRAIN TOTAL
  ===================================================== */

  if (mode === "TRAIN") {

    data.pg = data.pg || 0;

    const total = Number(
      (data.base + data.pg).toFixed(2)
    );

    updateBooking(bookingId, {
      fare: { ...data, total },
    });

    await sendText(
      from,
`✅ Train Fare Processed

🎫 COST : ₹${data.base}
💳 PG   : ₹${data.pg}
━━━━━━━━━━━━━━
💰 TOTAL: ₹${total}`
    );

    const success = await sendTrainFare({ booking, ctx });

    if (!success) {

      await sendText(
        from,
        "⚠️ Fare stored but failed to send to user."
      );

      return true;
    }

    await sendText(
      from,
      `💰 Price sent to user.\n\n🆔 Booking ID: ${bookingId}`
    );

    return true;

  }

  return true;
};