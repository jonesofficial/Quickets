const { buildContext } = require("./context");
const { handleLanguage } = require("./languageFlow");
const { handleMenu } = require("./menuFlow");
const { handleBooking } = require("./bookingFlow");
const { handleTracking } = require("./trackingFlow");
const { handleFallback } = require("./feedbackFlow");
const { isProcessed, markProcessed } = require("../sessionStore");

async function route(req, res) {
  const ctx = buildContext(req);

  if (!ctx.msg) return res.sendStatus(200);

  if (isProcessed(ctx.msg.id)) return res.sendStatus(200);
  markProcessed(ctx.msg.id);

  if (await handleLanguage(ctx)) return res.sendStatus(200);
  if (await handleMenu(ctx)) return res.sendStatus(200);
  if (await handleBooking(ctx)) return res.sendStatus(200);
  if (await handleTracking(ctx)) return res.sendStatus(200);

  await handleFallback(ctx);
  res.sendStatus(200);
}

module.exports = route;
