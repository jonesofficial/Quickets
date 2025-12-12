// lib/privacy.js
const crypto = require("crypto");
const HMAC_SECRET = process.env.HMAC_SECRET || "please_set_HMAC_SECRET";
if (!process.env.HMAC_SECRET) {
  console.warn("Warning: HMAC_SECRET not set. Set a strong secret in env for privacy.");
}

const hmac = (s) => {
  return crypto.createHmac("sha256", HMAC_SECRET).update(String(s)).digest("hex");
};

const maskPhone = (ph) => {
  if (!ph) return "";
  const p = String(ph);
  const last = p.slice(-4);
  return `****${last}`;
};

const ageBracket = (age) => {
  if (!age || isNaN(age)) return "unknown";
  const a = Number(age);
  if (a < 2) return "<2";
  if (a <= 12) return "2-12";
  if (a <= 18) return "13-18";
  if (a <= 30) return "19-30";
  if (a <= 45) return "31-45";
  if (a <= 65) return "46-65";
  return "65+";
};

const anonymizePassenger = (p) => {
  const nameHash = hmac((p.name || "").toLowerCase().trim());
  return {
    id: nameHash,
    ageBracket: ageBracket(p.age),
    gender: p.gender || "O",
  };
};

module.exports = { hmac, maskPhone, ageBracket, anonymizePassenger };
