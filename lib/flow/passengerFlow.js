// // // lib/flow/passengerFlow.js

// // const { sendText, sendButtons } = require("../waClient");
// // const { buildBusSummary } = require("./summary");

// // /* ======================================================
// //  * Passenger Flow
// //  * ====================================================== */
// // module.exports = async function passengerFlow(ctx) {
// //   const {
// //     session: s,
// //     msg,
// //     interactiveType,
// //     interactiveId,
// //     from,
// //   } = ctx;

// //   if (!s || !s.pendingBooking) return false;

// //   /* ===============================
// //    * PASSENGER MODE SELECTION
// //    * =============================== */
// //   if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
// //     if (interactiveId === "PAX_BULK") {
// //       s.pendingBooking.paxMode = "BULK";
// //       s.state = "BUS_PAX_BULK";

// //       await sendText(
// //         from,
// //         "✍️ *Enter passenger details*\n\n" +
// //           "Format (one per line):\n" +
// //           "Name, Age, Gender\n\n" +
// //           "Example:\n" +
// //           "Ravi, 28, M\n" +
// //           "Sita, 25, F"
// //       );
// //       return true;
// //     }

// //     if (interactiveId === "PAX_ONEBYONE") {
// //       s.pendingBooking.paxMode = "ONE_BY_ONE";
// //       s.pendingBooking.passengers = [];
// //       s.pendingBooking._paxIndex = 1;

// //       s.state = "BUS_PAX_ONE_NAME";
// //       await sendText(from, "👤 Enter passenger 1 name:");
// //       return true;
// //     }
// //   }

// //   /* ===============================
// //    * BULK PASSENGER INPUT
// //    * =============================== */
// //   if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
// //     const lines = msg.text.body
// //       .split("\n")
// //       .map((l) => l.trim())
// //       .filter(Boolean);

// //     if (lines.length !== s.pendingBooking.paxCount) {
// //       await sendText(
// //         from,
// //         `❌ You selected *${s.pendingBooking.paxCount} passengers* but sent *${lines.length}*.\nPlease try again.`
// //       );
// //       return true;
// //     }

// //     s.pendingBooking.passengers = lines.map((line) => {
// //       const [name, age, gender] = line.split(",").map((s) => s.trim());
// //       return { name, age, gender };
// //     });

// //     return await moveToUserConfirmation(ctx);
// //   }

// //   /* ===============================
// //    * ONE-BY-ONE PASSENGER INPUT
// //    * =============================== */
// //   if (s.state === "BUS_PAX_ONE_NAME" && msg.type === "text") {
// //     const name = msg.text.body.trim();

// //     if (!name) {
// //       await sendText(from, "❌ Name cannot be empty. Enter again.");
// //       return true;
// //     }

// //     s.pendingBooking.passengers.push({ name });

// //     if (s.pendingBooking.passengers.length >= s.pendingBooking.paxCount) {
// //       return await moveToUserConfirmation(ctx);
// //     }

// //     s.pendingBooking._paxIndex += 1;
// //     await sendText(
// //       from,
// //       `👤 Enter passenger ${s.pendingBooking._paxIndex} name:`
// //     );
// //     return true;
// //   }

// //   /* ===============================
// //    * USER CONFIRMATION
// //    * =============================== */
// //   if (s.state === "BUS_CONFIRM" && interactiveType === "button_reply") {
// //     if (interactiveId === "CONFIRM_BOOK") {
// //       s.pendingBooking.status = "CONFIRMED_BY_USER";
// //       s.state = "BUS_SUMMARY";

// //       const summary = buildBusSummary(s.pendingBooking);

// //       // ✅ Send summary again to user
// //       await sendText(from, summary);
// //       await sendText(
// //         from,
// //         "✅ *Booking confirmed!*\n\n⏳ We are now checking availability."
// //       );

// //       // ✅ Send summary to admin
// //       if (process.env.ADMIN_PHONE) {
// //         await sendText(process.env.ADMIN_PHONE, summary);
// //       } else {
// //         console.error("❌ ADMIN_PHONE not set");
// //       }

// //       return true;
// //     }

// //     if (interactiveId === "CANCEL_BOOK") {
// //       s.pendingBooking.status = "CANCELLED_BY_USER";
// //       s.state = null;

// //       await sendText(
// //         from,
// //         "❌ Booking cancelled.\nType *MENU* to start again."
// //       );
// //       return true;
// //     }
// //   }

// //   return false;
// // };

// // /* ======================================================
// //  * Helper: Move to confirmation
// //  * ====================================================== */
// // async function moveToUserConfirmation(ctx) {
// //   const { session: s, from } = ctx;

// //   s.pendingBooking.status = "AWAITING_USER_CONFIRM";
// //   s.state = "BUS_CONFIRM";

// //   const summary = buildBusSummary(s.pendingBooking);

// //   await sendText(from, summary);

// //   await sendButtons(from, "✅ *Please confirm your booking*", [
// //     { id: "CONFIRM_BOOK", title: "Confirm Booking ✅" },
// //     { id: "CANCEL_BOOK", title: "Cancel ❌" },
// //   ]);

// //   return true;
// // }

// // lib/flow/passengerFlow.js

// // lib/flow/passengerFlow.js

// const { sendText, sendButtons } = require("../waClient");
// const { buildBusSummary } = require("./summary");
// const { saveBooking } = require("../bookingStore");

// /* ======================================================
//  * Passenger Flow
//  * ====================================================== */
// module.exports = async function passengerFlow(ctx) {
//   if (ctx.session?.__isAdmin) return false;

//   const {
//     session: s,
//     msg,
//     interactiveType,
//     interactiveId,
//     from,
//   } = ctx;

//   if (!s || !s.pendingBooking) return false;

//   /* ===============================
//    * PASSENGER MODE SELECTION
//    * =============================== */
//   if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
//     if (interactiveId === "PAX_BULK") {
//       s.pendingBooking.paxMode = "BULK";
//       s.state = "BUS_PAX_BULK";

//       await sendText(
//         from,
//         "✍️ *Enter passenger details*\n\n" +
//           "Format (one per line):\n" +
//           "Name, Age, Gender\n\n" +
//           "Example:\n" +
//           "Ravi, 28, M\n" +
//           "Sita, 25, F"
//       );
//       return true;
//     }

//     if (interactiveId === "PAX_ONEBYONE") {
//       s.pendingBooking.paxMode = "ONE_BY_ONE";
//       s.pendingBooking.passengers = [];
//       s.pendingBooking._paxIndex = 1;

//       s.state = "BUS_PAX_ONE_NAME";
//       await sendText(from, "👤 Enter passenger 1 name:");
//       return true;
//     }
//   }

//   /* ===============================
//    * BULK PASSENGER INPUT
//    * =============================== */
//   if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
//     const lines = msg.text.body
//       .split("\n")
//       .map((l) => l.trim())
//       .filter(Boolean);

//     if (lines.length !== s.pendingBooking.paxCount) {
//       await sendText(
//         from,
//         `❌ You selected *${s.pendingBooking.paxCount} passengers* but sent *${lines.length}*.\nPlease try again.`
//       );
//       return true;
//     }

//     s.pendingBooking.passengers = lines.map((line) => {
//       const [name, age, gender] = line.split(",").map((s) => s.trim());
//       return { name, age, gender };
//     });

//     return await moveToUserConfirmation(ctx);
//   }

//   /* ===============================
//    * ONE-BY-ONE PASSENGER INPUT
//    * =============================== */
//   if (s.state === "BUS_PAX_ONE_NAME" && msg.type === "text") {
//     const name = msg.text.body.trim();

//     if (!name) {
//       await sendText(from, "❌ Name cannot be empty. Enter again.");
//       return true;
//     }

//     s.pendingBooking.passengers.push({ name });

//     if (s.pendingBooking.passengers.length >= s.pendingBooking.paxCount) {
//       return await moveToUserConfirmation(ctx);
//     }

//     s.pendingBooking._paxIndex += 1;
//     await sendText(
//       from,
//       `👤 Enter passenger ${s.pendingBooking._paxIndex} name:`
//     );
//     return true;
//   }

//   /* ===============================
//    * USER CONFIRMATION
//    * =============================== */
//   if (s.state === "BUS_CONFIRM" && interactiveType === "button_reply") {
//     if (interactiveId === "CONFIRM_BOOK") {
//       s.pendingBooking.status = "CONFIRMED_BY_USER";
//       s.state = "BUS_SUMMARY";

//       // ✅ CRITICAL FIX: SAVE BOOKING FOR ADMIN COMMANDS
//       saveBooking({
//         ...s.pendingBooking,
//         user: from,
//         createdAt: Date.now(),
//       });

//       const summary = buildBusSummary(s.pendingBooking);

//       // Send summary to user
//       await sendText(from, summary);
//       await sendText(
//         from,
//         "✅ *Booking confirmed!*\n\n⏳ We are now checking availability."
//       );

//       // Send summary to admin
//       if (process.env.ADMIN_PHONE) {
//         await sendText(process.env.ADMIN_PHONE, summary);
//       }

//       return true;
//     }

//     if (interactiveId === "CANCEL_BOOK") {
//       s.pendingBooking.status = "CANCELLED_BY_USER";
//       s.state = null;

//       await sendText(
//         from,
//         "❌ Booking cancelled.\nType *MENU* to start again."
//       );
//       return true;
//     }
//   }

//   return false;
// };

// /* ======================================================
//  * Helper: Move to confirmation
//  * ====================================================== */
// async function moveToUserConfirmation(ctx) {
//   const { session: s, from } = ctx;

//   s.pendingBooking.status = "AWAITING_USER_CONFIRM";
//   s.state = "BUS_CONFIRM";

//   const summary = buildBusSummary(s.pendingBooking);

//   await sendText(from, summary);

//   await sendButtons(from, "✅ *Please confirm your booking*", [
//     { id: "CONFIRM_BOOK", title: "Confirm Booking ✅" },
//     { id: "CANCEL_BOOK", title: "Cancel ❌" },
//   ]);

//   return true;
// }
const { sendText, sendButtons } = require("../waClient");

/* ======================================================
 * COMMON PASSENGER FLOW
 * ====================================================== */
module.exports = async function passengerFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const { session: s, msg, interactiveType, interactiveId, from } = ctx;
  if (!s || !s.pendingBooking) return false;

  const booking = s.pendingBooking;
  const total = booking.paxCount;

  /* ===============================
   * PASSENGER MODE SELECTION
   * =============================== */
  if (s.state === "PAX_MODE" && interactiveType === "button_reply") {
    if (interactiveId === "PAX_BULK") {
      s.state = "PAX_BULK";
      booking.passengers = [];

      await sendText(
        from,
        "✍️ *Enter passenger details*\n\n" +
          "Format (one per line):\n" +
          "Name, Age, Gender\n\n" +
          "Example:\n" +
          "Ravi, 28, M\n" +
          "Sita, 25, F"
      );
      return true;
    }

    if (interactiveId === "PAX_ONEBYONE") {
      s.state = "PAX_ONE_NAME";
      booking.passengers = [];
      booking._paxIndex = 1;

      await sendText(from, "👤 Enter passenger 1 name:");
      return true;
    }
  }

  /* ===============================
   * BULK INPUT
   * =============================== */
  if (s.state === "PAX_BULK" && msg.type === "text") {
    const lines = msg.text.body
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length !== total) {
      await sendText(
        from,
        `❌ Expected *${total} passengers* but got *${lines.length}*. Please try again.`
      );
      return true;
    }

    booking.passengers = lines.map(line => {
      const [name, age, gender] = line.split(",").map(s => s.trim());
      return { name, age, gender };
    });

    s.state = "ASK_CONTACT_PHONE";
    await sendText(
      from,
      "📞 *Contact phone number*\n\n" +
        "Enter a mobile number for booking updates.\n" +
        "Example: 9876543210"
    );
    return true;
  }

  /* ===============================
   * ONE BY ONE INPUT
   * =============================== */
  if (s.state === "PAX_ONE_NAME" && msg.type === "text") {
    const name = msg.text.body.trim();
    if (!name) {
      await sendText(from, "❌ Name cannot be empty.");
      return true;
    }

    booking.passengers.push({ name });

    if (booking.passengers.length >= total) {
      s.state = "ASK_CONTACT_PHONE";
      await sendText(
        from,
        "📞 *Contact phone number*\n\n" +
          "Enter a mobile number for booking updates.\n" +
          "Example: 9876543210"
      );
      return true;
    }

    booking._paxIndex += 1;
    await sendText(from, `👤 Enter passenger ${booking._paxIndex} name:`);
    return true;
  }

  /* ===============================
   * CONTACT PHONE (MANDATORY)
   * =============================== */
  if (s.state === "ASK_CONTACT_PHONE" && msg.type === "text") {
    const phone = msg.text.body.replace(/\D/g, "");

    if (phone.length < 10) {
      await sendText(
        from,
        "❌ Invalid phone number.\nPlease enter a valid 10-digit mobile number."
      );
      return true;
    }

    booking.contactPhone = phone;
    s.state = "PAX_DONE";

    return true; // booking flow continues
  }

  return false;
};
