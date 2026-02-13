const { sendText } = require("../../../../waClient");
const { startOrGet } = require("../../../../sessionStore");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
 * Parse Points (Reusable)
 * ====================================================== */
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
 * Format Message
 * ====================================================== */
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
 * Handle Boarding Points (Admin Sends List)
 * ====================================================== */
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
  userSession.boardingPoints = result.data;
  userSession.awaitingBoardingSelection = true;

  const message = buildPointsMessage(result.data, "BOARDING");

  await sendText(userPhone, message);

  await sendText(
    from,
    `✅ ${result.data.length} boarding points sent to user.\nWaiting for selection.`,
  );

  console.log("🚌 Boarding points sent:", userPhone);

  return true;
}

/* ======================================================
 * Handle Dropping Points (Admin Sends List)
 * ====================================================== */
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
  userSession.droppingPoints = result.data;
  userSession.awaitingDroppingSelection = true;

  const message = buildPointsMessage(result.data, "DROPPING");

  await sendText(userPhone, message);

  await sendText(
    from,
    `✅ ${result.data.length} dropping points sent to user.\nWaiting for selection.`,
  );

  console.log("📍 Dropping points sent:", userPhone);

  return true;
}

/* ======================================================
 * Handle User Boarding Selection
 * ====================================================== */
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
    `✅ Boarding Point Selected:\n\n${selected.place} – ${selected.time}`,
  );

  /* 🔔 Notify Admin */
  if (RAW_ADMIN) {
    await sendText(
      RAW_ADMIN,
      `🚌 *Boarding Selected*\n\n` +
        `👤 User: ${from}\n` +
        `${session.bookingId ? `🆔 Booking ID: ${session.bookingId}\n` : ""}` +
        `📍 ${selected.place}\n` +
        `⏰ ${selected.time}`,
    );
  }

  return true;
}

/* ======================================================
 * Handle User Dropping Selection
 * ====================================================== */
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
    `✅ Dropping Point Selected:\n\n${selected.place} – ${selected.time}`,
  );

  /* 🔔 Notify Admin */
  if (RAW_ADMIN) {
    await sendText(
      RAW_ADMIN,
      `📍 *Dropping Selected*\n\n` +
        `👤 User: ${from}\n` +
        `${session.bookingId ? `🆔 Booking ID: ${session.bookingId}\n` : ""}` +
        `📍 ${selected.place}\n` +
        `⏰ ${selected.time}`,
    );

    const boarding = session.selectedBoarding;
    const dropping = session.selectedDropping;

    await sendText(
      from,
      `📝 *We have updated your boarding and dropping points*\n\n` +
        `🚌 Boarding:\n${boarding?.place || "-"} – ${boarding?.time || "-"}\n\n` +
        `📍 Dropping:\n${dropping.place} – ${dropping.time}\n\n` +
        `⏳ We are now calculating the prices...`,
    );
  }

  const boarding = session.selectedBoarding;
  const dropping = session.selectedDropping;

  await sendText(
    from,
    `📝 *We have updated your boarding and dropping points*\n\n` +
      `🚌 Boarding:\n${boarding?.place || "-"} – ${boarding?.time || "-"}\n\n` +
      `📍 Dropping:\n${dropping.place} – ${dropping.time}\n\n` +
      `⏳ We are now calculating the prices...`,
  );

  return true;
}

module.exports = {
  handleBoardingPoints,
  handleDroppingPoints,
  handleBoardingSelection,
  handleDroppingSelection,
};
