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
        background: #000;
        color: #fff;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      /* subtle travel icons in background */
      .bg-icons {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.06;
        font-size: 120px;
      }

      .bg-icons span {
        position: absolute;
      }

      .icon-plane { top: 10%; left: 8%; }
      .icon-bus { bottom: 15%; right: 10%; }
      .icon-train { top: 20%; right: 15%; }

      .container {
        position: relative;
        max-width: 420px;
        width: 90%;
        background: #000;
        color: #fff;
        border-radius: 18px;
        padding: 30px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      }

      .brand {
        text-align: center;
        font-weight: 800;
        font-size: 26px;
        letter-spacing: 0.6px;
      }

      .brand span {
        color: #f2cd1c;
      }

      .tagline {
        margin-top: 6px;
        text-align: center;
        font-size: 14px;
        opacity: 0.7;
      }

      .status {
        margin: 22px 0;
        padding: 14px;
        border-radius: 12px;
        background: #000;
        color: #f2cd1c;
        font-weight: 600;
        text-align: center;
      }

      .steps {
        margin-top: 10px;
      }

      .step {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 12px;
        margin-bottom: 10px;
        background: #f7f7f7;
        font-size: 14px;
      }

      .step-icon {
        font-size: 20px;
      }

      .highlight {
        color: #000;
        font-weight: 600;
      }

      .footer {
        margin-top: 24px;
        text-align: center;
        font-size: 12px;
        opacity: 0.6;
      }

      .accent-line {
        width: 50px;
        height: 4px;
        background: #f2cd1c;
        border-radius: 10px;
        margin: 14px auto 0;
      }
    </style>
  </head>

  <body>
    <div class="bg-icons">
      <span class="icon-plane">✈️</span>
      <span class="icon-bus">🚌</span>
      <span class="icon-train">🚆</span>
    </div>

    <div class="container">
      <div class="brand">
        Quickets
      </div>
      <div class="tagline">
        What if booking tickets was just a message?
      </div>

      <div class="accent-line"></div>

      <div class="status">
        ✅ WhatsApp Bot is Live
      </div>

      <div class="steps">
        <div class="step">
          <div class="step-icon">📲</div>
          <div>Open <span class="highlight">WhatsApp</span></div>
        </div>

        <div class="step">
          <div class="step-icon">💬</div>
          <div>Send <span class="highlight">Hi</span> to Quickets</div>
        </div>

        <div class="step">
          <div class="step-icon">🎫</div>
          <div>Book <span class="highlight">Bus · Train · Flight</span></div>
        </div>
      </div>

      <div class="footer">
        © 2026 Quickets • Built for instant travel
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

