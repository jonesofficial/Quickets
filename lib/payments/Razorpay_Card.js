/**
 * Quickets – Razorpay Card / NetBanking Payments
 * ---------------------------------------------
 * Uses Razorpay Payment Links
 *
 * Handles:
 * 1. Create Payment Link
 * 2. Send link to WhatsApp
 * 3. Verify webhook payment success
 */

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendText } = require("../waClient");

/* ==============================
 * Razorpay Init
 * ============================== */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ======================================================
 * CREATE & SEND PAYMENT LINK
 * ====================================================== */
async function sendCardPaymentLink(ctx) {
  const { session: s, from } = ctx;
  const booking = s.pendingBooking;

  if (!booking || !booking.amount || !booking.id) {
    console.error("❌ CARD: Missing booking data");
    return;
  }

  /* 1️⃣ Create Payment Link */
  const link = await razorpay.paymentLink.create({
    amount: booking.amount * 100, // paise
    currency: "INR",
    accept_partial: false,
    description: `Quickets Booking ${booking.id}`,
    reference_id: booking.id,
    customer: {
      contact: from,
    },
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    notes: {
      bookingId: booking.id,
      phone: from,
    },
  });

  /* 2️⃣ Save payment state */
  booking.payment = {
    method: "CARD_NETBANKING",
    linkId: link.id,
    shortUrl: link.short_url,
    status: "PENDING",
    amount: booking.amount,
  };

  booking.status = "AWAITING_PAYMENT";
  s.state = "PAYMENT_PENDING";

  /* 3️⃣ Send link to WhatsApp */
  await sendText(
    from,
    `💳 *Complete Your Payment*\n\n` +
      `🆔 Booking ID: ${booking.id}\n` +
      `💰 Amount: ₹${booking.amount}\n\n` +
      `👉 Pay securely using:\n` +
      `• Debit / Credit Card\n` +
      `• Net Banking\n` +
      `• Wallets\n\n` +
      `🔗 Payment Link:\n${link.short_url}\n\n` +
      `Once payment is successful, confirmation will be automatic.`
  );
}

/* ======================================================
 * RAZORPAY WEBHOOK (PAYMENT LINK)
 * ====================================================== */
function razorpayCardWebhook(req, res) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("❌ Razorpay Card signature mismatch");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;

  /* ✅ Payment Link Paid */
  if (event === "payment_link.paid") {
    const payment = req.body.payload.payment.entity;
    const link = req.body.payload.payment_link.entity;

    markBookingPaid({
      bookingId: link.reference_id,
      paymentId: payment.id,
      amount: payment.amount / 100,
      phone: link.customer.contact,
    });
  }

  res.json({ status: "ok" });
}

/* ======================================================
 * MARK BOOKING PAID (CARD)
 * ====================================================== */
async function markBookingPaid({ bookingId, paymentId, amount, phone }) {
  console.log("✅ CARD PAYMENT CONFIRMED");
  console.log("Booking:", bookingId);
  console.log("Payment:", paymentId);

  await sendText(
    phone,
    `✅ *Payment Successful!*\n\n` +
      `Your booking *${bookingId}* is confirmed.\n\n` +
      `Thank you for choosing Quickets 🚍`
  );

  await sendText(
    process.env.ADMIN_PHONE,
    `💰 *CARD PAYMENT RECEIVED*\n\n` +
      `Booking ID: ${bookingId}\n` +
      `Amount: ₹${amount}\n` +
      `Payment ID: ${paymentId}`
  );
}

/* ======================================================
 * EXPORTS
 * ====================================================== */
module.exports = {
  sendCardPaymentLink,
  razorpayCardWebhook,
};
