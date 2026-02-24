const { sendText, sendButtons } = require("../../../../waClient");
const {
  getLastBookingByUser,
  findBookingById,
  updateBooking,
} = require("../../../../bookingStore");

const BUS_STATES = require("./states");

const RAW_ADMIN =
  process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   HELPERS
====================================================== */

function formatPhone(phone) {
  if (!phone) return "-";
  return String(phone);
}

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

    const bus = booking.selectedBus || {};
    const passengers = booking.passengers || [];

    const lines = [];

    lines.push("🚌 *REVIEW YOUR BOOKING*");
    lines.push("━━━━━━━━━━━━━━━━━━━━━━━━");
    lines.push("");

    lines.push(`🆔 *Booking ID:* ${booking.id || "-"}`);
    lines.push("");

    lines.push("🧾 *Trip Details*");
    lines.push(`• Operator : ${bus.name || "-"}`);
    lines.push(`• Departure: ${bus.time || "-"}`);
    lines.push(
      `• Seat     : ${booking.selectedSeat || "-"} ${
        booking.selectedDeck ? `(${booking.selectedDeck})` : ""
      }`
    );
    lines.push("");

    lines.push("📍 *Boarding*");
    lines.push(
      `• ${booking.selectedBoarding?.place || "-"} – ${
        booking.selectedBoarding?.time || "-"
      }`
    );
    lines.push("");

    lines.push("📍 *Dropping*");
    lines.push(
      `• ${booking.selectedDropping?.place || "-"} – ${
        booking.selectedDropping?.time || "-"
      }`
    );
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
    lines.push(
      `• ${formatPhone(booking.contactPhone || booking.user)}`
    );
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
       USER CONFIRMS BOOKING → WAIT FOR PRICE
    ====================================================== */

    if (buttonId === "CONFIRM_BOOKING") {
      updateBooking(booking.id, {
        status: "AWAITING_PRICE",
      });

      ctx.session.state = BUS_STATES.AWAITING_PRICE;

      await sendText(
        ctx.from,
        "✅ Thank you for confirming.\n\n💰 We are checking the final ticket price with the operator.\n⏳ This may take 1–2 minutes."
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
GST <amount>
AGENT <amount>

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Send TICKET_PRICE for ${booking.id}`
        );
      }

      return true;
    }

    /* ======================================================
       USER EDITS BOOKING
    ====================================================== */

    if (buttonId === "EDIT_BOOKING") {
      ctx.session.state = BUS_STATES.SEAT_SELECTION;

      await sendText(
        ctx.from,
        "✏️ No problem!\n\nPlease select your seat again to modify your booking."
      );

      return true;
    }

    /* ======================================================
       USER CANCELS BOOKING
    ====================================================== */

    if (buttonId === "CANCEL_BOOKING") {
      updateBooking(booking.id, {
        status: "CANCELLED",
      });

      ctx.session.state = null;

      await sendText(
        ctx.from,
        "🚫 Your booking has been cancelled.\n\nType *BOOK AGAIN* to start a new booking."
      );

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚫 Booking Cancelled

🆔 ${booking.id}
👤 ${booking.user}`
        );
      }

      return true;
    }

    /* ======================================================
       USER PROCEEDS TO PAYMENT
    ====================================================== */

    if (buttonId === "PROCEED_PAYMENT") {
      updateBooking(booking.id, {
        status: "CONFIRMED",
      });

      ctx.session.state = BUS_STATES.PAYMENT_PENDING;

      await sendText(
        ctx.from,
        "💳 Redirecting you to payment options..."
      );

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
          id: "EDIT_BOOKING",
          title: "✏️ Edit",
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