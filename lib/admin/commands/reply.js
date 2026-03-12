const { sendText } = require("../../waClient");
const { findBookingById } = require("../../bookingStore");

const ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleReplyCommand(ctx, text) {
  const from = ctx.from;

  // Only admin can use
  if (from !== ADMIN) return;

  if (!text.toLowerCase().startsWith("reply")) return;

  const parts = text.split(" ");

  if (parts.length < 3) {
    return sendText(from, "Usage:\nReply <BookingID> <message>");
  }

  const bookingId = parts[1];
  const message = parts.slice(2).join(" ");

  const booking = await findBookingById(bookingId);

  if (!booking) {
    return sendText(from, "❌ Booking not found.");
  }

  const userNumber =
    booking.phone || booking.number || booking.user || booking.from;

  const formattedMessage = `📩 Message from Quickets Support

${message}

To directly contact admin chat: 9894381195
To call: 8300984737`;

  await sendText(userNumber, formattedMessage);

  await sendText(from, "✅ Message sent to user.");
};