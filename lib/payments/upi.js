const QRCode = require("qrcode");
const { sendImage, sendButtons } = require("../waClient");
const { PAYMENT_AWAITING } = require("./paymentStates");

const UPI_ID = "test@upi"; // temporary
const PAYEE_NAME = "Quickets";

async function handleUpiQr(ctx) {
  const { session: s, from } = ctx;
  const b = s.pendingBooking;

  const upiUrl =
    `upi://pay?pa=${UPI_ID}` +
    `&pn=${PAYEE_NAME}` +
    `&am=${b.amount}` +
    `&tn=${b.id}`;

  const qrBuffer = await QRCode.toBuffer(upiUrl);

  await sendImage(
    from,
    qrBuffer,
    `💰 Amount: ₹${b.amount}\n🆔 Booking ID: ${b.id}`
  );

  await sendButtons(from, "After payment:", [
    { id: "PAY_DONE", title: "I've Paid" },
    { id: "PAY_HELP", title: "Need Help" },
  ]);

  b.payment = {
    method: "UPI_QR",
    status: "PENDING",
    createdAt: Date.now(),
  };

  s.state = PAYMENT_AWAITING;
}

module.exports = { handleUpiQr };
