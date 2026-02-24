// const { sendText } = require("../../../../waClient");
// const { startOrGet } = require("../../../../sessionStore");
// const BUS_STATES = require("./states");
// const { buildFinalSummary } = require("./finalConfirmation");

// const RAW_ADMIN =
//   process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// /* ======================================================
//    Parse Points
// ====================================================== */
// function parsePoints(text, expectedHeader) {
//   const lines = text
//     .split("\n")
//     .map((l) => l.trim())
//     .filter(Boolean);

//   const header = lines[0]?.toUpperCase();

//   if (header !== expectedHeader) {
//     return {
//       ok: false,
//       error: `Message must start with ${expectedHeader}`,
//     };
//   }

//   const rawPoints = lines.slice(1);

//   if (!rawPoints.length) {
//     return { ok: false, error: "No points provided." };
//   }

//   const parsed = [];

//   for (const line of rawPoints) {
//     const parts = line.split("-");
//     if (parts.length < 2) continue;

//     const place = parts[0].trim();
//     const time = parts
//       .slice(1)
//       .join("-")
//       .trim()
//       .replace(/\s*:\s*/g, ":");

//     parsed.push({ place, time });
//   }

//   if (!parsed.length) {
//     return { ok: false, error: "Invalid format." };
//   }

//   return { ok: true, data: parsed };
// }

// /* ======================================================
//    Format Points Message
// ====================================================== */
// function buildPointsMessage(points, type) {
//   const title =
//     type === "BOARDING"
//       ? "🚌 *Choose your Boarding Point* 👇"
//       : "📍 *Choose your Dropping Point* 👇";

//   let msg = `${title}\n\n`;

//   points.forEach((p, index) => {
//     msg += `*${index + 1}️⃣ ${p.place}* – ${p.time}\n`;
//   });

//   msg += "\n👉 Reply with the *number*.";

//   return msg;
// }

// /* ======================================================
//    Handle Boarding Points (Admin)
// ====================================================== */
// async function handleBoardingPoints(ctx, text) {
//   const from = ctx.from;

//   if (!ctx.session?.bookingUser) {
//     await sendText(from, "❌ No active booking found.");
//     return true;
//   }

//   const result = parsePoints(text, "B_POINTS");

//   if (!result.ok) {
//     await sendText(from, `❌ ${result.error}`);
//     return true;
//   }

//   const userPhone = ctx.session.bookingUser;
//   const { session: userSession } = startOrGet(userPhone);

//   /* 🔥 Sync booking context */
//   userSession.bookingUser = userPhone;
//   userSession.bookingId = ctx.session.bookingId;
//   userSession.selectedBus = ctx.session.selectedBus;
//   userSession.passengers = ctx.session.passengers;
//   userSession.selectedSeats = ctx.session.selectedSeats;

//   userSession.boardingPoints = result.data;
//   userSession.awaitingBoardingSelection = true;

//   await sendText(
//     userPhone,
//     buildPointsMessage(result.data, "BOARDING")
//   );

//   await sendText(
//     from,
//     `✅ ${result.data.length} boarding points sent to user.\nWaiting for selection.`
//   );

//   return true;
// }

// /* ======================================================
//    Handle Dropping Points (Admin)
// ====================================================== */
// async function handleDroppingPoints(ctx, text) {
//   const from = ctx.from;

//   if (!ctx.session?.bookingUser) {
//     await sendText(from, "❌ No active booking found.");
//     return true;
//   }

//   const result = parsePoints(text, "D_POINTS");

//   if (!result.ok) {
//     await sendText(from, `❌ ${result.error}`);
//     return true;
//   }

//   const userPhone = ctx.session.bookingUser;
//   const { session: userSession } = startOrGet(userPhone);

//   /* 🔥 Sync booking context */
//   userSession.bookingUser = userPhone;
//   userSession.bookingId = ctx.session.bookingId;
//   userSession.selectedBus = ctx.session.selectedBus;
//   userSession.passengers = ctx.session.passengers;
//   userSession.selectedSeats = ctx.session.selectedSeats;

//   userSession.droppingPoints = result.data;
//   userSession.awaitingDroppingSelection = true;

//   await sendText(
//     userPhone,
//     buildPointsMessage(result.data, "DROPPING")
//   );

//   await sendText(
//     from,
//     `✅ ${result.data.length} dropping points sent to user.\nWaiting for selection.`
//   );

//   return true;
// }

// /* ======================================================
//    Handle User Boarding Selection
// ====================================================== */
// async function handleBoardingSelection(ctx) {
//   const { session, msg, from } = ctx;

//   if (!session.awaitingBoardingSelection) return false;
//   if (msg.type !== "text") return true;

//   const input = msg.text?.body?.trim();
//   if (!/^\d+$/.test(input)) {
//     await sendText(from, "❌ Please reply with a valid number.");
//     return true;
//   }

//   const choice = Number(input);
//   const points = session.boardingPoints || [];

//   if (choice < 1 || choice > points.length) {
//     await sendText(from, `❌ Please select between 1 and ${points.length}.`);
//     return true;
//   }

//   const selected = points[choice - 1];

//   session.selectedBoarding = selected;
//   session.awaitingBoardingSelection = false;

//   await sendText(
//     from,
//     `✅ Boarding Point Selected:\n\n${selected.place} – ${selected.time}`
//   );

//   if (RAW_ADMIN) {
//     await sendText(
//       RAW_ADMIN,
//       `🚌 *Boarding Selected*

// 👤 User: ${from}
// 🆔 Booking ID: ${session.bookingId}
// 📍 ${selected.place}
// ⏰ ${selected.time}`
//     );
//   }

//   return true;
// }

// /* ======================================================
//    Handle User Dropping Selection
// ====================================================== */
// async function handleDroppingSelection(ctx) {
//   const { session, msg, from } = ctx;

//   if (!session.awaitingDroppingSelection) return false;
//   if (msg.type !== "text") return true;

//   const input = msg.text?.body?.trim();
//   if (!/^\d+$/.test(input)) {
//     await sendText(from, "❌ Please reply with a valid number.");
//     return true;
//   }

//   const choice = Number(input);
//   const points = session.droppingPoints || [];

//   if (choice < 1 || choice > points.length) {
//     await sendText(from, `❌ Please select between 1 and ${points.length}.`);
//     return true;
//   }

//   const selected = points[choice - 1];

//   session.selectedDropping = selected;
//   session.awaitingDroppingSelection = false;

//   await sendText(
//     from,
//     `✅ Dropping Point Selected:\n\n${selected.place} – ${selected.time}`
//   );

//   if (RAW_ADMIN) {
//     await sendText(
//       RAW_ADMIN,
//       `📍 *Dropping Selected*

// 👤 User: ${from}
// 🆔 Booking ID: ${session.bookingId}
// 📍 ${selected.place}
// ⏰ ${selected.time}`
//     );
//   }

//   /* ======================================================
//      Inform User
//   ====================================================== */

//   await sendText(
//     from,
//     `📝 *We have updated your boarding and dropping points*

// 🚌 Boarding:
// ${session.selectedBoarding?.place || "-"} – ${
//       session.selectedBoarding?.time || "-"
//     }

// 📍 Dropping:
// ${selected.place} – ${selected.time}

// ⏳ Preparing your final booking summary...`
//   );

//   /* ======================================================
//      Move to FINAL_CONFIRMATION State
//   ====================================================== */

//   session.state = BUS_STATES.FINAL_CONFIRMATION;

//   /* Small delay for UX */
//   await new Promise((res) => setTimeout(res, 600));

//   /* ======================================================
//      Generate Final Summary (Correct Context)
//   ====================================================== */

//   const summary = await buildFinalSummary({
//     from,
//     session: {
//       bookingId: session.bookingId,
//     },
//   });

//   if (summary) {
//     await sendText(from, summary);
//   } else {
//     await sendText(
//       from,
//       "⚠️ Unable to generate final summary. Please contact support."
//     );
//   }

//   return true;
// }

// module.exports = {
//   handleBoardingPoints,
//   handleDroppingPoints,
//   handleBoardingSelection,
//   handleDroppingSelection,
// };


const { sendText } = require("../../../../waClient");
const { startOrGet } = require("../../../../sessionStore");
const BUS_STATES = require("./states");

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   Parse Points
====================================================== */
function parsePoints(text, expectedHeader) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const header = lines[0]?.toUpperCase();

  if (header !== expectedHeader) {
    return {
      ok: false,
      error: `Message must start with ${expectedHeader}`,
    };
  }

  const rawPoints = lines.slice(1);

  if (!rawPoints.length) {
    return { ok: false, error: "No points provided." };
  }

  const parsed = [];

  for (const line of rawPoints) {
    const parts = line.split("-");
    if (parts.length < 2) continue;

    const place = parts[0].trim();
    const time = parts
      .slice(1)
      .join("-")
      .trim()
      .replace(/\s*:\s*/g, ":");

    parsed.push({ place, time });
  }

  if (!parsed.length) {
    return { ok: false, error: "Invalid format." };
  }

  return { ok: true, data: parsed };
}

/* ======================================================
   Format Points Message
====================================================== */
function buildPointsMessage(points, type) {
  const title =
    type === "BOARDING"
      ? "🚌 *Choose your Boarding Point* 👇"
      : "📍 *Choose your Dropping Point* 👇";

  let msg = `${title}\n\n`;

  points.forEach((p, index) => {
    msg += `*${index + 1}️⃣ ${p.place}* – ${p.time}\n`;
  });

  msg += "\n👉 Reply with the *number*.";

  return msg;
}

/* ======================================================
   Handle Boarding Points (Admin)
====================================================== */
async function handleBoardingPoints(ctx, text) {
  const from = ctx.from;

  if (!ctx.session?.bookingUser) {
    await sendText(from, "❌ No active booking found.");
    return true;
  }

  const result = parsePoints(text, "B_POINTS");

  if (!result.ok) {
    await sendText(from, `❌ ${result.error}`);
    return true;
  }

  const userPhone = ctx.session.bookingUser;
  const { session: userSession } = startOrGet(userPhone);

  userSession.bookingUser = userPhone;
  userSession.bookingId = ctx.session.bookingId;
  userSession.selectedBus = ctx.session.selectedBus;
  userSession.passengers = ctx.session.passengers;
  userSession.selectedSeats = ctx.session.selectedSeats;

  userSession.boardingPoints = result.data;
  userSession.awaitingBoardingSelection = true;

  await sendText(
    userPhone,
    buildPointsMessage(result.data, "BOARDING")
  );

  await sendText(
    from,
    `✅ ${result.data.length} boarding points sent to user.\nWaiting for selection.`
  );

  return true;
}

/* ======================================================
   Handle Dropping Points (Admin)
====================================================== */
async function handleDroppingPoints(ctx, text) {
  const from = ctx.from;

  if (!ctx.session?.bookingUser) {
    await sendText(from, "❌ No active booking found.");
    return true;
  }

  const result = parsePoints(text, "D_POINTS");

  if (!result.ok) {
    await sendText(from, `❌ ${result.error}`);
    return true;
  }

  const userPhone = ctx.session.bookingUser;
  const { session: userSession } = startOrGet(userPhone);

  userSession.bookingUser = userPhone;
  userSession.bookingId = ctx.session.bookingId;
  userSession.selectedBus = ctx.session.selectedBus;
  userSession.passengers = ctx.session.passengers;
  userSession.selectedSeats = ctx.session.selectedSeats;

  userSession.droppingPoints = result.data;
  userSession.awaitingDroppingSelection = true;

  await sendText(
    userPhone,
    buildPointsMessage(result.data, "DROPPING")
  );

  await sendText(
    from,
    `✅ ${result.data.length} dropping points sent to user.\nWaiting for selection.`
  );

  return true;
}

/* ======================================================
   Handle User Boarding Selection
====================================================== */
async function handleBoardingSelection(ctx) {
  const { session, msg, from } = ctx;

  if (!session.awaitingBoardingSelection) return false;
  if (msg.type !== "text") return true;

  const input = msg.text?.body?.trim();
  if (!/^\d+$/.test(input)) {
    await sendText(from, "❌ Please reply with a valid number.");
    return true;
  }

  const choice = Number(input);
  const points = session.boardingPoints || [];

  if (choice < 1 || choice > points.length) {
    await sendText(from, `❌ Please select between 1 and ${points.length}.`);
    return true;
  }

  const selected = points[choice - 1];

  session.selectedBoarding = selected;
  session.awaitingBoardingSelection = false;

  await sendText(
    from,
    `✅ Boarding Point Selected:\n\n${selected.place} – ${selected.time}`
  );

  if (RAW_ADMIN) {
    await sendText(
      RAW_ADMIN,
      `🚌 *Boarding Selected*

👤 User: ${from}
🆔 Booking ID: ${session.bookingId}
📍 ${selected.place}
⏰ ${selected.time}`
    );
  }

  return true;
}

/* ======================================================
   Handle User Dropping Selection
====================================================== */
async function handleDroppingSelection(ctx) {
  const { session, msg, from } = ctx;

  if (!session.awaitingDroppingSelection) return false;
  if (msg.type !== "text") return true;

  const input = msg.text?.body?.trim();
  if (!/^\d+$/.test(input)) {
    await sendText(from, "❌ Please reply with a valid number.");
    return true;
  }

  const choice = Number(input);
  const points = session.droppingPoints || [];

  if (choice < 1 || choice > points.length) {
    await sendText(from, `❌ Please select between 1 and ${points.length}.`);
    return true;
  }

  const selected = points[choice - 1];

  session.selectedDropping = selected;
  session.awaitingDroppingSelection = false;

  await sendText(
    from,
    `✅ Dropping Point Selected:\n\n${selected.place} – ${selected.time}`
  );

  if (RAW_ADMIN) {
    await sendText(
      RAW_ADMIN,
      `📍 *Dropping Selected*

👤 User: ${from}
🆔 Booking ID: ${session.bookingId}
📍 ${selected.place}
⏰ ${selected.time}`
    );
  }

  await sendText(
    from,
    `📝 Boarding & Dropping updated successfully.\n\n⏳ Preparing your final booking summary...`
  );

  /* 🔥 ONLY STATE TRANSITION — NO SUMMARY HERE */
  session.state = BUS_STATES.FINAL_CONFIRMATION;

  return true;
}

module.exports = {
  handleBoardingPoints,
  handleDroppingPoints,
  handleBoardingSelection,
  handleDroppingSelection,
};