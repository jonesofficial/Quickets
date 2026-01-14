// lib/flow/menuFlow.js
const { sendList, sendText } = require("../waClient");

module.exports = async function menuFlow(ctx) {
  const { session: s, from, msg, lower, interactiveId, get } = ctx;
  if (!s) return false;

  /* =========================================
   * Never interrupt active booking
   * ========================================= */
  if (s.pendingBooking) return false;

  /* =========================================
   * Explicit menu triggers ONLY
   * ========================================= */
  const wantsMenu =
    msg.type === "text" &&
    ["hi", "hello", "menu", "start", "home", "back"].includes(
      lower.trim()
    );

  if (wantsMenu) {
    s.state = "IDLE";
    s.pendingBooking = null;

    await sendList(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
      get("MAIN"),
      [
        {
          title: get("MAIN"),
          rows: [
            { id: "MENU_BOOK", title: "🎟 Book Ticket" },
            { id: "MENU_TRACK", title: get("MENU_TRACK") },
            { id: "MENU_HELP", title: get("MENU_HELP") },
          ],
        },
      ]
    );
    return true;
  }

  /* =========================================
   * Book → Choose Service
   * ========================================= */
  if (interactiveId === "MENU_BOOK") {
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
   * Service Selection
   * ========================================= */
  if (interactiveId === "SERVICE_BUS") {
    s.pendingBooking = { type: "BUS" };
    s.state = null;
    return true;
  }

  if (interactiveId === "SERVICE_TRAIN") {
    s.pendingBooking = { type: "TRAIN" };
    s.state = null;
    return true;
  }

  if (interactiveId === "SERVICE_FLIGHT") {
    s.pendingBooking = { type: "FLIGHT" };
    s.state = null;
    return true;
  }

  /* =========================================
   * Help
   * ========================================= */
  if (interactiveId === "MENU_HELP") {
    await sendText(from, get("SUPPORT_INFO"));
    return true;
  }

  return false;
};
