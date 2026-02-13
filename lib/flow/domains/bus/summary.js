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

function safeLabel(obj) {
  if (!obj) return "-";
  if (typeof obj === "string") return obj;
  if (typeof obj === "object" && obj.label) return obj.label;
  return "-";
}

function buildBusSummary(booking) {
  const bookingId = booking.id || "-";
  const createdTime = formatDateTime(booking.createdAt || Date.now());

  const lines = [];

  /* ======================================================
     HEADER
  ====================================================== */

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("🚌 *QUICKETS – BUS BOOKING REQUEST*");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  /* ======================================================
     BOOKING ID (TOP)
  ====================================================== */

  lines.push(`🆔 *Booking ID:* ${bookingId}`);
  lines.push("");

  /* ======================================================
     INITIATOR
  ====================================================== */

  lines.push("👤 *Booking Initiated By*");
  lines.push(`• WhatsApp: *${formatPhone(booking.user)}*`);
  lines.push("");

  /* ======================================================
     JOURNEY DETAILS
  ====================================================== */

  lines.push("📍 *Journey Details*");
  lines.push(`• From : ${booking.from || "-"}`);
  lines.push(`• To   : ${booking.to || "-"}`);
  lines.push(`• Date : ${booking.date || "-"}`);
  lines.push(`• Time Preference : ${safeLabel(booking.timePref)}`);
  lines.push("");

  /* ======================================================
     BUS PREFERENCES
  ====================================================== */

  lines.push("💺 *Bus Preferences*");
  lines.push(`• Seat Type : ${safeLabel(booking.seatType)}`);
  lines.push(`• Budget    : ${safeLabel(booking.budget)}`);
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
  lines.push(`🆔 Ref ID : *${bookingId}*`);
  lines.push(`🕒 Requested On : ${createdTime}`);
  lines.push("");
  lines.push("🔎 Seat availability & fare verification in progress.");
  lines.push("📢 Updates will be shared automatically in this chat.");
  lines.push("");
  lines.push("💬 Need assistance? Type *HELP* anytime.");
  lines.push("");
  lines.push("— *Team Quickets*");

  return lines.join("\n");
}

module.exports = buildBusSummary;
