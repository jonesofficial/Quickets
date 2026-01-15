const { sendText } = require("../waClient");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

function normalize(num = "") {
  return String(num).replace(/\D/g, "").slice(-10);
}

async function notifyAdmin(text) {
  if (!ADMIN_NUMBER) return;

  const admin = normalize(ADMIN_NUMBER);
  await sendText(admin, text);
}

module.exports = { notifyAdmin };
