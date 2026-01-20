const axios = require("axios");

const BASE_URL = `https://${process.env.RAPID_API_HOST}/v1/stations/code`;

const CACHE = new Map();

module.exports = async function resolveStationByCode(code) {
  if (!code) return null;

  if (CACHE.has(code)) {
    return CACHE.get(code);
  }

  try {
    const res = await axios.get(BASE_URL, {
      params: { code },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": process.env.RAPID_API_HOST,
      },
      timeout: 4000,
    });

    const s = res.data?.data;
    if (!s) return null;

    const fullName =
      s.name_en ||
      s.station_name ||
      s.name ||
      s.display_name ||
      code;

    const resolved = {
      code,
      name: fullName.replace(/\s+/g, " ").trim(),
      lat: s.latitude || null,
      lon: s.longitude || null,
    };

    CACHE.set(code, resolved);
    return resolved;
  } catch (err) {
    console.error("❌ Station code resolve failed:", code);
    return null;
  }
};
