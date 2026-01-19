const axios = require("axios");

const BASE_URL = `https://${process.env.RAPID_API_HOST}/v1/stations/search`;

module.exports = async function stationSearch(query, limit = 6) {
  try {
    const res = await axios.get(BASE_URL, {
      params: { q: query, limit },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": process.env.RAPID_API_HOST,
      },
      timeout: 5000,
    });

    const rows = res.data?.data || [];

    return rows.map((s) => ({
      code: s.code_current,        // eg: MS
      name: s.display_name_en,     // eg: Chennai Egmore
      score: s.confidence_score || 0,
    }));
  } catch (err) {
    console.error("❌ Station search failed:", err.message);
    return [];
  }
};
