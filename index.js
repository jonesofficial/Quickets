// require("dotenv").config();

// const express = require("express");
// const app = express();

// console.log(process.env.RAPID_API_KEY);
// console.log(process.env.RAPID_API_HOST);

// /* ==============================
//  * Middleware
//  * ============================== */
// app.use(
//   express.json({
//     verify: (req, res, buf) => {
//       req.rawBody = buf;
//     },
//   })
// );

// /* ============================
//  * WhatsApp Webhook
//  * ============================== */
// const whatsappWebhook = require("./routes/webhook");
// app.use("/webhook", whatsappWebhook);

// /* ==============================
//  * Health Check (UptimeRobot)
//  * ============================== */
// app.get("/health", (req, res) => {
//   res.status(200).send("OK");
// });

// /* ==============================
//  * Root
//  * ============================== */
// app.get("/", (req, res) => {
//   res.send(`<h1>Quickets WhatsApp Bot is running 🚀</h1>`);
// });


// /* ==============================
//  * Server Start
//  * ============================== */
// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log("🚀 Quickets server booted at", new Date().toISOString());
//   console.log(`✅ Server listening on port ${PORT}`);
// });





require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const { exec } = require("child_process");

const app = express();

/* ==============================
 * ENV LOG (optional)
 * ============================== */
console.log("RAPID_API_KEY:", !!process.env.RAPID_API_KEY);
console.log("RAPID_API_HOST:", !!process.env.RAPID_API_HOST);
console.log("WEBHOOK_SECRET loaded:", !!process.env.WEBHOOK_SECRET);

/* ==============================
 * Middleware (rawBody needed for GitHub webhook)
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
 * ============================ */
const whatsappWebhook = require("./routes/webhook");
app.use("/webhook", whatsappWebhook);

/* ==============================
 * GitHub Webhook Deploy (GET check)
 * ============================== */
app.get("/deploy", (req, res) => {
  res.status(200).send("Deploy endpoint is alive");
});


/* ==============================
 * GitHub Webhook Deploy
 * ============================== */
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.post("/deploy", (req, res) => {
  try {
    const signature = req.headers["x-hub-signature-256"];

    if (!signature) {
      return res.status(401).send("❌ Missing signature");
    }

    const hmac = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(req.rawBody)
      .digest("hex");

    const expectedSignature = `sha256=${hmac}`;

    if (signature !== expectedSignature) {
      return res.status(401).send("❌ Invalid signature");
    }

    // Deploy only on main branch
    if (req.body.ref !== "refs/heads/main") {
      return res.status(200).send("ℹ️ Not main branch, ignored");
    }

    console.log("🚀 GitHub webhook verified. Deploying...");

    exec(
      "/home/quicketsofficial/Quickets/deploy.sh",
      (error, stdout, stderr) => {
        if (error) {
          console.error("❌ Deploy failed:", stderr);
          return;
        }
        console.log(stdout);
      }
    );

    res.status(200).send("🚀 Deploy triggered");
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).send("Webhook error");
  }
});

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
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quickets Help</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
        color: #ffffff;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .container {
        max-width: 420px;
        width: 90%;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(12px);
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      }

      h1 {
        margin-top: 0;
        font-size: 26px;
        text-align: center;
      }

      p {
        opacity: 0.9;
        line-height: 1.6;
        text-align: center;
      }

      .status {
        margin: 20px 0;
        padding: 12px;
        border-radius: 10px;
        background: rgba(0, 255, 150, 0.15);
        color: #9cffd5;
        text-align: center;
        font-weight: 600;
      }

      .steps {
        margin-top: 20px;
      }

      .step {
        background: rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 10px;
        font-size: 14px;
      }

      .footer {
        margin-top: 24px;
        text-align: center;
        font-size: 12px;
        opacity: 0.7;
      }

      .brand {
        font-weight: 700;
        letter-spacing: 0.5px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚀 Quickets WhatsApp Bot</h1>

      <p>
        Book <strong>Bus</strong>, <strong>Train</strong>, and <strong>Flight</strong> tickets
        with just a message on WhatsApp.
      </p>

      <div class="status">
        ✅ Bot is running and healthy
      </div>

      <div class="steps">
        <div class="step">1️⃣ Open WhatsApp</div>
        <div class="step">2️⃣ Send <strong>Hi</strong> to Quickets</div>
        <div class="step">3️⃣ Follow the chat to book tickets</div>
      </div>

      <div class="footer">
        <span class="brand">Quickets</span> • What if booking tickets was just a message?
      </div>
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

//deeeeeeee

