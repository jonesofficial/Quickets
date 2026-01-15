const fs = require("fs");
const path = require("path");
const { sendText } = require("./waClient");

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
 * 🔔 Auto Notify Helper
 * ========================= */

function formatStatus(status) {
  switch (status) {
    case "PROCESSING":
      return "🕒 Processing";
    case "CONFIRMED":
      return "✅ Confirmed";
    case "FAILED":
      return "❌ Failed";
    case "CANCELLED":
      return "🚫 Cancelled";
    default:
      return status;
  }
}

async function notifyStatusChange(oldBooking, newBooking) {
  if (!oldBooking) return;
  if (oldBooking.status === newBooking.status) return;
  if (!newBooking.user) return;

  let message =
    `🔔 *Booking Status Updated*\n\n` +
    `🆔 Booking ID: *${newBooking.id}*\n` +
    `Type: ${newBooking.type}\n` +
    `${newBooking.from ? `From: ${newBooking.from}\n` : ""}` +
    `${newBooking.to ? `To: ${newBooking.to}\n` : ""}` +
    `${newBooking.date ? `Date: ${newBooking.date}\n` : ""}` +
    `\nStatus: *${formatStatus(newBooking.status)}*`;

  if (newBooking.meta?.reason) {
    message += `\nReason: ${newBooking.meta.reason}`;
  }

  message += `\n\nType *STATUS* to check details\nType *HELP* for support`;

  try {
    await sendText(newBooking.user, message);
  } catch (err) {
    console.error("❌ Failed to send status notification", err);
  }
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
    const oldBooking = all[idx];

    all[idx] = {
      ...oldBooking,
      ...normalized,
      updatedAt: Date.now(),
    };

    // 🔔 Auto-notify on status change
    notifyStatusChange(oldBooking, all[idx]);
  }

  save(all);
  return normalized;
}

/**
 * Find booking by booking ID
 */
function findBookingById(id) {
  if (!id) return null;
  return load().find((b) => b.id === id) || null;
}

/**
 * Find all bookings by user (unsorted)
 */
function findBookingsByUser(user) {
  if (!user) return [];
  return load().filter((b) => b.user === user);
}

/**
 * Get the most recent booking by user
 * (Used for STATUS command)
 */
function getLastBookingByUser(user) {
  if (!user) return null;

  const bookings = findBookingsByUser(user);
  if (!bookings.length) return null;

  return bookings.sort(
    (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
  )[0];
}

/**
 * Update booking fields safely
 */
function updateBooking(id, patch) {
  const all = load();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  const oldBooking = all[idx];

  all[idx] = {
    ...oldBooking,
    ...patch,
    updatedAt: Date.now(),
  };

  save(all);

  // 🔔 Auto-notify on status change
  notifyStatusChange(oldBooking, all[idx]);

  return all[idx];
}

module.exports = {
  saveBooking,
  findBookingById,
  findBookingsByUser,
  getLastBookingByUser,
  updateBooking,
};
