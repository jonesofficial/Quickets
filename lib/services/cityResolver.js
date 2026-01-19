/**
 * City → Lat/Lon resolver
 * Used ONLY to find nearby railway stations
 * Source: Govt / OpenStreetMap centroids
 */

const CITY_COORDS = {
  /* =========================
   * TAMIL NADU
   * ========================= */
  chennai: { lat: 13.0827, lon: 80.2707 },
  madras: { lat: 13.0827, lon: 80.2707 },

  coimbatore: { lat: 11.0168, lon: 76.9558 },
  madurai: { lat: 9.9252, lon: 78.1198 },
  tiruchirappalli: { lat: 10.7905, lon: 78.7047 },
  trichy: { lat: 10.7905, lon: 78.7047 },

  salem: { lat: 11.6643, lon: 78.1460 },
  erode: { lat: 11.3410, lon: 77.7172 },
  tiruppur: { lat: 11.1085, lon: 77.3411 },

  vellore: { lat: 12.9165, lon: 79.1325 },
  kanchipuram: { lat: 12.8342, lon: 79.7036 },
  tambaram: { lat: 12.9249, lon: 80.1000 },

  thanjavur: { lat: 10.7867, lon: 79.1378 },
  kumbakonam: { lat: 10.9617, lon: 79.3881 },
  nagapattinam: { lat: 10.7660, lon: 79.8434 },

  tirunelveli: { lat: 8.7139, lon: 77.7567 },
  thoothukudi: { lat: 8.7642, lon: 78.1348 },
  tuticorin: { lat: 8.7642, lon: 78.1348 },

  dindigul: { lat: 10.3673, lon: 77.9803 },
  karur: { lat: 10.9577, lon: 78.0809 },
  namakkal: { lat: 11.2194, lon: 78.1677 },

  /* =========================
   * KARNATAKA
   * ========================= */
  bengaluru: { lat: 12.9763, lon: 77.6033 },
  bangalore: { lat: 12.9763, lon: 77.6033 },
  banglore: { lat: 12.9763, lon: 77.6033 },

  mysuru: { lat: 12.2958, lon: 76.6394 },
  mysore: { lat: 12.2958, lon: 76.6394 },

  hubli: { lat: 15.3647, lon: 75.1240 },
  dharwad: { lat: 15.4589, lon: 75.0078 },

  mangaluru: { lat: 12.9141, lon: 74.8560 },
  mangalore: { lat: 12.9141, lon: 74.8560 },

  /* =========================
   * KERALA
   * ========================= */
  kochi: { lat: 9.9312, lon: 76.2673 },
  ernakulam: { lat: 9.9816, lon: 76.2999 },

  trivandrum: { lat: 8.5241, lon: 76.9366 },
  thiruvananthapuram: { lat: 8.5241, lon: 76.9366 },

  kozhikode: { lat: 11.2588, lon: 75.7804 },
  calicut: { lat: 11.2588, lon: 75.7804 },

  thrissur: { lat: 10.5276, lon: 76.2144 },

  /* =========================
   * ANDHRA / TELANGANA
   * ========================= */
  hyderabad: { lat: 17.3850, lon: 78.4867 },
  secunderabad: { lat: 17.4399, lon: 78.4983 },

  vijayawada: { lat: 16.5062, lon: 80.6480 },
  visakhapatnam: { lat: 17.6868, lon: 83.2185 },
  vizag: { lat: 17.6868, lon: 83.2185 },

  tirupati: { lat: 13.6288, lon: 79.4192 },

  /* =========================
   * MAJOR METROS
   * ========================= */
  mumbai: { lat: 19.0760, lon: 72.8777 },
  bombay: { lat: 19.0760, lon: 72.8777 },

  delhi: { lat: 28.6139, lon: 77.2090 },
  newdelhi: { lat: 28.6139, lon: 77.2090 },

  kolkata: { lat: 22.5726, lon: 88.3639 },
  calcutta: { lat: 22.5726, lon: 88.3639 },

  pune: { lat: 18.5204, lon: 73.8567 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },

  bhopal: { lat: 23.2599, lon: 77.4126 },
  indore: { lat: 22.7196, lon: 75.8577 },

  lucknow: { lat: 26.8467, lon: 80.9462 },
  kanpur: { lat: 26.4499, lon: 80.3319 },

  patna: { lat: 25.5941, lon: 85.1376 },

  bhubaneswar: { lat: 20.2961, lon: 85.8245 },

  guwahati: { lat: 26.1445, lon: 91.7362 },

  ranchi: { lat: 23.3441, lon: 85.3096 },
};

module.exports = function resolveCityCoords(input) {
  if (!input) return null;
  const key = input.toLowerCase().trim();
  return CITY_COORDS[key] || null;
};
