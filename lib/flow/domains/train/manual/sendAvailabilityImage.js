const { sendImage, sendText } = require("../../../../waClient");

/**
 * Sends availability image + status text
 */
module.exports = async function sendAvailabilityImage({
  from,
  image,
  statusText,
}) {
  if (!image) {
    await sendText(from, "⚠️ Availability image missing");
    return;
  }

  await sendImage(from, image);

  await sendText(
    from,
    `${statusText}\n\nReply *CONFIRM* to continue\nReply *CANCEL* to stop`
  );
};
