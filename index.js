// index.js (ROOT)
const express = require("express");
const app = express();

/* ==============================
 * Middleware
 * ============================== */
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

/* ==============================
 * WhatsApp Webhook
 * ============================== */
const whatsappWebhook = require("./routes/webhook");
app.use("/webhook", whatsappWebhook);

/* ==============================
 * Health Check
 * ============================== */
app.get("/", (req, res) => {
  res.status(200).send("Quickets WhatsApp Bot is running 🚍");
});

/* ==============================
 * Server Start
 * ============================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
