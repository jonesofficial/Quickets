function formatTrains(trains, fromName, toName, page = 1, perPage = 10) {

  if (!trains || !trains.length) {
    return "❌ No trains available for this route.";
  }

  const totalPages = Math.ceil(trains.length / perPage);

  const start = (page - 1) * perPage;
  const end = start + perPage;

  const pageTrains = trains.slice(start, end);

  let msg =
`🚆 *Available Trains*

📍 ${fromName} → ${toName}

Page ${page}/${totalPages}

`;

  pageTrains.forEach((t, i) => {

    const index = start + i + 1;

    msg +=
`T${index}. *${t.trainNo} ${t.trainName}*
   ${t.departure} → ${t.arrival}

`;

  });

  msg += `━━━━━━━━━━━━━━
Reply with *T + number* to select train

Example:
T3`;

  if (page < totalPages) {
    msg += `
NEXT → More trains`;
  }

  if (page > 1) {
    msg += `
BACK → Previous trains`;
  }

  return msg;
}

module.exports = formatTrains;