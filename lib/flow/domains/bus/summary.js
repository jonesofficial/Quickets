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

function safeLabel(obj) {
  if (!obj) return "-";
  if (typeof obj === "string") return obj;
  if (typeof obj === "object" && obj.label) return obj.label;
  return "-";
}

function buildBusSummary(booking) {
  const createdTime = formatDateTime(booking.createdAt || Date.now());
  const bookingId = booking.id || "-";

  const lines = [];

  /* ===============================
   * TOP REFERENCE
   * =============================== */
  lines.push(`🆔 *Booking ID: ${bookingId}*`);
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push("");

  /* ===============================
   * ROUTE
   * =============================== */
  lines.push(`🚌 *${booking.from || "-"} → ${booking.to || "-"}*`);
  lines.push(`📅 ${booking.date || "-"}   ⏰ ${safeLabel(booking.timePref)}`);
  lines.push("");

  /* ===============================
   * PREFERENCES
   * =============================== */
  lines.push("💺 *Travel Preferences*");
  lines.push(`• Seat Type : ${safeLabel(booking.seatType)}`);
  lines.push(`• Budget    : ${safeLabel(booking.budget)}`);
  lines.push("");

  /* ===============================
   * PASSENGERS
   * =============================== */
  lines.push(`👥 *Passengers (${booking.paxCount || 0})*`);

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
    lines.push("• Passenger details will be collected shortly");
  }

  lines.push("");

  /* ===============================
   * STATUS
   * =============================== */
  lines.push("📌 *Current Status*");
  lines.push(`• ${booking.status || "Pending Review"}`);
  lines.push("");

  /* ===============================
   * BOTTOM REFERENCE BLOCK
   * =============================== */
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`🆔 Ref ID: ${bookingId}`);
  lines.push(`🕒 Requested on: ${createdTime}`);
  lines.push("");
  lines.push("🔔 Updates will be shared automatically in this chat.");
  lines.push("💬 Need help? Type *HELP* anytime.");
  lines.push("");
  lines.push("— *Quickets*");

  return lines.join("\n");
}

module.exports = buildBusSummary;
