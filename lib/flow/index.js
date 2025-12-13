// lib/flow/index.js
const { buildContext } = require("./context");

const { handleLanguage } = require("./languageFlow");
const { handleMenu } = require("./menuFlow");
const { handleBooking } = require("./bookingFlow");
const { passengerFlow } = require("./passengerFlow");
const { handleTracking } = require("./trackingFlow");
const { handleFallback } = require("./fallbackFlow");

const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

module.exports = async function route(req, res) {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return res.sendStatus(200);

  // 🔒 Deduplicate
  if (isProcessed(msg.id)) return res.sendStatus(200);
  markProcessed(msg.id);

  // 🔑 Single session lookup (OLD WORKING BEHAVIOR)
  const { session } = startOrGet(msg.from);

  // 🔧 Build context using SAME session
  const ctx = buildContext(req);
  if (!ctx || !ctx.msg) return res.sendStatus(200);

  /**
   * 🔥 Priority execution (matches old flowHandler.js)
   * Order is IMPORTANT
   */
  if (await handleLanguage(ctx)) return res.sendStatus(200);
  if (await handleBooking(ctx)) return res.sendStatus(200);
  if (await passengerFlow(ctx)) return res.sendStatus(200);
  if (await handleTracking(ctx)) return res.sendStatus(200);
  if (await handleMenu(ctx)) return res.sendStatus(200);

  // 🧯 Fallback LAST
  await handleFallback(ctx);
  return res.sendStatus(200);
};
