// lib/flow/languageFlow.js
const { sendButtons, sendList, sendText } = require("../waClient");

async function handleLanguage(ctx) {
  const { session: s, msg, lower, interactiveType, interactiveId, from, get } = ctx;

  // 🔥 Always run first until language is chosen
  if (!s.optionSet) {
    s.state = "LANG_SELECTION";

    // Button reply
    if (interactiveType === "button_reply") {
      if (interactiveId === "LANG_EN") s.optionSet = "en";
      if (interactiveId === "LANG_TA") s.optionSet = "ta";
    }

    // Text fallback
    if (msg.type === "text") {
      if (["1", "en", "english"].includes(lower)) s.optionSet = "en";
      if (["2", "ta", "tamil", "தமிழ்"].includes(lower)) s.optionSet = "ta";
    }

    // If language chosen → show menu
    if (s.optionSet) {
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
              { id: "MENU_MYBOOK", title: get("MENU_MYBOOK") },
              { id: "MENU_PASSENGERS", title: get("MENU_PASSENGERS") },
              { id: "MENU_HELP", title: get("MENU_HELP") },
              { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
            ],
          },
        ]
      );
      return true;
    }

    // Show language buttons (once)
    await sendButtons(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}\n\n${get("LANG_PROMPT")}`,
      [
        { id: "LANG_EN", title: get("LANG_EN_LABEL") },
        { id: "LANG_TA", title: get("LANG_TA_LABEL") },
      ]
    );
    return true;
  }

  return false;
}

module.exports = handleLanguage;
