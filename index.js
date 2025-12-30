// // index.js (ROOT)
// const express = require("express");
// const app = express();

// app.use(express.json());

// // 🔥 Single webhook entry (messages)
// const flowHandler = require("./lib/flow"); // async (req, res)
// app.post("/webhook", async (req, res) => {
//   try {
//     await flowHandler(req, res);
//   } catch (err) {
//     console.error("Webhook handler error:", err?.message || err);
//     res.sendStatus(200); // always 200 to prevent retries
//   }
// });

// // 🔒 Webhook verification (Meta / WhatsApp)
// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
//     return res.status(200).send(challenge);
//   }

//   return res.sendStatus(403);
// });

// // 🟢 Health check (optional but useful)
// app.get("/", (req, res) => {
//   res.status(200).send("Quickets WhatsApp Bot is running 🚍");
// });

// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`✅ Server listening on port ${PORT}`);
// });


// index.js (ROOT)
const express = require("express");
const app = express();

// ⚠️ IMPORTANT: Capture RAW body for Razorpay signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

/* ==============================
 * WhatsApp Webhook
 * ============================== */
const whatsappWebhook = require("./routes/webhook");
app.use("/webhook", whatsappWebhook);

/* ==============================
 * Razorpay Webhook
 * ============================== */
const razorpayWebhook = require("./routes/razorpayWebhook");
app.use("/webhooks/razorpay", razorpayWebhook);

app.get("/test-qr", async (req, res) => {
  try {
    console.log("🔑 KEY ID:", process.env.RAZORPAY_KEY_ID?.slice(0, 8));
    console.log("🔑 SECRET EXISTS:", !!process.env.RAZORPAY_KEY_SECRET);
    


    const Razorpay = require("razorpay");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log("Razorpay keys:", Object.keys(razorpay));

    const qr = await razorpay.qrCode.create({
      type: "upi_qr",
      name: "Quickets-Test",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: 100 * 100,
      description: "QR Test",
    });

    console.log("✅ QR CREATED:", qr.id);

    res.json({
      id: qr.id,
      image_url: qr.image_url,
      status: qr.status,
    });
  } catch (err) {
    console.error("❌ TEST QR ERROR");
    console.error(err);

    res.status(500).json({
      error: err.message,
      details: err.error || err,
    });
  }
});

/* ==============================
 * Health Check
 * ============================== */
app.get("/", (req, res) => {
  res.status(200).send("Quickets WhatsApp Bot is running 🚍");
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
