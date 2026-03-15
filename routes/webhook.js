
// const express = require("express");
// const router = express.Router();
// const flowHandler = require("../lib/flow");

// /* ==============================
//  * Meta / WhatsApp Verification
//  * ============================== */
// router.get("/", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
//     return res.status(200).send(challenge);
//   }

//   return res.sendStatus(403);
// });

// /* ==============================
//  * WhatsApp Message Webhook
//  * ============================== */
// router.post("/", async (req, res) => {

//   try {
//     await flowHandler(req, res);
//   } catch (err) {
//     console.error("WhatsApp webhook error:", err?.message || err);
//   }

//   // ✅ CRITICAL: send response ONLY ONCE
//   if (!res.headersSent) {
//     res.sendStatus(200);
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();

const flowHandler = require("../lib/flow");
const { startOrGet } = require("../lib/sessionStore");
const { buildContext } = require("../lib/flow/context");

/* ==============================

Meta / WhatsApp Verification

============================== */
router.get("/", (req, res) => {
const mode = req.query["hub.mode"];
const token = req.query["hub.verify_token"];
const challenge = req.query["hub.challenge"];

if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
return res.status(200).send(challenge);
}

return res.sendStatus(403);
});

/* ==============================

WhatsApp Message Webhook

============================== */
router.post("/", async (req, res) => {
try {

const msg =
req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

if (!msg) {
return res.sendStatus(200);
}

const from = msg.from;

/* 🔑 ALWAYS create/get session first */
const { session } = startOrGet(from);

/* 🧠 Build context */
const ctx = buildContext(req, session);

if (!ctx) {
return res.sendStatus(200);
}

/* 🚀 Run flow engine */
await flowHandler(ctx);

} catch (err) {
console.error("WhatsApp webhook error:", err?.message || err);
}

/* ✅ send response only once */
if (!res.headersSent) {
res.sendStatus(200);
}
});

module.exports = router;