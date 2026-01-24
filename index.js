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
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Quickets – WhatsApp Ticket Booking</title>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #0f172a;
          color: white;
          padding: 40px;
          text-align: center;
        }
        .card {
          background: #020617;
          padding: 30px;
          border-radius: 12px;
          max-width: 600px;
          margin: auto;
        }
        a {
          color: #38bdf8;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚍 Quickets</h1>
        <p>Book Bus, Train & Flight tickets directly on WhatsApp.</p>

        <p><b>How it works:</b></p>
        <p>
          1️⃣ Message us on WhatsApp<br/>
          2️⃣ Choose Bus / Train / Flight<br/>
          3️⃣ Pay via UPI<br/>
          4️⃣ Get ticket instantly
        </p>

        <p>
          📲 Start booking on WhatsApp<br/>
          <a href="https://wa.me/91XXXXXXXXXX">Chat with Quickets</a>
        </p>

        <p style="opacity:0.6">
          API Status: ✅ Running
        </p>
      </div>
    </body>
    </html>
  `);
});

/* ==============================
 * Server Start
 * ============================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Quickets server booted at", new Date().toISOString());
  console.log(`✅ Server listening on port ${PORT}`);
});

// auto deploy test
