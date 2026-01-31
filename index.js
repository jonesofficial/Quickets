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
  res.send(`<h1>Quickets WhatsApp Bot is running 🚀</h1>`);
});

/* ==============================
 * Server Start
 * ============================== */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🚀 Quickets server booted at", new Date().toISOString());
  console.log(`✅ Server listening on port ${PORT}`);
});

//deeeee

