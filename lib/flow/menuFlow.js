// lib/flow/menuFlow.js

const { sendList, sendText } = require("../waClient");

module.exports = async function menuFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;
  const { session: s, from, get, interactiveId, msg, lower } = ctx;

  if (!s) return false;

  /* ==================================================
   * HARD BLOCKS — never interrupt active flows
   * ================================================== */
  // 🚫 NEVER handle interactive replies here
 if (msg?.type === "interactive" && s.state !== "IDLE") return false;
  if (s.pendingBooking) return false;
  if (s.state === "LANG_SELECTION") return false;
  if (s.state === "TRACK_WAIT_ID") return false;
  if (s.state && s.state.startsWith("BUS_")) return false;

  /* ==================================================
   * SHOW MENU (IDLE ONLY)
   * ================================================== */
  const wantsMenu =
    msg.type === "text" &&
    ["menu", "hi", "hello", "start", "home", "back"].some((k) =>
      lower.includes(k)
    );

  if (wantsMenu || s.state === "IDLE") {
    s.state = "IDLE";

    await sendList(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
      get("MAIN"),
      [
        {
          title: get("MAIN"),
          rows: [
           { id: "MENU_BOOK_BUS", title: "🚌 Bus Ticket" },
           { id: "MENU_BOOK_TRAIN", title: "🚆 Train Ticket" },
           { id: "MENU_TRACK", title: get("MENU_TRACK") },
           { id: "MENU_HELP", title: get("MENU_HELP") },
           { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
          ],
        },
      ]
    );
    return true;
  }

  /* ==================================================
   * MENU ACTIONS
   * ================================================== */
  if (interactiveId === "MENU_HELP") {
    await sendText(from, get("SUPPORT_INFO"));
    s.state = "IDLE";
    return true;
  }

  if (interactiveId === "MENU_ABOUT") {
    await sendText(from, get("ABOUT"));
    s.state = "IDLE";
    return true;
  }

  if (interactiveId === "MENU_BOOK_BUS") {
  s.pendingBooking = {
    type: "BUS",
    user: from,
    status: "DRAFT",
  };

  s.state = "BUS_FROM";
  return true;
}

if (interactiveId === "MENU_BOOK_TRAIN") {
  s.pendingBooking = {
    type: "TRAIN",
    user: from,
    status: "DRAFT",
  };

  s.state = null; // let train flow start
  return true;
}


  return false;
};
