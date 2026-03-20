const { sendText, sendDocumentById } = require("../../waClient");
const { findBookingById, updateBooking } = require("../../bookingStore");

/* =====================================================
   RESOLVE USER PHONE
===================================================== */

function getUserPhone(booking) {
  if (!booking) return null;

  if (booking.type === "TRAIN") {
    return booking.quickMode ? booking.user : booking.phone;
  }

  if (booking.type === "BUS") {
    return booking.user;
  }

  return booking.phone || booking.user || booking.contactPhone;
}

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

    ctx.session.awaitingTicketFor = bookingId;

    return sendText(from, `📄 Please upload ticket PDF for\n\n🆔 ${bookingId}`);
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

    const userPhone = getUserPhone(booking);

    if (!userPhone) {
      return sendText(from, "⚠️ User phone not found.");
    }

    const mediaId = ctx.msg.document.id;

    /* =====================================================
       STORE MEDIA ID INSIDE BOOKING
    ===================================================== */

    updateBooking(bookingId, {
      ticketMediaId: mediaId,
      status: "CONFIRMED",
    });

    /* =====================================================
       SEND PDF TO USERR
    ===================================================== */

    await sendDocumentById(userPhone, mediaId, {
      fileName: `Ticket_${bookingId}.pdf`,
      caption: "🎟 Here is your ticket. Have a pleasant journey.",
    });

    await sendText(
      userPhone,
`🎟 *Your Ticket Has Been Issued Successfully*

🧾 Booking ID: *${bookingId}*

Your travel ticket is attached above.

Thank you for choosing *Quickets* for your journey.
We truly appreciate your trust in our service.

We wish you a safe, comfortable, and pleasant trip.

If you require any assistance, simply reply *HELP* and our support team will assist you.

— *Team Quickets*`
    );

    /* =====================================================
       CLEAR SESSION
    ===================================================== */

    delete ctx.session.awaitingTicketFor;

    await sendText(from, `🎟 Ticket Sent Successfully\n\n🆔 ${bookingId}`);

    return true;
  }

  return false;
};