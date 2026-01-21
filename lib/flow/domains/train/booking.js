// const { sendText, sendList, sendButtons } = require("../../../waClient");
// const stationSearch = require("./api/stationSearch");

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
// function formatStationList(stations, title) {
//   return (
//     `🚉 *${title}*\n` +
//     `Reply with the *number* from the list below:\n\n` +
//     stations.map((s, i) => `${i + 1}. ${s.name} (${s.code})`).join("\n")
//   );
// }

// async function resolveStations(query) {
//   if (!query || query.length < 2) return [];
//   return await stationSearch(query.trim(), 6);
// }

// /* ======================================================
//  * LIST SENDERS (WITH EXPLANATIONS)
//  * ====================================================== */

// function sendClass(from) {
//   return sendList(
//     from,
//     "🚆 *Select Travel Class*\n\n" +
//       "This decides the coach type you’ll travel in.\n\n" +
//       "✍️ *Example:*\nSleeper is economical, AC classes are more comfortable.",
//     "Choose Class",
//     [
//       {
//         title: "Available Classes",
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

// function sendQuota(from) {
//   return sendList(
//     from,
//     "🎟 *Select Booking Quota*\n\n" +
//       "Quota affects seat availability and booking rules.\n\n" +
//       "✍️ *Example:*\nGeneral = normal booking\nTatkal = last-minute booking",
//     "Choose Quota",
//     [
//       {
//         title: "Quota Type",
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

// function sendBerth(from) {
//   return sendList(
//     from,
//     "🛏 *Berth Preference (Optional)*\n\n" +
//       "This is only a preference.\nActual allotment depends on availability.\n\n" +
//       "✍️ *Example:*\nChoose *Lower Berth* if you prefer easy access.",
//     "Choose Berth",
//     [
//       {
//         title: "Berth Preference",
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

// function sendPassengers(from) {
//   return sendList(
//     from,
//     "👥 *Number of Passengers*\n\n" +
//       "Select how many people will travel.\n\n" +
//       "✍️ *Example:*\nIf 2 people are travelling, choose *2*.",
//     "Passengers",
//     [
//       {
//         title: "Passengers Count",
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

//   try {
//     const cleanText = safeText(msg, text);
//     const upper = cleanText?.toUpperCase();

//     /* ================= GLOBAL ================= */

//     if (upper === "RETRY") return resend(ctx);

//     if (upper === "BOOK AGAIN") {
//       s.pendingBooking = null;
//       s.stationOptions = null;
//       s.state = null;
//       await sendText(from, "🔄 Starting a new train booking…");
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
//       await sendText(
//         from,
//         "📍 *FROM Station*\n\n" +
//           "Enter the starting railway station.\n\n" +
//           "✍️ *Example:*\nChennai\nBangalore\nMAS"
//       );
//       return true;
//     }

//     /* ================= FROM ================= */

//     if (s.state === "TRAIN_FROM") {
//       if (/^\d+$/.test(cleanText)) {
//         const pick = s.stationOptions?.[Number(cleanText) - 1];
//         if (!pick) {
//           await sendText(from, "❌ Invalid number. Please choose from the list.");
//           return true;
//         }

//         s.pendingBooking.from = pick;
//         s.stationOptions = null;
//         s.state = "TRAIN_TO";

//         await sendText(
//           from,
//           "🎯 *TO Station*\n\n" +
//             "Enter the destination railway station.\n\n" +
//             "✍️ *Example:*\nMumbai\nDelhi\nMAS"
//         );
//         return true;
//       }

//       const stations = await resolveStations(cleanText);
//       if (!stations.length) {
//         await sendText(
//           from,
//           "❌ No stations found.\n\n✍️ Example:\nChennai\nMAS"
//         );
//         return true;
//       }

//       s.stationOptions = stations;
//       await sendText(from, formatStationList(stations, "Select FROM station"));
//       return true;
//     }

//     /* ================= TO ================= */

//     if (s.state === "TRAIN_TO") {
//       if (/^\d+$/.test(cleanText)) {
//         const pick = s.stationOptions?.[Number(cleanText) - 1];
//         if (!pick || pick.code === s.pendingBooking.from.code) {
//           await sendText(
//             from,
//             "❌ Destination cannot be same as FROM station."
//           );
//           return true;
//         }

//         s.pendingBooking.to = pick;
//         s.stationOptions = null;
//         s.state = "TRAIN_DATE";

//         await sendText(
//           from,
//           "📅 *Journey Date*\n\n" +
//             "Enter travel date in *DD-MM-YYYY* format.\n\n" +
//             "✍️ *Example:*\n25-01-2026"
//         );
//         return true;
//       }

//       const stations = await resolveStations(cleanText);
//       if (!stations.length) {
//         await sendText(
//           from,
//           "❌ No stations found.\n\n✍️ Example:\nMumbai\nCSTM"
//         );
//         return true;
//       }

//       s.stationOptions = stations;
//       await sendText(from, formatStationList(stations, "Select TO station"));
//       return true;
//     }

//     /* ================= DATE ================= */

//     if (s.state === "TRAIN_DATE") {
//       if (!isValidFutureDate(cleanText)) {
//         await sendText(
//           from,
//           "❌ Invalid date.\n\n✍️ Use future date in DD-MM-YYYY format.\nExample: 25-01-2026"
//         );
//         return true;
//       }

//       s.pendingBooking.date = cleanText;
//       s.state = "TRAIN_CLASS";
//       await sendClass(from);
//       return true;
//     }

//     /* ================= CLASS ================= */

//     if (s.state === "TRAIN_CLASS" && msg.type === "interactive") {
//       s.pendingBooking.class = msg.interactive.list_reply.title;
//       s.state = "TRAIN_QUOTA";
//       await sendQuota(from);
//       return true;
//     }

//     /* ================= QUOTA ================= */

//     if (s.state === "TRAIN_QUOTA" && msg.type === "interactive") {
//       s.pendingBooking.quota = msg.interactive.list_reply.title;
//       s.state = "TRAIN_BERTH";
//       await sendBerth(from);
//       return true;
//     }

//     /* ================= BERTH ================= */

//     if (s.state === "TRAIN_BERTH" && msg.type === "interactive") {
//       s.pendingBooking.berth = msg.interactive.list_reply.title;
//       s.state = "TRAIN_PASSENGERS";
//       await sendPassengers(from);
//       return true;
//     }

//     /* ================= PASSENGERS ================= */

//     if (s.state === "TRAIN_PASSENGERS" && msg.type === "interactive") {
//       const id = msg.interactive?.list_reply?.id;
//       const count = Number(id?.replace("PAX_", ""));

//       if (!count || count < 1 || count > 6) {
//         await sendText(from, "❌ Please choose passenger count between 1 and 6.");
//         return true;
//       }

//       s.pendingBooking.paxCount = count;

//       /* 🔑 HANDOFF TO PASSENGER FLOW */
//       s.state = "PAX_MODE";

//       await sendButtons(
//         from,
//         "👥 *Passenger Details Entry*\n\n" +
//           "Choose how you want to enter passenger details.\n\n" +
//           "✍️ *Example:*\n" +
//           "One by One = enter each passenger separately\n" +
//           "All at once = paste all details together",
//         [
//           { id: "PAX_ONEBYONE", title: "One by One" },
//           { id: "PAX_BULK", title: "All at once" },
//         ]
//       );

//       return true;
//     }

//     return false;
//   } catch (err) {
//     console.error("❌ Train Booking Error:", err);
//     await sendText(from, "⚠️ Something went wrong.\nType *BOOK AGAIN*");
//     return true;
//   }
// };

// /* ======================================================
//  * RESEND HANDLER
//  * ====================================================== */
// async function resend(ctx) {
//   const { session: s, from } = ctx;

//   switch (s.state) {
//     case "TRAIN_FROM":
//       return sendText(from, "📍 Enter FROM station\nExample: Chennai");
//     case "TRAIN_TO":
//       return sendText(from, "🎯 Enter TO station\nExample: Bangalore");
//     case "TRAIN_DATE":
//       return sendText(from, "📅 Enter journey date\nExample: 25-01-2026");
//     case "TRAIN_CLASS":
//       return sendClass(from);
//     case "TRAIN_QUOTA":
//       return sendQuota(from);
//     case "TRAIN_BERTH":
//       return sendBerth(from);
//     case "TRAIN_PASSENGERS":
//       return sendPassengers(from);
//     default:
//       return sendText(
//         from,
//         "⚠️ Please type:\n• RETRY\n• BOOK AGAIN\n• HELP"
//       );
//   }
// }

const { sendText, sendList, sendButtons } = require("../../../waClient");
const stationSearch = require("./api/stationSearch");
const optionSets = require("../optionSets"); // adjust path if needed

/* ======================================================
 * Language helper (SAFE)
 * ====================================================== */
function t(lang, key) {
  return (
    optionSets[lang]?.[key] ??
    optionSets.en[key] ??
    key
  );
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
 * Station helpers
 * ====================================================== */
function formatStationList(stations, titleKey, lang) {
  return (
    `🚉 *${t(lang, titleKey)}*\n` +
    `${t(lang, "NUMBER_SELECT_HINT")}\n\n` +
    stations.map((s, i) => `${i + 1}. ${s.name} (${s.code})`).join("\n")
  );
}

async function resolveStations(query) {
  if (!query || query.length < 2) return [];
  return await stationSearch(query.trim(), 6);
}

/* ======================================================
 * LIST SENDERS (TEXT ONLY CHANGED)
 * ====================================================== */

function sendClass(from, lang) {
  return sendList(
    from,
    t(lang, "TRAIN_CLASS_HELP"),
    t(lang, "CHOOSE_CLASS"),
    [
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
    ]
  );
}

function sendQuota(from, lang) {
  return sendList(
    from,
    t(lang, "TRAIN_QUOTA_HELP"),
    t(lang, "CHOOSE_QUOTA"),
    [
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
    ]
  );
}

function sendBerth(from, lang) {
  return sendList(
    from,
    t(lang, "TRAIN_BERTH_HELP"),
    t(lang, "CHOOSE_BERTH"),
    [
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
    ]
  );
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

    /* ================= GLOBAL ================= */

    if (upper === "RETRY") return resend(ctx);

    if (upper === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.stationOptions = null;
      s.state = null;
      await sendText(from, t(lang, "BOOK_AGAIN_MSG"));
      return false;
    }

    /* ================= ENTRY ================= */

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

    /* ================= FROM ================= */

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

      const stations = await resolveStations(cleanText);
      if (!stations.length) {
        await sendText(from, t(lang, "NO_STATIONS_FOUND"));
        return true;
      }

      s.stationOptions = stations;
      await sendText(
        from,
        formatStationList(stations, "SELECT_FROM_STATION", lang)
      );
      return true;
    }

    /* ================= TO ================= */

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

      const stations = await resolveStations(cleanText);
      if (!stations.length) {
        await sendText(from, t(lang, "NO_STATIONS_FOUND"));
        return true;
      }

      s.stationOptions = stations;
      await sendText(
        from,
        formatStationList(stations, "SELECT_TO_STATION", lang)
      );
      return true;
    }

    /* ================= DATE ================= */

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

    /* ================= CLASS ================= */

    if (s.state === "TRAIN_CLASS" && msg.type === "interactive") {
      s.pendingBooking.class = msg.interactive.list_reply.title;
      s.state = "TRAIN_QUOTA";
      await sendQuota(from, lang);
      return true;
    }

    /* ================= QUOTA ================= */

    if (s.state === "TRAIN_QUOTA" && msg.type === "interactive") {
      s.pendingBooking.quota = msg.interactive.list_reply.title;
      s.state = "TRAIN_BERTH";
      await sendBerth(from, lang);
      return true;
    }

    /* ================= BERTH ================= */

    if (s.state === "TRAIN_BERTH" && msg.type === "interactive") {
      s.pendingBooking.berth = msg.interactive.list_reply.title;
      s.state = "TRAIN_PASSENGERS";
      await sendPassengers(from, lang);
      return true;
    }

    /* ================= PASSENGERS ================= */

    if (s.state === "TRAIN_PASSENGERS" && msg.type === "interactive") {
      const id = msg.interactive?.list_reply?.id;
      const count = Number(id?.replace("PAX_", ""));

      if (!count || count < 1 || count > 6) {
        await sendText(from, t(lang, "INVALID_PAX_COUNT"));
        return true;
      }

      s.pendingBooking.paxCount = count;
      s.state = "PAX_MODE";

      await sendButtons(
        from,
        t(lang, "PASSENGER_ENTRY_MODE"),
        [
          { id: "PAX_ONEBYONE", title: t(lang, "PAX_ONEBYONE") },
          { id: "PAX_BULK", title: t(lang, "PAX_BULK") },
        ]
      );

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
 * RESEND HANDLER (LANG ENABLED)
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
