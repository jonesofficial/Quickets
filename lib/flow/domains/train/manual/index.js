const STATES = require("./states");
const { sendText, sendImage } = require("../../../../waClient");
const { startOrGet } = require("../../../../sessionStore");

const {
  findBookingById,
  updateBooking,
} = require("../../../../bookingStore");

const sendFare = require("./fareflow");
const { handleFinalConfirmation } = require("./finalConfirmation");

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

module.exports = async function handleTrainManual(ctx, text) {
  try {
    const admin = ctx.from;
    const message = text?.trim();

    /* ======================================================
       Only allow ADMIN to trigger manual flow
    ====================================================== */
    if (!RAW_ADMIN || admin !== RAW_ADMIN) {
      return false;
    }

    /* ======================================================
       IMAGE FORWARDING (NEW 🔥)
    ====================================================== */
    if (
      ctx.msg?.type === "image" &&
      ctx.session?.bookingId
    ) {
      const booking = findBookingById(ctx.session.bookingId);

      if (!booking || !booking.user) {
        await sendText(
          admin,
          "❌ Booking not found or no user linked."
        );
        return true;
      }

      try {
        const imageId = ctx.msg.image.id;
        const caption = ctx.msg.image.caption || "";

        await sendImage(
          booking.user,
          imageId,
          caption
        );

        await sendText(
          admin,
          "✅ Availability image + caption forwarded to user."
        );

        return true;
      } catch (err) {
        console.error("🔥 Image forward failed:", err);

        await sendText(
          admin,
          "❌ Failed to forward image."
        );

        return true;
      }
    }

    if (!message) {
      await sendText(admin, "⚠️ Empty admin message.");
      return true;
    }

    console.log("🚆 TRAIN ADMIN INPUT:", message);

    /* ======================================================
       PROCESS <BOOKING_ID>
    ====================================================== */
    if (/^PROCESS\s+/i.test(message)) {
      const bookingId = message.split(" ")[1]?.trim();
      const booking = findBookingById(bookingId);

      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      ctx.session.bookingId = booking.id;
      ctx.session.bookingUser = booking.user;
      ctx.session.state = STATES.PROCESSING;

      await sendText(
        admin,
        `🛠 Processing Train Booking

🆔 ${booking.id}
👤 ${booking.user}

━━━━━━━━━━━━━━━━━━
You can now send:
• AVAILABLE ${booking.id}
• WAITING LIST ${booking.id}
• RAC ${booking.id}
• NO CHANCE ${booking.id}`
      );

      return true;
    }

    /* ======================================================
       STATUS COMMANDS
    ====================================================== */
    const statusMatch = message.match(
      /^(AVAILABLE|WAITING\s*LIST|RAC|NO\s*CHANCE)\s+(\S+)/i
    );

    if (statusMatch) {
      const statusText = statusMatch[1]
        .toUpperCase()
        .replace(/\s+/g, "_");

      const bookingId = statusMatch[2];

      const booking = findBookingById(bookingId);
      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      updateBooking(booking.id, {
        status: statusText,
      });

      const { session: userSession } = startOrGet(
        booking.user
      );

      userSession.bookingId = booking.id;
      userSession.state = STATES.AWAITING_CONFIRMATION;

      await sendText(
        booking.user,
        `🚆 *Train Status Update*

🆔 Booking ID: ${booking.id}
📢 Current Status: ${statusText.replace(
          "_",
          " "
        )}

Please confirm to continue.`
      );

      await sendText(
        admin,
        `✅ Status updated to ${statusText}
User notified.`
      );

      return true;
    }

    /* ======================================================
       TICKET_PRICE
    ====================================================== */
    if (/^TICKET_PRICE/i.test(message)) {
      const bookingId = ctx.session?.bookingId;

      if (!bookingId) {
        await sendText(
          admin,
          "❌ No booking in processing.\nUse PROCESS <BOOKING_ID>"
        );
        return true;
      }

      const booking = findBookingById(bookingId);
      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      ctx.session.state = STATES.AWAITING_FARE_INPUT;

      await sendText(
        admin,
        `💰 Send fare in this format:

COST <amount>
PG <amount>

━━━━━━━━━━━━━━━━━━
Example:
COST 500
PG 12`
      );

      return true;
    }

    /* ======================================================
       COST / PG HANDLER
    ====================================================== */
    if (ctx.session?.state === STATES.AWAITING_FARE_INPUT) {
      const costMatch = message.match(/COST\s+(\d+)/i);
      const pgMatch = message.match(/PG\s+(\d+)/i);

      if (!costMatch) {
        await sendText(admin, "❌ COST missing.");
        return true;
      }

      const base = Number(costMatch[1]);
      const pg = pgMatch ? Number(pgMatch[1]) : 0;

      const booking = findBookingById(ctx.session.bookingId);
      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      const IRCTC_FEE = 20; // constant
      const AGENT_FEE = 30; // constant

      updateBooking(booking.id, {
        fare: {
          base,
          irctc: IRCTC_FEE,
          agent: AGENT_FEE,
          pg,
          total:
            base + IRCTC_FEE + AGENT_FEE + pg,
        },
      });

      await sendFare({
        booking,
        ctx,
      });

      ctx.session.state = STATES.FARE_SENT;

      return true;
    }

    /* ======================================================
       FINAL CONFIRMATION HANDLER
    ====================================================== */
    if (
      ctx.session?.state ===
      STATES.AWAITING_CONFIRMATION
    ) {
      return await handleFinalConfirmation(ctx);
    }

    return false;
  } catch (err) {
    console.error("🔥 TRAIN MANUAL ERROR:", err);

    await sendText(
      ctx.from,
      "❌ Something went wrong in train manual handling."
    );

    return true;
  }
};