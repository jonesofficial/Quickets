const { sendText, sendButtons } = require("../../../waClient");
const stationSearch = require("./api/stationSearch");

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
 * Station helpers (TEXT ONLY)
 * ====================================================== */
function formatStationList(stations, title) {
  return (
    `🚉 *${title}*\nReply with the number\n\n` +
    stations
      .map((s, i) => `${i + 1}. ${s.name} (${s.code})`)
      .join("\n")
  );
}

async function resolveStations(query) {
  if (!query || query.length < 2) return [];
  return await stationSearch(query.trim(), 6);
}

/* ======================================================
 * Retry helper
 * ====================================================== */
async function resendCurrentPrompt(ctx) {
  const { session: s, from, get } = ctx;

  switch (s.state) {
    case "TRAIN_FROM":
      return sendText(from, get("TRAIN_ASK_FROM"));

    case "TRAIN_TO":
      return sendText(from, get("TRAIN_ASK_TO"));

    case "TRAIN_DATE":
      return sendText(from, get("TRAIN_ASK_DATE"));

    case "TRAIN_PREF_MODE":
      return sendButtons(from, "🚆 How would you like to choose the train?", [
        { id: "PREF_NAME", title: "By Train Name" },
        { id: "PREF_NUMBER", title: "By Train Number" },
        { id: "PREF_TIME", title: "By Time" },
        { id: "PREF_TYPE", title: "By Train Type" },
      ]);

    default:
      return sendText(from, get("OOPS_TAP_OPTIONS"));
  }
}

/* ======================================================
 * MAIN TRAIN BOOKING FLOW
 * ====================================================== */
module.exports = async function trainBookingFlow(ctx) {
  const { session: s, msg, text, from, get } = ctx;

  try {
    const cleanText = safeText(msg, text);

    /* ================= GLOBAL ================= */

    if (cleanText?.toUpperCase() === "HELP") {
      await sendText(
        from,
        `${get("HELP_TEXT")}\n\nYou can type:\n• HELP\n• RETRY\n• BOOK AGAIN`
      );
      return true;
    }

    if (cleanText?.toUpperCase() === "RETRY") {
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (cleanText?.toUpperCase() === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.state = null;
      s.stationOptions = null;
      await sendText(from, "🔄 Starting a new booking…");
      return false;
    }

    /* ================= ENTRY ================= */

    if (!s.state) {
      s.pendingBooking = {
        type: "TRAIN",
        from: null,
        to: null,
        date: null,
        status: "DRAFT",
      };

      s.state = "TRAIN_FROM";
      await sendText(from, get("TRAIN_ASK_FROM"));
      return true;
    }

    /* ================= FROM ================= */

    if (s.state === "TRAIN_FROM") {
      // Number selection
      if (/^\d+$/.test(cleanText)) {
        const idx = Number(cleanText) - 1;
        const list = s.stationOptions || [];

        if (!list[idx]) {
          await sendText(from, "❌ Invalid number. Try again.");
          return true;
        }

        s.pendingBooking.from = list[idx];
        s.stationOptions = null;
        s.state = "TRAIN_TO";

        await sendText(
          from,
          `✅ From station: *${list[idx].name} (${list[idx].code})*\n\n${get(
            "TRAIN_ASK_TO"
          )}`
        );
        return true;
      }

      // Station search (TEXT ONLY)
      const stations = await resolveStations(cleanText);
      if (!stations.length) {
        await sendText(from, "❌ No stations found. Try again.");
        return true;
      }

      s.stationOptions = stations;
      await sendText(from, formatStationList(stations, "Select FROM station"));
      return true;
    }

    /* ================= TO ================= */

    if (s.state === "TRAIN_TO") {
      // Number selection
      if (/^\d+$/.test(cleanText)) {
        const idx = Number(cleanText) - 1;
        const list = s.stationOptions || [];

        if (!list[idx]) {
          await sendText(from, "❌ Invalid number. Try again.");
          return true;
        }

        // Prevent same FROM & TO
        if (list[idx].code === s.pendingBooking.from?.code) {
          await sendText(
            from,
            "❌ From and To stations cannot be the same. Choose another."
          );
          return true;
        }

        s.pendingBooking.to = list[idx];
        s.stationOptions = null;
        s.state = "TRAIN_DATE";

        await sendText(
          from,
          `✅ To station: *${list[idx].name} (${list[idx].code})*\n\n${get(
            "TRAIN_ASK_DATE"
          )}`
        );
        return true;
      }

      // Station search (TEXT ONLY)
      const stations = await resolveStations(cleanText);
      if (!stations.length) {
        await sendText(from, "❌ No stations found. Try again.");
        return true;
      }

      s.stationOptions = stations;
      await sendText(from, formatStationList(stations, "Select TO station"));
      return true;
    }

    /* ================= DATE ================= */

    if (s.state === "TRAIN_DATE") {
      if (!isValidFutureDate(cleanText)) {
        await sendText(from, get("INVALID_DATE"));
        return true;
      }

      s.pendingBooking.date = cleanText;
      s.state = "TRAIN_PREF_MODE";
      await resendCurrentPrompt(ctx);
      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ Train Booking Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *BOOK AGAIN*");
    return true;
  }
};



// const { sendText, sendButtons } = require("../../../waClient");

// const stationSearch = require("../../../services/stationSearch");
// const getStationsNearby = require("../../../services/stationNearby");

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
//  * Station helpers (CORRECT & DYNAMIC)
//  * ====================================================== */
// function formatStationList(stations, title) {
//   return (
//     `🚉 *${title}*\nReply with the number\n\n` +
//     stations
//       .map((s, i) => `${i + 1}. ${s.name} (${s.code})`)
//       .join("\n")
//   );
// }

// async function resolveStationsDynamic(query) {
//   if (!query) return [];

//   // 1️⃣ Search by text (handles banglore/bangalore internally)
//   const search = await stationSearch(query, 10);
//   if (!search.length) return [];

//   let reference =
//     [...search]
//       .sort((a, b) => (b.score || 0) - (a.score || 0))
//       .find((s) => s.lat && s.lon) || null;

//   // 2️⃣ HARD FALLBACK: try again using best station name
//   if (!reference) {
//     const retry = await stationSearch(search[0].name, 5);
//     reference =
//       retry.find((s) => s.lat && s.lon) || null;
//   }

//   const results = [];

//   // 3️⃣ Fetch nearby stations relative to SEARCHED CITY (not user)
//   if (reference?.lat && reference?.lon) {
//     const nearby = await getStationsNearby(
//       reference.lat,
//       reference.lon,
//       30,
//       20
//     );
//     results.push(...nearby);
//   }

//   // 4️⃣ Add all stations matching the query
//   results.push(...search);

//   // 5️⃣ Deduplicate by station code
//   const map = new Map();
//   for (const s of results) {
//     if (s.code && !map.has(s.code)) {
//       map.set(s.code, s);
//     }
//   }

//   return Array.from(map.values()).slice(0, 10);
// }

// /* ======================================================
//  * Retry helper
//  * ====================================================== */
// async function resendCurrentPrompt(ctx) {
//   const { session: s, from, get } = ctx;

//   switch (s.state) {
//     case "TRAIN_FROM":
//       return sendText(from, get("TRAIN_ASK_FROM"));
//     case "TRAIN_TO":
//       return sendText(from, get("TRAIN_ASK_TO"));
//     case "TRAIN_DATE":
//       return sendText(from, get("TRAIN_ASK_DATE"));
//     case "TRAIN_PREF_MODE":
//       return sendButtons(from, "🚆 How would you like to choose the train?", [
//         { id: "PREF_NAME", title: "By Train Name" },
//         { id: "PREF_NUMBER", title: "By Train Number" },
//         { id: "PREF_TIME", title: "By Time" },
//         { id: "PREF_TYPE", title: "By Train Type" },
//       ]);
//     default:
//       return sendText(from, get("OOPS_TAP_OPTIONS"));
//   }
// }

// /* ======================================================
//  * MAIN TRAIN BOOKING FLOW
//  * ====================================================== */
// module.exports = async function trainBookingFlow(ctx) {
//   const { session: s, msg, text, from, get } = ctx;

//   try {
//     const cleanText = safeText(msg, text);

//     /* ================= GLOBAL ================= */

//     if (cleanText?.toUpperCase() === "HELP") {
//       await sendText(
//         from,
//         `${get("HELP_TEXT")}\n\nYou can type:\n• HELP\n• RETRY\n• BOOK AGAIN`
//       );
//       return true;
//     }

//     if (cleanText?.toUpperCase() === "RETRY") {
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (cleanText?.toUpperCase() === "BOOK AGAIN") {
//       s.pendingBooking = null;
//       s.state = null;
//       s.stationOptions = null;
//       await sendText(from, "🔄 Starting a new booking…");
//       return false;
//     }

//     /* ================= ENTRY ================= */

//     if (!s.state) {
//       s.pendingBooking = {
//         type: "TRAIN",
//         from: null,
//         to: null,
//         date: null,
//         status: "DRAFT",
//       };
//       s.state = "TRAIN_FROM";
//       await sendText(from, get("TRAIN_ASK_FROM"));
//       return true;
//     }

//     /* ================= FROM ================= */

//     if (s.state === "TRAIN_FROM") {
//       // ✅ Numeric selection ONLY for text messages
//       if (msg?.type === "text" && /^\d+$/.test(cleanText)) {
//         const idx = Number(cleanText) - 1;
//         const list = s.stationOptions || [];

//         if (!list[idx]) {
//           await sendText(from, "❌ Invalid number. Try again.");
//           return true;
//         }

//         s.pendingBooking.from = list[idx];
//         s.stationOptions = null;
//         s.state = "TRAIN_TO";

//         await sendText(
//           from,
//           `✅ From station: *${list[idx].name} (${list[idx].code})*\n\n${get(
//             "TRAIN_ASK_TO"
//           )}`
//         );
//         return true;
//       }

//       const stations = await resolveStationsDynamic(cleanText);
//       if (!stations.length) {
//         await sendText(from, "❌ No stations found. Try again.");
//         return true;
//       }

//       s.stationOptions = stations;
//       await sendText(
//         from,
//         formatStationList(stations, "Select FROM station")
//       );
//       return true;
//     }

//     /* ================= TO ================= */

//     if (s.state === "TRAIN_TO") {
//       if (msg?.type === "text" && /^\d+$/.test(cleanText)) {
//         const idx = Number(cleanText) - 1;
//         const list = s.stationOptions || [];

//         if (!list[idx]) {
//           await sendText(from, "❌ Invalid number. Try again.");
//           return true;
//         }

//         s.pendingBooking.to = list[idx];
//         s.stationOptions = null;
//         s.state = "TRAIN_DATE";

//         await sendText(
//           from,
//           `✅ To station: *${list[idx].name} (${list[idx].code})*\n\n${get(
//             "TRAIN_ASK_DATE"
//           )}`
//         );
//         return true;
//       }

//       const stations = await resolveStationsDynamic(cleanText);
//       if (!stations.length) {
//         await sendText(from, "❌ No stations found. Try again.");
//         return true;
//       }

//       s.stationOptions = stations;
//       await sendText(
//         from,
//         formatStationList(stations, "Select TO station")
//       );
//       return true;
//     }

//     /* ================= DATE ================= */

//     if (s.state === "TRAIN_DATE") {
//       if (!isValidFutureDate(cleanText)) {
//         await sendText(from, get("INVALID_DATE"));
//         return true;
//       }

//       s.pendingBooking.date = cleanText;
//       s.state = "TRAIN_PREF_MODE";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     return false;
//   } catch (err) {
//     console.error("❌ Train Booking Error:", err);
//     await sendText(from, "⚠️ Something went wrong.\nType *BOOK AGAIN*");
//     return true;
//   }
// };
