// lib/flow/domains/bus/api/searchCities.js

const axios = require("axios");

/* ======================================================
 * Config
 * ====================================================== */
const BASE_URL = "https://irctc-api-tbn9.onrender.com";

/* ======================================================
 * City Search (via Quickets City API)
 * ====================================================== */
module.exports = async function searchCities(query, limit = 6) {
  if (!query) return [];

  try {
    const res = await axios.get(`${BASE_URL}/search/cities`, {
      params: { q: query },
      timeout: 3000,
    });

    const data = Array.isArray(res.data) ? res.data : [];

    // Hard limit safety (WhatsApp UX)
    return data.slice(0, limit);
  } catch (err) {
    console.error("❌ citySearch API error:", err.message);
    return [];
  }
};
