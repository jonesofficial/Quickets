const { sendButtons } = require("../../../waClient");

async function handleTrainMode(ctx) {
  const { session, from, interactiveType, interactiveId } = ctx;

  if (!session.state || session.state === "TRAIN_START") {
    session.state = "TRAIN_MODE_SELECTION";

    await sendButtons(
      from,
      "🚆 *Train Booking Options*\n\n" +
        "⚡ *Quick Book*\n" +
        "Use this if you already know:\n" +
        "• Train name\n" +
        "• Date & time\n" +
        "• Berth preference\n\n" +
        "🔎 *Search Trains*\n" +
        "Use this if you want to:\n" +
        "• Explore available trains\n" +
        "• Compare classes & availability\n\n" +
        "👉 Please choose how you'd like to continue:",
      [
        { id: "TRAIN_MODE_QUICK", title: "⚡ Quick Book" },
        { id: "TRAIN_MODE_SEARCH", title: "🔎 Search Trains" },
      ],
    );

    return "MODE_HANDLED";
  }

  if (
    session.state === "TRAIN_MODE_SELECTION" &&
    interactiveType === "button_reply"
  ) {
    if (interactiveId === "TRAIN_MODE_QUICK") {
      session.state = "TRAIN_QUICK_BOOK_START";
      return "QUICK";
    }

    if (interactiveId === "TRAIN_MODE_SEARCH") {
      return "SEARCH";
    }
  }

  return null;
}

module.exports = handleTrainMode;
