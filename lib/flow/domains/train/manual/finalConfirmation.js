const { sendText, sendButtons } = require("../../../../waClient");
const {
  getLastBookingByUser,
  findBookingById,
  updateBooking,
} = require("../../../../bookingStore");

const TRAIN_MANUAL_STATES = require("./states");

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

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

    lines.push("🚆 *REVIEW YOUR TRAIN BOOKING*");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("");
    lines.push(`🆔 *Booking ID:* ${booking.id || "-"}`);
    lines.push("");

    lines.push("📍 *Journey Details*");
    lines.push(
      `• From : ${booking.from?.name || "-"} (${booking.from?.code || "-"})`
    );
    lines.push(
      `• To   : ${booking.to?.name || "-"} (${booking.to?.code || "-"})`
    );
    lines.push(`• Date : ${booking.date || "-"}`);
    lines.push("");

    lines.push("🎟 *Ticket Preferences*");
    lines.push(`• Class : ${booking.class || "-"}`);
    lines.push(`• Quota : ${booking.quota || "-"}`);
    lines.push(`• Berth : ${booking.berth || "No Preference"}`);
    lines.push("");

    lines.push(`👥 *Passenger Details (${passengers.length})*`);

    if (Array.isArray(passengers) && passengers.length) {
      passengers.forEach((p, i) => {
        const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
          .filter(Boolean)
          .join(" • ");

        lines.push(
          `${i + 1}. ${p.name || "Passenger"}${
            meta ? ` (${meta})` : ""
          }`
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
    const buttonId =
      ctx.msg?.interactive?.button_reply?.id;

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

      // Move session out of confirmation state
      ctx.session.state = TRAIN_MANUAL_STATES.USER_CONFIRMED;

      await sendText(
        ctx.from,
        "✅ Thank you for confirming.\n\n💰 We are checking the final train fare.\n⏳ Please wait..."
      );

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `💰 *Fare Required*

🆔 ${booking.id}
👤 ${booking.user}

Send in this format:

TICKET_PRICE
COST <amount>
PG <amount>

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Send TICKET_PRICE for ${booking.id}`
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
        "🚫 Your train booking has been cancelled.\n\nType *BOOK AGAIN* to start a new booking."
      );

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚫 Train Booking Cancelled

🆔 ${booking.id}
👤 ${booking.user}`
        );
      }

      return true;
    }

    /* ======================================================
       DEFAULT → SHOW SUMMARY
    ====================================================== */

    const summaryText = await buildFinalSummary(ctx);

    await sendButtons(
      ctx.from,
      summaryText,
      [
        {
          id: "CONFIRM_BOOKING",
          title: "✅ Confirm",
        },
        {
          id: "CANCEL_BOOKING",
          title: "❌ Cancel",
        },
      ]
    );

    return true;
  } catch (err) {
    console.error("🔥 FATAL handleFinalConfirmation error", {
      user: ctx?.from,
      bookingId: ctx?.session?.bookingId,
      error: err.message,
    });

    await sendText(
      ctx.from,
      "❌ Something went wrong while confirming your booking."
    );

    return true;
  }
}

module.exports = {
  handleFinalConfirmation,
  buildFinalSummary,
};