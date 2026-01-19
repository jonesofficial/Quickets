const axios = require("axios");

const BASE_URL = `https://${process.env.RAPID_API_HOST}/v1/stations/nearby`;

module.exports = async function getStationsNearby(
  lat,
  lon,
  radius = 10,
  limit = 6
) {
  if (!lat || !lon) return [];

  try {
    const res = await axios.get(BASE_URL, {
      params: { lat, lon, radius, limit },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": process.env.RAPID_API_HOST,
      },
      timeout: 5000,
    });

    const rows = res.data?.data || [];

    return rows.map((s) => ({
      code: s.code,
      name: s.name,
      distanceKm: Math.round((s.distance || 0) * 10) / 10,
    }));
  } catch (err) {
    console.error("❌ Nearby station search failed:", err.message);
    return [];
  }
};
