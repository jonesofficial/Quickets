function formatDateTime(ts) {
  try {
    const date = new Date(ts);

    const formatted = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    return `${formatted} IST`;
  } catch {
    return "-";
  }
}

function formatPhone(phone) {
  if (!phone) return "-";
  return String(phone);
}

function buildTrainSummary(booking) {
  const bookingId = booking.id || "-";
  const createdTime = formatDateTime(booking.createdAt || Date.now());

  /* ======================================================
     SUPPORT BOTH QUICKBOOK + NORMAL FLOW
  ====================================================== */

  const originName =
    booking.origin?.name || booking.from || "-";

  const originCode =
    booking.origin?.code || "";

  const destinationName =
    booking.destination?.name || booking.to || "-";

  const destinationCode =
    booking.destination?.code || "";

  const lines = [];

  /* ======================================================
     HEADER
  ====================================================== */

  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("🚆 *QUICKETS – TRAIN BOOKING REQUEST*");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  /* ======================================================
     BOOKING ID
  ====================================================== */

  lines.push(`🆔 *Booking ID:* ${bookingId}`);
  lines.push("");

  /* ======================================================
     INITIATOR DETAILS
  ====================================================== */

  lines.push("👤 *Booking Initiated By*");
  lines.push(`• WhatsApp: ${formatPhone(booking.user || booking.from)}`);
  lines.push("");

  /* ======================================================
     JOURNEY DETAILS
  ====================================================== */

  lines.push("📍 *Journey Details*");

  lines.push(
    `• From : ${originName}${originCode ? ` (${originCode})` : ""}`
  );

  lines.push(
    `• To   : ${destinationName}${destinationCode ? ` (${destinationCode})` : ""}`
  );

  lines.push(`• Date : ${booking.date || "-"}`);

  if (booking.trainName) {
    lines.push(`• Train : ${booking.trainName}`);
  }

  if (booking.departureTime) {
    lines.push(`• Departure : ${booking.departureTime}`);
  }

  lines.push("");

  /* ======================================================
     TRAIN PREFERENCES
  ====================================================== */

  lines.push("🚃 *Train Preferences*");

  if (booking.class)
    lines.push(`• Class : ${booking.class}`);

  if (booking.quota)
    lines.push(`• Quota : ${booking.quota}`);

  if (booking.berth || booking.berthPref)
    lines.push(`• Berth : ${booking.berth || booking.berthPref}`);

  lines.push("");

  /* ======================================================
     PASSENGERS
  ====================================================== */

  lines.push(`👥 *Passenger Details (${booking.paxCount || 0})*`);

  if (Array.isArray(booking.passengers) && booking.passengers.length) {
    booking.passengers.forEach((p, i) => {
      const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
        .filter(Boolean)
        .join(" • ");

      lines.push(
        `${i + 1}. ${p.name || "Passenger"}${meta ? ` (${meta})` : ""}`
      );
    });
  } else {
    lines.push("• Passenger details pending");
  }

  lines.push("");

  /* ======================================================
     CONTACT
  ====================================================== */

  lines.push("📞 *Passenger Contact Number*");
  lines.push(`• ${formatPhone(booking.contactPhone)}`);
  lines.push("");

  /* ======================================================
     STATUS
  ====================================================== */

  lines.push("📌 *Current Status*");
  lines.push(`• ${booking.status || "Pending Review"}`);
  lines.push("");

  /* ======================================================
     FOOTER
  ====================================================== */

  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`🆔 Ref ID : ${bookingId}`);
  lines.push(`🕒 Requested On : ${createdTime}`);
  lines.push("");
  lines.push("🔎 IRCTC availability & fare verification in progress.");
  lines.push("📢 Updates will be shared automatically in this chat.");
  lines.push("");
  lines.push("💬 Need assistance? Type *HELP* anytime.");
  lines.push("");
  lines.push("— *Team Quickets*");

  return lines.join("\n");
}

module.exports = buildTrainSummary;