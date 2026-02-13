const { sendText } = require("../../../../waClient");
const BUS_STATES = require("./states");

function maskPhone(num = "") {
  return num.replace(/(\d{5})\d+/, "$1XXXXX");
}

function buildFinalSummary(session) {
  const bus = session.selectedBus || {};
  const passengers = session.passengers || [];
  const primaryPassenger = passengers[0] || {};

  let msg = "🚌 *Booking Summary*\n\n";

  msg += `Operator: ${bus.name || "-"}\n`;
  msg += `Departure: ${bus.time || "-"}\n`;
  msg += `Seat: ${session.selectedSeat || "-"} (${session.selectedDeck || ""})\n\n`;

  msg += "📍 *Boarding*\n";
  msg += `${session.selectedBoarding?.place || "-"} – ${session.selectedBoarding?.time || "-"}\n\n`;

  msg += "📍 *Dropping*\n";
  msg += `${session.selectedDropping?.place || "-"} – ${session.selectedDropping?.time || "-"}\n\n`;

  msg += `👥 *Passenger Details (${passengers.length})*\n`;

  if (passengers.length) {
    passengers.forEach((p, i) => {
      const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
        .filter(Boolean)
        .join(" • ");

      msg += `${i + 1}. ${p.name || "Passenger"}${meta ? ` (${meta})` : ""}\n`;
    });
  } else {
    msg += "• Passenger details pending\n";
  }

  msg += "\n";

  msg += "📞 *Contact*\n";
  msg += `Phone: ${session.contactPhone || session.user || "-"}\n\n`;

  msg += "Please confirm all details.\n\n";
  msg += "1️⃣ Confirm & Proceed to Payment\n";
  msg += "2️⃣ Edit Details";

  return msg;
}

module.exports = {
  handleFinalConfirmation,
  buildFinalSummary,
};
