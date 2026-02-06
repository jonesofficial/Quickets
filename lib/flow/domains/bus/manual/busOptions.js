const path = require("path");
const { sendText } = require(
  path.resolve(__dirname, "../../../../waClient.js")
);

module.exports = async function sendBusOptions(ctx) {
  const buses = ctx?.session?.busOptions;

  if (!Array.isArray(buses) || !buses.length) {
    await sendText(
      ctx.user,
      "❌ No buses available at the moment. Please wait while we check again."
    );
    return;
  }

  let msg = "🚌 *Choose the bus that suits you* 👇\n\n";

  buses.forEach((b, index) => {
    const busNumber = index + 1; // ✅ ONLY source of truth

    msg += `*${busNumber}️⃣ ${b.name}*\n`;
    msg += `${b.type}\n`;
    msg += `⏰ ${b.time} | ⌛ ${b.duration}\n`;
    msg += `💺 Seats: ${b.seats}\n`;
    msg += `💰 Price: ₹${b.price}\n\n`;
  });

  msg += "👉 Reply with the *bus number* to continue.";

  await sendText(ctx.user, msg);
};
