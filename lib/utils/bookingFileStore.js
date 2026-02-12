const fs = require("fs");
const path = require("path");

const inProcessPath = path.join(__dirname, "../data/inProcessBookings.json");
const confirmedPath = path.join(__dirname, "../data/confirmedBookings.json");

/* ===============================
   Helper Functions
=============================== */

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data || "[]");
  } catch (err) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/* ===============================
   IN PROCESS BOOKINGS
=============================== */

function addInProcessBooking(booking) {
  const bookings = readJSON(inProcessPath);

  const exists = bookings.find(b => b.id === booking.id);
  if (exists) return;

  bookings.push(formatBooking(booking));
  writeJSON(inProcessPath, bookings);
}

function removeInProcessBooking(bookingId) {
  let bookings = readJSON(inProcessPath);
  bookings = bookings.filter(b => b.id !== bookingId);
  writeJSON(inProcessPath, bookings);
}

/* ===============================
   CONFIRMED BOOKINGS
=============================== */

function addConfirmedBooking(booking) {
  const bookings = readJSON(confirmedPath);

  const exists = bookings.find(b => b.id === booking.id);
  if (exists) return;

  bookings.push({
    ...formatBooking(booking),
    confirmedAt: Date.now()
  });

  writeJSON(confirmedPath, bookings);
}

/* ===============================
   COMMON FORMAT (NO PERSONAL DATA)
=============================== */

function formatBooking(booking) {
  return {
    id: booking.id,
    service: booking.type,
    operator: booking.meta?.operator || null,
    from: booking.meta?.from || null,
    to: booking.meta?.to || null,
    travelDate: booking.meta?.date || null,
    departureTime: booking.meta?.time || null,
    seat: booking.meta?.seat || null,
    amount: booking.meta?.amount || null,
    paymentStatus: booking.payment?.status || null,
    status: booking.status,
    createdAt: booking.createdAt || Date.now()
  };
}

module.exports = {
  addInProcessBooking,
  removeInProcessBooking,
  addConfirmedBooking,
};
