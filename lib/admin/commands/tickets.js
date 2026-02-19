const { sendText } = require("../../waClient");
const { findBookingById, updateBooking } = require("../../bookingStore");
const sendTicket = require("../../utils/sendTicket");
const fs = require("fs");
const path = require("path");

module.exports = async function handleTicketCommands(
  ctx,
  text,
  mode
) {
  const from = ctx.from;

  /* =====================================================
     PDF UPLOAD MODE
  ===================================================== */

  if (mode === "PDF_UPLOAD") {
    const buffer = await ctx.downloadMedia();

    if (!buffer) {
      return sendText(from, "❌ PDF download failed.");
    }

    ctx.session.pendingTicketPdf = buffer;

    await sendText(
      from,
      "📄 PDF received successfully."
    );

    await sendText(
      from,
      "━━━━━━━━━━━━━━━━━━\n" +
        "👉 NEXT STEP:\n\n" +
        "SEND TICKET <BOOKING_ID>"
    );

    return true;
  }

  /* =====================================================
     SEND TICKET COMMAND
  ===================================================== */

  const parts = text.split(/\s+/);
  const bookingId = parts[2];

  if (!bookingId) {
    return sendText(from, "⚠️ SEND TICKET <BOOKING_ID>");
  }

  if (!ctx.session.pendingTicketPdf) {
    return sendText(
      from,
      "⚠️ No PDF uploaded.\n\nPlease upload ticket PDF first."
    );
  }

  const booking = findBookingById(bookingId);

  if (!booking) {
    return sendText(from, "❌ Booking not found.");
  }

  /* =====================================================
     SAVE FILE
  ===================================================== */

  const ticketsDir = path.join(__dirname, "../../../tickets");

  if (!fs.existsSync(ticketsDir)) {
    fs.mkdirSync(ticketsDir, { recursive: true });
  }

  const fileName = `internal_${bookingId}.pdf`;
  const filePath = path.join(ticketsDir, fileName);

  fs.writeFileSync(filePath, ctx.session.pendingTicketPdf);

  updateBooking(bookingId, { ticketFileName: fileName });

  delete ctx.session.pendingTicketPdf;

  /* =====================================================
     SEND TO USER
  ===================================================== */

  const success = await sendTicket({
    ...booking,
    ticketFileName: fileName,
  });

  if (!success) {
    return sendText(from, "❌ Ticket failed to send.");
  }

  await sendText(
    from,
    `🎟 Ticket Sent Successfully\n\n🆔 ${bookingId}`
  );

  /* =====================================================
     NEXT STEP GUIDANCE
  ===================================================== */

  await sendText(
    from,
    "━━━━━━━━━━━━━━━━━━\n" +
      "👉 NEXT STEP:\n\n" +
      `CONFIRM ${bookingId}`
  );

  return true;
};
