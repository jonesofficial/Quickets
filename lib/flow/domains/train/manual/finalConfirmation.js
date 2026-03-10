const { sendText, sendButtons } = require("../../../../waClient");
const {
  getLastBookingByUser,
  findBookingById,
  updateBooking,
} = require("../../../../bookingStore");

const TRAIN_MANUAL_STATES = require("./states");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   FETCH BOOKING SAFELY
====================================================== */
async function getBookingFromContext(ctx) {
  try {
    if (ctx.session?.bookingId) {
      const booking = findBookingById(ctx.session.bookingId);
      if (booking) return booking;
    }

    return await getLastBookingByUser(ctx.from);
  } catch (err) {
    console.error("🔥 getBookingFromContext error", err);
    return null;
  }
}

/* ======================================================
   BUILD FINAL SUMMARY
====================================================== */
async function buildFinalSummary(ctx) {
  try {
    const booking = await getBookingFromContext(ctx);

    if (!booking) {
      return "⚠️ Booking not found. Please restart booking process.";
    }

    const passengers = booking.passengers || [];
    const lines = [];

    /* ================================================
       NORMALIZE JOURNEY DATA
    ================================================= */

    const fromName =
      booking.from?.name ||
      booking.fromStation?.name ||
      booking.fromStation ||
      booking.from ||
      "-";

    const fromCode =
      booking.from?.code ||
      booking.fromStation?.code ||
      booking.fromCode ||
      "-";

    const toName =
      booking.to?.name ||
      booking.toStation?.name ||
      booking.toStation ||
      booking.to ||
      "-";

    const toCode =
      booking.to?.code || booking.toStation?.code || booking.toCode || "-";

    const travelDate =
      booking.date || booking.travelDate || booking.journeyDate || "-";

    const travelClass =
      booking.class || booking.travelClass || booking.classType || "-";

    const quota =
      booking.quota || booking.quotaType || booking.bookingQuota || "-";

    /* ================================================
       SUMMARY
    ================================================= */

    lines.push("🚆 *REVIEW YOUR TRAIN BOOKING*");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(`🆔 *Booking ID:* ${booking.id || "-"}`);
    lines.push("");

    lines.push("📍 *Journey Details*");
    lines.push(`• From : ${fromName} (${fromCode})`);
    lines.push(`• To   : ${toName} (${toCode})`);
    lines.push(`• Date : ${travelDate}`);
    lines.push("");

    lines.push("🎟 *Ticket Preferences*");
    lines.push(`• Class : ${travelClass}`);
    lines.push(`• Quota : ${quota}`);
    lines.push(`• Berth : ${booking.berth || "No Preference"}`);
    lines.push("");

    lines.push(`👥 *Passenger Details (${passengers.length})*`);

    if (Array.isArray(passengers) && passengers.length) {
      passengers.forEach((p, i) => {
        const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
          .filter(Boolean)
          .join(" • ");

        lines.push(
          `${i + 1}. ${p.name || "Passenger"}${meta ? ` (${meta})` : ""}`,
        );
      });
    } else {
      lines.push("• Passenger details pending");
    }

    lines.push("");
    lines.push("📞 *Contact Number*");
    lines.push(`• ${booking.contactPhone || booking.user || "-"}`);
    lines.push("");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("⚠️ *Please confirm that all details are correct.*");
    lines.push("");

    return lines.join("\n");
  } catch (err) {
    console.error("🔥 buildFinalSummary error", err);
    return "❌ Unable to generate booking summary.";
  }
}

/* ======================================================
   HANDLE FINAL CONFIRMATION
====================================================== */
async function handleFinalConfirmation(ctx) {
  try {
    const buttonId = ctx.msg?.interactive?.button_reply?.id;

    const booking = await getBookingFromContext(ctx);

    if (!booking) {
      await sendText(ctx.from, "⚠️ Booking not found.");
      return true;
    }

    /* ======================================================
       USER CONFIRMS BOOKING
    ====================================================== */
    if (buttonId === "CONFIRM_BOOKING") {
      updateBooking(booking.id, {
        status: "AWAITING_PRICE",
      });

      // move user state to waiting for fare
      ctx.session.state = TRAIN_MANUAL_STATES.AWAITING_PRICE;

      /* USER MESSAGE */

      await sendText(
        ctx.from,
        `✅ *Booking Confirmed*

💰 We are now checking the final ticket fare.

⏳ Please wait while our team retrieves the latest price.`,
      );

      /* ADMIN MESSAGE */

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `💰 *Train Fare Required*

🆔 ${booking.id}
👤 ${booking.user}

━━━━━━━━━━━━━━━━━━
Send fare in this format:

TICKET_PRICE ${booking.id}
COST <amount>
PG <amount>

Example:

TICKET_PRICE ${booking.id}
COST 380
PG 15`,
        );
      }

      return true;
    }

    /* ======================================================
       USER CANCELS BOOKING
    ====================================================== */
    if (buttonId === "CANCEL_BOOKING") {
      updateBooking(booking.id, {
        status: "CANCELLED",
      });

      ctx.session.state = TRAIN_MANUAL_STATES.CANCELLED;

      await sendText(
        ctx.from,
        "🚫 Your train booking has been cancelled.\n\nType *BOOK AGAIN* to start a new booking.",
      );

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚫 Train Booking Cancelled

🆔 ${booking.id}
👤 ${booking.user}`,
        );
      }

      return true;
    }

    /* ======================================================
       DEFAULT → SHOW SUMMARY
    ====================================================== */

    const summaryText = await buildFinalSummary(ctx);

    await sendButtons(ctx.from, summaryText, [
      {
        id: "CONFIRM_BOOKING",
        title: "✅ Confirm",
      },
      {
        id: "CANCEL_BOOKING",
        title: "❌ Cancel",
      },
    ]);

    return true;
  } catch (err) {
    console.error("🔥 FATAL handleFinalConfirmation error", {
      user: ctx?.from,
      bookingId: ctx?.session?.bookingId,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong while confirming your booking.",
    );

    return true;
  }
}

module.exports = {
  handleFinalConfirmation,
  buildFinalSummary,
};
