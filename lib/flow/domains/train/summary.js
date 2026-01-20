// lib/flow/domains/train/summary.js

function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString("en-IN");
  } catch {
    return "-";
  }
}

function buildTrainSummary(booking) {
  const lines = [];

  lines.push("🚆 *QUICKETS – TRAIN TICKET REQUEST*");
  lines.push("");

  /* ===============================
   * BOOKING INFO
   * =============================== */
  lines.push(`🆔 *Booking ID* : ${booking.id || "-"}`);
  lines.push(`📅 *Journey Date* : ${booking.date || "-"}`);
  lines.push("");

  /* ===============================
   * ROUTE
   * =============================== */
  lines.push("📍 *Route*");
  lines.push(
    `From : ${booking.from?.name || "-"} (${booking.from?.code || "-"})`
  );
  lines.push(
    `To   : ${booking.to?.name || "-"} (${booking.to?.code || "-"})`
  );
  lines.push("");

  /* ===============================
   * TRAIN DETAILS
   * =============================== */
  lines.push("🚃 *Train Preferences*");
  lines.push(`Class : ${booking.class || "-"}`);
  lines.push(`Quota : ${booking.quota || "-"}`);
  lines.push(`Berth : ${booking.berth || "No Preference"}`);
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

module.exports = buildTrainSummary;
