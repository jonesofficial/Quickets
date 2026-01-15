function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString("en-IN");
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
  const lines = [];

  lines.push("🚌 *QUICKETS – BUS TICKET REQUEST*");
  lines.push("");

  /* ===============================
   * BOOKING INFO
   * =============================== */
  lines.push(`🆔 *Booking ID* : ${booking.id || "-"}`);
  lines.push(`📅 *Journey Date* : ${booking.date || "-"}`);
  lines.push(`⏰ *Time Preference* : ${safeLabel(booking.timePref)}`);
  lines.push("");

  /* ===============================
   * ROUTE
   * =============================== */
  lines.push("📍 *Route*");
  lines.push(`From : ${booking.from || "-"}`);
  lines.push(`To   : ${booking.to || "-"}`);
  lines.push("");

  /* ===============================
   * BUS DETAILS
   * =============================== */
  lines.push("💺 *Bus Preferences*");
  lines.push(`Seat Type : ${safeLabel(booking.seatType)}`);
  lines.push(`Budget    : ${safeLabel(booking.budget)}`);
  lines.push("");

  /* ===============================
   * PASSENGERS
   * =============================== */
  lines.push(`👥 *Passengers* : ${booking.paxCount || "-"}`);

  if (Array.isArray(booking.passengers) && booking.passengers.length) {
    booking.passengers.forEach((p, i) => {
      const meta = [p.age ? `${p.age}Y` : "", p.gender || ""]
        .filter(Boolean)
        .join(", ");
      lines.push(
        `${i + 1}. ${p.name || "Passenger"}${meta ? ` (${meta})` : ""}`
      );
    });
  } else {
    lines.push("• Passenger details will be collected");
  }

  lines.push("");

  /* ===============================
   * STATUS
   * =============================== */
  lines.push(`📌 *Status* : ${booking.status || "PENDING"}`);
  lines.push(
    `🕒 *Created On* : ${formatDateTime(booking.createdAt || Date.now())}`
  );
  lines.push("");

  /* ===============================
   * FOOTER
   * =============================== */
  lines.push("✅ *Your booking request has been received.*");
  lines.push("⏳ We are checking availability and fares.");
  lines.push("📲 You will receive confirmation shortly.");
  lines.push("");
  lines.push("🆘 *Need Help?* Reply *HELP* anytime in this chat.");
  lines.push("");
  lines.push("🙏 Thank you for choosing *Quickets*");

  return lines.join("\n");
}

module.exports = buildBusSummary;
