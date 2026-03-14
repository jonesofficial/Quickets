/* ==============================
 * ENV SETUP (MUST BE FIRST))
 * ============================== */
require("dotenv").config();

/* ==============================
 * Imports
 * ============================== */
const express = require("express");
const crypto = require("crypto");
const { exec } = require("child_process");

const app = express();

app.use("/assets", express.static("assets"));

/* ==============================
 * ENV LOG (debug – safe)
 * ============================== */
console.log("RAPID_API_KEY:", !!process.env.RAPID_API_KEY);
console.log("RAPID_API_HOST:", !!process.env.RAPID_API_HOST);
console.log("WEBHOOK_SECRET loaded:", !!process.env.WEBHOOK_SECRET);
console.log("ADMIN_NUMBER:", process.env.ADMIN_NUMBER);
console.log("ADMIN_PHONE:", process.env.ADMIN_PHONE);

/* ==============================
 * Middleware
 * - rawBody needed for GitHub webhook
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
 * GitHub Deploy – Health Check
 * ============================== */
app.get("/deploy", (req, res) => {
  res.status(200).send("Deploy endpoint is alive");
});

/* ==============================
 * GitHub Webhook Deploy (SAFE)
 * ============================== */
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

app.post("/deploy", (req, res) => {
  try {
    if (!WEBHOOK_SECRET) {
      console.error("❌ WEBHOOK_SECRET missing");
      return res.status(500).send("Server misconfigured");
    }

    const signature = req.headers["x-hub-signature-256"];
    if (!signature) {
      return res.status(401).send("❌ Missing signature");
    }

    const expectedSignature =
      "sha256=" +
      crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(req.rawBody || "")
        .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      return res.status(401).send("❌ Invalid signature");
    }

    // Only deploy from main branch
    if (req.body?.ref !== "refs/heads/main") {
      return res.status(200).send("ℹ️ Not main branch, ignored");
    }

    console.log("🚀 GitHub webhook verified. Deploying...");

    exec("/home/quicketsofficial/Quickets/deploy.sh", (err, stdout, stderr) => {
      if (err) {
        console.error("❌ Deploy failed:", stderr);
        return;
      }
      console.log(stdout);
    });

    res.status(200).send("🚀 Deploy triggered");
  } catch (err) {
    console.error("❌ Deploy webhook error:", err);
    res.status(500).send("Webhook error");
  }
});

/* ==============================
 * Health Check
 * ============================== */
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

/* ==============================
 * Root Page
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
body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  background: #000;
  color: #fff;
}
header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo {
  font-size: 26px;
  font-weight: 800;
}
.logo span { color: #f2cd1c; }
.hero {
  padding: 70px 20px;
  text-align: center;
}
.hero h1 {
  font-size: 40px;
}
.hero span { color: #f2cd1c; }
.icons {
  margin-top: 24px;
  font-size: 40px;
}
footer {
  padding: 20px;
  text-align: center;
  opacity: 0.6;
}
</style>
</head>
<body>

<header>
  <div class="logo">Quick<span>ets</span></div>
  <div>🟢 Bot Live</div>
</header>

<section class="hero">
  <h1>Book Tickets<br><span>Just by Messaging</span></h1>
  <p>Bus • Train • Flight — all on WhatsApp</p>
  <div class="icons">✈️ 🚌 🚆</div>
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
