function formatTrains(trains, fromName, toName) {

  if (!trains || !trains.length) {
    return "❌ No trains available for this route.";
  }

  let msg =
`🚆 *Hop on a Train!*
📍 ${fromName} → ${toName}
━━━━━━━━━━━━━━━━━━

`;

  trains.forEach((t, i) => {
    const index = i + 1;

    msg += `*T${index}.* ${t.trainNo} ${t.trainName} • 🕒 ${t.departure}\n`;
  });

  msg +=
`\n━━━━━━━━━━━━━━━━━━
⚡ Reply *T + number* to continue
_Example: T3_`;

  return msg;
}

module.exports = formatTrains;