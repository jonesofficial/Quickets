const axios = require("axios");
const resolveFullStation = require("./stationFullName");

const BASE_URL = `https://${process.env.RAPID_API_HOST}/v1/stations/search`;

function normalizeQuery(q) {
  if (!q) return q;

  const map = {
    banglore: "bengaluru",
    bangalore: "bengaluru",
    bengaluru: "bengaluru",
    madras: "chennai",
  };

  const key = q.toLowerCase().trim();
  return map[key] || q;
}

module.exports = async function stationSearch(query, limit = 10) {
  // 🛡️ Safety guard
  if (!process.env.RAPID_API_HOST || !process.env.RAPID_API_KEY) {
    console.error("❌ RapidAPI env vars missing (stationSearch)");
    return [];
  }

  const q = normalizeQuery(query);

  try {
    const res = await axios.get(BASE_URL, {
      params: { q, limit },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": process.env.RAPID_API_HOST,
      },
      timeout: 5000,
    });

    const rows = res.data?.data || [];
    const results = [];

    // 🔐 FORCE full-name resolution via station CODE
    for (const s of rows) {
      const code = s.code_current;
      if (!code) continue;

      const fullName = await resolveFullStation(code);

      results.push({
        code,
        name: fullName || s.name || s.display_name || code,
        lat: s.latitude || s.lat || null,
        lon: s.longitude || s.lon || null,
        score: s.confidence_score || 0,
      });
    }

    return results;
  } catch (err) {
    console.error("❌ Station search failed:", err.message);
    return [];
  }
};
