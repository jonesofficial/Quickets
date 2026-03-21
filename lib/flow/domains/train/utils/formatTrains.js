function formatTrainsSplit(trains, fromName, toName) {

  if (!trains || !trains.length) {
    return ["❌ No trains available for this route."];
  }

  const chunkSize = 10;

  const messages = [];

  for (let i = 0; i < trains.length; i += chunkSize) {

    const chunk = trains.slice(i, i + chunkSize);

    const start = i + 1;
    const end = i + chunk.length;

    let msg =
`🚆 *Available Trains (${start}–${end})*
📍 ${fromName} → ${toName}
━━━━━━━━━━━━━━━━━━

`;

    chunk.forEach((t, index) => {

      const serial = i + index + 1;

      msg +=
`*T${serial.toString().padStart(2, "0")}*  *${t.trainNo}*  *${t.trainName}*   ${t.departure}\n`;

    });

    msg +=
`\n⚡ Reply *T + number*
Example: *T${start}*`;

    messages.push(msg);
  }

  return messages;
}

module.exports = formatTrainsSplit;