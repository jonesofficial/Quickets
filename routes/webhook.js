// routes/webhook.js
const express = require("express");
const router = express.Router();

// ✅ IMPORT THE ACTUAL FUNCTION
const route = require("../index"); // ← ROOT index.js

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// ✅ PASS FUNCTION, NOT OBJECT
router.post("/", route);

module.exports = router;
