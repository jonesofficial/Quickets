function formatTrains(trains, fromName, toName, page = 1, perPage = 5) {

  if (!trains || !trains.length) {
    return "❌ No trains available for this route.";
  }

  const totalPages = Math.ceil(trains.length / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const pageTrains = trains.slice(start, end);

  let msg =
`🚆 *Trains Available*

📍 *${fromName} → ${toName}*
━━━━━━━━━━━━━━━━━━
📄 Page *${page}/${totalPages}*

`;

  pageTrains.forEach((t, i) => {
    const index = start + i + 1;

    msg +=
`*T${index}*  🚄 *${t.trainName}*
🆔 ${t.trainNo}
🕒 ${t.departure} → ${t.arrival}

`;
  });

  msg +=
`━━━━━━━━━━━━━━━━━━
👉 Reply with *T + number*

_Example: T3_`;

  if (page < totalPages) {
    msg += `\n\n➡️ NEXT for more`;
  }

  if (page > 1) {
    msg += `\n⬅️ BACK for previous`;
  }

  return msg;
}

module.exports = formatTrains;