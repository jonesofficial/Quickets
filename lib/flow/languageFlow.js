// lib/flow/languageFlow.js
const { sendButtons, sendList } = require("../waClient");

module.exports = async function languageFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const {
    session: s,
    msg,
    interactiveType,
    interactiveId,
    from,
    get,
  } = ctx;

  /* ===============================
   * 1️⃣ SHOW LANGUAGE MENU
   * =============================== */
  if (!s.optionSet) {
    s.state = "LANG_SELECTION";

    await sendButtons(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}\n\n${get(
        "LANG_PROMPT"
      )}`,
      [
        { id: "LANG_EN", title: get("LANG_EN_LABEL") },
        { id: "LANG_TA", title: get("LANG_TA_LABEL") },
        { id: "LANG_HI", title: get("LANG_HI_LABEL") },
      ]
    );
    return true;
  }

  /* ===============================
   * 2️⃣ HANDLE LANGUAGE SELECTION
   * =============================== */
  if (s.state === "LANG_SELECTION") {
    if (interactiveType === "button_reply") {
      if (interactiveId === "LANG_EN") s.optionSet = "en";
      if (interactiveId === "LANG_TA") s.optionSet = "ta";
      if (interactiveId === "LANG_HI") s.optionSet = "hi";
    }

    if (msg.type === "text") {
      const t = msg.text.body.toLowerCase();
      if (["1", "en", "english"].includes(t)) s.optionSet = "en";
      if (["2", "ta", "tamil", "தமிழ்"].includes(t)) s.optionSet = "ta";
      if (["3", "hi", "hindi", "हिन्दी", "हिंदी"].includes(t)) s.optionSet = "hi";
    }

    /* ===============================
     * 3️⃣ AFTER SELECTION → MAIN MENU
     * =============================== */
    if (s.optionSet) {
      s.state = "IDLE";

      await sendList(
        from,
        `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
        get("MAIN"),
        [
          {
            title: "Menu",
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
  }

  return false;
};
