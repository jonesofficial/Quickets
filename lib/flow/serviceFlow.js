// lib/flow/serviceFlow.js
const { sendList } = require("../waClient");

module.exports = async function serviceFlow(ctx) {
  const { session: s, from, interactiveId, get } = ctx;
  if (!s) return false;

  /* =========================================
   * Do not interrupt active flows
   * ========================================= */
  if (s.state && s.state !== "IDLE") return false;

  /* =========================================
   * Show service selection
   * ========================================= */
  if (interactiveId === "MENU_BOOK") {
    s.state = "IDLE";
    s.pendingBooking = null;

    await sendList(
      from,
      get("CHOOSE_SERVICE"),
      get("SELECT"),
      [
        {
          title: get("SERVICES"),
          rows: [
            { id: "SERVICE_BUS", title: "🚌 Bus" },
            { id: "SERVICE_TRAIN", title: "🚆 Train" },
            { id: "SERVICE_FLIGHT", title: "✈️ Flight" },
          ],
        },
      ]
    );
    return true;
  }

  /* =========================================
   * BUS
   * ========================================= */
  if (interactiveId === "SERVICE_BUS") {
    s.pendingBooking = { type: "BUS" };
    s.state = null; // bookingFlow → bus/booking.js will start
    return true;
  }

  /* =========================================
   * TRAIN
   * ========================================= */
  if (interactiveId === "SERVICE_TRAIN") {
    s.pendingBooking = { type: "TRAIN" };
    s.state = null;
    return true;
  }

  /* =========================================
   * FLIGHT
   * ========================================= */
  if (interactiveId === "SERVICE_FLIGHT") {
    s.pendingBooking = { type: "FLIGHT" };
    s.state = null;
    return true;
  }

  return false;
};
