// lib/flow/index.js

const { buildContext } = require("./context");

const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const summaryFlow = require("./summaryFlow"); // ✅ ADD THIS
const trackingFlow = require("./trackingFlow");
const fallbackFlow = require("./fallbackFlow");

const { handleAdminCommands } = require("../adminCommand");
const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

/* ==============================
 * Helpers
 * ============================== */
function normalize(num = "") {
  return String(num).replace(/\D/g, "").slice(-10);
}

function isAdminNumber(from) {
  return normalize(from) === normalize(ADMIN_NUMBER);
}

/* ==============================
 * FLOW BRAIN
 * ============================== */
module.exports = async function route(req, res) {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg || !msg.from) return;

  const from = msg.from;

  /* 🔐 ADMIN */
  if (isAdminNumber(from)) {
    const { session } = startOrGet(from);
    session.__isAdmin = true;

    const ctx = buildContext(req, session);
    if (!ctx) return;

    await handleAdminCommands(ctx);
    return;
  }

  /* 🧑 USER */
  if (isProcessed(msg.id)) return;
  markProcessed(msg.id);

  const { session } = startOrGet(from);
  const ctx = buildContext(req, session);
  if (!ctx) return;

  if (await languageFlow(ctx)) return;
  if (await menuFlow(ctx)) return;
  if (await bookingFlow(ctx)) return;
  if (await passengerFlow(ctx)) return;
  if (await summaryFlow(ctx)) return; // ✅ REVIEW + BUTTONS
  if (await trackingFlow(ctx)) return;

  await fallbackFlow(ctx);
};
