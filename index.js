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
console.log("ADMIN_NUMBER:", process.env.ADMIN_NUMBER);
console.log("ADMIN_PHONE:", process.env.ADMIN_PHONE);

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
  <title>Quickets – Book Tickets on WhatsApp</title>

  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      background: #000;
      color: #fff;
    }

    header {
      padding: 28px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .logo span {
      color: #f2cd1c;
    }

    .status-pill {
      background: #f2cd1c;
      color: #000;
      padding: 8px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
    }

    .hero {
      padding: 70px 22px 60px;
      text-align: center;
      max-width: 900px;
      margin: auto;
    }

    .hero h1 {
      font-size: 40px;
      line-height: 1.2;
      margin-bottom: 18px;
    }

    .hero h1 span {
      color: #f2cd1c;
    }

    .hero p {
      font-size: 18px;
      opacity: 0.85;
      max-width: 600px;
      margin: auto;
    }

    .travel-icons {
      margin-top: 28px;
      font-size: 40px;
      display: flex;
      justify-content: center;
      gap: 28px;
      opacity: 0.9;
    }

    .section {
      background: #fff;
      color: #000;
      padding: 60px 22px;
    }

    .section-inner {
      max-width: 900px;
      margin: auto;
    }

    .section h2 {
      font-size: 28px;
      margin-bottom: 30px;
      text-align: center;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin-top: 30px;
    }

    .step {
      background: #f7f7f7;
      border-radius: 14px;
      padding: 20px;
    }

    .step h3 {
      margin-bottom: 8px;
      font-size: 16px;
    }

    .step p {
      font-size: 14px;
      opacity: 0.8;
    }

    .highlight {
      background: #f2cd1c;
      color: #000;
      padding: 60px 22px;
      text-align: center;
    }

    .highlight h2 {
      font-size: 30px;
      margin-bottom: 12px;
    }

    .highlight p {
      font-size: 16px;
      opacity: 0.9;
    }

    footer {
      padding: 26px 22px;
      text-align: center;
      font-size: 13px;
      opacity: 0.6;
    }
  </style>
</head>

<body>

  <header>
    <div class="logo"><img src=".."</div>
    <div class="status-pill">Bot Live</div>
  </header>

  <section class="hero">
    <h1>
      Book Travel Tickets<br />
      <span>Just by Sending a Message</span>
    </h1>

    <p>
      Quickets lets you book Bus, Train, and Flight tickets directly on WhatsApp.
      No apps. No forms. Just chat.
    </p>

    <div class="travel-icons">
      ✈️ 🚌 🚆
    </div>
  </section>

  <section class="section">
    <div class="section-inner">
      <h2>How Quickets Works</h2>

      <div class="steps">
        <div class="step">
          <h3>📲 Open WhatsApp</h3>
          <p>Use the app you already trust and use every day.</p>
        </div>

        <div class="step">
          <h3>💬 Say “Hi”</h3>
          <p>Start a chat with Quickets to begin your booking.</p>
        </div>

        <div class="step">
          <h3>🎫 Get Your Ticket</h3>
          <p>Choose, pay, and receive your ticket instantly.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="highlight">
    <h2>WhatsApp-First. Travel-Smart.</h2>
    <p>Built for speed, simplicity, and real people.</p>
  </section>

  <footer>
    © 2026 Quickets • quickets.co.in
  </footer>

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

//deeeeeee

