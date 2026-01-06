// lib/flow/summary.js

function buildBusSummary(booking) {
  const line = "━━━━━━━━━━━━━━━━━━━━";
  const lines = [];

  lines.push("🚌 *QUIKETS – BUS TICKET*");
  lines.push(line);

  /* ===============================
   * CORE TRAVEL INFO
   * =============================== */
  lines.push(`🆔 Booking ID : *${booking.id}*`);
  lines.push(`📅 Journey Date : ${booking.date}`);
  lines.push(`⏰ Time Pref.   : ${booking.timePref?.label || "-"}`);
  lines.push(line);

  /* ===============================
   * ROUTE
   * =============================== */
  lines.push("📍 *Route*");
  lines.push(`From : ${booking.from}`);
  lines.push(`To   : ${booking.to}`);
  lines.push(line);

  /* ===============================
   * BUS & SEAT
   * =============================== */
  lines.push("💺 *Bus & Seat*");
  lines.push(`Seat Type : ${booking.seatType?.label || "-"}`);
  lines.push(`Budget    : ${booking.budget?.label || "-"}`);
  lines.push(line);

  /* ===============================
   * PASSENGERS
   * =============================== */
  lines.push(`👥 *Passengers (${booking.paxCount})*`);

  booking.passengers.forEach((p, i) => {
    const age = p.age ? `${p.age}Y` : "";
    const gender = p.gender ? p.gender : "";
    const meta = [age, gender].filter(Boolean).join(", ");

    lines.push(
      `${i + 1}. ${p.name}${meta ? ` (${meta})` : ""}`
    );
  });

  lines.push(line);

  /* ===============================
   * STATUS
   * =============================== */
  lines.push(`📌 Status : *${booking.status}*`);
  lines.push(
    `🕒 Created: ${new Date(booking.createdAt).toLocaleString("en-IN")}`
  );

  lines.push(line);
  lines.push("ℹ️ This is a booking summary.");
  lines.push("Final ticket will be shared after confirmation.");

  return lines.join("\n");
}

module.exports = { buildBusSummary };
