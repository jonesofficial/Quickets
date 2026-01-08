// lib/sessionStore.js
const crypto = require("crypto");

const HMAC_SECRET = process.env.HMAC_SECRET || "dev_secret";

/* ==================================================
 * HMAC (session keying only)
 * ================================================== */
const hmac = (value) =>
  crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(String(value ?? ""))
    .digest("hex");

/* ==================================================
 * In-memory stores (PRIVATE)
 * ================================================== */
const sessions = new Map();          // phoneHash -> session
const processedMessages = new Set(); // msgId dedup

let bookingSequence = Date.now(); // avoids restart collisions

/* ==================================================
 * Session factory
 * ================================================== */
const newSession = () => ({
  state: "IDLE",

  pendingBooking: null,
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
const MAX_PROCESSED_IDS = 5000;

const isProcessed = (msgId) => processedMessages.has(msgId);

const markProcessed = (msgId) => {
  if (!msgId) return;

  processedMessages.add(msgId);

  // Soft cap to prevent memory spikes
  if (processedMessages.size > MAX_PROCESSED_IDS) {
    const first = processedMessages.values().next().value;
    processedMessages.delete(first);
  }

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
      console.log(`🧹 Session ${key.slice(0, 6)}… expired`);
    }
  }
}, CLEANUP_INTERVAL_MS);

/* ==================================================
 * Find booking by ID (ADMIN use)
 * ================================================== */
const findBookingById = (bookingId) => {
  if (!bookingId) return null;

  for (const session of sessions.values()) {
    // Check pending booking
    if (session.pendingBooking?.id === bookingId) {
      return session.pendingBooking;
    }

    // Check confirmed bookings
    if (Array.isArray(session.bookings)) {
      const found = session.bookings.find((b) => b.id === bookingId);
      if (found) return found;
    }
  }

  return null;
};


/* ==================================================
 * Exports (SAFE API only)
 * ================================================== */
module.exports = {
  startOrGet,
  nextBookingId,
  isProcessed,
  markProcessed,
  findBookingById
};
