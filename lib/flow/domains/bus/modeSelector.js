const { sendText, sendButtons } = require("../../../waClient");

async function handleBusMode(ctx) {
  const { session, from, interactiveType, interactiveId } = ctx;

  // First entry into bus
  if (!session.state || session.state === "BUS_START") {
    session.state = "BUS_MODE_SELECTION";

    await sendButtons(
      from,
      `🚌 *Bus Booking Options*\n\nChoose how you'd like to continue:`,
      [
        { id: "BUS_MODE_QUICK", title: "⚡ Quick Book" },
        { id: "BUS_MODE_SEARCH", title: "🔎 Search Buses" },
      ]
    );

    return "MODE_HANDLED";
  }

  // Handle button click
  if (
    session.state === "BUS_MODE_SELECTION" &&
    interactiveType === "button_reply"
  ) {
    if (interactiveId === "BUS_MODE_QUICK") {
      session.state = "BUS_QUICK_BOOK_START";
      return "QUICK";
    }

    if (interactiveId === "BUS_MODE_SEARCH") {
      return "SEARCH";
    }
  }

  return null;
}

module.exports = handleBusMode;