// utils/sendTicket.js

const path = require("path");
const fs = require("fs");
const { sendDocument } = require("../waClient");

/**
 * Format date like 23APR
 */
function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date)) return "DATE";

  const day = String(date.getDate()).padStart(2, "0");

  const month = date
    .toLocaleString("en-IN", { month: "short" })
    .toUpperCase();

  return `${day}${month}`;
}

async function sendTicket(booking = {}) {
  try {
    const {
      phone,
      user,
      ticketFileName,
      serviceType,
      journeyDate,
    } = booking;

    // Support both booking.phone and booking.user
    const recipient = phone || user;

    if (!recipient) {
      throw new Error("User phone number missing");
    }

    if (!ticketFileName) {
      throw new Error("ticketFileName missing");
    }

    const filePath = path.join(
      __dirname,
      "../tickets",
      ticketFileName
    );

    if (!fs.existsSync(filePath)) {
      throw new Error(`Ticket file not found: ${ticketFileName}`);
    }

    const formattedDate = formatShortDate(journeyDate);

    const type =
      serviceType === "train" ? "train" : "bus";

    const finalFileName = `Quickets_${type}_${formattedDate}.pdf`;

    const caption =
      serviceType === "train"
        ? "🚆 *Train Ticket Confirmed!*\n\nYour ticket has been issued successfully.\n\n— *Team Quickets*"
        : "🚌 *Bus Ticket Confirmed!*\n\nYour ticket has been issued successfully.\n\n— *Team Quickets*";

    await sendDocument(recipient, filePath, {
      mimetype: "application/pdf",
      fileName: finalFileName,
      caption,
    });

    console.log(
      `🎟️ Ticket sent successfully to ${recipient} as ${finalFileName}`
    );

    return true;

  } catch (err) {
    console.error("❌ Failed to send ticket:", err.message);
    return false;
  }
}

module.exports = sendTicket;
