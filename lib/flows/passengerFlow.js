// lib/flows/passengerFlow.js
const { sendText, sendButtons } = require("../waClient");
const { parsePassengerLine } = require("../validators");
const { anonymizePassenger } = require("../privacy");

async function passengerFlow(ctx) {
  const { s, from, msg, interactiveType, interactiveId, get } = ctx;

  if (!s.state.startsWith("BUS_PAX")) return false;

  if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
    const parsed = msg.text.body
      .split("\n")
      .map(parsePassengerLine)
      .filter(Boolean)
      .map(anonymizePassenger);

    s.pendingBooking.passengers = parsed;
    s.state = "BUS_SUMMARY";
    await sendText(from, get("REVIEW_REQUEST"));
    return true;
  }

  return false;
}

module.exports = { passengerFlow };
