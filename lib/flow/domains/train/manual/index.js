const STATES = require("./states");

const { sendText, sendImage } = require("../../../../waClient");

const { startOrGet } = require("../../../../sessionStore");

const { findBookingById, updateBooking } = require("../../../../bookingStore");

const sendAvailabilityPrompt = require("./availabilityPrompt");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   Normalize phone format
====================================================== */
function normalize(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

function parseAvailabilityFromCaption(caption) {
  if (!caption) return null;

  const text = caption.toUpperCase();

  const wlMatch = text.match(/WL\s*(\d+)/);
  if (wlMatch) {
    return {
      type: "WL",
      position: Number(wlMatch[1]),
    };
  }

  const racMatch = text.match(/RAC\s*(\d+)/);
  if (racMatch) {
    return {
      type: "RAC",
      position: Number(racMatch[1]),
    };
  }

  const availMatch = text.match(/AVAILABLE\s*(\d+)?/);
  if (availMatch) {
    return {
      type: "AVAILABLE",
      seats: Number(availMatch[1] || 0),
    };
  }

  return null;
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

      let userPhone;

      switch (booking.type) {
        case "TRAIN":
          userPhone = booking.quickMode ? booking.user : booking.phone;
          break;

        default:
          userPhone = booking.phone;
      }

      userPhone = normalize(userPhone);

      const imageId = ctx.msg.image.id;
      let caption = ctx.msg.image.caption || "";

      /* =========================
     DETECT WL / RAC / SEATS
  ========================= */

      const availability = parseAvailabilityFromCaption(caption);

      if (availability) {
        const patch = {};

        if (availability.type === "WL") {
          patch.wlPosition = availability.position;
        }

        if (availability.type === "RAC") {
          patch.racPosition = availability.position;
        }

        if (availability.type === "AVAILABLE") {
          patch.seatsRemaining = availability.seats;
        }

        updateBooking(booking.id, patch);

        console.log("🚆 Seat numbers detected:", patch);
      }

      /* =========================
     FORWARD IMAGE ONLY
  ========================= */

      if (caption.includes("Booking ID: N/A")) {
        caption = caption.replace(
          "Booking ID: N/A",
          `Booking ID: ${booking.id}`,
        );
      }

      await sendImage(userPhone, imageId, caption);

      await sendText(
        admin,
        `✅ Availability image forwarded to user.\n\n🆔 ${booking.id}`,
      );

      return true;
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

      let userPhone;

      switch (booking.type) {
        case "TRAIN":
          userPhone = booking.quickMode ? booking.user : booking.phone;
          break;

        default:
          userPhone = booking.phone;
      }

      userPhone = normalize(userPhone);

      ctx.session.bookingId = booking.id;
      ctx.session.state = STATES.PROCESSING;

      await sendText(
        admin,
        `🛠 Processing Train Booking

🆔 ${booking.id}
👤 ${booking.user}

━━━━━━━━━━━━━━━━━━
Send availability:

AVAILABLE ${booking.id}
WAITING LIST ${booking.id}
RAC ${booking.id}
NO CHANCE ${booking.id}

You may also send a screenshot.`,
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
      let statusText = statusMatch[1].toUpperCase();

      if (statusText === "WAITING LIST") statusText = "WL";
      if (statusText === "NO CHANCE") statusText = "NO_CHANCE";

      const bookingId = statusMatch[2];

      const booking = findBookingById(bookingId);

      if (!booking) {
        await sendText(admin, "❌ Booking not found.");
        return true;
      }

      if (!userPhone || userPhone.length < 10) {
        console.error("❌ Invalid user phone:", userPhone);
        return true;
      }

      /* ======================================================
         UPDATE BOOKING STATUS
      ====================================================== */

      updateBooking(booking.id, {
        availability: statusText,
      });

      const { session: userSession } = startOrGet(userPhone);

      userSession.bookingId = booking.id;
      userSession.state = STATES.AWAITING_AVAILABILITY_DECISION;

      /* ======================================================
         SEND BUTTON PROMPT
      ====================================================== */

      await sendAvailabilityPrompt(userPhone, statusText, booking, userSession);

      await sendText(
        admin,
        `✅ Availability sent to user.

🆔 ${booking.id}
Status: ${statusText}`,
      );

      return true;
    }

    /* ======================================================
       UNKNOWN COMMAND
    ====================================================== */

    await sendText(
      admin,
      `⚠️ Unknown TRAIN admin command.

Available commands:

PROCESS <BOOKING_ID>

AVAILABLE <BOOKING_ID>
WAITING LIST <BOOKING_ID>
RAC <BOOKING_ID>
NO CHANCE <BOOKING_ID>`,
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
