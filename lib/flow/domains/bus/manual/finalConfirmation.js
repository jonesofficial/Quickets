const { sendText, sendButtons } = require("../../../../waClient");
const { getLastBookingByUser } = require("../../../../bookingStore");
const BUS_STATES = require("./states");

/* ======================================================
   HELPERS (Same logic style as summary.js)
====================================================== */

function formatPhone(phone) {
  if (!phone) return "-";
  return String(phone);
}

/* ======================================================
   BUILD FINAL SUMMARY (FETCHES FROM BOOKING STORE)
====================================================== */

async function buildFinalSummary(ctx) {
  const booking = await getLastBookingByUser(ctx.from);

  if (!booking) {
    return "⚠️ Booking not found. Please restart booking process.";
  }

  const bus = booking.selectedBus || {};
  const passengers = booking.passengers || [];

  const lines = [];

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("🚌 *REVIEW YOUR BOOKING*");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  lines.push(`🆔 *Booking ID:* ${booking.id || "-"}`);
  lines.push("");

  /* Trip Details */
  lines.push("🧾 *Trip Details*");
  lines.push(`• Operator : ${bus.name || "-"}`);
  lines.push(`• Departure: ${bus.time || "-"}`);
  lines.push(
    `• Seat     : ${booking.selectedSeat || "-"} ${
      booking.selectedDeck ? `(${booking.selectedDeck})` : ""
    }`
  );
  lines.push("");

  /* Boarding */
  lines.push("📍 *Boarding*");
  lines.push(
    `• ${booking.selectedBoarding?.place || "-"} – ${
      booking.selectedBoarding?.time || "-"
    }`
  );
  lines.push("");

  /* Dropping */
  lines.push("📍 *Dropping*");
  lines.push(
    `• ${booking.selectedDropping?.place || "-"} – ${
      booking.selectedDropping?.time || "-"
    }`
  );
  lines.push("");

  /* Passengers */
  lines.push(`👥 *Passenger Details (${passengers.length})*`);

  if (Array.isArray(passengers) && passengers.length) {
    passengers.forEach((p, i) => {
      const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
        .filter(Boolean)
        .join(" • ");

      lines.push(
        `${i + 1}. ${p.name || "Passenger"}${meta ? ` (${meta})` : ""}`
      );
    });
  } else {
    lines.push("• Passenger details pending");
  }

  lines.push("");

  /* Contact */
  lines.push("📞 *Contact Number*");
  lines.push(`• ${formatPhone(booking.contactPhone || booking.user)}`);
  lines.push("");

  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("⚠️ *Please confirm that all details are correct.*");
  lines.push("Once confirmed, we will fetch the final ticket price.");
  lines.push("");

  return lines.join("\n");
}

/* ======================================================
   HANDLE FINAL CONFIRMATION
====================================================== */

async function handleFinalConfirmation(ctx) {
  const buttonId = ctx.msg?.interactive?.button_reply?.id;
  const admin = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

  /* ================================
     CONFIRM BUTTON
  ================================= */
  if (buttonId === "CONFIRM_BOOKING") {
    ctx.session.state = BUS_STATES.FARE_PENDING;

    await sendText(
      ctx.from,
      "✅ Thank you for confirming.\n\n💰 We are checking the final ticket price with the operator.\n⏳ This may take 1–2 minutes."
    );

    const booking = await getLastBookingByUser(ctx.from);

    if (admin && booking) {
      await sendText(
        admin,
        `💰 *Fare Required*\n\n🆔 ${booking.id}\n👤 ${ctx.from}\n\nSend in this format:\nTICKET_PRICE\nCOST <amount>\nGST <amount>\nAGENT <amount>`
      );
    }

    return;
  }

  /* ================================
     EDIT BUTTON
  ================================= */
  if (buttonId === "EDIT_BOOKING") {
    ctx.session.state = BUS_STATES.SEAT_SELECTION;

    await sendText(
      ctx.from,
      "✏️ No problem!\n\nPlease select your seat again to modify your booking."
    );

    return;
  }

  /* ================================
     DEFAULT → SHOW SUMMARY
  ================================= */
  const summaryText = await buildFinalSummary(ctx);

  await sendButtons(
    ctx.from,
    summaryText,
    [
      { id: "CONFIRM_BOOKING", title: "✅ Confirm & Continue" },
      { id: "EDIT_BOOKING", title: "✏️ Edit Details" },
    ]
  );
}

module.exports = {
  handleFinalConfirmation,
};
