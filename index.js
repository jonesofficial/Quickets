// index.js
require("dotenv").config();
const express = require("express");
const webhookRouter = require("./routes/webhook");

const app = express();
app.use(express.json());

app.use("/webhook", webhookRouter);

// health endpoint (kept exactly as before)
app.get("/health", (req, res) => res.status(200).json({ ok: true, ts: Date.now() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));
