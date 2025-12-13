// lib/flow/fallbackFlow.js
const { sendList, sendOopsTapOptions } = require("../waClient");

async function handleFallback(ctx) {
  const { msg, from, get } = ctx;

  if (msg.type === "interactive") {

    return true;
  }

  await sendList(from,
    `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
    get("MAIN"),
    [{
      title: get("MAIN"),
      rows: [
        { id: "MENU_BOOK", title: get("MENU_BOOK") },
        { id: "MENU_TRACK", title: get("MENU_TRACK") },
        { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
        { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
        { id: "MENU_HELP", title: get("MENU_HELP") },
        { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
      ],
    }]
  );
  return true;
}

module.exports = { handleFallback };
