const { sendText, sendButtons, sendList } = require("../../../waClient");
const searchCities = require("./api/searchCities");
const buildBusSummary = require("./summary");
const optionSets = require("../../../i18n/optionSets");
const handleBusSelection = require("./manual/busSelection");

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

    /* ========== CITY CONFIRMATION ========== */
    if (
      interactiveType === "button_reply" &&
      (interactiveId === "CITY_YES" || interactiveId === "CITY_NO")
    ) {
      const temp = s.tempCityConfirm;
      if (!temp) return true;

      if (interactiveId === "CITY_YES") {
        s.pendingBooking[temp.field] = temp.city.name;
        s.state = temp.field === "from" ? "BUS_TO" : "BUS_DATE";
        s.tempCityConfirm = null;
        await resendCurrentPrompt(ctx);
        return true;
      }

      const retry = await searchCities(temp.city.name, 6);
      if (retry.type === "list") {
        s.cityOptions = retry.cities;
        await sendText(
          from,
          formatCityList(
            retry.cities,
            temp.field === "from" ? "SELECT_FROM_STATION" : "SELECT_TO_STATION",
            lang,
          ),
        );
      } else {
        await sendText(from, t(lang, "BUS_CITY_NOT_UNDERSTOOD"));
      }

      s.tempCityConfirm = null;
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

      if (result.type === "confirm") {
        s.tempCityConfirm = { field: "from", city: result.city };
        await sendButtons(from, `❓ Did you mean *${result.city.name}*?`, [
          { id: "CITY_YES", title: "✅ Yes" },
          { id: "CITY_NO", title: "❌ No" },
        ]);
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(
          from,
          formatCityList(result.cities, "SELECT_FROM_STATION", lang),
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

      if (result.type === "confirm") {
        s.tempCityConfirm = { field: "to", city: result.city };
        await sendButtons(from, `❓ Did you mean *${result.city.name}*?`, [
          { id: "CITY_YES", title: "✅ Yes" },
          { id: "CITY_NO", title: "❌ No" },
        ]);
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(
          from,
          formatCityList(result.cities, "SELECT_TO_STATION", lang),
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
