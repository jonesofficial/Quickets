const path = require("path");
const { sendText } = require(
  path.resolve(__dirname, "../../../../waClient.js")
);


module.exports = async function sendBusOptions(ctx) {
  const buses = ctx.session.busOptions;

  let msg = "Choose the bus that suits you 👇\n\n";
  buses.forEach(b => {
    msg += `${b.id}️⃣ ${b.name}\n`;
    msg += `• ${b.type}\n`;
    msg += `• Time: ${b.time}\n`;
    msg += `• Duration: ${b.duration}\n`;
    msg += `• Seats: ${b.seats}\n`;
    msg += `• Price: ₹${b.price}\n\n`;
  });

  await sendText(ctx.user, msg);
};
