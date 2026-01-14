const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../data/bookings.json");

/* =========================
 * Internal Helpers
 * ========================= */

function load() {
  if (!fs.existsSync(FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    console.error("❌ Failed to read bookings.json", e);
    return [];
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function generateBookingId() {
  return `QK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normalizeBooking(booking) {
  return {
    id: booking.id || generateBookingId(),
    type: booking.type || "UNKNOWN",
    user: booking.user || null,

    from: booking.from || null,
    to: booking.to || null,
    date: booking.date || null,

    passengers: booking.passengers || [],
    paxCount: booking.paxCount || booking.passengers?.length || null,

    payment: booking.payment || { status: "INIT" },
    status: booking.status || "DRAFT",

    createdAt: booking.createdAt || Date.now(),
    updatedAt: Date.now(),

    meta: booking.meta || {}, // future-safe
  };
}

/* =========================
 * Public API
 * ========================= */

/**
 * Save or update a booking safely (UPSERT)
 */
function saveBooking(booking) {
  const all = load();

  const normalized = normalizeBooking(booking);

  const idx = all.findIndex((b) => b.id === normalized.id);

  if (idx === -1) {
    all.push(normalized);
  } else {
    all[idx] = {
      ...all[idx],
      ...normalized,
      updatedAt: Date.now(),
    };
  }

  save(all);
  return normalized;
}

function findBookingById(id) {
  if (!id) return null;
  return load().find((b) => b.id === id) || null;
}

function findBookingsByUser(user) {
  if (!user) return [];
  return load().filter((b) => b.user === user);
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
  findBookingsByUser,
  updateBooking,
};
