const { sendText } = require("../waClient");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

async function notifyAdmin(text) {
  if (!ADMIN_NUMBER) {
    console.warn("⚠️ ADMIN_NUMBER not set");
    return;
  }

  // ✅ Send exactly as stored (international format)
  await sendText(ADMIN_NUMBER, text);
}

module.exports = { notifyAdmin };
