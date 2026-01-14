/**
 * TRAIN SEARCH
 * Purpose:
 * - Validate stations, date, class
 * - Prepare IRCTC-style search payload
 */

module.exports = async function trainSearch(booking) {
  const errors = [];

  if (!booking.from || !booking.to) {
    errors.push("Stations not selected");
  }

  if (!booking.date) {
    errors.push("Journey date missing");
  }

  if (!booking.class) {
    errors.push("Travel class not selected");
  }

  if (booking.from && booking.to && booking.from === booking.to) {
    errors.push("From and To stations cannot be same");
  }

  return {
    ok: errors.length === 0,
    type: "TRAIN",
    errors,
    meta: {
      route: `${booking.from} → ${booking.to}`,
      date: booking.date,
      class: booking.class,
      quota: booking.quota || "GN",
    },
  };
};
