// lib/validators.js
const WEEK_DAYS = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function pad(n){ return String(n).padStart(2, "0"); }

function formatDDMMYYYY(d){
  return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()}`;
}

function getNextWeekday(base, weekdayIndex, mode = "next") {
  const baseDay = base.getDay();
  let diff = (weekdayIndex - baseDay + 7) % 7;
  if (diff === 0 && mode === "next") diff = 7;
  // when mode !== "next" (like "coming") we accept same-day if it matches
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
}

function normalizeShorthandDate(s) {
  if (!s) return s;
  const t = String(s).trim().toLowerCase();
  const map = {
    "tmrw": "tomorrow", "tmr": "tomorrow", "tomrw": "tomorrow", "tomr": "tomorrow",
    "dat": "day after tomorrow", "dayafter": "day after tomorrow",
    "tnite": "coming tonight", "tonight": "coming tonight",
    "wkend": "this weekend", "weekend": "this weekend"
  };
  if (map[t]) return map[t];
  const compact = t.replace(/[^a-z0-9]+/g, "");
  if (map[compact]) return map[compact];
  return s;
}

function parseNaturalPhrase(raw, now = new Date()){
  const s = String(normalizeShorthandDate(raw || "")).trim().toLowerCase();
  if (!s) return null;

  let timeHint = null;
  if (s.includes("night")) timeHint = "night";
  else if (s.includes("evening")) timeHint = "evening";
  else if (s.includes("afternoon")) timeHint = "afternoon";
  else if (s.includes("morning")) timeHint = "morning";

  if (s === "tomorrow") {
    return { date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), timeHint };
  }
  if (s === "day after tomorrow" || s === "day after") {
    return { date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2), timeHint };
  }

  if (s.includes("this weekend")) {
    const sat = 6;
    // "coming" here means accept same-week saturday if not passed
    return { date: getNextWeekday(now, sat, "coming"), timeHint };
  }

  const m = s.match(/\b(next|coming)\s+([a-z\.]+)/);
  if (m) {
    const mode = m[1];
    const weekday = m[2];
    // tolerant weekday lookup (accepts 'mon', 'Mon.', 'thu', 'thurs', etc.)
    const weekdayRaw = weekday.replace(/[^a-z]/g, '').toLowerCase();
    let idx = WEEK_DAYS.indexOf(weekdayRaw);
    if (idx === -1) {
      const abbr = weekdayRaw.slice(0, 3);
      idx = WEEK_DAYS.findIndex((w) => w.slice(0, 3) === abbr);
    }
    if (idx >= 0) {
      return { date: getNextWeekday(now, idx, mode === "next" ? "next" : "coming"), timeHint };
    }
  }

  return null;
}

function parseDateInput(input){
  if (!input) return { ok: false };

  const nat = parseNaturalPhrase(input);
  if (nat && nat.date instanceof Date && !isNaN(nat.date)) {
    return {
      ok: true,
      dateObj: nat.date,
      dateStr: formatDDMMYYYY(nat.date),
      timeHint: nat.timeHint
    };
  }

  const d = new Date(input);
  if (!isNaN(d)) {
    return {
      ok: true,
      dateObj: d,
      dateStr: formatDDMMYYYY(d),
      timeHint: null
    };
  }

  return { ok: false };
}

const isValidDate = (input) => {
  const res = parseDateInput(input);
  if (!res.ok) return false;

  const d = new Date(res.dateObj.getFullYear(), res.dateObj.getMonth(), res.dateObj.getDate());
  const today = new Date();
  today.setHours(0,0,0,0);

  if (d < today) return false;

  const limit = new Date();
  limit.setDate(limit.getDate() + 120);
  limit.setHours(0,0,0,0);
  if (d > limit) return false;

  const year = d.getFullYear();
  if (year < 2024 || year > 2035) return false;

  return true;
};

const normalizeDate = (input) => {
  const res = parseDateInput(input);
  return res.ok ? res.dateStr : input;
};

// ---------- City alias map (expanded) ----------
const cityAliasMap = {
  // South
  "hyd":"Hyderabad","hydr":"Hyderabad","hyderabad":"Hyderabad",
  "sec":"Secunderabad","secunderabad":"Secunderabad",
  "cbe":"Coimbatore","coimbatore":"Coimbatore","covai":"Coimbatore",
  "blr":"Bengaluru","bangalore":"Bengaluru","b'lore":"Bengaluru",
  "madras":"Chennai","chn":"Chennai","chennai":"Chennai",
  "vizag":"Visakhapatnam","vskp":"Visakhapatnam","visakhapatnam":"Visakhapatnam",
  "mdu":"Madurai","madurai":"Madurai",
  "trichy":"Tiruchirappalli","tiruchirappalli":"Tiruchirappalli","tiruchi":"Tiruchirappalli",
  "tvm":"Thiruvananthapuram","thiruvananthapuram":"Thiruvananthapuram",
  "kochi":"Kochi","cochin":"Kochi","ekm":"Kochi",
  "calicut":"Kozhikode","kozhikode":"Kozhikode",

  // West
  "mum":"Mumbai","mumbai":"Mumbai","bombay":"Mumbai","navimumbai":"Navi Mumbai",
  "pune":"Pune","ahmd":"Ahmedabad","ahmedabad":"Ahmedabad",

  // North
  "del":"New Delhi","nd":"New Delhi","delhi":"New Delhi","newdelhi":"New Delhi",
  "gurgaon":"Gurugram","ggn":"Gurugram","gurugram":"Gurugram",
  "noida":"Noida","ghaziabad":"Ghaziabad","gzb":"Ghaziabad",

  // East
  "kol":"Kolkata","kolkata":"Kolkata","calcutta":"Kolkata",
  "bbsr":"Bhubaneswar","bhubaneswar":"Bhubaneswar",

  // Central & misc
  "bhopal":"Bhopal","indore":"Indore","nagpur":"Nagpur","ngp":"Nagpur","jabalpur":"Jabalpur",
  "nellore":"Nellore","tirupati":"Tirupati","guntur":"Guntur"
};

function normTokenCity(s) {
  if (!s) return "";
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function resolveCityAlias(input) {
  if (!input) return { kind: "invalid" };
  const raw = String(input).trim();
  const key = normTokenCity(raw);

  if (cityAliasMap[key]) return { kind: "alias", canonical: cityAliasMap[key], raw };

  // If looks like a valid city name, accept as normal (only letters + spaces, min 3 chars)
  if (/^[A-Za-z ]+$/.test(raw) && raw.replace(/\s+/g, "").length >= 3) {
    const cand = raw.split(/\s+/).map(w => w[0]?.toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    return { kind: "normal", canonical: cand, raw };
  }

  return { kind: "invalid" };
}

const isValidCity = (s) => {
  if (!s) return false;
  const cleaned = String(s).trim();

  // must be at least 3 visible letters (ignore spaces)
  if (cleaned.replace(/\s+/g, "").length < 3) return false;

  // only letters and spaces allowed
  if (!/^[A-Za-z ]+$/.test(cleaned)) return false;

  // avoid all-uppercase short codes like "CBE", "BLR"
  const noSpace = cleaned.replace(/\s+/g, "");
  if (noSpace.length <= 4 && /^[A-Z]+$/.test(noSpace)) return false;

  // reject obvious numeric or symbol-containing inputs
  if (/[0-9]/.test(cleaned)) return false;

  return true;
};

const parsePassengerLine = (line) => {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 3) return null;
  const [name, ageStr, genderRaw] = [
    parts.slice(0, parts.length - 2).join(" "),
    parts[parts.length - 2],
    parts[parts.length - 1],
  ];
  const age = parseInt(ageStr, 10);
  const g = (genderRaw || "").toUpperCase();
  if (!name || isNaN(age) || age <= 0) return null;
  if (!["M", "F", "O", "MALE", "FEMALE", "OTHER"].includes(g)) return null;
  const gender = g.startsWith("M") ? "M" : g.startsWith("F") ? "F" : "O";
  return { name: name.trim(), age, gender };
};

module.exports = { parseDateInput, isValidDate, formatDDMMYYYY, normalizeDate, resolveCityAlias, parsePassengerLine };
