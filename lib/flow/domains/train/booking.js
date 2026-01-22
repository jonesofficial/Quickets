const { sendText, sendButtons, sendList } = require("../../../waClient");
const searchCities = require("./api/searchCities");
const buildBusSummary = require("./summary");
const optionSets = require("../../../i18n/optionSets");

/* ======================================================
 * Language helper (SAFE)
 * ====================================================== */
function t(lang, key) {
  return optionSets[lang]?.[key] ?? optionSets.en[key] ?? key;
}

/* ======================================================
 * Utils
 * ====================================================== */
function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function safeText(msg, text) {
  if (typeof text === "string") return text.trim();
  if (msg?.text?.body) return msg.text.body.trim();
  return null;
}

function pickOption(id, lang) {
  return { id, label: t(lang, id) };
}

/* ======================================================
 * City helpers
 * ====================================================== */
async function resolveCitySmart(query) {
  if (!query || query.length < 2) {
    return { type: "not_found" };
  }
  return await searchCities(query.trim(), 6);
}

function formatCityList(cities, titleKey, lang) {
  return (
    `🏙 *${t(lang, titleKey)}*\n\n` +
    `${t(lang, "NUMBER_SELECT_HINT")}\n\n` +
    cities.map((c, i) => `${i + 1}. ${c.name}`).join("\n")
  );
}

/* ======================================================
 * Retry helper
 * ====================================================== */
async function resendCurrentPrompt(ctx) {
  const { session: s, from } = ctx;
  const lang = s.lang || "en";

  switch (s.state) {
    case "BUS_FROM":
      return sendText(from, t(lang, "BUS_FROM_PROMPT"));

    case "BUS_TO":
      return sendText(from, t(lang, "BUS_TO_PROMPT"));

    case "BUS_DATE":
      return sendButtons(from, t(lang, "BUS_DATE_PROMPT"), [
        { id: "DATE_TODAY", title: "Today" },
        { id: "DATE_TOMORROW", title: "Tomorrow" },
        { id: "DATE_DAY_AFTER", title: "Day After" },
        { id: "DATE_MANUAL", title: "Pick another date" },
      ]);

    case "BUS_TIME":
      return sendList(from, t(lang, "BUS_TIME_PROMPT"), t(lang, "SELECT"), [
        {
          title: "Time",
          rows: [
            { id: "TIME_MORNING", title: t(lang, "TIME_MORNING") },
            { id: "TIME_AFTERNOON", title: t(lang, "TIME_AFTERNOON") },
            { id: "TIME_EVENING", title: t(lang, "TIME_EVENING") },
            { id: "TIME_NIGHT", title: t(lang, "TIME_NIGHT") },
          ],
        },
      ]);

    case "BUS_PAX_COUNT":
      return sendList(from, t(lang, "BUS_PAX_PROMPT"), t(lang, "PASSENGERS"), [
        {
          title: t(lang, "PASSENGER_COUNT"),
          rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
            id: `PAX_${n}`,
            title: n,
          })),
        },
      ]);

    case "BUS_SEAT_TYPE":
      return sendList(from, t(lang, "BUS_SEAT_PROMPT"), "Seat", [
        {
          title: "Seat Type",
          rows: [
            { id: "SEAT_AC_SLEEPER", title: t(lang, "SEAT_AC_SLEEPER") },
            { id: "SEAT_AC_SEATER", title: t(lang, "SEAT_AC_SEATER") },
            { id: "SEAT_NONAC_SLEEPER", title: t(lang, "SEAT_NONAC_SLEEPER") },
            { id: "SEAT_NONAC_SEATER", title: t(lang, "SEAT_NONAC_SEATER") },
          ],
        },
      ]);

    case "BUS_BUDGET":
      return sendList(from, t(lang, "BUS_BUDGET_PROMPT"), "Budget", [
        {
          title: "Budget",
          rows: [
            "BUDGET_300U",
            "BUDGET_500",
            "BUDGET_700",
            "BUDGET_1000",
            "BUDGET_1500",
            "BUDGET_2000PLUS",
          ].map((id) => ({ id, title: t(lang, id) })),
        },
      ]);

    default:
      return sendText(from, t(lang, "HELP_FALLBACK"));
  }
}

/* ======================================================
 * BUS BOOKING FLOW
 * ====================================================== */
module.exports = async function busBookingFlow(ctx) {
  const { session: s, msg, text, interactiveType, interactiveId, from } = ctx;
  const lang = s.lang || "en";

  try {
    const cleanText = safeText(msg, text);
    const upperText = cleanText?.toUpperCase();

    if (upperText === "HELP") {
      await sendText(from, t(lang, "HELP_TEXT"));
      return true;
    }

    if (upperText === "RETRY") {
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (!s.state) {
      s.pendingBooking = {
        type: "BUS",
        user: from,
        from: null,
        to: null,
        date: null,
        timePref: null,
        paxCount: null,
        seatType: null,
        budget: null,
        passengers: [],
        status: "DRAFT",
      };

      s.state = "BUS_FROM";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= FROM CITY ================= */
    if (s.state === "BUS_FROM" && msg.type === "text") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.cityOptions?.[Number(cleanText) - 1];
        if (!pick) {
          await sendText(from, t(lang, "BUS_INVALID_NUMBER"));
          return true;
        }

        s.pendingBooking.from = pick.name;
        s.cityOptions = null;
        s.state = "BUS_TO";
        await resendCurrentPrompt(ctx);
        return true;
      }

      const result = await resolveCitySmart(cleanText);

      if (result.type === "exact") {
        s.pendingBooking.from = result.city.name;
        s.state = "BUS_TO";
        await resendCurrentPrompt(ctx);
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(
          from,
          formatCityList(result.cities, "SELECT_FROM_STATION", lang)
        );
        return true;
      }

      await sendText(from, t(lang, "BUS_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= TO CITY ================= */
    if (s.state === "BUS_TO" && msg.type === "text") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.cityOptions?.[Number(cleanText) - 1];
        if (!pick || pick.name === s.pendingBooking.from) {
          await sendText(from, t(lang, "BUS_FROM_TO_SAME"));
          return true;
        }

        s.pendingBooking.to = pick.name;
        s.cityOptions = null;
        s.state = "BUS_DATE";
        await resendCurrentPrompt(ctx);
        return true;
      }

      const result = await resolveCitySmart(cleanText);

      if (result.type === "exact") {
        if (result.city.name === s.pendingBooking.from) {
          await sendText(from, t(lang, "BUS_FROM_TO_SAME"));
          return true;
        }

        s.pendingBooking.to = result.city.name;
        s.state = "BUS_DATE";
        await resendCurrentPrompt(ctx);
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(
          from,
          formatCityList(result.cities, "SELECT_TO_STATION", lang)
        );
        return true;
      }

      await sendText(from, t(lang, "BUS_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= REST (UNCHANGED) ================= */

    if (s.state === "BUS_DATE" && interactiveType === "button_reply") {
      const d = new Date();
      if (interactiveId === "DATE_TODAY") s.pendingBooking.date = formatDate(d);
      if (interactiveId === "DATE_TOMORROW") {
        d.setDate(d.getDate() + 1);
        s.pendingBooking.date = formatDate(d);
      }
      if (interactiveId === "DATE_DAY_AFTER") {
        d.setDate(d.getDate() + 2);
        s.pendingBooking.date = formatDate(d);
      }
      s.state = "BUS_TIME";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_TIME" && interactiveType === "list_reply") {
      s.pendingBooking.timePref = pickOption(interactiveId, lang);
      s.state = "BUS_PAX_COUNT";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_PAX_COUNT" && interactiveType === "list_reply") {
      s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
      s.state = "BUS_SEAT_TYPE";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_SEAT_TYPE" && interactiveType === "list_reply") {
      s.pendingBooking.seatType = pickOption(interactiveId, lang);
      s.state = "BUS_BUDGET";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_BUDGET" && interactiveType === "list_reply") {
      s.pendingBooking.budget = pickOption(interactiveId, lang);
      s.state = "PAX_MODE";

      await sendButtons(from, t(lang, "PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: t(lang, "PAX_BULK") },
        { id: "PAX_ONEBYONE", title: t(lang, "PAX_ONEBYONE") },
      ]);

      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ BUS BOOKING ERROR:", err);
    await sendText(from, t(lang, "GENERIC_ERROR"));
    return true;
  }
};


const { sendText, sendList, sendButtons } = require("../../../waClient");
const stationSearch = require("./api/stationSearch");
const optionSets = require("../../../i18n/optionSets");
const translate = require("google-translate-api-x");

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
 * 🌍 Translate to English (input only)
 * ====================================================== */
async function translateToEnglish(input, lang) {
  if (!input || lang === "en") return input;
  if (/^[a-zA-Z\s]+$/.test(input)) return input;

  try {
    const res = await translate(input, { to: "en" });
    return res.text;
  } catch (err) {
    console.error("❌ Translation failed:", err.message);
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
  return stationSearch(translated, 6);
}

/* ======================================================
 * LIST SENDERS (TEXT ONLY CHANGED)
 * ====================================================== */

function sendClass(from, lang) {
  return sendList(from, t(lang, "TRAIN_CLASS_HELP"), t(lang, "CHOOSE_CLASS"), [
    {
      title: t(lang, "AVAILABLE_CLASSES"),
      rows: [
        { id: "CLASS_SL", title: t(lang, "TRAIN_CLASS_SL") },
        { id: "CLASS_3A", title: t(lang, "TRAIN_CLASS_3A") },
        { id: "CLASS_2A", title: t(lang, "TRAIN_CLASS_2A") },
        { id: "CLASS_CC", title: t(lang, "TRAIN_CLASS_CC") },
        { id: "CLASS_2S", title: t(lang, "TRAIN_CLASS_2S") },
      ],
    },
  ]);
}

function sendQuota(from, lang) {
  return sendList(from, t(lang, "TRAIN_QUOTA_HELP"), t(lang, "CHOOSE_QUOTA"), [
    {
      title: t(lang, "QUOTA_TYPE"),
      rows: [
        { id: "QUOTA_GEN", title: t(lang, "TRAIN_QUOTA_GN") },
        { id: "QUOTA_TATKAL", title: t(lang, "TRAIN_QUOTA_TATKAL") },
        { id: "QUOTA_PT", title: t(lang, "TRAIN_QUOTA_PT") },
        { id: "QUOTA_LADIES", title: t(lang, "TRAIN_QUOTA_LADIES") },
        { id: "QUOTA_SC", title: t(lang, "TRAIN_QUOTA_SENIOR") },
      ],
    },
  ]);
}

function sendBerth(from, lang) {
  return sendList(from, t(lang, "TRAIN_BERTH_HELP"), t(lang, "CHOOSE_BERTH"), [
    {
      title: t(lang, "BERTH_PREFERENCE"),
      rows: [
        { id: "BERTH_L", title: t(lang, "BERTH_L") },
        { id: "BERTH_M", title: t(lang, "BERTH_M") },
        { id: "BERTH_U", title: t(lang, "BERTH_U") },
        { id: "BERTH_SL", title: t(lang, "BERTH_SL") },
        { id: "BERTH_SU", title: t(lang, "BERTH_SU") },
        { id: "BERTH_NONE", title: t(lang, "BERTH_NONE") },
      ],
    },
  ]);
}

function sendPassengers(from, lang) {
  return sendList(from, t(lang, "PASSENGER_COUNT_HELP"), t(lang, "PASSENGERS"), [
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
  ]);
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
