// /**
//  * Quickets – Razorpay QR Payment Controller
//  * ----------------------------------------
//  * Responsibilities:
//  * 1. Create Razorpay QR (mandatory payment)
//  * 2. Send QR to user
//  * 3. Handle "I've Paid"
//  * 4. Handle Razorpay webhook confirmation (QR)
//  */

// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const { sendText, sendImage, sendButtons } = require("../waClient");

// // 🔐 Razorpay Init (TEST or LIVE keys)
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// /* ======================================================
//  * CREATE & SEND PAYMENT QR
//  * ====================================================== */
// async function sendPaymentQR(ctx) {
//   const { session: s, from } = ctx;
//   const booking = s.pendingBooking;
//   if (!booking) return;

//   const amount = booking.amount; // ₹

//   // Create Razorpay QR
//   const qr = await razorpay.qrcode.create({
//     type: "upi_qr",
//     name: `Quickets-${booking.id}`,
//     usage: "single_use",
//     fixed_amount: true,
//     payment_amount: amount * 100, // paise
//     description: `Ticket Booking ${booking.id}`,
//     notes: {
//       bookingId: booking.id,
//       phone: from,
//     },
//   });

//   // Save payment info
//   booking.payment = {
//     method: "RAZORPAY_QR",
//     qrId: qr.id,
//     status: "PENDING",
//     amount,
//   };

//   booking.status = "AWAITING_PAYMENT";
//   s.state = "PAYMENT_PENDING";

//   // Send QR image
//   await sendImage(
//     from,
//     qr.image_url,
//     `💳 *Payment Required*\n\nBooking ID: ${booking.id}\nAmount: ₹${amount}\n\nScan & pay to confirm your booking.`
//   );

//   // Buttons
//   await sendButtons(from, "After payment 👇", [
//     { id: "PAYMENT_DONE", title: "✅ I’ve Paid" },
//     { id: "CANCEL_BOOKING", title: "❌ Cancel" },
//   ]);
// }

// /* ======================================================
//  * HANDLE "I'VE PAID" BUTTON
//  * ====================================================== */
// async function handlePaymentDone(ctx) {
//   const { from } = ctx;

//   // Never trust user confirmation
//   await sendText(
//     from,
//     "⏳ Please wait while we verify your payment.\nYou’ll be notified automatically once it’s confirmed."
//   );
// }

// /* ======================================================
//  * RAZORPAY WEBHOOK HANDLER (QR)
//  * ====================================================== */
// function razorpayWebhook(req, res) {
//   const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

//   const body = JSON.stringify(req.body);
//   const signature = req.headers["x-razorpay-signature"];

//   const expectedSignature = crypto
//     .createHmac("sha256", secret)
//     .update(body)
//     .digest("hex");

//   if (signature !== expectedSignature) {
//     return res.status(400).send("Invalid signature");
//   }

//   const event = req.body.event;

//   // ✅ CORRECT EVENT FOR QR PAYMENTS
//   if (event === "qr_code.credited") {
//     const qr = req.body.payload.qr_code.entity;

//     markBookingPaid({
//       bookingId: qr.notes.bookingId,
//       paymentId: qr.id,
//       amount: qr.amount / 100,
//       phone: qr.notes.phone,
//     });
//   }

//   res.json({ status: "ok" });
// }

// /* ======================================================
//  * MARK BOOKING AS PAID
//  * ====================================================== */
// async function markBookingPaid({ bookingId, paymentId, amount, phone }) {
//   /**
//    * 🔁 Replace with DB logic
//    *
//    * booking.status = "PAID"
//    * booking.payment.status = "PAID"
//    * booking.payment.transactionId = paymentId
//    */

//   console.log("✅ PAYMENT CONFIRMED");
//   console.log("Booking:", bookingId);
//   console.log("Payment ID:", paymentId);

//   // Notify customer
//   await sendText(
//     phone,
//     `✅ *Payment Successful!*\n\nYour booking *${bookingId}* is confirmed.\n\nThank you for choosing Quickets 🚍`
//   );

//   // Notify admin
//   await sendText(
//     process.env.ADMIN_PHONE,
//     `💰 PAYMENT RECEIVED\n\nBooking ID: ${bookingId}\nAmount: ₹${amount}\nPayment ID: ${paymentId}`
//   );
// }

// /* ======================================================
//  * EXPORTS
//  * ====================================================== */
// module.exports = {
//   sendPaymentQR,
//   handlePaymentDone,
//   razorpayWebhook,
// };
/**
 * Quickets – Razorpay UPI QR Payments
 * ----------------------------------
 * Handles:
 * 1. Create Razorpay UPI QR
 * 2. Send QR image to WhatsApp (Base64)
 * 3. Verify Razorpay webhook (QR only)
 */

const Razorpay = require("razorpay");
const crypto = require("crypto");
const axios = require("axios");
const { sendText, sendImage } = require("../waClient");

/* ==============================
 * Razorpay Init
 * ============================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ======================================================
 * CREATE & SEND PAYMENT QR (BASE64 IMAGE)
 * ====================================================== */
async function sendPaymentQR(ctx) {
  const { session: s, from } = ctx;
  const booking = s.pendingBooking;

  if (!booking || !booking.amount || !booking.id) {
    console.error("❌ QR: Missing booking data");
    return;
  }

  /* 1️⃣ Create Razorpay QR */
  const qr = await razorpay.qrcode.create({
    type: "upi_qr",
    name: `Quickets-${booking.id}`,
    usage: "single_use",
    fixed_amount: true,
    payment_amount: booking.amount * 100, // paise
    description: `Ticket Booking ${booking.id}`,
    notes: {
      bookingId: booking.id,
      phone: from,
    },
  });

  /* 2️⃣ Save payment state */
  booking.payment = {
    method: "UPI_QR",
    qrId: qr.id,
    status: "PENDING",
    amount: booking.amount,
  };

  booking.status = "AWAITING_PAYMENT";
  s.state = "PAYMENT_PENDING";

  /* 3️⃣ Download QR image */
  const imageResp = await axios.get(qr.image_url, {
    responseType: "arraybuffer",
  });

  const imageBase64 = Buffer.from(imageResp.data).toString("base64");

  /* 4️⃣ Send QR image to WhatsApp */
  await sendImage(
    from,
    imageBase64,
    `💳 *Payment Required*\n\n` +
      `🆔 Booking ID: ${booking.id}\n` +
      `💰 Amount: ₹${booking.amount}\n\n` +
      `📱 Scan this QR using any UPI app.\n` +
      `Once paid, confirmation will be automatic.`,
    true // base64 mode
  );
}

/* ======================================================
 * RAZORPAY WEBHOOK (QR EVENTS ONLY)
 * ====================================================== */
function razorpayQRWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("❌ Razorpay QR signature mismatch");
    return res.status(400).send("Invalid signature");
  }

  /* ✅ Correct QR event */
  if (req.body.event === "qr_code.credited") {
    const qr = req.body.payload.qr_code.entity;

    markBookingPaid({
      bookingId: qr.notes.bookingId,
      paymentId: qr.id,
      amount: qr.amount / 100,
      phone: qr.notes.phone,
    });
  }

  res.json({ status: "ok" });
}

/* ======================================================
 * MARK BOOKING PAID (QR)
 * ====================================================== */
async function markBookingPaid({ bookingId, paymentId, amount, phone }) {
  console.log("✅ QR PAYMENT CONFIRMED");
  console.log("Booking:", bookingId);
  console.log("Payment:", paymentId);

  // Notify customer
  await sendText(
    phone,
    `✅ *Payment Successful!*\n\n` +
      `Your booking *${bookingId}* is confirmed.\n\n` +
      `Thank you for choosing Quickets 🚍`
  );

  // Notify admin
  await sendText(
    process.env.ADMIN_PHONE,
    `💰 *QR PAYMENT RECEIVED*\n\n` +
      `Booking ID: ${bookingId}\n` +
      `Amount: ₹${amount}\n` +
      `Payment ID: ${paymentId}`
  );
}

/* ======================================================
 * EXPORTS
 * ====================================================== */
module.exports = {
  sendPaymentQR,
  razorpayQRWebhook,
};
