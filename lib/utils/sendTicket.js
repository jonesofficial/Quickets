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

async function sendTicket(booking = {}) {
	try {
		const {
			id,
			phone,
			user,
			ticketFileName,
			serviceType,
			journeyDate,
		} = booking;

		const recipientRaw = phone || user;
		const recipient = normalizePhone(recipientRaw);

		if (!recipient) {
			throw new Error("User phone number missing");
		}

		if (!ticketFileName) {
			throw new Error("ticketFileName missing");
		}

		// Ensure only PDF files are sent
		if (!ticketFileName.toLowerCase().endsWith(".pdf")) {
			throw new Error("Invalid ticket file format");
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
			String(serviceType || "")
				.toLowerCase()
				.trim() === "train"
				? "train"
				: "bus";

		const finalFileName = `Quickets_${type}_${formattedDate}.pdf`;

		const caption =
			type === "train"
				? "🚆 *Train Ticket Confirmed!*\n\nYour ticket has been issued successfully.\n\n— *Team Quickets*"
				: "🚌 *Bus Ticket Confirmed!*\n\nYour ticket has been issued successfully.\n\n— *Team Quickets*";

		await sendDocument(recipient, filePath, {
			mimetype: "application/pdf",
			fileName: finalFileName,
			caption,
		});

		console.log(
			`🎟️ Ticket sent | Booking: ${id || "N/A"} | To: ${recipient} | File: ${finalFileName}`
		);

		return true;

	} catch (err) {
		console.error("❌ Failed to send ticket:", err.message);
		return false;
	}
}

module.exports = sendTicket;
