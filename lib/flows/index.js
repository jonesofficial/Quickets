// lib/flow/index.js
const { buildContext } = require("./context");
const { handleLanguage } = require("./languageFlow");
const { handleMenu } = require("./menuFlow");
const { handleBooking } = require("./bookingFlow");
const { handlePassenger } = require("./passengerFlow"); // ✅ ADD
const { handleTracking } = require("./trackingFlow");
const { handleFallback } = require("./fallbackFlow");

async function route(req, res) {
  const ctx = buildContext(req);
  if (!ctx.msg || ctx.duplicate) return res.sendStatus(200);

  // Order matters
  if (await handleLanguage(ctx)) return res.sendStatus(200);
  if (await handleMenu(ctx)) return res.sendStatus(200);
  if (await handleBooking(ctx)) return res.sendStatus(200);
  if (await handlePassenger(ctx)) return res.sendStatus(200); // ✅ ADD
  if (await handleTracking(ctx)) return res.sendStatus(200);

  await handleFallback(ctx);
  res.sendStatus(200);
}

module.exports = { route };
