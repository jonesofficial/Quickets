// Wrapper around existing working flow
const bookingFlow = require("../../bookingFlow");

module.exports = async function busBooking(ctx) {
  return bookingFlow(ctx);
};
