

// // index.js (ROOT)
// const express = require("express");
// const app = express();

// // ⚠️ IMPORTANT: Capture RAW body for Razorpay signature verification
// app.use(express.json({
//   verify: (req, res, buf) => {
//     req.rawBody = buf;
//   }
// }));

// /* ==============================
//  * WhatsApp Webhook
//  * ============================== */
// const whatsappWebhook = require("./routes/webhook");
// app.use("/webhook", whatsappWebhook);

// /* ==============================
//  * Razorpay Webhook
//  * ============================== */
// const razorpayWebhook = require("./routes/razorpayWebhook");
// app.use("/webhooks/razorpay", razorpayWebhook);

// app.get("/test-qr", async (req, res) => {
//   try {
//     console.log("🔑 KEY ID:", process.env.RAZORPAY_KEY_ID?.slice(0, 8));
//     console.log("🔑 SECRET EXISTS:", !!process.env.RAZORPAY_KEY_SECRET);
    


//     const Razorpay = require("razorpay");

//     const razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });

//     console.log("Razorpay keys:", Object.keys(razorpay));

//     const qr = await razorpay.qrCode.create({
//       type: "upi_qr",
//       name: "Quickets-Test",
//       usage: "single_use",
//       fixed_amount: true,
//       payment_amount: 100 * 100,
//       description: "QR Test",
//     });

//     console.log("✅ QR CREATED:", qr.id);

//     res.json({
//       id: qr.id,
//       image_url: qr.image_url,
//       status: qr.status,
//     });
//   } catch (err) {
//     console.error("❌ TEST QR ERROR");
//     console.error(err);

//     res.status(500).json({
//       error: err.message,
//       details: err.error || err,
//     });
//   }
// });

// /* ==============================
//  * Health Check
//  * ============================== */
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

/* ==============================
 * TEST: QR (UPI)
 * ============================== */
app.get("/test-qr", async (req, res) => {
  try {
    const Razorpay = require("razorpay");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Handle SDK naming difference safely
    const qrApi = razorpay.qrCode || razorpay.qrcode;
    if (!qrApi) {
      throw new Error("QR API not available in Razorpay SDK");
    }

    const qr = await qrApi.create({
      type: "upi_qr",
      name: "Quickets-Test-QR",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: 100 * 100, // ₹100
      description: "QR Test",
    });

    res.json({
      success: true,
      id: qr.id,
      image_url: qr.image_url,
      status: qr.status,
    });

  } catch (err) {
    console.error("❌ TEST QR ERROR:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: err.error || err,
    });
  }
});

/* ==============================
 * TEST: CARD / NET BANKING
 * ============================== */
app.get("/test-card", async (req, res) => {
  try {
    const Razorpay = require("razorpay");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const paymentLink = await razorpay.paymentLink.create({
      amount: 150 * 100, // ₹150
      currency: "INR",
      description: "Quickets Card Test",
      customer: {
        name: "Test User",
        email: "test@quickets.in",
        contact: "9000000000",
      },
      notify: {
        sms: false,
        email: false,
      },
      callback_url: "https://quickets.onrender.com",
      callback_method: "get",
    });

    res.json({
      success: true,
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      status: paymentLink.status,
    });

  } catch (err) {
    console.error("❌ TEST CARD ERROR:", err);
    res.status(500).json({
      success: false,
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
