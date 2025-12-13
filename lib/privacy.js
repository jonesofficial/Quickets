// lib/privacy.js
const crypto = require("crypto");

const HMAC_SECRET = process.env.HMAC_SECRET || "dev_secret";

/* ==================================================
 * HMAC (used ONLY for session keys if needed)
 * ================================================== */
const hmac = (value) => {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(String(value ?? ""))
    .digest("hex");
};

/* ==================================================
 * Mask phone number (LOGS ONLY)
 * ================================================== */
const maskPhone = (ph) => {
  if (!ph) return "";
  const p = String(ph);
  return `****${p.slice(-4)}`;
};

module.exports = {
  hmac,
  maskPhone,
};
