// // lib/flow/index.js

// const { buildContext } = require("./context");

// const languageFlow = require("./languageFlow");
// const menuFlow = require("./menuFlow");
// const bookingFlow = require("./bookingFlow");
// const passengerFlow = require("./passengerFlow");
// const trackingFlow = require("./trackingFlow");
// const fallbackFlow = require("./fallbackFlow");

// const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

// module.exports = async function route(req, res) {
//   try {
//     const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

//     // Ignore non-message webhooks
//     if (!msg || !msg.from) {
//       return res.sendStatus(200);
//     }

//     // Deduplicate message IDs
//     if (isProcessed(msg.id)) {
//       return res.sendStatus(200);
//     }
//     markProcessed(msg.id);

//     // Session init
//     const { session } = startOrGet(msg.from);

//     // Build context
//     const ctx = buildContext(req, session);
//     if (!ctx) {
//       return res.sendStatus(200);
//     }

//     /* ==================================================
//      * FLOW PRIORITY (TOP → BOTTOM)
//      * ================================================== */

//     // 1️⃣ Language selection (global)
//     if (await languageFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 2️⃣ Passenger flow (active booking only)
//     if (await passengerFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 3️⃣ Booking flow (active booking only)
//     if (await bookingFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 4️⃣ Tracking flow (explicit user action)
//     if (await trackingFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 5️⃣ Menu (idle users only)
//     if (await menuFlow(ctx)) {
//       return res.sendStatus(200);
//     }

//     // 6️⃣ Final fallback
//     await fallbackFlow(ctx);
//     return res.sendStatus(200);
//   } catch (err) {
//     console.error("Webhook handler error:", err);
//     return res.sendStatus(200); // never retry
//   }
// };

// lib/flow/index.js

const { buildContext } = require("./context");

const languageFlow = require("./languageFlow");
const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const trackingFlow = require("./trackingFlow");
const fallbackFlow = require("./fallbackFlow");
const paymentFlow = require("./paymentFlow");

const { handleAdminCommands } = require("../adminCommand");
const { startOrGet, isProcessed, markProcessed } = require("../sessionStore");

const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

function isAdmin(from) {
  return from === ADMIN_NUMBER;
}

module.exports = async function route(req, res) {
  try {
    const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    // Ignore non-message webhooks
    if (!msg || !msg.from) {
      return res.sendStatus(200);
    }

    // Deduplicate message IDs
    if (isProcessed(msg.id)) {
      return res.sendStatus(200);
    }
    markProcessed(msg.id);

    // Session init
    const { session } = startOrGet(msg.from);

    // Build context
    const ctx = buildContext(req, session);
    if (!ctx) {
      return res.sendStatus(200);
    }

    /* ==================================================
     * FLOW PRIORITY (TOP → BOTTOM)
     * ================================================== */

    // 0️⃣ ADMIN COMMANDS (HIGHEST PRIORITY)
    if (isAdmin(msg.from) && handleAdminCommands(ctx)) {
      console.log("✅ Admin command handled");
      return res.sendStatus(200);
    }

    // 1️⃣ PAYMENT FLOW
    if (await paymentFlow(ctx)) {
      return res.sendStatus(200);
    }

    // 2️⃣ Language selection (global)
    if (await languageFlow(ctx)) {
      return res.sendStatus(200);
    }

    // 3️⃣ Passenger flow (active booking only)
    if (await passengerFlow(ctx)) {
      return res.sendStatus(200);
    }

    // 4️⃣ Booking flow (active booking only)
    if (await bookingFlow(ctx)) {
      return res.sendStatus(200);
    }

    // 5️⃣ Tracking flow (explicit user action)
    if (await trackingFlow(ctx)) {
      return res.sendStatus(200);
    }

    // 6️⃣ Menu (idle users only)
    if (await menuFlow(ctx)) {
      return res.sendStatus(200);
    }

    // 7️⃣ Final fallback
    await fallbackFlow(ctx);
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.sendStatus(200); // never retry
  }
};
