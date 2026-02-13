const { sendText } = require("../../../../waClient");
const BUS_STATES = require("./states");

function maskPhone(num = "") {
  return num.replace(/(\d{5})\d+/, "$1XXXXX");
}

function buildFinalSummary(session) {
  const bus = session.selectedBus || {};
  const passenger = session.passengers?.[0] || {};

  let msg = "🚌 *Booking Summary*\n\n";

  msg += `Operator: ${bus.name || "-"}\n`;
  msg += `Departure: ${bus.time || "-"}\n`;
  msg += `Seat: ${session.selectedSeat || "-"} (${session.selectedDeck || ""})\n\n`;

  msg += "📍 *Boarding*\n";
  msg += `${session.selectedBoarding?.place || "-"} – ${session.selectedBoarding?.time || "-"}\n\n`;

  msg += "📍 *Dropping*\n";
  msg += `${session.selectedDropping?.place || "-"} – ${session.selectedDropping?.time || "-"}\n\n`;

  msg += "👤 *Passenger*\n";
  msg += `Name: ${passenger.name || "-"}\n`;
  msg += `Gender: ${passenger.gender || "-"}\n`;
  msg += `Age: ${passenger.age || "-"}\n\n`;

  msg += "📞 *Contact*\n";
  msg += `Phone: ${maskPhone(passenger.phone || "")}\n`;
  msg += `Email: ${passenger.email || "-"}\n\n`;

  if (passenger.city) {
    msg += `🏙 City: ${passenger.city}\n\n`;
  }

  msg += "Please confirm all details.\n\n";
  msg += "1️⃣ Confirm & Proceed to Payment\n";
  msg += "2️⃣ Edit Details";

  return msg;
}

async function handleFinalConfirmation(ctx) {
  const { session, msg, from } = ctx;

  if (session.state !== BUS_STATES.FINAL_CONFIRMATION) return false;

  if (!msg.text?.body) {
    await sendText(from, "Please reply with 1 or 2.");
    return true;
  }

  const input = msg.text.body.trim();

  if (input === "1") {
    session.state = BUS_STATES.PRICE_CONFIRMATION;

    await sendText(
      from,
      "💳 Proceeding to payment...\n\nCalculating final fare."
    );

    return true;
  }

  if (input === "2") {
    session.state = BUS_STATES.PASSENGER_DETAILS;

    await sendText(
      from,
      "✏️ Please update the passenger details."
    );

    return true;
  }

  await sendText(from, "Reply with:\n1️⃣ Confirm\n2️⃣ Edit");

  return true;
}

module.exports = {
  handleFinalConfirmation,
  buildFinalSummary,
};
