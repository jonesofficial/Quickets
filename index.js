require("dotenv").config();

const express = require("express");
const app = express();

console.log(process.env.RAPID_API_KEY);
console.log(process.env.RAPID_API_HOST);

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

/* ============================
 * WhatsApp Webhook
 * ============================== */
const whatsappWebhook = require("./routes/webhook");
app.use("/webhook", whatsappWebhook);

/* ==============================
 * Health Check (UptimeRobot)
 * ============================== */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ==============================
 * Root
 * ============================== */
app.get("/", (req, res) => {
  res.status(200).send("Quickets WhatsApp Bot is running 🚍");
});

/* ==============================
 * Server Start
 * ============================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Quickets server booted at", new Date().toISOString());
  console.log(`✅ Server listening on port ${PORT}`);
});
//added





