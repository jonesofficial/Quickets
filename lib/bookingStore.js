const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../data/bookings.json");

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

/* =========================
 * Public API
 * ========================= */

function saveBooking(booking) {
  const all = load();
  all.push(booking);
  save(all);
}

function findBookingById(id) {
  return load().find((b) => b.id === id);
}

function updateBooking(id, patch) {
  const all = load();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  all[idx] = { ...all[idx], ...patch };
  save(all);
  return all[idx];
}

module.exports = {
  saveBooking,
  findBookingById,
  updateBooking,
};
