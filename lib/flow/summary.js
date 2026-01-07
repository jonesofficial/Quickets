// lib/flow/summary.js

function buildBusSummary(booking) {
  const lines = [];

  lines.push("🚌 *QUIKETS – BUS TICKET*");
  lines.push("");

  /* ===============================
   * BOOKING INFO
   * =============================== */
  lines.push(`🆔 *Booking ID* : ${booking.id}`);
  lines.push(`📅 *Journey Date* : ${booking.date}`);
  lines.push(`⏰ *Time Preference* : ${booking.timePref?.label || "-"}`);
  lines.push("");

  /* ===============================
   * ROUTE
   * =============================== */
  lines.push("📍 *Route*");
  lines.push(`From : ${booking.from}`);
  lines.push(`To   : ${booking.to}`);
  lines.push("");

  /* ===============================
   * BUS & SEAT DETAILS
   * =============================== */
  lines.push("💺 *Bus & Seat Details*");
  lines.push(`Seat Type : ${booking.seatType?.label || "-"}`);
  lines.push(`Budget    : ${booking.budget?.label || "-"}`);
  lines.push("");

  /* ===============================
   * PASSENGER DETAILS
   * =============================== */
  lines.push(`👥 *Passengers (${booking.paxCount})*`);

  booking.passengers.forEach((p, i) => {
    const age = p.age ? `${p.age}Y` : "";
    const gender = p.gender ? p.gender : "";
    const meta = [age, gender].filter(Boolean).join(", ");

    lines.push(`${i + 1}. ${p.name}${meta ? ` (${meta})` : ""}`);
  });

  lines.push("");

  /* ===============================
   * STATUS
   * =============================== */
  lines.push(`📌 *Status* : ${booking.status}`);
  lines.push(
    `🕒 *Created On* : ${new Date(booking.createdAt).toLocaleString("en-IN")}`
  );
  lines.push("");

  /* ===============================
   * CONFIRMATION & HELP
   * =============================== */
  lines.push("✅ *Your booking request has been received by our admin.*");
  lines.push("⏳ We are checking availability and will reply shortly.");
  lines.push("");

  lines.push("🆘 *Need Help?*");
  lines.push("• Reply *HELP* in this chat anytime");
  lines.push("• For any queries, message us on WhatsApp or even a call: *9894381195");
  lines.push("");

  lines.push("🙏 Thank you for choosing *Quickets*");
 

  return lines.join("\n");
}

module.exports = { buildBusSummary };
