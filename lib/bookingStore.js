const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../data/bookings.json");

/* =========================
 * Helpers
 * ========================= */

function load() {
  if (!fs.existsSync(FILE)) return [];
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function save(data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function generateBookingId() {
  return `QK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/* =========================
 * Public API
 * ========================= */

function saveBooking(booking) {
  const all = load();

  const savedBooking = {
    id: booking.id || generateBookingId(),
    createdAt: booking.createdAt || Date.now(),
    ...booking,
  };

  all.push(savedBooking);
  save(all);

  return savedBooking; // ✅ CRITICAL FIX
}

function findBookingById(id) {
  return load().find((b) => b.id === id);
}

function updateBooking(id, patch) {
  const all = load();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  all[idx] = {
    ...all[idx],
    ...patch,
    updatedAt: Date.now(),
  };

  save(all);
  return all[idx];
}

module.exports = {
  saveBooking,
  findBookingById,
  updateBooking,
};
