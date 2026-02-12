const fs = require("fs");
const path = require("path");
const { sendText, sendButtons } = require("./waClient");
const { createPayment } = require("./payments/paymentFactory");
const { buildUPILink } = require("./payments/paymentLinks");
const { get } = require("http");
const {
  addInProcessBooking,
  removeInProcessBooking,
  addConfirmedBooking,
} = require("./utils/bookingFileStore");

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

/**
 * Human-readable booking ID (after CONFIRM)
 * QB2026011601 / QT / QF
 */
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
    user: booking.user || null,

    passengers: booking.passengers || [],
    paxCount: booking.paxCount || booking.passengers?.length || null,

    // 🔑 CRITICAL: payment MUST be null initially
    payment: booking.payment ?? null,

    status: booking.status || "DRAFT",

    createdAt: booking.createdAt || Date.now(),
    updatedAt: Date.now(),

    meta: booking.meta || {},
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
    case "PAYMENT_PENDING":
      return "💳 Payment Pending";
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
  if (
    oldBooking.status === newBooking.status &&
    newBooking.status !== "CONFIRMED"
  ) {
    return;
  }

  if (!newBooking.user) return;

  /* =========================
   * 1️⃣ STATUS UPDATE MESSAGE
   * ========================= */

  const statusMsg =
    `🔔 *Booking Status Updated*\n\n` +
    `🆔 Booking ID: *${newBooking.id}*\n` +
    `Type: ${newBooking.type}\n` +
    `${newBooking.from ? `From: ${newBooking.from}\n` : ""}` +
    `${newBooking.to ? `To: ${newBooking.to}\n` : ""}` +
    `${newBooking.date ? `Date: ${newBooking.date}\n` : ""}` +
    `\nStatus: *${formatStatus(newBooking.status)}*\n\n` +
    `Type *STATUS* to check details\nType *HELP* for support`;

  try {
    await sendText(newBooking.user, statusMsg);
  } catch (err) {
    console.error("❌ Failed to send status message", err);
    return;
  }

  /* =========================
   * 2️⃣ PAYMENT ACTIVATION
   * ========================= */

  if (newBooking.status === "CONFIRMED" && !newBooking.payment) {
    const totalAmount =
      newBooking.amount?.total ??
      newBooking.amount ??
      newBooking.total ??
      newBooking.fare ??
      newBooking.price;

    if (!totalAmount) {
      console.error("❌ Payment amount missing for booking", newBooking.id);
      return;
    }

    const payment = createPayment({
      bookingId: newBooking.id,
      amount: {
        total: totalAmount,
      },
    });

    const upiId = process.env.QUICKETS_UPI_ID;
    const name = process.env.QUICKETS_UPI_NAME;

    payment.link = buildUPILink({
      upiId,
      name,
      amount: payment.amount.total,
      note: `Booking ${newBooking.id}`,
    });

    // Move booking to payment pending
    updateBooking(newBooking.id, {
      status: "PAYMENT_PENDING",
      payment,
    });

    // Ask payment method via buttons
    await sendButtons(
      newBooking.user,
      `💳 *Payment Required*\n\n` +
        `Amount: ₹${payment.amount.total}\n\n` +
        `Choose a payment option:`,
      [
        { id: "PAY_UPI", title: "🔗 Pay with UPI" },
        { id: "PAY_QR", title: "📷 QR Code" },
      ]
    );
  }
}

/* =========================
 * Public API
 * ========================= */

function saveBooking(booking) {
  const all = load();
  let normalized = normalizeBooking(booking);

  // Upgrade booking ID only once on CONFIRM
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
    notifyStatusChange(oldBooking, all[idx]);
  }

  save(all);
  return normalized;
}

function updateBooking(id, patch) {
  const all = load();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  const oldBooking = all[idx];
  const updated = { ...oldBooking, ...patch, updatedAt: Date.now() };

  all[idx] = updated;
  save(all);

  notifyStatusChange(oldBooking, updated);

  /* =========================
     🔹 FILE TRACKING LOGIC
  ========================= */
  /* =========================
   🔹 FILE TRACKING LOGIC
========================= */

// If payment success OR status confirmed → move to confirmed
if (
  updated.status === "CONFIRMED" ||
  updated.payment?.status === "SUCCESS"
) {
  removeInProcessBooking(updated.id);
  addConfirmedBooking(updated);
}

// If cancelled or failed → remove from inProcess only
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
  return load().find((b) => b.id === id) || null;
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
  return load().filter(
    (b) =>
      b.type === type &&
      b.status === "PROCESSING"
  );
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

    paymentPending: all.filter(
      (b) => b.status === "PAYMENT_PENDING"
    ).length,

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
};
