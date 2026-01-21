
// const { sendText, sendList, sendButtons } = require("../../../waClient");
// const stationSearch = require("./api/stationSearch");
// const optionSets = require("../../../i18n/optionSets"); // adjust path if needed

// /* ======================================================
//  * Language helper (SAFE)
//  * ====================================================== */
// function t(lang, key) {
//   return (
//     optionSets[lang]?.[key] ??
//     optionSets.en[key] ??
//     key
//   );
// }

// /* ======================================================
//  * Utils
//  * ====================================================== */
// function isValidFutureDate(input) {
//   if (!input) return false;
//   if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) return false;

//   const [dd, mm, yyyy] = input.split("-").map(Number);
//   const selected = new Date(yyyy, mm - 1, dd);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   return selected >= today;
// }

// function safeText(msg, text) {
//   if (typeof text === "string") return text.trim();
//   if (msg?.text?.body) return msg.text.body.trim();
//   return null;
// }

// /* ======================================================
//  * Station helpers
//  * ====================================================== */
// function formatStationList(stations, titleKey, lang) {
//   return (
//     `🚉 *${t(lang, titleKey)}*\n` +
//     `${t(lang, "NUMBER_SELECT_HINT")}\n\n` +
//     stations.map((s, i) => `${i + 1}. ${s.name} (${s.code})`).join("\n")
//   );
// }

// async function resolveStations(query) {
//   if (!query || query.length < 2) return [];
//   return await stationSearch(query.trim(), 6);
// }

// /* ======================================================
//  * LIST SENDERS (TEXT ONLY CHANGED)
//  * ====================================================== */

// function sendClass(from, lang) {
//   return sendList(
//     from,
//     t(lang, "TRAIN_CLASS_HELP"),
//     t(lang, "CHOOSE_CLASS"),
//     [
//       {
//         title: t(lang, "AVAILABLE_CLASSES"),
//         rows: [
//           { id: "CLASS_SL", title: "Sleeper (SL)" },
//           { id: "CLASS_3A", title: "AC 3 Tier (3A)" },
//           { id: "CLASS_2A", title: "AC 2 Tier (2A)" },
//           { id: "CLASS_CC", title: "Chair Car (CC)" },
//           { id: "CLASS_2S", title: "Second Sitting (2S)" },
//         ],
//       },
//     ]
//   );
// }

// function sendQuota(from, lang) {
//   return sendList(
//     from,
//     t(lang, "TRAIN_QUOTA_HELP"),
//     t(lang, "CHOOSE_QUOTA"),
//     [
//       {
//         title: t(lang, "QUOTA_TYPE"),
//         rows: [
//           { id: "QUOTA_GEN", title: "General" },
//           { id: "QUOTA_TATKAL", title: "Tatkal" },
//           { id: "QUOTA_PT", title: "Premium Tatkal" },
//           { id: "QUOTA_LADIES", title: "Ladies" },
//           { id: "QUOTA_SC", title: "Senior Citizen" },
//         ],
//       },
//     ]
//   );
// }

// function sendBerth(from, lang) {
//   return sendList(
//     from,
//     t(lang, "TRAIN_BERTH_HELP"),
//     t(lang, "CHOOSE_BERTH"),
//     [
//       {
//         title: t(lang, "BERTH_PREFERENCE"),
//         rows: [
//           { id: "BERTH_L", title: "Lower Berth" },
//           { id: "BERTH_M", title: "Middle Berth" },
//           { id: "BERTH_U", title: "Upper Berth" },
//           { id: "BERTH_SL", title: "Side Lower" },
//           { id: "BERTH_SU", title: "Side Upper" },
//           { id: "BERTH_NONE", title: "No Preference" },
//         ],
//       },
//     ]
//   );
// }

// function sendPassengers(from, lang) {
//   return sendList(
//     from,
//     t(lang, "PASSENGER_COUNT_HELP"),
//     t(lang, "PASSENGERS"),
//     [
//       {
//         title: t(lang, "PASSENGER_COUNT"),
//         rows: [
//           { id: "PAX_1", title: "1" },
//           { id: "PAX_2", title: "2" },
//           { id: "PAX_3", title: "3" },
//           { id: "PAX_4", title: "4" },
//           { id: "PAX_5", title: "5" },
//           { id: "PAX_6", title: "6" },
//         ],
//       },
//     ]
//   );
// }

// /* ======================================================
//  * MAIN TRAIN BOOKING FLOW
//  * ====================================================== */
// module.exports = async function trainBookingFlow(ctx) {
//   const { session: s, msg, text, from } = ctx;
//   const lang = s.lang || "en";

//   try {
//     const cleanText = safeText(msg, text);
//     const upper = cleanText?.toUpperCase();

//     /* ================= GLOBAL ================= */

//     if (upper === "RETRY") return resend(ctx);

//     if (upper === "BOOK AGAIN") {
//       s.pendingBooking = null;
//       s.stationOptions = null;
//       s.state = null;
//       await sendText(from, t(lang, "BOOK_AGAIN_MSG"));
//       return false;
//     }

//     /* ================= ENTRY ================= */

//     if (!s.state) {
//       s.pendingBooking = {
//         type: "TRAIN",
//         from: null,
//         to: null,
//         date: null,
//         class: null,
//         quota: null,
//         berth: null,
//         paxCount: null,
//         status: "DRAFT",
//       };

//       s.state = "TRAIN_FROM";
//       await sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
//       return true;
//     }

//     /* ================= FROM ================= */

//     if (s.state === "TRAIN_FROM") {
//       if (/^\d+$/.test(cleanText)) {
//         const pick = s.stationOptions?.[Number(cleanText) - 1];
//         if (!pick) {
//           await sendText(from, t(lang, "INVALID_NUMBER"));
//           return true;
//         }

//         s.pendingBooking.from = pick;
//         s.stationOptions = null;
//         s.state = "TRAIN_TO";

//         await sendText(from, t(lang, "TRAIN_TO_PROMPT"));
//         return true;
//       }

//       const stations = await resolveStations(cleanText);
//       if (!stations.length) {
//         await sendText(from, t(lang, "NO_STATIONS_FOUND"));
//         return true;
//       }

//       s.stationOptions = stations;
//       await sendText(
//         from,
//         formatStationList(stations, "SELECT_FROM_STATION", lang)
//       );
//       return true;
//     }

//     /* ================= TO ================= */

//     if (s.state === "TRAIN_TO") {
//       if (/^\d+$/.test(cleanText)) {
//         const pick = s.stationOptions?.[Number(cleanText) - 1];
//         if (!pick || pick.code === s.pendingBooking.from.code) {
//           await sendText(from, t(lang, "FROM_TO_SAME_ERROR"));
//           return true;
//         }

//         s.pendingBooking.to = pick;
//         s.stationOptions = null;
//         s.state = "TRAIN_DATE";

//         await sendText(from, t(lang, "TRAIN_DATE_PROMPT"));
//         return true;
//       }

//       const stations = await resolveStations(cleanText);
//       if (!stations.length) {
//         await sendText(from, t(lang, "NO_STATIONS_FOUND"));
//         return true;
//       }

//       s.stationOptions = stations;
//       await sendText(
//         from,
//         formatStationList(stations, "SELECT_TO_STATION", lang)
//       );
//       return true;
//     }

//     /* ================= DATE ================= */

//     if (s.state === "TRAIN_DATE") {
//       if (!isValidFutureDate(cleanText)) {
//         await sendText(from, t(lang, "INVALID_DATE_MSG"));
//         return true;
//       }

//       s.pendingBooking.date = cleanText;
//       s.state = "TRAIN_CLASS";
//       await sendClass(from, lang);
//       return true;
//     }

//     /* ================= CLASS ================= */

//     if (s.state === "TRAIN_CLASS" && msg.type === "interactive") {
//       s.pendingBooking.class = msg.interactive.list_reply.title;
//       s.state = "TRAIN_QUOTA";
//       await sendQuota(from, lang);
//       return true;
//     }

//     /* ================= QUOTA ================= */

//     if (s.state === "TRAIN_QUOTA" && msg.type === "interactive") {
//       s.pendingBooking.quota = msg.interactive.list_reply.title;
//       s.state = "TRAIN_BERTH";
//       await sendBerth(from, lang);
//       return true;
//     }

//     /* ================= BERTH ================= */

//     if (s.state === "TRAIN_BERTH" && msg.type === "interactive") {
//       s.pendingBooking.berth = msg.interactive.list_reply.title;
//       s.state = "TRAIN_PASSENGERS";
//       await sendPassengers(from, lang);
//       return true;
//     }

//     /* ================= PASSENGERS ================= */

//     if (s.state === "TRAIN_PASSENGERS" && msg.type === "interactive") {
//       const id = msg.interactive?.list_reply?.id;
//       const count = Number(id?.replace("PAX_", ""));

//       if (!count || count < 1 || count > 6) {
//         await sendText(from, t(lang, "INVALID_PAX_COUNT"));
//         return true;
//       }

//       s.pendingBooking.paxCount = count;
//       s.state = "PAX_MODE";

//       await sendButtons(
//         from,
//         t(lang, "PASSENGER_ENTRY_MODE"),
//         [
//           { id: "PAX_ONEBYONE", title: t(lang, "PAX_ONEBYONE") },
//           { id: "PAX_BULK", title: t(lang, "PAX_BULK") },
//         ]
//       );

//       return true;
//     }

//     return false;
//   } catch (err) {
//     console.error("❌ Train Booking Error:", err);
//     await sendText(from, t(lang, "GENERIC_ERROR"));
//     return true;
//   }
// };

// /* ======================================================
//  * RESEND HANDLER (LANG ENABLED)
//  * ====================================================== */
// async function resend(ctx) {
//   const { session: s, from } = ctx;
//   const lang = s.lang || "en";

//   switch (s.state) {
//     case "TRAIN_FROM":
//       return sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
//     case "TRAIN_TO":
//       return sendText(from, t(lang, "TRAIN_TO_PROMPT"));
//     case "TRAIN_DATE":
//       return sendText(from, t(lang, "TRAIN_DATE_PROMPT"));
//     case "TRAIN_CLASS":
//       return sendClass(from, lang);
//     case "TRAIN_QUOTA":
//       return sendQuota(from, lang);
//     case "TRAIN_BERTH":
//       return sendBerth(from, lang);
//     case "TRAIN_PASSENGERS":
//       return sendPassengers(from, lang);
//     default:
//       return sendText(from, t(lang, "HELP_FALLBACK"));
//   }
// }
const { sendText, sendList, sendButtons } = require("../../../waClient");
const stationSearch = require("./api/stationSearch");
const optionSets = require("../../../i18n/optionSets");
const translate = require("@vitalets/google-translate-api").default;

/* ======================================================
 * Language helper (SAFE)
 * ====================================================== */
function t(lang, key) {
  return optionSets[lang]?.[key] ?? optionSets.en[key] ?? key;
}

/* ======================================================
 * Utils
 * ====================================================== */
function isValidFutureDate(input) {
  if (!input) return false;
  if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) return false;

  const [dd, mm, yyyy] = input.split("-").map(Number);
  const selected = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected >= today;
}

function safeText(msg, text) {
  if (typeof text === "string") return text.trim();
  if (msg?.text?.body) return msg.text.body.trim();
  return null;
}

/* ======================================================
 * 🌍 TRANSLATE TO ENGLISH (SIMPLE & CORRECT)
 * ====================================================== */
async function translateToEnglish(input, lang) {
  if (!input) return input;
  if (lang === "en") return input;

  try {
    const res = await translate(input, { to: "en" });
    return res.text;
  } catch (err) {
    console.error("❌ Translation failed:", err);
    return input;
  }
}

/* ======================================================
 * Station helpers
 * ====================================================== */
function formatStationList(stations, titleKey, lang) {
  return (
    `🚉 *${t(lang, titleKey)}*\n` +
    `${t(lang, "NUMBER_SELECT_HINT")}\n\n` +
    stations.map((s, i) => `${i + 1}. ${s.name} (${s.code})`).join("\n")
  );
}

async function resolveStations(query, lang) {
  if (!query || query.length < 2) return [];

  const translated = await translateToEnglish(query.trim(), lang);

  console.log("STATION SEARCH:", query, "→", translated);

  return await stationSearch(translated, 6);
}

/* ======================================================
 * LIST SENDERS
 * ====================================================== */

function sendClass(from, lang) {
  return sendList(from, t(lang, "TRAIN_CLASS_HELP"), t(lang, "CHOOSE_CLASS"), [
    {
      title: t(lang, "AVAILABLE_CLASSES"),
      rows: [
        { id: "CLASS_SL", title: "Sleeper (SL)" },
        { id: "CLASS_3A", title: "AC 3 Tier (3A)" },
        { id: "CLASS_2A", title: "AC 2 Tier (2A)" },
        { id: "CLASS_CC", title: "Chair Car (CC)" },
        { id: "CLASS_2S", title: "Second Sitting (2S)" },
      ],
    },
  ]);
}

function sendQuota(from, lang) {
  return sendList(from, t(lang, "TRAIN_QUOTA_HELP"), t(lang, "CHOOSE_QUOTA"), [
    {
      title: t(lang, "QUOTA_TYPE"),
      rows: [
        { id: "QUOTA_GEN", title: "General" },
        { id: "QUOTA_TATKAL", title: "Tatkal" },
        { id: "QUOTA_PT", title: "Premium Tatkal" },
        { id: "QUOTA_LADIES", title: "Ladies" },
        { id: "QUOTA_SC", title: "Senior Citizen" },
      ],
    },
  ]);
}

function sendBerth(from, lang) {
  return sendList(from, t(lang, "TRAIN_BERTH_HELP"), t(lang, "CHOOSE_BERTH"), [
    {
      title: t(lang, "BERTH_PREFERENCE"),
      rows: [
        { id: "BERTH_L", title: "Lower Berth" },
        { id: "BERTH_M", title: "Middle Berth" },
        { id: "BERTH_U", title: "Upper Berth" },
        { id: "BERTH_SL", title: "Side Lower" },
        { id: "BERTH_SU", title: "Side Upper" },
        { id: "BERTH_NONE", title: "No Preference" },
      ],
    },
  ]);
}

function sendPassengers(from, lang) {
  return sendList(
    from,
    t(lang, "PASSENGER_COUNT_HELP"),
    t(lang, "PASSENGERS"),
    [
      {
        title: t(lang, "PASSENGER_COUNT"),
        rows: [
          { id: "PAX_1", title: "1" },
          { id: "PAX_2", title: "2" },
          { id: "PAX_3", title: "3" },
          { id: "PAX_4", title: "4" },
          { id: "PAX_5", title: "5" },
          { id: "PAX_6", title: "6" },
        ],
      },
    ]
  );
}

/* ======================================================
 * MAIN TRAIN BOOKING FLOW
 * ====================================================== */
module.exports = async function trainBookingFlow(ctx) {
  const { session: s, msg, text, from } = ctx;
  const lang = s.lang || "en";

  try {
    const cleanText = safeText(msg, text);
    const upper = cleanText?.toUpperCase();

    if (upper === "RETRY") return resend(ctx);

    if (upper === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.stationOptions = null;
      s.state = null;
      await sendText(from, t(lang, "BOOK_AGAIN_MSG"));
      return false;
    }

    if (!s.state) {
      s.pendingBooking = {
        type: "TRAIN",
        from: null,
        to: null,
        date: null,
        class: null,
        quota: null,
        berth: null,
        paxCount: null,
        status: "DRAFT",
      };

      s.state = "TRAIN_FROM";
      await sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
      return true;
    }

    if (s.state === "TRAIN_FROM") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.stationOptions?.[Number(cleanText) - 1];
        if (!pick) {
          await sendText(from, t(lang, "INVALID_NUMBER"));
          return true;
        }

        s.pendingBooking.from = pick;
        s.stationOptions = null;
        s.state = "TRAIN_TO";
        await sendText(from, t(lang, "TRAIN_TO_PROMPT"));
        return true;
      }

      const stations = await resolveStations(cleanText, lang);
      if (!stations.length) {
        await sendText(from, t(lang, "NO_STATIONS_FOUND"));
        return true;
      }

      s.stationOptions = stations;
      await sendText(from, formatStationList(stations, "SELECT_FROM_STATION", lang));
      return true;
    }

    if (s.state === "TRAIN_TO") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.stationOptions?.[Number(cleanText) - 1];
        if (!pick || pick.code === s.pendingBooking.from.code) {
          await sendText(from, t(lang, "FROM_TO_SAME_ERROR"));
          return true;
        }

        s.pendingBooking.to = pick;
        s.stationOptions = null;
        s.state = "TRAIN_DATE";
        await sendText(from, t(lang, "TRAIN_DATE_PROMPT"));
        return true;
      }

      const stations = await resolveStations(cleanText, lang);
      if (!stations.length) {
        await sendText(from, t(lang, "NO_STATIONS_FOUND"));
        return true;
      }

      s.stationOptions = stations;
      await sendText(from, formatStationList(stations, "SELECT_TO_STATION", lang));
      return true;
    }

    if (s.state === "TRAIN_DATE") {
      if (!isValidFutureDate(cleanText)) {
        await sendText(from, t(lang, "INVALID_DATE_MSG"));
        return true;
      }

      s.pendingBooking.date = cleanText;
      s.state = "TRAIN_CLASS";
      await sendClass(from, lang);
      return true;
    }

    if (s.state === "TRAIN_CLASS" && msg.type === "interactive") {
      s.pendingBooking.class = msg.interactive.list_reply.title;
      s.state = "TRAIN_QUOTA";
      await sendQuota(from, lang);
      return true;
    }

    if (s.state === "TRAIN_QUOTA" && msg.type === "interactive") {
      s.pendingBooking.quota = msg.interactive.list_reply.title;
      s.state = "TRAIN_BERTH";
      await sendBerth(from, lang);
      return true;
    }

    if (s.state === "TRAIN_BERTH" && msg.type === "interactive") {
      s.pendingBooking.berth = msg.interactive.list_reply.title;
      s.state = "TRAIN_PASSENGERS";
      await sendPassengers(from, lang);
      return true;
    }

    if (s.state === "TRAIN_PASSENGERS" && msg.type === "interactive") {
      const count = Number(msg.interactive.list_reply.id.replace("PAX_", ""));
      if (!count || count < 1 || count > 6) {
        await sendText(from, t(lang, "INVALID_PAX_COUNT"));
        return true;
      }

      s.pendingBooking.paxCount = count;
      s.state = "PAX_MODE";

      await sendButtons(from, t(lang, "PASSENGER_ENTRY_MODE"), [
        { id: "PAX_ONEBYONE", title: t(lang, "PAX_ONEBYONE") },
        { id: "PAX_BULK", title: t(lang, "PAX_BULK") },
      ]);

      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ Train Booking Error:", err);
    await sendText(from, t(lang, "GENERIC_ERROR"));
    return true;
  }
};

/* ======================================================
 * RESEND HANDLER
 * ====================================================== */
async function resend(ctx) {
  const { session: s, from } = ctx;
  const lang = s.lang || "en";

  switch (s.state) {
    case "TRAIN_FROM":
      return sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
    case "TRAIN_TO":
      return sendText(from, t(lang, "TRAIN_TO_PROMPT"));
    case "TRAIN_DATE":
      return sendText(from, t(lang, "TRAIN_DATE_PROMPT"));
    case "TRAIN_CLASS":
      return sendClass(from, lang);
    case "TRAIN_QUOTA":
      return sendQuota(from, lang);
    case "TRAIN_BERTH":
      return sendBerth(from, lang);
    case "TRAIN_PASSENGERS":
      return sendPassengers(from, lang);
    default:
      return sendText(from, t(lang, "HELP_FALLBACK"));
  }
}
