// lib/flow/index.js
const { buildContext } = require("./context");

const languageFlow = require("./language.flow");
const menuFlow = require("./menu.flow");
const bookingFlow = require("./booking.flow");
const passengerFlow = require("./passengerFlow");
const trackingFlow = require("./tracking.flow");
const fallbackFlow = require("./fallback.flow");

const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

module.exports = async function route(req, res) {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return res.sendStatus(200);

  // 🔒 Deduplicate
  if (isProcessed(msg.id)) return res.sendStatus(200);
  markProcessed(msg.id);

  // 🔑 Single session lookup (OLD BEHAVIOR)
  const { session } = startOrGet(msg.from);

  // 🔧 Build context with SAME session
  const ctx = buildContext(req, session);
  if (!ctx) return res.sendStatus(200);

  // 🔥 PRIORITY EXECUTION (CRITICAL)
  if (await languageFlow(ctx)) return res.sendStatus(200);
  if (await bookingFlow(ctx)) return res.sendStatus(200);
  if (await passengerFlow(ctx)) return res.sendStatus(200);
  if (await trackingFlow(ctx)) return res.sendStatus(200);
  if (await menuFlow(ctx)) return res.sendStatus(200);

  // 🧯 Fallback last
  await fallbackFlow(ctx);
  return res.sendStatus(200);
};
