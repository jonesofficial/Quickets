const { sendButtons } = require("../../../../waClient");

module.exports = async function sendAvailabilityPrompt(
  user,
  status,
  booking
) {
  let message = "";
  let buttons = [];

  if (status === "AVAILABLE") {
    const seats = booking?.seatsRemaining || "few";

    message =
`🟢 *Seats Available*

There are *${seats} seats remaining* in this train.

Would you like to proceed with booking?`;

    buttons = [
      { id: "TRAIN_BOOK_NOW", title: "🎟 Book Now" },
      { id: "CANCEL_BOOKING", title: "❌ Cancel" },
    ];
  }

  else if (status === "WL") {
    const wl = booking?.wlPosition || "unknown";

    message =
`⚠ *Waiting List*

Your current position is *WL${wl}*.

If passengers ahead cancel,
your ticket *may get confirmed*.

Do you want to continue anyway?`;

    buttons = [
      { id: "TRAIN_CONTINUE_WL", title: "⚠ Continue WL" },
      { id: "CANCEL_BOOKING", title: "❌ Cancel" },
    ];
  }

  else if (status === "RAC") {
    const rac = booking?.racPosition || "unknown";

    message =
`⚠ *RAC Status*

Your RAC position is *${rac}*.

You may travel but a berth may not be allocated initially.

Would you like to continue?`;

    buttons = [
      { id: "TRAIN_CONTINUE_RAC", title: "⚠ Continue RAC" },
      { id: "CANCEL_BOOKING", title: "❌ Cancel" },
    ];
  }

  else if (status === "NO_CHANCE") {
    message =
`❌ *No Chance of Confirmation*

The waiting list is extremely high.

We recommend choosing another train
or trying Tatkal booking.`;

    buttons = [
      { id: "CANCEL_BOOKING", title: "❌ Cancel Booking" },
    ];
  }

  await sendButtons(user, message, buttons);
};