// lib/flow/fallbackFlow.js
const { sendList, sendOopsTapOptions } = require("../waClient");

async function fallbackFlow(ctx) {
  const { session: s, msg, from, get } = ctx;

  // 🛡 Safety guard
  if (!s || !msg) return false;

  // Interactive fallback → ask user to retry
  if (msg.type === "interactive") {
    await sendOopsTapOptions(from);
    return true;
  }

  // Text fallback — only when idle
  if (msg.type === "text" && s.state === "IDLE") {
    await sendList(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
      get("MAIN"),
      [
        {
          title: get("MAIN"),
          rows: [
            { id: "MENU_BOOK", title: get("MENU_BOOK") },
            { id: "MENU_TRACK", title: get("MENU_TRACK") },
            { id: "MENU_HELP", title: get("MENU_HELP") },
            { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
          ],
        },
      ]
    );
    return true;
  }

  // Otherwise let other flows continue
  return false;
}

module.exports = fallbackFlow;
