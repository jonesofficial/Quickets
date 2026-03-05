const stationSearch = require("../api/stationSearch");
const optionSets = require("../../../i18n/optionSets");

/* ======================================================
 * Language helper
 * ====================================================== */

function t(lang, key) {
  return optionSets[lang]?.[key] ?? optionSets.en[key] ?? key;
}

/* ======================================================
 * Format Date
 * ====================================================== */

function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}

/* ======================================================
 * Parse Manual Date
 * ====================================================== */

function parseManualDate(input) {
  if (!input) return null;

  const cleaned = input.replace(/\//g, "-").trim();

  const match = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const year = parseInt(match[3], 10);

  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  /* Prevent past dates */

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) return null;

  return date;
}

/* ======================================================
 * Station helpers
 * ====================================================== */

async function resolveCitySmart(query) {
  if (!query || query.length < 2) {
    return { type: "not_found" };
  }

  const stations = await stationSearch(query.trim(), 6);

  if (!stations?.length) {
    return { type: "not_found" };
  }

  if (stations.length === 1) {
    return {
      type: "exact",
      city: stations[0],
    };
  }

  return {
    type: "list",
    cities: stations,
  };
}

/* ======================================================
 * Format station list
 * ====================================================== */

function formatCityList(stations, titleKey, lang) {
  return (
    `🚉 *${t(lang, titleKey)}*\n\n` +
    `${t(lang, "NUMBER_SELECT_HINT")}\n\n` +
    stations
      .map((s, i) => `${i + 1}. ${s.name} (${s.code})`)
      .join("\n")
  );
}

module.exports = {
  resolveCitySmart,
  formatCityList,
  parseManualDate,
  formatDate,
  t,
};