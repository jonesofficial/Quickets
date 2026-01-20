const axios = require("axios");

/**
 * Search railway stations using IRCTC RapidAPI
 * @param {string} query
 * @param {number} limit
 */
module.exports = async function stationSearch(query, limit = 10) {
  if (!query) return [];

  try {
    const res = await axios.get(
      "https://irctc1.p.rapidapi.com/api/v1/searchStation",
      {
        params: {
          query,
        },
        headers: {
          "X-RapidAPI-Key": process.env.IRCTC_API_KEY,
          "X-RapidAPI-Host": "irctc1.p.rapidapi.com",
        },
        timeout: 10000,
      }
    );

    const stations = res?.data?.data || [];

    // 🔁 Normalize to YOUR FLOW FORMAT
    return stations.slice(0, limit).map((s) => ({
      name: s.name || s.eng_name,
      code: s.code,
      state: s.state_name,
    }));
  } catch (err) {
    console.error(
      "❌ IRCTC Station Search Error:",
      err?.response?.data || err.message
    );
    return [];
  }
};
