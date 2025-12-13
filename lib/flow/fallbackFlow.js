// lib/flow/fallbackFlow.js
const { sendList, sendText, sendOopsTapOptions } = require("../waClient");

async function handleFallback(ctx) {
  const { session: s, msg, from, get } = ctx;

  // Interactive fallback → guide user
  if (msg.type === "interactive") {
    await sendOopsTapOptions(from);
    return true;
  }

  // Text fallback — only if idle
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

  // Otherwise: do nothing (let current flow continue)
  return false;
}

module.exports = handleFallback;
