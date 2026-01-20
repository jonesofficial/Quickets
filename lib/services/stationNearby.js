const axios = require("axios");
const resolveFullStation = require("./stationFullName");

const BASE_URL = `https://${process.env.RAPID_API_HOST}/v1/stations/nearby`;

module.exports = async function getStationsNearby(
  lat,
  lon,
  radius = 10,
  limit = 6,
  cityKey = null
) {
  if (!lat || !lon) return [];

  if (!process.env.RAPID_API_HOST || !process.env.RAPID_API_KEY) {
    console.error("❌ RapidAPI env vars missing (stationNearby)");
    return [];
  }

  // 🚆 Expand radius for major metros
  const city = (cityKey || "").toLowerCase().trim();
  if (
    ["chennai", "bengaluru", "bangalore", "mumbai", "delhi", "kolkata"].includes(
      city
    )
  ) {
    radius = 35;
    limit = 25;
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
    const results = [];

    // 🔐 IMPORTANT: Resolve FULL NAME via station CODE
    for (const s of rows) {
      if (!s.code) continue;

      const fullName = await resolveFullStation(s.code);

      results.push({
        code: s.code,
        name: fullName || s.name || s.display_name || s.code,
        lat: s.latitude || s.lat || null,
        lon: s.longitude || s.lon || null,
        distanceKm: Math.round((Number(s.distance || 0)) * 10) / 10,
      });
    }

    return results.sort(
      (a, b) => (a.distanceKm || 0) - (b.distanceKm || 0)
    );
  } catch (err) {
    console.error("❌ Nearby station search failed:", err.message);
    return [];
  }
};
