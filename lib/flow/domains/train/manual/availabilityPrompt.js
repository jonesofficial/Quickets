const { sendButtons } = require("../../../../waClient");
const TRAIN_MANUAL_STATES = require("./states");

module.exports = async function sendAvailabilityPrompt(
  user,
  status,
  booking,
  session,
) {
  try {
    let message = "";
    let buttons = [];

    /* ======================================================
       SET STATE FOR BUTTON HANDLING
    ====================================================== */

    if (session) {
      session.state = TRAIN_MANUAL_STATES.AWAITING_AVAILABILITY_DECISION;
      session.bookingId = booking?.id || session.bookingId;
    }

    /* ======================================================
       AVAILABLE
    ====================================================== */

    if (status === "AVAILABLE") {
      const seats = booking?.seatsRemaining || "few";

      message = `🟢 *Seats Available*

There are *${seats} seats remaining* in this train.

Would you like to proceed with booking?`;

      buttons = [
        { id: "TRAIN_BOOK_NOW", title: "🎟 Book Now" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" },
      ];
    } else if (status === "WL") {

    /* ======================================================
       WAITING LIST
    ====================================================== */
      const wl = booking?.wlPosition || "unknown";

      message = `⚠ *Waiting List*

Your current position is *WL${wl}*.

If passengers ahead cancel,
your ticket *may get confirmed*.

Do you want to continue anyway?`;

      buttons = [
        { id: "TRAIN_CONTINUE_WL", title: "⚠ Continue WL" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" },
      ];
    } else if (status === "RAC") {

    /* ======================================================
       RAC
    ====================================================== */
      const rac = booking?.racPosition || "unknown";

      message = `⚠ *RAC Status*

Your RAC position is *${rac}*.

You may travel but a berth may not be allocated initially.

Would you like to continue?`;

      buttons = [
        { id: "TRAIN_CONTINUE_RAC", title: "⚠ Continue RAC" },
        { id: "CANCEL_BOOKING", title: "❌ Cancel" },
      ];
    } else if (status === "NO_CHANCE") {

    /* ======================================================
       NO CHANCE
    ====================================================== */
      message = `❌ *No Chance of Confirmation*

The waiting list is extremely high.

We recommend choosing another train
or trying Tatkal booking.`;

      buttons = [{ id: "CANCEL_BOOKING", title: "❌ Cancel Booking" }];
    }

    /* ======================================================
       SEND BUTTONS
    ====================================================== */

    if (!message || !buttons.length) {
      console.error("⚠ Invalid availability status:", status);
      return;
    }

    await sendButtons(user, message, buttons);
  } catch (err) {
    console.error("❌ sendAvailabilityPrompt error:", err);
  }
};
