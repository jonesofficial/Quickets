// lib/flow/menuFlow.js
const { sendList, sendText } = require("../waClient");

module.exports = async function menuFlow(ctx) {
  const { session: s, from, get, interactiveId, msg, lower } = ctx;

  // 🔒 Do NOT interfere during critical flows
  if (!s) return false;
  if (s.state === "LANG_SELECTION") return false;
  if (s.state?.startsWith("BUS_")) return false;
  if (s.state === "TRACK_WAIT_ID") return false;

  // ✅ Explicit menu intent (robust)
  const wantsMenu =
    msg.type === "text" &&
    ["menu", "hi", "hello", "start", "home", "back"].some((k) =>
      lower.includes(k)
    );

  if (wantsMenu) {
    s.state = "IDLE";

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

  // 🟢 Menu button actions (LIST replies)
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

  return false;
};
