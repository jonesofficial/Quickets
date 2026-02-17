const { sendText, sendButtons } = require("../../../../waClient");
const BUS_STATES = require("./states");

function maskPhone(num = "") {
  return num.replace(/(\d{5})\d+/, "$1XXXXX");
}

/* ======================================================
   BUILD FINAL SUMMARY
====================================================== */
function buildFinalSummary(session) {
  const bus = session.selectedBus || {};
  const passengers = session.passengers || [];

  let msg = "🚌 *Booking Summary*\n\n";

  msg += `Operator: ${bus.name || "-"}\n`;
  msg += `Departure: ${bus.time || "-"}\n`;
  msg += `Seat: ${session.selectedSeat || "-"} ${
    session.selectedDeck ? `(${session.selectedDeck})` : ""
  }\n\n`;

  msg += "📍 *Boarding*\n";
  msg += `${session.selectedBoarding?.place || "-"} – ${
    session.selectedBoarding?.time || "-"
  }\n\n`;

  msg += "📍 *Dropping*\n";
  msg += `${session.selectedDropping?.place || "-"} – ${
    session.selectedDropping?.time || "-"
  }\n\n`;

  msg += `👥 *Passenger Details (${passengers.length})*\n`;

  if (passengers.length) {
    passengers.forEach((p, i) => {
      const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
        .filter(Boolean)
        .join(" • ");

      msg += `${i + 1}. ${p.name || "Passenger"}${
        meta ? ` (${meta})` : ""
      }\n`;
    });
  } else {
    msg += "• Passenger details pending\n";
  }

  msg += "\n";

  msg += "📞 *Contact*\n";
  msg += `Phone: ${session.contactPhone || session.user || "-"}\n\n`;

  msg += "Please review all details carefully.";

  return msg;
}

/* ======================================================
   HANDLE FINAL CONFIRMATION (BUTTON VERSION)
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
      "💰 Please wait while we confirm the final ticket price with the operator.\n\n⏳ This may take 1–2 minutes."
    );

    if (admin) {
      await sendText(
        admin,
        `💰 *Fare Required*\n\n🆔 ${ctx.session.bookingId}\n👤 ${ctx.from}\n\nSend:\nTICKET_PRICE\nCOST <amount>\nGST <amount>\nAGENT <amount>`
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
      "✏️ You can now edit your booking details."
    );

    return;
  }

  /* ================================
     DEFAULT → SEND BUTTONS
  ================================= */
  await sendButtons(
    ctx.from,
    buildFinalSummary(ctx.session),
    [
      { id: "CONFIRM_BOOKING", title: "✅ Confirm & Pay" },
      { id: "EDIT_BOOKING", title: "✏️ Edit Details" },
    ]
  );
}

module.exports = {
  handleFinalConfirmation,
  buildFinalSummary,
};
