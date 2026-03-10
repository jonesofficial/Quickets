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

    lines.push(`👥 *Passenger Details (${passengers.length})`);

    if (Array.isArray(passengers) && passengers.length) {
      passengers.forEach((p, i) => {
        const meta = [p.age ? `${p.age} yrs` : "", p.gender || ""]
          .filter(Boolean)
          .join(" • ");

        lines.push(
          `${i + 1}. ${p.name || "Passenger"}${meta ? ` (${meta})` : ""}`,
        );
      });
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
       AVAILABLE → SHOW SEATS WARNING
    ====================================================== */

    if (buttonId === "TRAIN_BOOK_NOW") {
      const seats = booking.seatsRemaining || "few";

      await sendButtons(
        ctx.from,
        `🟢 *Seats Available*

There are *${seats} seats remaining* in this train.

Do you want to continue booking now?`,
        [
          { id: "CONFIRM_BOOKING", title: "✅ Continue Booking" },
          { id: "CANCEL_BOOKING", title: "❌ Cancel" },
        ],
      );

      return true;
    }

    /* ======================================================
       WAITING LIST WARNING
    ====================================================== */

    if (buttonId === "TRAIN_CONTINUE_WL") {
      const wl = booking.wlPosition || "unknown";

      await sendButtons(
        ctx.from,
        `⚠ *Waiting List*

Your waiting list position is *${wl}*.

If passengers ahead cancel their tickets,
your ticket *may get confirmed*.

However confirmation is *not guaranteed*.

Do you want to continue anyway?`,
        [
          { id: "CONFIRM_BOOKING", title: "⚠ Continue Anyway" },
          { id: "CANCEL_BOOKING", title: "❌ Cancel" },
        ],
      );

      return true;
    }

    /* ======================================================
       RAC WARNING
    ====================================================== */

    if (buttonId === "TRAIN_CONTINUE_RAC") {
      const rac = booking.racPosition || "unknown";

      await sendButtons(
        ctx.from,
        `⚠ *RAC Status*

Your RAC position is *${rac}*.

You will be allowed to board the train,
but a berth may not be allocated initially.

If passengers ahead cancel,
a berth may be assigned.

Do you want to continue?`,
        [
          { id: "CONFIRM_BOOKING", title: "⚠ Continue" },
          { id: "CANCEL_BOOKING", title: "❌ Cancel" },
        ],
      );

      return true;
    }

    /* ======================================================
       FINAL CONFIRM BOOKING
    ====================================================== */

    if (buttonId === "CONFIRM_BOOKING") {
      updateBooking(booking.id, {
        status: "AWAITING_PRICE",
      });

      ctx.session.state = TRAIN_MANUAL_STATES.AWAITING_FARE_INPUT;

      /* =========================
     USER MESSAGE
  ========================= */

      await sendText(
        ctx.from,
        `✅ *Booking Confirmed*

💰 We are now preparing the final ticket fare.

⏳ Please wait while our team calculates the latest price.`,
      );

      /* =========================
     DETECT AVAILABILITY TYPE
  ========================= */

      let availability = "UNKNOWN";

      if (booking.wlPosition) {
        availability = `WL${booking.wlPosition}`;
      } else if (booking.racPosition) {
        availability = `RAC${booking.racPosition}`;
      } else if (booking.seatsRemaining !== undefined) {
        availability = `AVAILABLE ${booking.seatsRemaining}`;
      } else if (booking.availability) {
        availability = booking.availability;
      }

      /* =========================
     ADMIN NOTIFICATION
  ========================= */

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚆 *Fare Required*

🆔 Booking ID: ${booking.id}
👤 User: ${booking.user}

📊 Availability: ${availability}

━━━━━━━━━━━━━━━━━━
Send fare using:

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
       CANCEL BOOKING
    ====================================================== */

    if (buttonId === "CANCEL_BOOKING") {
      updateBooking(booking.id, {
        status: "CANCELLED",
      });

      ctx.session.state = TRAIN_MANUAL_STATES.CANCELLED;

      await sendText(
        ctx.from,
        `🚫 Your train booking has been cancelled.

Type *BOOK AGAIN* to start a new booking.`,
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
      { id: "CONFIRM_BOOKING", title: "✅ Confirm" },
      { id: "CANCEL_BOOKING", title: "❌ Cancel" },
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
