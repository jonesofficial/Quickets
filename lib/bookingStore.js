// const fs = require("fs");
// const path = require("path");
// const { sendText } = require("./waClient");
// const {
//   addInProcessBooking,
//   removeInProcessBooking,
//   addConfirmedBooking,
// } = require("./utils/bookingFileStore");

// const FILE = path.join(__dirname, "../data/bookings.json");

// const pool = require("../lib/neon/neon");

// /* =========================
//  * Internal Helpers
//  * ========================= */

// function load() {
//   if (!fs.existsSync(FILE)) return [];
//   try {
//     return JSON.parse(fs.readFileSync(FILE, "utf8"));
//   } catch (e) {
//     console.error("❌ Failed to read bookings.json", e);
//     return [];
//   }
// }

// function save(data) {
//   fs.mkdirSync(path.dirname(FILE), { recursive: true });
//   fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
// }

// function generateBookingId() {
//   return `QK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
// }

// function generateReadableBookingId(type) {
//   const prefix = { BUS: "QB", TRAIN: "QT", FLIGHT: "QF" }[type] || "QX";

//   const now = new Date();
//   const yyyy = now.getFullYear();
//   const mm = String(now.getMonth() + 1).padStart(2, "0");
//   const dd = String(now.getDate()).padStart(2, "0");
//   const date = `${yyyy}${mm}${dd}`;

//   const all = load();
//   const todayCount = all.filter(
//     (b) => b.id && b.id.startsWith(prefix + date),
//   ).length;

//   return `${prefix}${date}${String(todayCount + 1).padStart(2, "0")}`;
// }

// function normalizeBooking(booking) {
//   return {
//     ...booking,
//     id: booking.id || generateBookingId(),
//     type: booking.type || "UNKNOWN",
//     user: booking.user || booking.contactPhone || booking.meta?.user || null,
//     passengers: booking.passengers || [],
//     paxCount: booking.paxCount || booking.passengers?.length || null,
//     payment: booking.payment ?? null,
//     status: booking.status || "DRAFT",
//     createdAt: booking.createdAt || Date.now(),
//     updatedAt: Date.now(),
//     meta: booking.meta || {},
//   };
// }

// /* =========================
//  * Status Formatter
//  * ========================= */

// function formatStatus(status) {
//   switch (status) {
//     case "PROCESSING":
//       return "🕒 Processing";

//     case "AWAITING_PRICE":
//       return "⏳ Awaiting Fare";

//     case "FARE_SENT":
//       return "💰 Fare Sent";

//     case "PAYMENT_PENDING":
//       return "💳 Payment Pending";

//     case "AWAITING_MANUAL_VERIFICATION":
//       return "🔍 Payment Verification";

//     case "CONFIRMED":
//     case "BOOKING_CONFIRMED":
//       return "✅ Confirmed";

//     case "FAILED":
//       return "❌ Failed";

//     case "CANCELLED":
//       return "🚫 Cancelled";

//     default:
//       return status;
//   }
// }
// /* =========================
//  * MANUAL STATUS SENDER
//  * ========================= */

// async function sendBookingStatus(booking) {
//   if (!booking?.user) return;

//   const statusMsg =
//     `🔔 *Booking Status*\n\n` +
//     `🆔 Booking ID: *${booking.id}*\n` +
//     `Type: ${booking.type}\n` +
//     `${booking.from ? `From: ${booking.from}\n` : ""}` +
//     `${booking.to ? `To: ${booking.to}\n` : ""}` +
//     `${booking.date ? `Date: ${booking.date}\n` : ""}` +
//     `\nStatus: *${formatStatus(booking.status)}*`;

//   await sendText(booking.user, statusMsg);
// }

// /* =========================
//  * Public API
//  * ========================= */

// function saveBooking(booking) {
//   const all = load();
//   let normalized = normalizeBooking(booking);

//   if (normalized.status === "PROCESSING" && normalized.id.startsWith("QK-")) {
//     normalized.id = generateReadableBookingId(normalized.type);
//   }

//   const idx = all.findIndex((b) => b.id === normalized.id);

//   if (idx === -1) {
//     all.push(normalized);

//     if (normalized.status !== "CONFIRMED") {
//       addInProcessBooking(normalized);
//     }
//   } else {
//     const oldBooking = all[idx];
//     all[idx] = { ...oldBooking, ...normalized, updatedAt: Date.now() };
//   }

//   save(all);
//   return normalized;
// }

// function updateBooking(id, patch) {
//   const all = load();
//   const idx = all.findIndex((b) => b.id === id);
//   if (idx === -1) return null;

//   const oldBooking = all[idx];
//   const updated = { ...oldBooking, ...patch, updatedAt: Date.now() };

//   all[idx] = updated;
//   save(all);

//   /* =========================
//      FILE TRACKING LOGIC
//   ========================= */

//   if (updated.status === "CONFIRMED" || updated.payment?.status === "SUCCESS") {
//     removeInProcessBooking(updated.id);
//     addConfirmedBooking(updated);
//   }

//   if (
//     updated.status === "CANCELLED" ||
//     updated.status === "FAILED" ||
//     updated.status === "PAYMENT_FAILED"
//   ) {
//     removeInProcessBooking(updated.id);
//   }

//   return updated;
// }
// function findBookingById(id) {
//   if (!id) return null;

//   const cleanId = String(id).trim().toUpperCase();
//   const all = load();

//   return all.find((b) => String(b.id).trim().toUpperCase() === cleanId) || null;
// }

// function findBookingsByUser(user) {
//   return load().filter((b) => b.user === user);
// }

// function getLastBookingByUser(user) {
//   return findBookingsByUser(user).sort(
//     (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt),
//   )[0];
// }

// function getPendingManualBookings(type) {
//   return load().filter((b) => b.type === type && b.status === "PROCESSING");
// }

// function getAdminStats() {
//   const all = load();

//   return {
//     total: all.length,
//     pendingTrain: all.filter(
//       (b) => b.type === "TRAIN" && b.status === "PROCESSING",
//     ).length,
//     pendingBus: all.filter((b) => b.type === "BUS" && b.status === "PROCESSING")
//       .length,
//     confirmed: all.filter((b) => b.status === "CONFIRMED").length,
//     paymentPending: all.filter((b) => b.status === "PAYMENT_PENDING").length,
//     failed: all.filter((b) => b.status === "FAILED").length,
//     cancelled: all.filter((b) => b.status === "CANCELLED").length,
//   };
// }

// await pool.query(
//   "INSERT INTO bookings (id,data) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET data=$2",
//   [booking.id, booking],
// );

// module.exports = {
//   saveBooking,
//   updateBooking,
//   findBookingById,
//   findBookingsByUser,
//   getLastBookingByUser,
//   getPendingManualBookings,
//   getAdminStats,
//   generateReadableBookingId,
//   sendBookingStatus, // 👈 manually call this on STATUS
// };


const fs = require("fs");
const path = require("path");
const { sendText } = require("./waClient");

const {
  addInProcessBooking,
  removeInProcessBooking,
  addConfirmedBooking,
} = require("./utils/bookingFileStore");

const FILE = path.join(__dirname, "../data/bookings.json");

const pool = require("../lib/neon/neon");

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

function generateReadableBookingId(type) {
  const prefix = { BUS: "QB", TRAIN: "QT", FLIGHT: "QF" }[type] || "QX";

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const date = `${yyyy}${mm}${dd}`;

  const all = load();

  const todayCount = all.filter(
    (b) => b.id && b.id.startsWith(prefix + date)
  ).length;

  return `${prefix}${date}${String(todayCount + 1).padStart(2, "0")}`;
}

function normalizeBooking(booking) {
  return {
    ...booking,
    id: booking.id || generateBookingId(),
    type: booking.type || "UNKNOWN",
    user: booking.user || booking.contactPhone || booking.meta?.user || null,
    passengers: booking.passengers || [],
    paxCount: booking.paxCount || booking.passengers?.length || null,
    payment: booking.payment ?? null,
    status: booking.status || "DRAFT",
    createdAt: booking.createdAt || Date.now(),
    updatedAt: Date.now(),
    meta: booking.meta || {},
  };
}

/* =========================
 * Status Formatter
 * ========================= */

function formatStatus(status) {
  switch (status) {
    case "PROCESSING":
      return "🕒 Processing";

    case "AWAITING_PRICE":
      return "⏳ Awaiting Fare";

    case "FARE_SENT":
      return "💰 Fare Sent";

    case "PAYMENT_PENDING":
      return "💳 Payment Pending";

    case "AWAITING_MANUAL_VERIFICATION":
      return "🔍 Payment Verification";

    case "CONFIRMED":
    case "BOOKING_CONFIRMED":
      return "✅ Confirmed";

    case "FAILED":
      return "❌ Failed";

    case "CANCELLED":
      return "🚫 Cancelled";

    default:
      return status;
  }
}

/* =========================
 * MANUAL STATUS SENDER
 * ========================= */

async function sendBookingStatus(booking) {
  if (!booking?.user) return;

  const statusMsg =
    `🔔 *Booking Status*\n\n` +
    `🆔 Booking ID: *${booking.id}*\n` +
    `Type: ${booking.type}\n` +
    `${booking.from ? `From: ${booking.from}\n` : ""}` +
    `${booking.to ? `To: ${booking.to}\n` : ""}` +
    `${booking.date ? `Date: ${booking.date}\n` : ""}` +
    `\nStatus: *${formatStatus(booking.status)}*`;

  await sendText(booking.user, statusMsg);
}

/* =========================
 * Public API
 * ========================= */

async function saveBooking(booking) {
  const all = load();

  let normalized = normalizeBooking(booking);

  if (normalized.status === "PROCESSING" && normalized.id.startsWith("QK-")) {
    normalized.id = generateReadableBookingId(normalized.type);
  }

  const idx = all.findIndex((b) => b.id === normalized.id);

  if (idx === -1) {
    all.push(normalized);

    if (normalized.status !== "CONFIRMED") {
      addInProcessBooking(normalized);
    }
  } else {
    const oldBooking = all[idx];

    all[idx] = { ...oldBooking, ...normalized, updatedAt: Date.now() };
  }

  save(all);

  /* =========================
     SAVE TO NEON DATABASE
  ========================= */

  try {
    await pool.query(
      "INSERT INTO bookings (id,data) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET data=$2",
      [normalized.id, normalized]
    );
  } catch (err) {
    console.error("Neon save failed:", err.message);
  }

  return normalized;
}

async function updateBooking(id, patch) {
  const all = load();

  const idx = all.findIndex((b) => b.id === id);

  if (idx === -1) return null;

  const oldBooking = all[idx];

  const updated = { ...oldBooking, ...patch, updatedAt: Date.now() };

  all[idx] = updated;

  save(all);

  /* =========================
     SAVE UPDATE TO NEON
  ========================= */

  try {
    await pool.query(
      "INSERT INTO bookings (id,data) VALUES ($1,$2) ON CONFLICT (id) DO UPDATE SET data=$2",
      [updated.id, updated]
    );
  } catch (err) {
    console.error("Neon update failed:", err.message);
  }

  /* =========================
     FILE TRACKING LOGIC
  ========================= */

  if (updated.status === "CONFIRMED" || updated.payment?.status === "SUCCESS") {
    removeInProcessBooking(updated.id);
    addConfirmedBooking(updated);
  }

  if (
    updated.status === "CANCELLED" ||
    updated.status === "FAILED" ||
    updated.status === "PAYMENT_FAILED"
  ) {
    removeInProcessBooking(updated.id);
  }

  return updated;
}

function findBookingById(id) {
  if (!id) return null;

  const cleanId = String(id).trim().toUpperCase();

  const all = load();

  return all.find((b) => String(b.id).trim().toUpperCase() === cleanId) || null;
}

function findBookingsByUser(user) {
  return load().filter((b) => b.user === user);
}

function getLastBookingByUser(user) {
  return findBookingsByUser(user).sort(
    (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
  )[0];
}

function getPendingManualBookings(type) {
  return load().filter((b) => b.type === type && b.status === "PROCESSING");
}

function getAdminStats() {
  const all = load();

  return {
    total: all.length,
    pendingTrain: all.filter(
      (b) => b.type === "TRAIN" && b.status === "PROCESSING"
    ).length,
    pendingBus: all.filter(
      (b) => b.type === "BUS" && b.status === "PROCESSING"
    ).length,
    confirmed: all.filter((b) => b.status === "CONFIRMED").length,
    paymentPending: all.filter((b) => b.status === "PAYMENT_PENDING").length,
    failed: all.filter((b) => b.status === "FAILED").length,
    cancelled: all.filter((b) => b.status === "CANCELLED").length,
  };
}

module.exports = {
  saveBooking,
  updateBooking,
  findBookingById,
  findBookingsByUser,
  getLastBookingByUser,
  getPendingManualBookings,
  getAdminStats,
  generateReadableBookingId,
  sendBookingStatus,
};