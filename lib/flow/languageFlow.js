// lib/flow/languageFlow.js
async function handleLanguage(ctx) {
  const { session: s, msg, lower, interactiveType, interactiveId, from, get } = ctx;

  // 1️⃣ Only show language selector ONCE
  if (!s.optionSet && s.state !== "LANG_SELECTION") {
    s.state = "LANG_SELECTION";

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

  // 2️⃣ Handle selection ONLY while in LANG_SELECTION
  if (s.state === "LANG_SELECTION") {
    if (interactiveType === "button_reply") {
      if (interactiveId === "LANG_EN") s.optionSet = "en";
      if (interactiveId === "LANG_TA") s.optionSet = "ta";
    }

    if (msg.type === "text") {
      if (["1", "en", "english"].includes(lower)) s.optionSet = "en";
      if (["2", "ta", "tamil", "தமிழ்"].includes(lower)) s.optionSet = "ta";
    }

    // ✅ Only NOW show menu ONCE
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
  }

  return false;
}
