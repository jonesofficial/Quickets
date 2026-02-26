// const STATES = require("./states");
// const { sendText } = require("../../../../waClient");
// const { getLastBookingByUser, updateBooking } = require("../../../../bookingStore");

// const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// /**
//  * Handle USER bus selection
//  */
// module.exports = async function handleBusSelection(ctx) {
//   console.log("🟢 HANDLE BUS SELECTION START");

//   try {
//     const { session: s, from, text, msg } = ctx;

//     if (!s) {
//       console.error("❌ Missing session in bus selection", ctx);
//       return false;
//     }

//     /* ================================
//        STRICT STATE GUARD
//     ================================= */
//     if (s.state !== STATES.BUS_OPTION_SELECTION) {
//       return false;
//     }

//     /* ================================
//        Validate bus list (from session)
//     ================================= */
//     if (!Array.isArray(s.busOptions) || s.busOptions.length === 0) {
//       return false;
//     }

//     /* ================================
//        Fetch booking from store
//     ================================= */
//     const booking = await getLastBookingByUser(from);

//     if (!booking) {
//       await sendText(from, "⚠️ No active booking found.");
//       return true;
//     }

//     /* ================================
//        Prevent duplicate selection
//     ================================= */
//     if (booking.selectedBus) {
//       console.log("⚠️ Bus already selected in booking store");
//       return true;
//     }

//     /* ================================
//        Extract input
//     ================================= */
//     const input =
//       (typeof text === "string" && text.trim()) ||
//       msg?.text?.body?.trim();

//     if (!input) return false;

//     /* ================================
//        Validate numeric input
//     ================================= */
//     if (!/^\d+$/.test(input)) {
//       await sendText(
//         from,
//         "❌ Please reply with the bus number (e.g. 1, 2, 3)."
//       );
//       return true;
//     }

//     const choice = Number(input);
//     const buses = s.busOptions;

//     if (choice < 1 || choice > buses.length) {
//       await sendText(
//         from,
//         `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`
//       );
//       return true;
//     }

//     const selectedBus = buses[choice - 1];

//     /* ================================
//        Persist in booking store (🔥 SOURCE OF TRUTH)
//     ================================= */
//     updateBooking(booking.id, {
//       selectedBus,
//       status: "BUS_SELECTED",
//     });

//     /* ================================
//        Update session flow state
//     ================================= */
//     s.selectedBus = selectedBus;
//     s.state = STATES.SEAT_LAYOUT_PENDING;

//     /* Optional: prevent retrigger */
//     delete s.busOptions;

//     /* ================================
//        Notify USER
//     ================================= */
//     await sendText(
//       from,
//       `🚌 *Bus Selected Successfully*\n\n` +
//         `Operator: *${selectedBus.name}*\n` +
//         `Type: ${selectedBus.type}\n` +
//         `Departure: ${selectedBus.time}\n` +
//         `Duration: ${selectedBus.duration}\n` +
//         `Price: ₹${selectedBus.price}\n\n` +
//         `🪑 Fetching seat layout...\n\n` +
//         `— *Team Quickets*`
//     );

//     /* ================================
//        Notify ADMIN
//     ================================= */
//     if (RAW_ADMIN) {
//       await sendText(
//         RAW_ADMIN,
//         `🚌 *Bus Selected by User*\n\n` +
//           `👤 User: ${from}\n` +
//           `🆔 Booking ID: ${booking.id}\n` +
//           `Operator: ${selectedBus.name}\n` +
//           `Type: ${selectedBus.type}\n` +
//           `Departure: ${selectedBus.time}\n` +
//           `Duration: ${selectedBus.duration}\n` +
//           `Price: ₹${selectedBus.price}\n\n` +
//           `━━━━━━━━━━━━━━━━━━\n` +
//           `👉 NEXT STEP:\nSend SEAT_OPTIONS with seat layout image.`
//       );
//     }

//     console.log("🟢 HANDLE BUS SELECTION END — SUCCESS", {
//       bookingId: booking.id,
//       user: from,
//       nextState: s.state,
//     });

//     return true;

//   } catch (err) {
//     console.error("🔥 FATAL BUS SELECTION ERROR", {
//       bookingId: ctx?.session?.bookingId,
//       user: ctx?.from,
//       error: err.message,
//     });

//     try {
//       await sendText(
//         ctx.from,
//         "❌ Something went wrong while selecting the bus.\nPlease try again."
//       );
//     } catch (_) {}

//     return true;
//   }
// };

const STATES = require("./states");
const { sendText } = require("../../../../waClient");
const { getLastBookingByUser } = require("../../../../bookingStore");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/**
 * Handle USER bus selection
 */
module.exports = async function handleBusSelection(ctx) {
  console.log("🟢 HANDLE BUS SELECTION START");

  try {
    const { session: s, from, text, msg } = ctx;

    if (!s) {
      console.error("❌ Missing session in bus selection", ctx);
      return false;
    }

    /* ================================
       STRICT STATE GUARD
    ================================= */
    if (s.state !== STATES.BUS_OPTION_SELECTION) {
      return false;
    }

    /* ================================
       Validate bus list (from session)
    ================================= */
    if (!Array.isArray(s.busOptions) || s.busOptions.length === 0) {
      return false;
    }

    /* ================================
       Fetch booking from store
    ================================= */
    const booking = await getLastBookingByUser(from);

    if (!booking) {
      await sendText(from, "⚠️ No active booking found.");
      return true;
    }

    /* ================================
       Extract input
    ================================= */
    const input =
      (typeof text === "string" && text.trim()) ||
      msg?.text?.body?.trim();

    if (!input) return false;

    /* ================================
       Validate numeric input
    ================================= */
    if (!/^\d+$/.test(input)) {
      await sendText(
        from,
        "❌ Please reply with the bus number (e.g. 1, 2, 3)."
      );
      return true;
    }

    const choice = Number(input);
    const buses = s.busOptions;

    if (choice < 1 || choice > buses.length) {
      await sendText(
        from,
        `❌ Invalid choice.\nReply with a number between 1 and ${buses.length}.`
      );
      return true;
    }

    const selectedBus = buses[choice - 1];

    /* ======================================================
       🔥 IMPORTANT CHANGE
       Store as TEMP selection (NOT final yet)
    ====================================================== */

    s.tempSelectedBus = selectedBus;
    s.state = STATES.SEAT_LAYOUT_PENDING;

    /* Optional: prevent retrigger */
    delete s.busOptions;

    /* ================================
       Notify USER
    ================================= */
    await sendText(
      from,
      `🚌 *Bus Selected*\n\n` +
        `Operator: *${selectedBus.name}*\n` +
        `Type: ${selectedBus.type}\n` +
        `Departure: ${selectedBus.time}\n` +
        `Duration: ${selectedBus.duration}\n` +
        `Price: ₹${selectedBus.price}\n\n` +
        `🪑 Fetching seat layout...\n\n` +
        `You can still change the bus after viewing seats.\n\n` +
        `— *Team Quickets*`
    );

    /* ================================
       Notify ADMIN
    ================================= */
    if (RAW_ADMIN) {
      await sendText(
        RAW_ADMIN,
        `🚌 *Bus Selected (Temporary)*\n\n` +
          `👤 User: ${from}\n` +
          `🆔 Booking ID: ${booking.id}\n` +
          `Operator: ${selectedBus.name}\n` +
          `Type: ${selectedBus.type}\n` +
          `Departure: ${selectedBus.time}\n` +
          `Duration: ${selectedBus.duration}\n` +
          `Price: ₹${selectedBus.price}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `👉 NEXT STEP:\nSend SEAT_OPTIONS with seat layout image.`
      );
    }

    console.log("🟢 HANDLE BUS SELECTION END — TEMP STORED", {
      bookingId: booking.id,
      user: from,
      nextState: s.state,
    });

    return true;

  } catch (err) {
    console.error("🔥 FATAL BUS SELECTION ERROR", {
      bookingId: ctx?.session?.bookingId,
      user: ctx?.from,
      error: err.message,
    });

    try {
      await sendText(
        ctx.from,
        "❌ Something went wrong while selecting the bus.\nPlease try again."
      );
    } catch (_) {}

    return true;
  }
};