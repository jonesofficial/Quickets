const express = require("express");
const router = express.Router();

const { razorpayWebhook } = require("../lib/payments/Razorpay_payments");
const { razorpayCardWebhook } = require("../lib/payments/Razorpay_Card");

/**
 * Razorpay Webhook
 * One endpoint → handles both QR + Card events
 */
router.post("/", (req, res) => {
  try {
    // Each handler ignores unrelated events
    razorpayWebhook(req, res);
    razorpayCardWebhook(req, res);
  } catch (err) {
    console.error("Razorpay webhook error:", err);
  }

  // ⚠️ Respond ONCE
  if (!res.headersSent) {
    res.json({ status: "ok" });
  }
});

module.exports = router;
