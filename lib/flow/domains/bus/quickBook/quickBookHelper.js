const searchCities = require("../api/searchCities");
const optionSets = require("../../../../i18n/optionSets");

/* ================= Language ================= */
function t(lang, key) {
  return optionSets[lang]?.[key] ?? optionSets.en[key] ?? key;
}

/* ================= Date ================= */
function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function parseManualDate(input) {
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
  ) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return null;

  return date;
}

/* ================= Cities ================= */
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

module.exports = {
  t,
  formatDate,
  parseManualDate,
  resolveCitySmart,
  formatCityList,
};