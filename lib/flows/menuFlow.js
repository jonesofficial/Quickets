// lib/flow/menuFlow.js
const { sendList, sendText } = require("../waClient");

async function handleMenu(ctx) {
  const {
    msg,
    session: s,
    interactiveType,
    interactiveId,
    from,
    get,
    text,
  } = ctx;

  /**
   * =====================================================
   * 1️⃣ Handle MAIN / முகப்பு explicitly (ONLY this id)
   * =====================================================
   */
  if (interactiveType === "list_reply" && interactiveId === "MAIN") {
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
            { id: "MENU_BOOK", title: get("MENU_BOOK") },
            { id: "MENU_TRACK", title: get("MENU_TRACK") },
            { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
            { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
            { id: "MENU_HELP", title: get("MENU_HELP") },
            { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
          ],
        },
      ]
    );
    return true; // 🔥 OWNED
  }

  /**
   * =====================================================
   * 2️⃣ Text-based menu trigger (TEXT ONLY)
   * =====================================================
   */
  const wantsMenu =
    msg.type === "text" &&
    text &&
    ["menu", "hi", "hello", "start", "book", "quickets", "hii"].some((w) =>
      text.toLowerCase().includes(w)
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
            { id: "MENU_BOOK", title: get("MENU_BOOK") },
            { id: "MENU_TRACK", title: get("MENU_TRACK") },
            { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
            { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
            { id: "MENU_HELP", title: get("MENU_HELP") },
            { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
          ],
        },
      ]
    );
    return true; // 🔥 OWNED
  }

  /**
   * =====================================================
   * 3️⃣ From here on → LIST replies ONLY
   * =====================================================
   */
  if (interactiveType !== "list_reply") {
    return false; // let other flows handle
  }

  if (interactiveId === "MENU_TRACK") {
    s.state = "TRACK_WAIT_ID";
    await sendText(from, get("TRACK_PROMPT"));
    return true;
  }

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

  // MENU_BOOK, MENU_PASSENGERS etc are handled by other flows
  return false;
}

module.exports = { handleMenu };
