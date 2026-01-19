const axios = require("axios");

const BASE_URL = `https://${process.env.RAPID_API_HOST}/v1/stations/nearby`;

module.exports = async function getStationsNearby(
  lat,
  lon,
  radius = 10,
  limit = 6
) {
  // 🛡️ Safety guards
  if (!lat || !lon) return [];
  if (!process.env.RAPID_API_HOST || !process.env.RAPID_API_KEY) {
    console.error("❌ RapidAPI env vars missing (stationNearby)");
    return [];
  }

  const latitude = Number(lat);
  const longitude = Number(lon);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return [];

  try {
    const res = await axios.get(BASE_URL, {
      params: { lat: latitude, lon: longitude, radius, limit },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": process.env.RAPID_API_HOST,
      },
      timeout: 5000,
    });

    const rows = res.data?.data || [];

    return rows
      .map((s) => ({
        code: s.code,
        name:
          s.name_en ||
          s.name ||
          s.display_name_en ||
          s.display_name ||
          s.code,
        lat: s.latitude || s.lat || null,
        lon: s.longitude || s.lon || null,
        distanceKm: Math.round((s.distance || 0) * 10) / 10,
      }))
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  } catch (err) {
    console.error("❌ Nearby station search failed:", err.message);
    return [];
  }
};
