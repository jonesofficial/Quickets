// lib/sessionStore.js
const crypto = require("crypto");
const HMAC_SECRET = process.env.HMAC_SECRET || "please_set_HMAC_SECRET";
const hmac = (s) => {
  return crypto.createHmac("sha256", HMAC_SECRET).update(String(s)).digest("hex");
};

const sessions = new Map(); // phoneHash -> session
let bookingSequence = 10000;

const newSession = () => ({
  state: "IDLE",
  savedPassengers: [], // [{id, ageBracket, gender}]
  pendingBooking: null,
  bookings: [], // confirmed bookings (anonymized)
  lastMessageAt: Date.now(),
});

const startOrGet = (phone) => {
  const key = hmac(phone);
  if (!sessions.has(key)) sessions.set(key, newSession());
  const s = sessions.get(key);
  s.lastMessageAt = Date.now();
  return { session: s, key };
};

const nextBookingId = () => `QK-${++bookingSequence}`;

const processedMessages = new Set();
const isProcessed = (msgId) => processedMessages.has(msgId);
const markProcessed = (msgId) => {
  if (!msgId) return;
  processedMessages.add(msgId);
  setTimeout(() => processedMessages.delete(msgId), 1000 * 60 * 60 * 24);
};

// Session cleanup (same as original)
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours session TTL
const CLEANUP_INTERVAL_MS = 1000 * 60 * 10; // every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, s] of sessions.entries()) {
    if (now - s.lastMessageAt > SESSION_TTL_MS) {
      sessions.delete(key);
      console.log(`Session ${key.slice(0,6)}.. expired and removed`);
    }
  }
}, CLEANUP_INTERVAL_MS);

module.exports = { sessions, startOrGet, nextBookingId, isProcessed, markProcessed };
