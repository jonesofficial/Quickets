// lib/flow/menuFlow.js
const { sendButtons, sendList, sendText } = require("../waClient");

async function handleMenu(ctx) {
  const { session: s, interactiveType, interactiveId, from, get, text } = ctx;

  const wantsMenu =
    text &&
    ["menu", "hi", "hello", "start", "book", "quickets","hii"].some((w) =>
      text.toLowerCase().includes(w)
    );

  if (wantsMenu) {
    s.state = "IDLE";
    s.pendingBooking = null;

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

  if (interactiveType !== "list_reply") return false;

  if (interactiveId === "MENU_TRACK") {
    s.state = "TRACK_WAIT_ID";
    await sendText(from, get("TRACK_PROMPT"));
    return true;
  }

  if (interactiveId === "MENU_HELP") {
    await sendText(from, get("SUPPORT_INFO"));
    return true;
  }

  if (interactiveId === "MENU_ABOUT") {
    await sendText(from, get("ABOUT"));
    return true;
  }

  return false;
}

module.exports = { handleMenu };
