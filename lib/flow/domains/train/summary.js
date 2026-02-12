// lib/flow/domains/train/summary.js

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

function buildTrainSummary(booking) {
  const bookingId = booking.id || "-";
  const createdTime = formatDateTime(booking.createdAt || Date.now());

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
  lines.push(
    `🚆 *${booking.from?.name || "-"} (${booking.from?.code || "-"}) → ${booking.to?.name || "-"} (${booking.to?.code || "-"})*`
  );
  lines.push(`📅 ${booking.date || "-"}`);
  lines.push("");

  /* ===============================
   * TRAIN PREFERENCES
   * =============================== */
  lines.push("🚃 *Train Preferences*");
  lines.push(`• Class : ${booking.class || "-"}`);
  lines.push(`• Quota : ${booking.quota || "-"}`);
  lines.push(`• Berth : ${booking.berth || "No Preference"}`);
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
   * MODERN FOOTER
   * =============================== */
  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`🆔 Ref ID: ${bookingId}`);
  lines.push(`🕒 Requested on: ${createdTime}`);
  lines.push("");
  lines.push("🔎 Availability & fare check in progress");
  lines.push("📢 Updates will be shared automatically in this chat.");
  lines.push("");
  lines.push("💬 Need assistance? Type *HELP* anytime.");
  lines.push("");
  lines.push("— *Quickets*");

  return lines.join("\n");
}

module.exports = buildTrainSummary;
