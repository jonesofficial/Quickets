// // lib/adminCommand.js

// const {
//   handleAdminApproval,
//   handleAdminVerification,
// } = require("./payments");

// const { findBookingById } = require("./sessionStore");

// function handleAdminCommands(ctx) {
//   const text = ctx.msg.text?.body?.trim();
//   console.log("🛂 ADMIN COMMAND CHECK:", text);

//   if (!text) return false;

//   // APPROVE
//   if (text.startsWith("APPROVE")) {
//     const bookingId = text.split(" ")[1];
//     if (!bookingId) return true;

//     const booking = findBookingById(bookingId);
//     if (!booking) {
//       console.log("❌ Booking not found:", bookingId);
//       return true;
//     }

//     handleAdminApproval(booking);
//     return true;
//   }

//   // PAID
//   if (text.startsWith("PAID")) {
//     const bookingId = text.split(" ")[1];
//     if (!bookingId) return true;

//     const booking = findBookingById(bookingId);
//     if (!booking) {
//       console.log("❌ Booking not found:", bookingId);
//       return true;
//     }

//     handleAdminVerification(booking);
//     return true;
//   }

//   return false;
// }

// module.exports = { handleAdminCommands };

// lib/adminCommand.js

const { approveBooking } = require("./bookings");
const { markBookingPaid } = require("./payments");

/**
 * Admin command handler
 * Returns true if handled, false otherwise
 */
async function handleAdminCommands({ from, text }) {
  if (!text) return false;

  const cmd = text.toUpperCase().trim();

  // APPROVE <BOOKING_ID>
  if (cmd.startsWith("APPROVE ")) {
    const bookingId = cmd.split(/\s+/)[1];
    if (!bookingId) return true;

    console.log("✅ ADMIN APPROVE:", bookingId);
    await approveBooking(bookingId);
    return true;
  }

  // PAID <BOOKING_ID>
  if (cmd.startsWith("PAID ")) {
    const bookingId = cmd.split(/\s+/)[1];
    if (!bookingId) return true;

    console.log("💰 ADMIN PAID:", bookingId);
    await markBookingPaid(bookingId);
    return true;
  }

  return false;
}

module.exports = { handleAdminCommands };
