// lib/sessionStore.js
const crypto = require("crypto");

const HMAC_SECRET = process.env.HMAC_SECRET || "dev_secret";

/* ==================================================
 * HMAC (used ONLY for session keying)
 * ================================================== */
const hmac = (value) => {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(String(value ?? ""))
    .digest("hex");
};

/* ==================================================
 * In-memory session store
 * ================================================== */
const sessions = new Map(); // phoneHash -> session
let bookingSequence = 10000;

/* ==================================================
 * Session factory
 * ================================================== */
const newSession = () => ({
  state: "IDLE",

  // ✅ RAW passenger data (name, age, gender)
  savedPassengers: [],

  // Active booking (raw)
  pendingBooking: null,

  // Confirmed bookings (raw)
  bookings: [],

  lastMessageAt: Date.now(),
});

/* ==================================================
 * Create or fetch session
 * ================================================== */
const startOrGet = (phone) => {
  const key = hmac(phone);

  if (!sessions.has(key)) {
    sessions.set(key, newSession());
  }

  const session = sessions.get(key);
  session.lastMessageAt = Date.now();

  return { session, key };
};

/* ==================================================
 * Booking ID generator
 * ================================================== */
const nextBookingId = () => {
  bookingSequence += 1;
  return `QK-${bookingSequence}`;
};

/* ==================================================
 * Message de-duplication
 * ================================================== */
const processedMessages = new Set();

const isProcessed = (msgId) => processedMessages.has(msgId);

const markProcessed = (msgId) => {
  if (!msgId) return;

  processedMessages.add(msgId);

  // Auto-expire after 24 hours
  setTimeout(
    () => processedMessages.delete(msgId),
    1000 * 60 * 60 * 24
  );
};

/* ==================================================
 * Session cleanup (memory safety)
 * ================================================== */
const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const CLEANUP_INTERVAL_MS = 1000 * 60 * 10; // every 10 minutes

setInterval(() => {
  const now = Date.now();

  for (const [key, session] of sessions.entries()) {
    if (now - session.lastMessageAt > SESSION_TTL_MS) {
      sessions.delete(key);
      console.log(`🧹 Session ${key.slice(0, 6)}.. expired`);
    }
  }
}, CLEANUP_INTERVAL_MS);

/* ==================================================
 * Exports
 * ================================================== */
module.exports = {
  sessions,
  startOrGet,
  nextBookingId,
  isProcessed,
  markProcessed,
};
