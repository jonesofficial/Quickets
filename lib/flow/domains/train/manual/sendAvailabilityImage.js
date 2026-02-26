const { sendImage, sendText } = require("../../../../waClient");

module.exports = async function sendAvailabilityImage({
  from,
  image,
  caption,
}) {
  if (!image) {
    await sendText(from, "⚠️ Availability image missing");
    return;
  }

  await sendImage(from, image);

  if (caption) {
    await sendText(from, caption);
  }
};