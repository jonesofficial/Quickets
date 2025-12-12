// routes/webhook.js
const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../lib/flowHandler");

// Webhook verify (GET) — same behavior as original
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST /webhook -> delegate to flow handler
router.post("/", (req, res) => handleWebhook(req, res));

module.exports = router;
