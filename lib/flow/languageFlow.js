// lib/flow/languageFlow.js
const { sendButtons, sendList } = require("../waClient");

module.exports = async function languageFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const {
    session: s,
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
        { id: "SHOW_LANG_LIST", title: "🌍 All Languages" }
      ]
    );

    return true;
  }

  /* ===============================
   * 2️⃣ Handle button replies
   * =============================== */
  if (interactiveType === "button_reply") {

    if (interactiveId === "SHOW_LANG_LIST") {
      return showLanguageList(from);
    }

    const map = {
      LANG_EN: "en",
      LANG_TA: "ta"
    };

    if (map[interactiveId]) {
      s.lang = map[interactiveId];
    }
  }

  /* ===============================
   * 3️⃣ Handle list replies
   * =============================== */
  if (interactiveType === "list_reply") {
    const code = interactiveId.replace("LANG_", "").toLowerCase();
    s.lang = code;
  }

  /* ===============================
   * 4️⃣ After language selection
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

  return false;
};

/* ===============================
 * LANGUAGE LIST
 * =============================== */
async function showLanguageList(to) {
  return sendList(
    to,
    "🌍 Select your language",
    "Other Languages",
    [
      {
        title: "Other Indian Languages",
        rows: [
          { id: "LANG_HI", title: "Hindi (हिन्दी)" },
          { id: "LANG_TE", title: "Telugu (తెలుగు)" },
          { id: "LANG_ML", title: "Malayalam (മലയാളം)" },
          { id: "LANG_KN", title: "Kannada (ಕನ್ನಡ)" },
          { id: "LANG_BN", title: "Bengali (বাংলা)" },
          { id: "LANG_MR", title: "Marathi (मराठी)" },
          { id: "LANG_GU", title: "Gujarati (ગુજરાતી)" },
          { id: "LANG_PA", title: "Punjabi (ਪੰਜਾਬੀ)" },
          { id: "LANG_OR", title: "Odia (ଓଡ଼ିଆ)" },
          { id: "LANG_AS", title: "Assamese (অসমীয়া)" }
        ]
      }
    ]
  );
}