const trainsBetween = require("../../train/api/trainsBetween");
const formatTrains = require("../../train/utils/formatTrains");
const delay = require("../../utils/delay");
const { sendText } = require("../../waClient");

async function processTrainSearch(booking) {

  const user = booking.phone;

  await sendText(
    user,
    "🔎 *Searching trains...*\n\n🚆 Checking available routes\n⏱️ Please wait..."
  );

  const trains = await trainsBetween(
    booking.fromCode,
    booking.toCode
  );

  await delay(15000);

  if (!trains.length) {
    await sendText(user,"❌ No trains found.");
    return;
  }

  booking.availableTrains = trains;

  const msg = formatTrains(
    trains,
    booking.from,
    booking.to
  );

  await sendText(user,msg);
}

module.exports = processTrainSearch;