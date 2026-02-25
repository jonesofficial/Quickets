const { sendText } = require("../../../waClient");
const { startOrGet } = require("../../../sessionStore");
const BUS_STATES = require("./manual/states");

const QUICK_BOOK_STATES = require("./quickBook/states");

async function handleBusMode(user, message) {
  const session = startOrGet(user);

  // First time entering bus
  if (!session.state || session.state === "BUS_START") {
    session.state = "BUS_MODE_SELECTION";

    await sendText(
      user,
      `🚌 *Bus Booking Options*

1️⃣ Quick Book  
(Already know operator, time & seat)

2️⃣ Search Buses  
(Find buses normally)

Reply with 1 or 2`
    );

    return true; // stop further processing
  }

  // Handle mode selection
  if (session.state === "BUS_MODE_SELECTION") {
    const input = message.trim().toLowerCase();

    if (input === "1" || input.includes("quick")) {
      session.state = QUICK_BOOK_STATES.START;
      return "QUICK_BOOK";
    }

    if (input === "2" || input.includes("search")) {
      session.state = BUS_STATES.FROM_CITY; // existing manual flow state
      return "SEARCH";
    }

    await sendText(user, "Please reply with 1 or 2.");
    return true;
  }

  return false; // not handled here
}

module.exports = handleBusMode;