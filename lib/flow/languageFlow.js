// lib/flow/languageFlow.js
const { sendButtons, sendList } = require("../waClient");

module.exports = async function languageFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const {
    session: s,
    msg,
    lower,
    interactiveType,
    interactiveId,
    from,
  } = ctx;

  /* 🚫 ABSOLUTE BLOCK FOR ADMIN */
  const ADMIN_NUMBER = process.env.ADMIN_NUMBER;
  if (
    ADMIN_NUMBER &&
    from &&
    from.replace(/\D/g, "").slice(-10) ===
      ADMIN_NUMBER.replace(/\D/g, "").slice(-10)
  ) {
    return false;
  }

  /* ===============================
   * 1️⃣ Show language selector
   * =============================== */
  if (!s.lang && s.state !== "LANG_SELECTION") {
    s.state = "LANG_SELECTION";

    await sendButtons(
      from,
      "👋 Welcome to *Quickets*\n\nPlease choose your language",
      [
        { id: "LANG_EN", title: "English" },
        { id: "LANG_TA", title: "தமிழ்" },
        { id: "LANG_HI", title: "हिन्दी" }
      ]
    );

    return true;
  }

  /* ===============================
   * 2️⃣ Handle language selection
   * =============================== */
  if (s.state === "LANG_SELECTION") {

    /* Button replies */
    if (interactiveType === "button_reply") {
      const map = {
        LANG_EN: "en",
        LANG_TA: "ta",
        LANG_HI: "hi",
        LANG_TE: "te",
        LANG_ML: "ml",
        LANG_KN: "kn",
        LANG_BN: "bn",
        LANG_MR: "mr",
        LANG_GU: "gu"
      };

      if (map[interactiveId]) {
        s.lang = map[interactiveId];
      }
    }

    /* Text fallback */
    if (msg.type === "text") {
      const textMap = {
        en: "en",
        english: "en",

        ta: "ta",
        tamil: "ta",
        "தமிழ்": "ta",

        hi: "hi",
        hindi: "hi",
        "हिंदी": "hi",

        te: "te",
        telugu: "te",

        ml: "ml",
        malayalam: "ml",

        kn: "kn",
        kannada: "kn",

        bn: "bn",
        bengali: "bn",

        mr: "mr",
        marathi: "mr",

        gu: "gu",
        gujarati: "gu"
      };

      if (textMap[lower]) {
        s.lang = textMap[lower];
      }
    }

    /* ===============================
     * 3️⃣ If language chosen
     * =============================== */
    if (s.lang) {
      s.state = "IDLE";

      await sendList(
        from,
        "Welcome to Quickets",
        "Main Menu",
        [
          {
            title: "Main Menu",
            rows: [
              { id: "MENU_BOOK", title: "Book Tickets" },
              { id: "MENU_TRACK", title: "Track Booking" },
              { id: "MENU_HELP", title: "Help" },
              { id: "MENU_ABOUT", title: "About Quickets" }
            ]
          }
        ]
      );

      return true;
    }

    /* ===============================
     * 4️⃣ Show full language list
     * =============================== */
    if (msg.type === "text") {
      await sendList(
        from,
        "Select your language",
        "View Languages",
        [
          {
            title: "Languages",
            rows: [
              { id: "LANG_EN", title: "English" },
              { id: "LANG_TA", title: "Tamil (தமிழ்)" },
              { id: "LANG_HI", title: "Hindi (हिन्दी)" },
              { id: "LANG_TE", title: "Telugu" },
              { id: "LANG_ML", title: "Malayalam" },
              { id: "LANG_KN", title: "Kannada" },
              { id: "LANG_BN", title: "Bengali" },
              { id: "LANG_MR", title: "Marathi" },
              { id: "LANG_GU", title: "Gujarati" }
            ]
          }
        ]
      );

      return true;
    }
  }

  return false;
};