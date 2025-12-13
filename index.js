// index.js (ROOT)
const express = require("express");
const app = express();

app.use(express.json());

// 🔥 Single webhook entry (messages)
const flowHandler = require("./lib/flow"); // async (req, res)
app.post("/webhook", async (req, res) => {
  try {
    await flowHandler(req, res);
  } catch (err) {
    console.error("Webhook handler error:", err?.message || err);
    res.sendStatus(200); // always 200 to prevent retries
  }
});

// 🔒 Webhook verification (Meta / WhatsApp)
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// 🟢 Health check (optional but useful)
app.get("/", (req, res) => {
  res.status(200).send("Quickets WhatsApp Bot is running 🚍");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
