const { sendText, sendDocumentById } = require("../../waClient");
const { findBookingById, updateBooking } = require("../../bookingStore");

module.exports = async function handleTicketCommands(ctx, text) {
  const from = ctx.from;

  ctx.session = ctx.session || {};

  /* =====================================================
     STEP 1: ADMIN SENDS "SEND TICKET <BOOKING_ID>"
  ===================================================== */

  const match = text?.match(/^SEND\s+TICKET\s+(.+)/i);

  if (match) {
    const bookingId = match[1].trim();
    const booking = findBookingById(bookingId);

    if (!booking) {
      return sendText(from, "❌ Booking not found.");
    }

    // Store pending booking ID in session
    ctx.session.awaitingTicketFor = bookingId;

    return sendText(
      from,
      `📄 Please upload ticket PDF for\n\n🆔 ${bookingId}`
    );
  }

  /* =====================================================
     STEP 2: ADMIN UPLOADS PDF
  ===================================================== */

  if (ctx.msg?.type === "document" && ctx.msg?.document?.id) {
    const bookingId = ctx.session.awaitingTicketFor;

    if (!bookingId) {
      return sendText(
        from,
        "⚠️ Please send:\nSEND TICKET <BOOKING_ID>\nBefore uploading PDF."
      );
    }

    const booking = findBookingById(bookingId);

    if (!booking) {
      return sendText(from, "❌ Booking not found.");
    }

    const mediaId = ctx.msg.document.id;

    /* =====================================================
       STORE MEDIA ID INSIDE BOOKING (PERSISTENT)
    ===================================================== */

    updateBooking(bookingId, {
      ticketMediaId: mediaId,
    });

    /* =====================================================
       SEND PDF TO USER
    ===================================================== */

    await sendDocumentById(
      booking.user,
      mediaId,
      {
        fileName: `Ticket_${bookingId}.pdf`,
        caption: "🎟 Your Ticket is attached.",
      }
    );

    // Clear pending state
    delete ctx.session.awaitingTicketFor;

    await sendText(
      from,
      `🎟 Ticket Sent Successfully\n\n🆔 ${bookingId}`
    );

    return true;
  }

  return false;
};