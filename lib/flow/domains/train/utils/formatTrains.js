function getDuration(dep, arr) {

  const [dh, dm] = dep.split(":").map(Number);
  const [ah, am] = arr.split(":").map(Number);

  let start = dh * 60 + dm;
  let end = ah * 60 + am;

  if (end < start) end += 24 * 60;

  const diff = end - start;

  const h = Math.floor(diff / 60);
  const m = diff % 60;

  return `${h}h ${m}m`;
}

function formatTrains(trains, fromName, toName) {

  let msg =
`🚆 *Available Trains*

📍 Boarding Station: ${fromName}
🏁 Departure Station: ${toName}

`;

  trains.slice(0,5).forEach((t, i) => {

    const duration = getDuration(t.departure, t.arrival);

    msg +=
`${i+1}️⃣ *${t.trainNo} ${t.trainName}*
🕐 Departure: ${t.departure}
🕐 Arrival: ${t.arrival}
⏳ Duration: ${duration}
💺 Coaches: SL • 2S • 3A

`;

  });

  return msg;
}

module.exports = formatTrains;