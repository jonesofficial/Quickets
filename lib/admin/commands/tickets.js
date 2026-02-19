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

  // PDF upload mode
  if (mode === "PDF_UPLOAD") {
    const buffer = await ctx.downloadMedia();
    if (!buffer)
      return sendText(from, "❌ PDF download failed.");

    ctx.session.pendingTicketPdf = buffer;

    return sendText(
      from,
      "📄 PDF received.\nSend: SEND TICKET <ID>"
    );
  }

  const parts = text.split(/\s+/);
  const bookingId = parts[2];

  if (!bookingId)
    return sendText(from, "⚠️ SEND TICKET <ID>");

  if (!ctx.session.pendingTicketPdf)
    return sendText(from, "⚠️ No PDF uploaded.");

  const booking = findBookingById(bookingId);
  if (!booking)
    return sendText(from, "❌ Booking not found.");

  const ticketsDir = path.join(__dirname, "../../../tickets");
  if (!fs.existsSync(ticketsDir))
    fs.mkdirSync(ticketsDir, { recursive: true });

  const fileName = `internal_${bookingId}.pdf`;
  const filePath = path.join(ticketsDir, fileName);

  fs.writeFileSync(filePath, ctx.session.pendingTicketPdf);

  updateBooking(bookingId, { ticketFileName: fileName });

  delete ctx.session.pendingTicketPdf;

  const success = await sendTicket({
    ...booking,
    ticketFileName: fileName,
  });

  return sendText(
    from,
    success ? "✅ Ticket sent" : "❌ Ticket failed"
  );
};
