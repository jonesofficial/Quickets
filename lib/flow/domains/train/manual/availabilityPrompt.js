const { sendButtons } = require("../../../../waClient");

async function sendAvailabilityPrompt(user, status) {

  const s = status.toUpperCase();

  if (s === "AVAILABLE") {
    await sendButtons(
      user,
`🟢 *Ticket Status: AVAILABLE*

Seats are currently available for this train.

You can proceed with booking now.`,
      [
        { id: "TRAIN_BOOK_NOW", title: "🟢 Book Now" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" }
      ]
    );
  }

  else if (s === "WL" || s === "WAITING") {
    await sendButtons(
      user,
`⚠ *Ticket Status: WAITING LIST*

Your ticket will be placed on the waiting list.

Confirmation is *not guaranteed*.`,
      [
        { id: "TRAIN_CONTINUE_WL", title: "⚠ Continue Anyway" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" }
      ]
    );
  }

  else if (s === "RAC") {
    await sendButtons(
      user,
`⚠ *Ticket Status: RAC*

You will be allowed to board the train.

However, a berth may not be allocated initially.`,
      [
        { id: "TRAIN_CONTINUE_RAC", title: "⚠ Continue (RAC)" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" }
      ]
    );
  }

  else if (s === "NO_CHANCE") {
    await sendButtons(
      user,
`❌ *Ticket Status: Very Low Chance*

This train currently has almost no chance of confirmation.

You may try another train or Tatkal.`,
      [
        { id: "TRAIN_OTHER_OPTIONS", title: "🔍 Other Trains" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" }
      ]
    );
  }
}

module.exports = sendAvailabilityPrompt;