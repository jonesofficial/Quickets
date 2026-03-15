// // lib/sessionStore.js
// const crypto = require("crypto");

// const HMAC_SECRET = process.env.HMAC_SECRET || "dev_secret";

// /* ==================================================
//  * HMAC (session keying only)
//  * ================================================== */
// const hmac = (value) =>
//   crypto
//     .createHmac("sha256", HMAC_SECRET)
//     .update(String(value ?? ""))
//     .digest("hex");

// /* ==================================================
//  * In-memory stores
//  * ================================================== */
// const sessions = new Map(); // phoneHash -> session
// const processedMessages = new Set(); // msgId dedup

// /* ==================================================
//  * Session factory
//  * ================================================== */
// const newSession = () => ({
//   state: "IDLE", // current flow state
//   pendingBooking: null, // booking in progress

//   data: {}, // 🔥 step-level temporary storage
//   stateHistory: [],
//   lastMessage: null, // 🔥 last sent message for RETRY

//   lastMessageAt: Date.now(),
// });

// /* ==================================================
//  * Create or fetch session
//  * ================================================== */
// const startOrGet = (phone) => {
//   const key = hmac(phone);

//   if (!sessions.has(key)) {
//     sessions.set(key, newSession());
//   }

//   let session = sessions.get(key);

//   // 🔥 Wrap session with Proxy once
//   if (!session.__isProxied) {
//     session.stateHistory = session.stateHistory || [];

//     session = new Proxy(session, {
//       set(target, prop, value) {
//         if (prop === "state") {
//           if (target.state && target.state !== value) {
//             target.stateHistory.push(target.state);
//           }
//         }
//         target[prop] = value;
//         return true;
//       },
//     });

//     session.__isProxied = true;
//     sessions.set(key, session);
//   }

//   session.lastMessageAt = Date.now();

//   return { session, key };
// };

// /* ==================================================
//  * Message de-duplication (CRITICAL)
//  * ================================================== */
// const MAX_PROCESSED_IDS = 5000;

// const isProcessed = (msgId) => processedMessages.has(msgId);

// const markProcessed = (msgId) => {
//   if (!msgId) return;

//   processedMessages.add(msgId);

//   // Soft cap
//   if (processedMessages.size > MAX_PROCESSED_IDS) {
//     const first = processedMessages.values().next().value;
//     processedMessages.delete(first);
//   }

//   // Auto-expire after 24 hours
//   setTimeout(() => processedMessages.delete(msgId), 1000 * 60 * 60 * 24);
// };

// /* ==================================================
//  * Session cleanup (memory safety)
//  * ================================================== */
// const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
// const CLEANUP_INTERVAL_MS = 1000 * 60 * 10; // every 10 minutes

// setInterval(() => {
//   const now = Date.now();

//   for (const [key, session] of sessions.entries()) {
//     if (now - session.lastMessageAt > SESSION_TTL_MS) {
//       sessions.delete(key);
//       console.log(`🧹 Session ${key.slice(0, 6)}… expired`);
//     }
//   }
// }, CLEANUP_INTERVAL_MS);

// /* ==================================================
//  * Exports (SAFE + MINIMAL)
//  * ================================================== */
// module.exports = {
//   startOrGet,
//   isProcessed,
//   markProcessed,
// };

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
 * In-memory stores
 * ================================================== */
const sessions = new Map();        // phoneHash -> session
const processedMessages = new Set(); // msgId dedup

/* ==================================================
 * Session factory
 * ================================================== */
const newSession = () => ({
  state: "IDLE",
  pendingBooking: null,

  data: {},
  stateHistory: [],
  lastMessage: null,

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

  let session = sessions.get(key);

  if (!session.__proxied) {

    session.stateHistory = session.stateHistory || [];

    const proxy = new Proxy(session, {
      set(target, prop, value) {

        if (prop === "state") {
          if (target.state && target.state !== value) {
            target.stateHistory.push(target.state);
          }
        }

        target[prop] = value;
        return true;
      },
    });

    proxy.__proxied = true;
    sessions.set(key, proxy);
    session = proxy;
  }

  session.lastMessageAt = Date.now();

  return { session, key };
};

/* ==================================================
 * Message de-duplication
 * ================================================== */

const MAX_PROCESSED_IDS = 5000;

const isProcessed = (msgId) => processedMessages.has(msgId);

const markProcessed = (msgId) => {

  if (!msgId) return;

  processedMessages.add(msgId);

  while (processedMessages.size > MAX_PROCESSED_IDS) {
    const first = processedMessages.values().next().value;
    processedMessages.delete(first);
  }

  // expire after 24h
  setTimeout(() => {
    processedMessages.delete(msgId);
  }, 1000 * 60 * 60 * 24);
};

/* ==================================================
 * Session cleanup
 * ================================================== */

const SESSION_TTL_MS = 1000 * 60 * 60 * 24;
const CLEANUP_INTERVAL_MS = 1000 * 60 * 10;

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
 * Exports
 * ================================================== */

module.exports = {
  startOrGet,
  isProcessed,
  markProcessed,
};