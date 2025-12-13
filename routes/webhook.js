// routes/webhook.js
const express = require("express");
const router = express.Router();
const { route } = require("../lib/flow");

// --------------------------------------------------
// Webhook verification (Meta / WhatsApp)
// --------------------------------------------------
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// --------------------------------------------------
// Incoming messages → modular flow router
// --------------------------------------------------
router.post("/", route);

module.exports = router;
