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

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("🚌 *QUICKETS – BUS BOOKING REQUEST*");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("");

  lines.push(`🆔 *Booking ID:* ${bookingId}`);
  lines.push("");

  lines.push("👤 *Booking Initiated By*");
  lines.push(`• WhatsApp: *${formatPhone(booking.user)}*`);
  lines.push("");

  /* ======================================================
     QUICKBOOK MODE
  ====================================================== */
  if (booking.quickMode) {
    lines.push("⚡ *QuickBook Journey Details*");
    lines.push(`• From : ${booking.from || "-"}`);
    lines.push(`• To   : ${booking.to || "-"}`);
    lines.push(`• Date : ${booking.date || "-"}`);
    lines.push(`• Operator : ${booking.operator || "-"}`);
    lines.push(`• Departure : ${booking.departureTime || "-"}`);
    lines.push(`• Seat No : ${booking.seatNumber || "-"}`);
    lines.push("");

    lines.push("📌 *Current Status*");
    lines.push(`• ${booking.status || "Awaiting Admin Review"}`);
    lines.push("");

    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push(`🆔 *Reference ID:* ${bookingId}`);
    lines.push(`🕒 *Requested On:* ${createdTime}`);
    lines.push("");
    lines.push("👨‍💼 *Admin Verification in Progress*");
    lines.push("Seat availability is being checked.");
    lines.push("");
    lines.push("🔔 You will receive an update shortly.");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("— *Team Quickets*");

    return lines.join("\n");
  }

  /* ======================================================
     NORMAL BUS FLOW
  ====================================================== */

  lines.push("📍 *Journey Details*");
  lines.push(`• From : ${booking.from || "-"}`);
  lines.push(`• To   : ${booking.to || "-"}`);
  lines.push(`• Date : ${booking.date || "-"}`);
  lines.push(`• Time Preference : ${safeLabel(booking.timePref)}`);
  lines.push("");

  lines.push("💺 *Bus Preferences*");
  lines.push(`• Seat Type : ${safeLabel(booking.seatType)}`);
  lines.push(`• Budget    : ${safeLabel(booking.budget)}`);
  lines.push("");

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

  lines.push("📞 *Passenger Contact Number*");
  lines.push(`• ${formatPhone(booking.contactPhone)}`);
  lines.push("");

  lines.push("📌 *Current Status*");
  lines.push(`• ${booking.status || "Pending Review"}`);
  lines.push("");

  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push(`🆔 *Reference ID:* ${bookingId}`);
  lines.push(`🕒 *Requested On:* ${createdTime}`);
  lines.push("");
  lines.push("👨‍💼 *Admin Review in Progress*");
  lines.push("Your booking request has been forwarded to our team.");
  lines.push("");
  lines.push("🔔 You will receive an update shortly.");
  lines.push("━━━━━━━━━━━━━━━━━━━━━━");
  lines.push("— *Team Quickets*");

  return lines.join("\n");
}

module.exports = buildBusSummary;