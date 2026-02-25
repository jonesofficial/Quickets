const { sendText } = require("../../../../waClient");
const { startOrGet } = require("../../../../sessionStore");
const STATES = require("./states");

async function handleQuickBook(user, message) {
  const session = startOrGet(user);

  switch (session.state) {
    case STATES.START:
      session.state = STATES.OPERATOR;
      await sendText(user, "Enter Bus Operator Name:");
      break;

    case STATES.OPERATOR:
      session.quick = { operator: message };
      session.state = STATES.DATE;
      await sendText(user, "Enter Journey Date (DD-MM-YYYY):");
      break;

    case STATES.DATE:
      session.quick.date = message;
      session.state = STATES.TIME;
      await sendText(user, "Enter Departure Time:");
      break;

    case STATES.TIME:
      session.quick.time = message;
      session.state = STATES.SEAT;
      await sendText(user, "Enter Seat Number:");
      break;

    case STATES.SEAT:
      session.quick.seat = message;
      session.state = STATES.CONFIRM;

      await sendText(
        user,
        `🚌 *Confirm Your Quick Booking*

Operator: ${session.quick.operator}
Date: ${session.quick.date}
Time: ${session.quick.time}
Seat: ${session.quick.seat}

Reply YES to confirm or EDIT to change`
      );
      break;

    case STATES.CONFIRM:
      if (message.toLowerCase() === "yes") {
        await sendText(user, "✅ Booking request sent to admin.");
        session.state = null;
      } else {
        await sendText(user, "Booking cancelled.");
        session.state = null;
      }
      break;
  }
}

module.exports = handleQuickBook;