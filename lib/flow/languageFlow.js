// const { sendButtons, sendList } = require("../waClient");

// module.exports = async function languageFlow(ctx) {
//   if (ctx.session?.__isAdmin) return false;

//   const {
//     session: s,
//     msg,
//     lower,
//     interactiveType,
//     interactiveId,
//     from,
//     get,
//   } = ctx;

//   /* 🚫 ABSOLUTE BLOCK FOR ADMIN */
//   const ADMIN_NUMBER = process.env.ADMIN_NUMBER;
//   if (
//     ADMIN_NUMBER &&
//     from &&
//     from.replace(/\D/g, "").slice(-10) ===
//       ADMIN_NUMBER.replace(/\D/g, "").slice(-10)
//   ) {
//     return false;
//   }

//   /* ===============================
//    * 1️⃣ Show language selector (ONCE)
//    * =============================== */
//   if (!s.optionSet && s.state !== "LANG_SELECTION") {
//     s.state = "LANG_SELECTION";

//     await sendButtons(
//       from,
//       `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}\n\n${get(
//         "LANG_PROMPT",
//       )}`,
//       [
//         { id: "LANG_EN", title: get("LANG_EN_LABEL") },
//         { id: "LANG_TA", title: get("LANG_TA_LABEL") },
//         { id: "LANG_MORE", title: "🌍 Other Languages" },
//       ],
//     );
//     return true;
//   }

//   /* ===============================
//    * 2️⃣ Handle language selection
//    * =============================== */
//   if (s.state === "LANG_SELECTION") {
//     /* ---- Button selection ---- */
//     if (interactiveType === "button_reply") {
//       if (interactiveId === "LANG_EN") {
//         s.optionSet = "en";
//         s.lang = "en";
//       }

//       if (interactiveId === "LANG_TA") {
//         s.optionSet = "ta";
//         s.lang = "ta";
//       }

//       /* Show other language list */
//       if (interactiveId === "LANG_MORE") {
//         await sendList(from, "🌍 Select your language", "Other Languages", [
//           {
//             title: "Other Indian Languages",
//             rows: [
//               { id: "LANG_HI", title: "Hindi (हिन्दी)" },
//               { id: "LANG_TE", title: "Telugu (తెలుగు)" },
//               { id: "LANG_ML", title: "Malayalam (മലയാളം)" },
//               { id: "LANG_KN", title: "Kannada (ಕನ್ನಡ)" },
//               { id: "LANG_BN", title: "Bengali (বাংলা)" },
//               { id: "LANG_MR", title: "Marathi (मराठी)" },
//               { id: "LANG_GU", title: "Gujarati (ગુજરાતી)" },
//               { id: "LANG_PA", title: "Punjabi (ਪੰਜਾਬੀ)" },
//               { id: "LANG_OR", title: "Odia (ଓଡ଼ିଆ)" },
//               { id: "LANG_AS", title: "Assamese (অসমীয়া)" },
//             ],
//           },
//         ]);
//         return true;
//       }
//     }

//     /* ---- List selection (FIXED BUG) ---- */
//     if (interactiveType === "list_reply") {
//       const langMap = {
//         LANG_HI: "hi",
//         LANG_TE: "te",
//         LANG_ML: "ml",
//         LANG_KN: "kn",
//         LANG_BN: "bn",
//         LANG_MR: "mr",
//         LANG_GU: "gu",
//         LANG_PA: "pa",
//         LANG_OR: "or",
//         LANG_AS: "as",
//       };

//       if (langMap[interactiveId]) {
//         s.optionSet = langMap[interactiveId];
//         s.lang = langMap[interactiveId];
//       }
//     }

//     /* ---- Text fallback ---- */
//     if (msg.type === "text") {
//       if (["1", "en", "english"].includes(lower)) {
//         s.optionSet = "en";
//         s.lang = "en";
//       }

//       if (["2", "ta", "tamil", "தமிழ்"].includes(lower)) {
//         s.optionSet = "ta";
//         s.lang = "ta";
//       }

//       if (["3", "hi", "hindi", "हिन्दी", "हिंदी"].includes(lower)) {
//         s.optionSet = "hi";
//         s.lang = "hi";
//       }
//     }

//     /* ===============================
//      * 3️⃣ After selection → show menu
//      * =============================== */
//     if (s.optionSet) {
//       s.state = "IDLE";

//       console.log("Selected language:", s.lang);

//       await sendList(
//         from,
//         `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
//         get("MAIN"),
//         [
//           {
//             title: get("MAIN"),
//             rows: [
//               { id: "MENU_BOOK", title: get("MENU_BOOK") },
//               { id: "MENU_TRACK", title: get("MENU_TRACK") },
//               { id: "MENU_HELP", title: get("MENU_HELP") },
//               { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
//             ],
//           },
//         ],
//       );

//       return true;
//     }
//   }

//   return false;
// };
const { sendButtons, sendList, sendImage } = require("../waClient");
const { getWelcomeImage } = require("../media/welcomeImage");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = async function languageFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const {
    session: s,
    msg,
    lower,
    interactiveType,
    interactiveId,
    from,
    get,
  } = ctx;

  /* 🚫 BLOCK ADMIN NUMBER COMPLETELY */
  const ADMIN_NUMBER = process.env.ADMIN_NUMBER;
  if (
    ADMIN_NUMBER &&
    from &&
    from.replace(/\D/g, "").slice(-10) ===
      ADMIN_NUMBER.replace(/\D/g, "").slice(-10)
  ) {
    return false;
  }

  /* 🚫 NEVER INTERRUPT ACTIVE BOOKING */
  if (s.pendingBooking) return false;

  /* ==================================================
   * 1️⃣ Show language selector (only when bot starts)
   * ================================================== */
  if (!s.optionSet && s.state === "IDLE") {
    s.state = "LANG_SELECTION";

    const image = await getWelcomeImage();

    await sendImage(
      from,
      image,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`
    );

    await delay(3000);

    await sendButtons(from, `${get("LANG_PROMPT")}`, [
      { id: "LANG_EN", title: get("LANG_EN_LABEL") },
      { id: "LANG_TA", title: get("LANG_TA_LABEL") },
      { id: "LANG_MORE", title: "🌍 Other Languages" },
    ]);

    return true;
  }

  /* ==================================================
   * 2️⃣ Handle language selection
   * ================================================== */
  if (s.state === "LANG_SELECTION") {
    /* ---------- Button replies ---------- */
    if (interactiveType === "button_reply") {
      if (interactiveId === "LANG_EN") s.optionSet = "en";
      if (interactiveId === "LANG_TA") s.optionSet = "ta";

      if (interactiveId === "LANG_MORE") {
        await sendList(from, "🌍 Select your language", "Other Languages", [
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
              { id: "LANG_AS", title: "Assamese (অসমীয়া)" },
            ],
          },
        ]);
        return true;
      }
    }

    /* ---------- List replies ---------- */
    if (interactiveType === "list_reply") {
      const langMap = {
        LANG_HI: "hi",
        LANG_TE: "te",
        LANG_ML: "ml",
        LANG_KN: "kn",
        LANG_BN: "bn",
        LANG_MR: "mr",
        LANG_GU: "gu",
        LANG_PA: "pa",
        LANG_OR: "or",
        LANG_AS: "as",
      };

      if (langMap[interactiveId]) {
        s.optionSet = langMap[interactiveId];
      }
    }

    /* ---------- Text fallback ---------- */
    if (msg.type === "text") {
      if (["1", "en", "english"].includes(lower)) s.optionSet = "en";

      if (["2", "ta", "tamil", "தமிழ்"].includes(lower))
        s.optionSet = "ta";

      if (["3", "hi", "hindi", "हिन्दी", "हिंदी"].includes(lower))
        s.optionSet = "hi";
    }

    /* ==================================================
     * 3️⃣ After selection → show main menu
     * ================================================== */
    if (s.optionSet) {
      s.state = "IDLE";

      console.log("🌐 Language selected:", s.optionSet);

      await sendList(
        from,
        `*Quickets*

Book *Bus 🚌, Train 🚆, and Flight ✈️ tickets* directly on WhatsApp.

✅ *100% on WhatsApp*
No apps to install.
No redirects for booking.

Just chat, choose your trip, and receive your ticket.

🌐 *Our website:* www.quickets.co.in
(For information and updates)

*What would you like to do next?*`,
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
  }

  return false;
};