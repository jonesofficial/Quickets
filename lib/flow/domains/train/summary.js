function buildTrainSummary(booking) {
  const lines = [];

  const isConfirmed = Boolean(booking.id && booking.status === "CONFIRMED");

  lines.push("🚆 *QUICKETS – TRAIN TICKET*");
  lines.push("");

  /* ===============================
   * BOOKING INFO
   * =============================== */

  if (isConfirmed) {
    lines.push(`🆔 *Booking ID* : ${booking.id}`);
  }

  lines.push(`📅 *Journey Date* : ${booking.date || "-"}`);
  lines.push("");

  /* ===============================
   * ROUTE
   * =============================== */
  lines.push("📍 *Route*");
  lines.push(`From : ${booking.from || "-"}`);
  lines.push(`To   : ${booking.to || "-"}`);
  lines.push("");

  /* ===============================
   * TRAIN DETAILS
   * =============================== */
  lines.push("🚃 *Train Details*");
  lines.push(`Class : ${booking.class || "-"}`);
  lines.push(`Quota : ${booking.quota || "-"}`);
  lines.push("");

  /* ===============================
   * PASSENGERS
   * =============================== */
  lines.push(`👥 *Passengers (${booking.paxCount || 0})*`);
  (booking.passengers || []).forEach((p, i) => {
    const meta = [p.age ? `${p.age}Y` : "", p.gender || ""]
      .filter(Boolean)
      .join(", ");
    lines.push(`${i + 1}. ${p.name}${meta ? ` (${meta})` : ""}`);
  });

  lines.push("");

  /* ===============================
   * STATUS
   * =============================== */

  if (isConfirmed) {
    lines.push("📌 *Status* : Confirmed");
    lines.push("⏳ Our agent will complete the IRCTC booking shortly.");
  } else {
    lines.push("📌 *Status* : DRAFT");
    lines.push("🧾 Please review your booking details above.");
    lines.push("👇 Use the buttons below to confirm, edit, or cancel.");
  }

  lines.push("");
  lines.push("🆘 *Need Help?*");
  lines.push("• Reply *HELP* in this chat anytime");
  lines.push("• Support: *+91 9894381195*");
  lines.push("");
  lines.push("🙏 Thank you for choosing *Quickets*");

  return lines.join("\n");
}

module.exports = buildTrainSummary;
