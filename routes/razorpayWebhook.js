const express = require("express");
const router = express.Router();
const { razorpayWebhook } = require("../lib/flow/Razorpaypayments");

/**
 * Razorpay Webhook
 * ⚠️ Must respond FAST with 200
 */
router.post("/", (req, res) => {
  razorpayWebhook(req, res);
});

module.exports = router;
