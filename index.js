// index.js (ROOT)
const { buildContext } = require("./lib/flow/context");
const { handleLanguage } = require("./lib/flow/languageFlow");
const { handleMenu } = require("./lib/flow/menuFlow");
const { handleBooking } = require("./lib/flow/bookingFlow");
const { handleTracking } = require("./lib/flow/trackingFlow");
const { handleFallback } = require("./lib/flow/feedbackFlow");
const { isProcessed, markProcessed } = require("./lib/sessionStore");

async function route(req, res) {
  const ctx = buildContext(req);

  if (!ctx.msg) return res.sendStatus(200);

  // ✅ SINGLE dedupe location (ONLY HERE)
  if (isProcessed(ctx.msg.id)) return res.sendStatus(200);
  markProcessed(ctx.msg.id);

  if (await handleLanguage(ctx)) return res.sendStatus(200);
  if (await handleMenu(ctx)) return res.sendStatus(200);
  if (await handleBooking(ctx)) return res.sendStatus(200);
  if (await handleTracking(ctx)) return res.sendStatus(200);

  await handleFallback(ctx);
  res.sendStatus(200);
}

// 🔥 REQUIRED: export the FUNCTION
module.exports = route;
