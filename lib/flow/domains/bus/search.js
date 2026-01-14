/**
 * BUS SEARCH
 * Purpose:
 * - Validate route & date
 * - Prepare data for admin / future API
 */

module.exports = async function busSearch(booking) {
  const errors = [];

  if (!booking.from || !booking.to) {
    errors.push("Route is incomplete");
  }

  if (!booking.date) {
    errors.push("Journey date missing");
  }

  if (booking.from && booking.to && booking.from === booking.to) {
    errors.push("From and To cannot be same");
  }

  return {
    ok: errors.length === 0,
    type: "BUS",
    errors,
    meta: {
      route: `${booking.from} → ${booking.to}`,
      date: booking.date,
      timePref: booking.timePref,
      seatType: booking.seatType,
      budget: booking.budget,
    },
  };
};
