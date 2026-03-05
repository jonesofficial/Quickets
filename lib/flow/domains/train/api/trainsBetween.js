const axios = require("axios");

/* ======================================================
 * Config
 * ====================================================== */

const BASE_URL =
  process.env.TRAIN_API_BASE ||
  "https://citiesandstationsapi.onrender.com";

/* ======================================================
 * Trains Between Stations
 * ====================================================== */

module.exports = async function trainsBetween(from, to, limit = 20) {

  if (!from || !to) return [];

  try {

    const res = await axios.get(`${BASE_URL}/search/trains-between`, {
      params: { from, to },
      timeout: 4000
    });

    const trains = res?.data?.trains || [];

    return trains.slice(0, limit);

  } catch (err) {

    console.error("❌ trainsBetween API error:", err.message);

    return [];

  }

};