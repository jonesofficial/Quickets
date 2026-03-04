const STATES = require("./states");
const { sendText, sendImage } = require("../../../../waClient");
const { startOrGet } = require("../../../../sessionStore");

const { findBookingById, updateBooking } = require("../../../../bookingStore");

const sendFare = require("./fareFlow");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   Normalize phone format
====================================================== */
function normalize(phone) {
  if (!phone) return phone;
  return phone.replace(/^\+/, "");
}

module.exports = async function handleTrainManual(ctx, text) {
  try {
    const admin = normalize(ctx.from);
    const rawAdmin = normalize(RAW_ADMIN);

    const message =
      typeof text === "string"
        ? text.trim()
        : ctx.msg?.text?.body?.trim() || "";

    /* ======================================================
       ADMIN ONLY
    ====================================================== */

    if (!rawAdmin || admin !== rawAdmin) {
      return false;
    }

    /* ======================================================
       IMAGE FORWARDING (ADMIN → USER)
    ====================================================== */

    /* ======================================================
   IMAGE FORWARDING (ADMIN → CHAT USER)
====================================================== */

    if (ctx.msg?.type === "image") {
      const bookingId = ctx.session?.bookingId;

      if (!bookingId) {
        await sendText(
          admin,
          "❌ No booking selected.\nUse: PROCESS <BOOKING_ID>",
        );
        return true;
      }

      const booking = findBookingById(bookingId);

      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      try {
        const imageId = ctx.msg.image.id;
        let caption = ctx.msg.image.caption || "";

        if (caption.includes("Booking ID: N/A")) {
          caption = caption.replace(
            "Booking ID: N/A",
            `Booking ID: ${booking.id}`,
          );
        }

        /* 🔑 GET CHAT USER FROM SESSION */

        const userPhone =
          ctx.session?.bookingUser || booking.meta?.chatUser || booking.user;

        console.log("🚆 Sending train image to:", userPhone);

        await sendImage(userPhone, imageId, caption);

        await sendText(
          admin,
          `✅ Availability image forwarded to user.\n\n🆔 ${booking.id}`,
        );

        return true;
      } catch (err) {
        console.error("🔥 Image forward failed:", err);

        await sendText(admin, "❌ Failed to forward availability image.");

        return true;
      }
    }

    /* ======================================================
       EMPTY MESSAGE CHECK
    ====================================================== */

    if (!message) {
      await sendText(admin, "⚠️ Empty admin message.");
      return true;
    }

    console.log("🚆 TRAIN ADMIN INPUT:", message);

    /* ======================================================
       PROCESS <BOOKING_ID>
    ====================================================== */

    if (/^PROCESS\s+/i.test(message)) {
      const bookingId = message.split(/\s+/)[1]?.trim();

      if (!bookingId) {
        await sendText(admin, "❌ Booking ID missing.");
        return true;
      }

      const booking = findBookingById(bookingId);

      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      ctx.session.bookingId = booking.id;
      ctx.session.bookingUser = booking.meta?.chatUser || booking.user;
      ctx.session.state = STATES.PROCESSING;

      await sendText(
        admin,
        `🛠 Processing Train Booking

🆔 ${booking.id}
👤 ${booking.user}

━━━━━━━━━━━━━━━━━━
You can now send:

• Train availability screenshot
• AVAILABLE ${booking.id}
• WAITING LIST ${booking.id}
• RAC ${booking.id}
• NO CHANCE ${booking.id}`,
      );

      return true;
    }

    /* ======================================================
       STATUS COMMANDS
    ====================================================== */

    const statusMatch = message.match(
      /^(AVAILABLE|WAITING\s*LIST|RAC|NO\s*CHANCE)\s+(\S+)/i,
    );

    if (statusMatch) {
      const statusText = statusMatch[1].toUpperCase().replace(/\s+/g, "_");

      const bookingId = statusMatch[2];

      const booking = findBookingById(bookingId);

      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      const userPhone = booking.user;

      updateBooking(booking.id, {
        status: statusText,
      });

      const { session: userSession } = startOrGet(userPhone);

      userSession.bookingId = booking.id;
      userSession.state = STATES.AWAITING_CONFIRMATION;

      await sendText(
        userPhone,
        `🚆 *Train Status Update*

🆔 Booking ID: ${booking.id}
📢 Current Status: ${statusText.replace("_", " ")}

Please review and confirm to continue.`,
      );

      await sendText(
        admin,
        `✅ Status updated to ${statusText}\nUser notified.`,
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
          "❌ No booking in processing.\nUse PROCESS <BOOKING_ID>",
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
PG 12`,
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

      updateBooking(booking.id, {
        fare: { base, pg },
      });

      await sendFare({ booking, ctx });

      ctx.session.state = STATES.FARE_SENT;

      await sendText(admin, "✅ Fare sent to user successfully.");

      return true;
    }

    /* ======================================================
       UNKNOWN COMMAND
    ====================================================== */

    await sendText(
      admin,
      `⚠️ Unknown TRAIN admin command.

Available commands:

• PROCESS <BOOKING_ID>
• AVAILABLE <BOOKING_ID>
• WAITING LIST <BOOKING_ID>
• RAC <BOOKING_ID>
• NO CHANCE <BOOKING_ID>
• TICKET_PRICE`,
    );

    return true;
  } catch (err) {
    console.error("🔥 TRAIN MANUAL ERROR:", err);

    await sendText(
      ctx.from,
      "❌ Something went wrong in train manual handling.",
    );

    return true;
  }
};
