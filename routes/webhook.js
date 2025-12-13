// routes/webhook.js
const express = require("express");
const router = express.Router();
const route = require("../lib/flows");

// Webhook verification
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// 🔥 Express now receives a real function
router.post("/", route);
console.log("TYPEOF route:", typeof route);
module.exports = router;
