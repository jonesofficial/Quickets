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

  const origin = booking.origin || {};
  const destination = booking.destination || {};

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
  lines.push(`• WhatsApp: ${formatPhone(booking.from)}`);
  lines.push("");

  /* ======================================================
     JOURNEY DETAILS
  ====================================================== */

  lines.push("📍 *Journey Details*");

  lines.push(
    `• From : ${origin.name || "-"} (${origin.code || "-"})`
  );

  lines.push(
    `• To   : ${destination.name || "-"} (${destination.code || "-"})`
  );

  lines.push(`• Date : ${booking.date || "-"}`);

  lines.push("");

  /* ======================================================
     TRAIN PREFERENCES
  ====================================================== */

  lines.push("🚃 *Train Preferences*");
  lines.push(`• Class : ${booking.class || "-"}`);
  lines.push(`• Quota : ${booking.quota || "-"}`);
  lines.push(`• Berth : ${booking.berth || "No Preference"}`);
  lines.push("");

  /* ======================================================
     PASSENGER DETAILS
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
     PASSENGER CONTACT
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