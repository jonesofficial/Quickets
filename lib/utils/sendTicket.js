// utils/sendTicket.js

const path = require("path");
const fs = require("fs");
const { sendDocument } = require("../waClient");

/* ======================================================
   NORMALIZE PHONE
====================================================== */
function normalizePhone(num = "") {
  return String(num).replace(/\D/g, "");
}

/* ======================================================
   FORMAT DATE LIKE 23APR
====================================================== */
function formatShortDate(dateStr) {
  if (!dateStr) return "DATE";

  const date = new Date(dateStr);
  if (isNaN(date)) return "DATE";

  const day = String(date.getDate()).padStart(2, "0");

  const month = date
    .toLocaleString("en-IN", { month: "short" })
    .toUpperCase();

  return `${day}${month}`;
}

/* ======================================================
   MASK PHONE FOR LOGS
====================================================== */
function maskPhone(num = "") {
  const cleaned = normalizePhone(num);
  if (cleaned.length < 6) return cleaned;
  return cleaned.slice(0, 5) + "XXXXX";
}

/* ======================================================
   SEND TICKET
====================================================== */
async function sendTicket(booking = {}) {
  try {
    if (!booking || typeof booking !== "object") {
      throw new Error("Invalid booking object");
    }

    const {
      id,
      phone,
      user,
      ticketFileName,
      serviceType,
      journeyDate,
    } = booking;

    /* ======================================================
       RECIPIENT
    ====================================================== */

    const recipientRaw = user || phone;
    const recipient = normalizePhone(recipientRaw);

    if (!recipient) {
      throw new Error("User phone number missing");
    }

    /* ======================================================
       FILE VALIDATION
    ====================================================== */

    if (!ticketFileName) {
      throw new Error("ticketFileName missing");
    }

    if (!ticketFileName.toLowerCase().endsWith(".pdf")) {
      throw new Error("Invalid ticket file format");
    }

    // Prevent directory traversal attack
    const safeFileName = path.basename(ticketFileName);

    const filePath = path.resolve(
      __dirname,
      "../tickets",
      safeFileName
    );

    if (!fs.existsSync(filePath)) {
      throw new Error(`Ticket file not found: ${safeFileName}`);
    }

    /* ======================================================
       FILE NAMING
    ====================================================== */

    const formattedDate = formatShortDate(journeyDate);

    const type =
      String(serviceType || "")
        .toLowerCase()
        .trim() === "train"
        ? "train"
        : "bus";

    const finalFileName = `Quickets_${type}_${formattedDate}.pdf`;

    /* ======================================================
       CAPTION
    ====================================================== */

    const caption =
      type === "train"
        ? "🚆 *Train Ticket Confirmed!*\n\nYour ticket has been issued successfully.\n\n— *Team Quickets*"
        : "🚌 *Bus Ticket Confirmed!*\n\nYour ticket has been issued successfully.\n\n— *Team Quickets*";

    /* ======================================================
       SEND DOCUMENT
    ====================================================== */

    await sendDocument(recipient, filePath, {
      mimetype: "application/pdf",
      fileName: finalFileName,
      caption,
    });

    console.log(
      `🎟️ Ticket sent | Booking: ${id || "N/A"} | To: ${maskPhone(recipient)} | File: ${finalFileName}`
    );

    return true;

  } catch (err) {
    console.error("❌ Failed to send ticket:", err.message);
    return false;
  }
}

module.exports = sendTicket;
