const { sendText, sendImage } = require("../../../waClient");

module.exports = {
  async sendSeatLayout(ctx, image) {
    await sendImage(ctx.user, image);
    await sendText(
      ctx.user,
      "🪑 Please reply with the seat number only (e.g. E3, LB4)"
    );
  },

  validateSeat(seat, rules, gender) {
    if (!rules.AVAILABLE.includes(seat)) return "Seat not available";
    if (rules.LADIES.includes(seat) && gender === "Male")
      return "This seat is reserved for ladies";
    return null;
  }
};
