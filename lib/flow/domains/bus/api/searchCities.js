// lib/flow/domains/bus/api/searchCities.js

const axios = require("axios");

/* ======================================================
 * Config
 * ====================================================== */
const BASE_URL = "https://irctc-api-tbn9.onrender.com";
const SIMILARITY_THRESHOLD = 0.85;

/* ======================================================
 * Utils
 * ====================================================== */
function normalize(str) {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a, b) {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (!longer.length) return 1;
  return (longer.length - levenshtein(longer, shorter)) / longer.length;
}

/* ======================================================
 * Smart City Search
 * ====================================================== */
module.exports = async function searchCities(query, limit = 6) {
  if (!query) return { type: "not_found" };

  try {
    const res = await axios.get(`${BASE_URL}/search/cities`, {
      params: { q: query },
      timeout: 3000,
    });

    const cities = Array.isArray(res.data) ? res.data : [];
    if (!cities.length) return { type: "not_found" };

    const qNorm = normalize(query);

    /* 1️⃣ Exact match */
    const exact = cities.find(
      c => normalize(c.name) === qNorm
    );
    if (exact) {
      return { type: "exact", city: exact };
    }

    /* 2️⃣ Fuzzy confirmation */
    let best = null;
    let bestScore = 0;

    for (const city of cities) {
      const score = similarity(qNorm, normalize(city.name));
      if (score > bestScore) {
        best = city;
        bestScore = score;
      }
    }

    if (bestScore >= SIMILARITY_THRESHOLD) {
      return { type: "confirm", city: best };
    }

    /* 3️⃣ Suggestions */
    const suggestions = cities.slice(0, limit);
    if (suggestions.length) {
      return { type: "list", cities: suggestions };
    }

    return { type: "not_found" };
  } catch (err) {
    console.error("❌ citySearch API error:", err.message);
    return { type: "not_found" };
  }
};
