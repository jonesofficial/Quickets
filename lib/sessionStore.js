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
// const sessions = new Map();          // phoneHash -> session
// const processedMessages = new Set(); // msgId dedup

// /* ==================================================
//  * Session factory
//  * ================================================== */
// const newSession = () => ({
//   state: "IDLE",          // current flow state
//   pendingBooking: null,   // booking in progress
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

//   const session = sessions.get(key);
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
//   setTimeout(
//     () => processedMessages.delete(msgId),
//     1000 * 60 * 60 * 24
//   );
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
