const axios = require("axios");

/* ======================================================
 * Config
 * ====================================================== */
const BASE_URL = "https://irctc-api-tbn9.onrender.com";

/* ======================================================
 * Station Search (via Quickets IRCTC API)
 * ====================================================== */
module.exports = async function stationSearch(query, limit = 6) {
  if (!query) return [];

  try {
    const res = await axios.get(`${BASE_URL}/search/station`, {
      params: { q: query },
      timeout: 3000,
    });

    const data = Array.isArray(res.data) ? res.data : [];

    // Hard limit safety (WhatsApp UX)
    return data.slice(0, limit);
  } catch (err) {
    console.error("❌ stationSearch API error:", err.message);
    return [];
  }
};
