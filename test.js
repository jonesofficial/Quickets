require("dotenv").config(); // 👈 ADD THIS

const stationSearch = require("./lib/services/stationSearch");

(async () => {

  const res = await stationSearch("coimbatore");
  console.log(res);
})();
