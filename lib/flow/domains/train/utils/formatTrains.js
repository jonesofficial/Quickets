function formatTrains(trains, fromName, toName) {

  let msg =
`🚆 *Available Trains*

📍 ${fromName} ➜ ${toName}

`;

  if (!trains || !trains.length) {
    return msg + "❌ No trains available.";
  }

  trains.forEach((t, i) => {

    msg +=
`${i + 1}️⃣ *${t.trainNo} ${t.trainName}*
🕐 ${t.departure} ➜ ${t.arrival}

`;

  });

  return msg;
}

module.exports = formatTrains;