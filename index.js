// index.js (ROOT)
const express = require("express");
require("dotenv").config();

const webhookRouter = require("./routes/webhook");

const app = express();

// WhatsApp requires raw JSON
app.use(express.json());

// Mount webhook
app.use("/webhook", webhookRouter);

// Health check (Render likes this)
app.get("/", (req, res) => {
  res.send("Quickets WhatsApp Bot is running 🚍");
});

// 🔥 CRITICAL: bind to PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
