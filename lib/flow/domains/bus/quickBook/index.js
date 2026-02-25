const { sendText, sendButtons } = require("../../../../waClient");
const STATES = require("./states");

async function handleQuickBook(ctx) {
  const { session, from, text, interactiveType, interactiveId } = ctx;

  const input = text?.trim();

  switch (session.state) {
    case STATES.START:
      session.state = STATES.OPERATOR;
      await sendText(from, "Enter Bus Operator Name:");
      return true;

    case STATES.OPERATOR:
      session.quick = { operator: input };
      session.state = STATES.DATE;
      await sendText(from, "Enter Journey Date (DD-MM-YYYY):");
      return true;

    case STATES.DATE:
      session.quick.date = input;
      session.state = STATES.TIME;
      await sendText(from, "Enter Departure Time:");
      return true;

    case STATES.TIME:
      session.quick.time = input;
      session.state = STATES.SEAT;
      await sendText(from, "Enter Seat Number:");
      return true;

    case STATES.SEAT:
      session.quick.seat = input;
      session.state = STATES.CONFIRM;

      await sendButtons(
        from,
        `🚌 *Confirm Your Quick Booking*

Operator: ${session.quick.operator}
Date: ${session.quick.date}
Time: ${session.quick.time}
Seat: ${session.quick.seat}

Please confirm your booking:`,
        [
          { id: "QB_CONFIRM", title: "✅ Confirm" },
          { id: "QB_EDIT", title: "✏️ Edit" },
          { id: "QB_CANCEL", title: "❌ Cancel" },
        ]
      );

      return true;

    case STATES.CONFIRM:
      if (interactiveType === "button_reply") {
        if (interactiveId === "QB_CONFIRM") {
          await sendText(from, "✅ Booking request sent to admin.");
          session.state = null;
          session.quick = null;
          return true;
        }

        if (interactiveId === "QB_EDIT") {
          session.state = STATES.OPERATOR;
          await sendText(from, "Re-enter Bus Operator Name:");
          return true;
        }

        if (interactiveId === "QB_CANCEL") {
          await sendText(from, "❌ Quick booking cancelled.");
          session.state = null;
          session.quick = null;
          return true;
        }
      }

      return true;
  }

  return false;
}

module.exports = handleQuickBook;