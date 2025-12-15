// lib/flow/index.js
const { buildContext } = require("./context");

const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const trackingFlow = require("./trackingFlow");
const fallbackFlow = require("./fallbackFlow");

const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

module.exports = async function route(req, res) {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // ✅ Ignore non-message webhooks (status, delivery, etc.)
    if (!msg || !msg.from) {
      return res.sendStatus(200);
    }

    // 🔒 Deduplicate
    if (isProcessed(msg.id)) {
      return res.sendStatus(200);
    }
    markProcessed(msg.id);

    // ✅ SAFE: msg.from guaranteed here
    const { session } = startOrGet(msg.from);

    // 🧠 Build context
    const ctx = buildContext(req, session);
    if (!ctx) {
      return res.sendStatus(200);
    }

    // 🔥 PRIORITY EXECUTION ORDER
    if (await languageFlow(ctx)) return res.sendStatus(200);
    if (await passengerFlow(ctx)) return res.sendStatus(200);
    if (await bookingFlow(ctx)) return res.sendStatus(200);
    if (await trackingFlow(ctx)) return res.sendStatus(200);
    if (await menuFlow(ctx)) return res.sendStatus(200);

    // 🧯 Final fallback
    await fallbackFlow(ctx);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.sendStatus(200); // never retry
  }
};
