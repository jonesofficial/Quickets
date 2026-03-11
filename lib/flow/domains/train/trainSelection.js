const { sendText } = require("../../../waClient");

const {
  findBookingById,
  updateBooking
} = require("../../../utils/bookingStore");

const TRAIN_STATES = require("../manual/states");

const ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleTrainSelection(ctx, text) {

  if (!/^T\d+$/i.test(text)) return false;

  const bookingId = ctx.session.bookingId;

  if (!bookingId) return false;

  const booking = findBookingById(bookingId);

  if (!booking || !booking.availableTrains) {

    await sendText(
      ctx.from,
      "❌ Train list expired. Please search again."
    );

    return true;
  }

  const index = parseInt(text.slice(1)) - 1;

  const train = booking.availableTrains[index];

  if (!train) {

    await sendText(
      ctx.from,
      "❌ Invalid train selection."
    );

    return true;
  }

  /* SAVE TRAIN */

  updateBooking(bookingId, {
    selectedTrain: train,
    trainNo: train.trainNo,
    trainName: train.trainName
  });

  /* USER CONFIRM */

  await sendText(
    ctx.from,
`🚆 *Train Selected*

${train.trainNo} ${train.trainName}

🕐 ${train.departure} → ${train.arrival}

⏳ Checking seat availability...`
  );

  /* MOVE FLOW */

  ctx.session.state =
    TRAIN_STATES.AVAILABILITY_SCREENSHOT_PENDING;

  /* ADMIN NOTIFY */

  await sendText(
    ADMIN,
`🚆 *Train Selected*

🆔 ${bookingId}

${train.trainNo} ${train.trainName}
${train.departure} → ${train.arrival}

👉 Send availability screenshot`
  );

  return true;
};