

function buildFlightSummary(booking) {
  const lines = [];

  lines.push("✈️ *QUICKETS – FLIGHT BOOKING*");
  lines.push("");
  lines.push("🚧 *Coming Soon*");
  lines.push("");

  lines.push("✅ Your interest has been registered.");
  lines.push("🔔 We will notify you once flight bookings go live on Quickets.");
  lines.push("");

  lines.push("🆘 *Need Help?*");
  lines.push("• Reply *HELP* in this chat anytime");
  lines.push("• Support: *+91 9894381195*");
  lines.push("");
  lines.push("🙏 Thank you for choosing *Quickets*");

  return lines.join("\n");
}

module.exports = buildFlightSummary;
