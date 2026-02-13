// // lib/flow/fallbackFlow.js
// const {
//   sendList,
//   sendOopsTapOptions,
//   sendText,
//   sendButtons,
// } = require("../waClient");

// const menuFlow = require("./menuFlow");
// const bookingFlow = require("./bookingFlow");
// const passengerFlow = require("./passengerFlow");
// const summaryFlow = require("./summaryFlow");

// const {
//   getLastBookingByUser,
//   saveBooking,
//   generateReadableBookingId,
// } = require("../bookingStore");

// const ADMIN_CHAT_LINK = "https://wa.me/919894381195"; // auto-masked

// module.exports = async function fallbackFlow(ctx) {
//   const { session: s, msg, from, get } = ctx;
//   if (!msg) return false;

//   const text = getText(msg);
//   const upperText = text?.toUpperCase();

//   /* ================= STATUS ================= */
//   if (upperText === "STATUS") {
//     await sendStatus(ctx);
//     return true;
//   }

//   if (!s) return false;

//   /* ================= GLOBAL TEXT ================= */
//   if (msg.type === "text" && upperText) {
//     if (upperText === "HELP") {
//       await sendButtons(
//         from,
//         `🆘 *Need help?*\n\nYou can chat directly with our team.\n\nYou can also type anytime:\n• HELP\n• RETRY\n• BOOK AGAIN`,
//         [{ id: "CHAT_ADMIN", title: "💬 Chat with us" }],
//       );
//       return true;
//     }

//     if (upperText === "RETRY") {
//       if (!s.pendingBooking) {
//         await sendText(
//           from,
//           "No active booking to retry.\n\nType *BOOK AGAIN* to start a new booking.",
//         );
//         return true;
//       }
//       return retryCurrentStep(ctx);
//     }

//     if (upperText === "BOOK AGAIN") {
//       s.pendingBooking = null;
//       s.currentStep = null;
//       s.state = "IDLE";
//       await menuFlow(ctx);
//       return true;
//     }
//   }

//   /* ================= INTERACTIVE ================= */
//   if (msg.type === "interactive") {
//     const id = msg.interactive?.button_reply?.id;

//     // 💬 CHAT ADMIN
//     if (id === "CHAT_ADMIN") {
//       await sendText(from, `💬 Chat with our team here:\n${ADMIN_CHAT_LINK}`);
//       return true;
//     }

//     // ✅ CONFIRM BOOKING
//     if (id === "CONFIRM_BOOKING" && s.pendingBooking) {
//       const booking = s.pendingBooking;

//       const bookingId = generateReadableBookingId(booking.type);

//       saveBooking({
//         ...booking,
//         id: bookingId,
//         status: "CONFIRMED",
//         createdAt: Date.now(),
//       });

//       s.pendingBooking = null;
//       s.state = "IDLE"; // ✅ FIXED

//       await sendText(
//         from,
//         `🎟 *Booking Confirmed!*\n🆔 Booking ID: *${bookingId}*`,
//       );
//       return true;
//     }

//     // ✏️ EDIT BOOKING
//     if (interactiveId === "EDIT_BOOKING") {
//       s.state = "BOOKING_EDIT";

//       await sendText(
//         from,
//         "✏️ *Edit Booking*\n\n" +
//           "Reply with the details you want to update.\n\n" +
//           "Example:\n" +
//           "Name: Jones\n" +
//           "Destination: Bangalore\n\n" +
//           "You can update:\n" +
//           "• Name\n" +
//           "• Destination\n" +
//           "• From\n" +
//           "• Date\n" +
//           "• Seat Type\n" +
//           "• Budget",
//       );

//       return true;
//     }

//     // ❌ CANCEL BOOKING
//     if (id === "CANCEL_BOOKING") {
//       s.pendingBooking = null;
//       s.state = "IDLE"; // ✅ CONSISTENT
//       await sendText(
//         from,
//         "❌ Booking cancelled.\n\nType *BOOK AGAIN* to start a new booking.",
//       );
//       return true;
//     }

//     await sendOopsTapOptions(from);
//     return true;
//   }

//   /* ================= IDLE ================= */
//   if (msg.type === "text" && s.state === "IDLE") {
//     await sendList(
//       from,
//       `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
//       get("MAIN"),
//       [
//         {
//           title: get("MAIN"),
//           rows: [
//             { id: "MENU_BOOK", title: get("MENU_BOOK") },
//             { id: "MENU_TRACK", title: get("MENU_TRACK") },
//             { id: "MENU_HELP", title: get("MENU_HELP") },
//             { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
//           ],
//         },
//       ],
//     );
//     return true;
//   }

//   return false;
// };

// /* ================= RETRY HANDLER ================= */
// async function retryCurrentStep(ctx) {
//   const step = ctx.session.currentStep;

//   switch (step) {
//     case "ASK_SOURCE":
//     case "ASK_DESTINATION":
//     case "ASK_DATE":
//       return bookingFlow(ctx);

//     case "ASK_PASSENGERS":
//       return passengerFlow(ctx);

//     case "CONFIRM_SUMMARY":
//       return summaryFlow(ctx);

//     default:
//       return sendText(
//         ctx.from,
//         "⚠️ Unable to retry this step.\n\nType *BOOK AGAIN* to start fresh.",
//       );
//   }
// }

// /* ================= STATUS ================= */
// async function sendStatus(ctx) {
//   const { session: s, from } = ctx;

//   if (s?.pendingBooking) {
//     const b = s.pendingBooking;

//     await sendText(
//       from,
//       `📌 *Booking in progress*\n\n` +
//         `Type: ${b.type}\n` +
//         `${b.from ? `From: ${b.from}\n` : ""}` +
//         `${b.to ? `To: ${b.to}\n` : ""}` +
//         `${b.date ? `Date: ${b.date}\n` : ""}` +
//         `\nCurrent step: ${s.state}\n\n` +
//         `You can type:\n• RETRY\n• BOOK AGAIN\n• HELP`,
//     );
//     return;
//   }

//   const last = getLastBookingByUser?.(from);

//   if (last) {
//     await sendText(
//       from,
//       `📄 *Last Booking Status*\n\n` +
//         `🆔 Booking ID: ${last.id}\n` +
//         `Type: ${last.type}\n` +
//         `From: ${last.from}\n` +
//         `To: ${last.to}\n` +
//         `Date: ${last.date}\n` +
//         `Status: ${last.status}\n\n` +
//         `Need help? Type *HELP*`,
//     );
//     return;
//   }

//   await sendText(
//     from,
//     `ℹ️ No active or past booking found.\n\nType *BOOK AGAIN* to start a new booking.`,
//   );
// }

// /* ================= SAFE TEXT ================= */
// function getText(msg) {
//   if (!msg) return null;
//   if (typeof msg.text === "string") return msg.text.trim();
//   if (msg.text?.body) return msg.text.body.trim();
//   return null;
// }

// lib/flow/fallbackFlow.js

const {
  sendList,
  sendOopsTapOptions,
  sendText,
  sendButtons,
} = require("../waClient");

const menuFlow = require("./menuFlow");
const bookingFlow = require("./bookingFlow");
const passengerFlow = require("./passengerFlow");
const summaryFlow = require("./summaryFlow");

const {
  getLastBookingByUser,
  saveBooking,
  generateReadableBookingId,
} = require("../bookingStore");

const buildBusSummary = require("./domains/bus/summary");

const ADMIN_CHAT_LINK = "https://wa.me/919894381195";

module.exports = async function fallbackFlow(ctx) {
  const { session: s, msg, from, get } = ctx;
  if (!msg) return false;

  const text = getText(msg);
  const upperText = text?.toUpperCase();

  /* ======================================================
     UNIVERSAL COMMANDS
  ====================================================== */

  if (msg.type === "text" && upperText) {

    /* ===== HELP ===== */
    if (upperText === "HELP") {
      await sendText(
        from,
        "🆘 *Need Assistance?*\n\n" +
        "You can use these commands anytime:\n\n" +
        "• *RETRY* – Refill the current step\n" +
        "• *BOOK AGAIN* – Start a fresh booking\n" +
        "• *STATUS* – Check booking status\n\n" +
        `Or chat with us directly:\n${ADMIN_CHAT_LINK}\n\n` +
        "We're here to help 😊"
      );
      return true;
    }

    /* ===== RETRY ===== */
    if (upperText === "RETRY") {
      if (!s?.pendingBooking) {
        await sendText(
          from,
          "⚠️ No active booking found.\n\nType *BOOK AGAIN* to start a new booking."
        );
        return true;
      }

      return retryCurrentStep(ctx);
    }

    /* ===== BOOK AGAIN ===== */
    if (upperText === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.currentStep = null;
      s.state = "IDLE";

      await sendText(
        from,
        "🔄 Starting a new booking.\n\nPlease choose an option below."
      );

      await menuFlow(ctx);
      return true;
    }

    /* ===== STATUS ===== */
    if (upperText === "STATUS") {
      await sendStatus(ctx);
      return true;
    }
  }

  if (!s) return false;

  /* ======================================================
     EDIT MODE
  ====================================================== */
if (s.state === "BOOKING_EDIT" && msg.type === "text") {
  if (!s.pendingBooking) return true;

  const body = msg.text?.body?.trim();
  if (!body) return true;

  const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
  const booking = s.pendingBooking;

  if (!Array.isArray(booking.passengers)) {
    booking.passengers = [];
  }

  for (const line of lines) {
    const [rawKey, ...rest] = line.split(":");
    if (!rawKey || !rest.length) continue;

    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (!value) continue;

    /* ======================================
       PASSENGER TARGETING (Passenger 1, 2)
    ====================================== */

    let passengerIndex = 0; // default first passenger

    const passengerMatch = key.match(/passenger\s*(\d+)/);
    if (passengerMatch) {
      passengerIndex = Number(passengerMatch[1]) - 1;
    }

    if (!booking.passengers[passengerIndex]) {
      booking.passengers[passengerIndex] = {};
    }

    /* ======================================
       NAME
    ====================================== */

    if (key.includes("name")) {
      booking.passengers[passengerIndex].name = value;
      continue;
    }

    /* ======================================
       AGE (VALIDATED)
    ====================================== */

    if (key.includes("age")) {
      const age = Number(value);
      if (!age || age < 1 || age > 120) {
        await sendText(from, "❌ Invalid age. Please enter age between 1 and 120.");
        return true;
      }

      booking.passengers[passengerIndex].age = age;
      continue;
    }

    /* ======================================
       GENDER (VALIDATED)
    ====================================== */

    if (key.includes("gender")) {
      const g = value.toLowerCase();

      let gender = null;

      if (g.startsWith("m")) gender = "Male";
      else if (g.startsWith("f")) gender = "Female";
      else if (g.startsWith("o")) gender = "Other";

      if (!gender) {
        await sendText(from, "❌ Invalid gender. Use Male / Female / Other.");
        return true;
      }

      booking.passengers[passengerIndex].gender = gender;
      continue;
    }

    /* ======================================
       ROUTE
    ====================================== */

    if (key.includes("destination") || key === "to") {
      booking.to = value;
      continue;
    }

    if (key.includes("from")) {
      booking.from = value;
      continue;
    }

    /* ======================================
       DATE
    ====================================== */

    if (key.includes("date")) {
      booking.date = value;
      continue;
    }

    /* ======================================
       SEAT / BUDGET
    ====================================== */

    if (key.includes("seat")) {
      booking.seatType = { label: value };
      continue;
    }

    if (key.includes("budget")) {
      booking.budget = { label: value };
      continue;
    }
  }

  s.state = "BOOKING_REVIEW";

  await sendText(
    from,
    "✅ Booking updated successfully.\n\nHere is the revised summary:"
  );

  await sendText(from, buildBusSummary(booking));

  await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
    { id: "CONFIRM_BOOKING", title: get("CONFIRM_BOOKING") },
    { id: "EDIT_BOOKING", title: get("EDIT_BOOKING") },
  ]);

  return true;
}


  /* ======================================================
     INTERACTIVE HANDLING
  ====================================================== */

  if (msg.type === "interactive") {
    const id =
      msg.interactive?.button_reply?.id ||
      msg.interactive?.list_reply?.id;

    if (!id) {
      await sendOopsTapOptions(from);
      return true;
    }

    /* ===== EDIT ===== */
    if (id === "EDIT_BOOKING" && s.pendingBooking) {
      s.state = "BOOKING_EDIT";

      await sendText(
        from,
        "✏️ *Edit Booking*\n\n" +
        "Reply with the details you want to update.\n\n" +
        "Example:\n" +
        "Name: Jones\n" +
        "Destination: Bangalore\n\n" +
        "You can update:\n" +
        "• Name\n• Destination\n• From\n• Date\n• Seat Type\n• Budget\n\n" +
        "If you're confused, type *HELP*."
      );

      return true;
    }

    /* ===== CONFIRM ===== */
    if (id === "CONFIRM_BOOKING" && s.pendingBooking) {
      const booking = s.pendingBooking;
      const bookingId = generateReadableBookingId(booking.type);

      saveBooking({
        ...booking,
        id: bookingId,
        status: "SUBMITTED",
        createdAt: Date.now(),
      });

      s.pendingBooking = null;
      s.state = "IDLE";

      await sendText(
        from,
        `🎟 *Booking Request Submitted!*\n\n` +
        `🆔 Booking ID: *${bookingId}*\n\n` +
        "Our team will review your request shortly.\n\n" +
        "If you need help anytime, type *HELP*."
      );

      return true;
    }

    /* ===== CANCEL ===== */
    if (id === "CANCEL_BOOKING") {
      s.pendingBooking = null;
      s.state = "IDLE";

      await sendText(
        from,
        "❌ Booking cancelled.\n\nYou can type:\n• *BOOK AGAIN*\n• *HELP*"
      );

      return true;
    }

    await sendOopsTapOptions(from);
    return true;
  }

  /* ======================================================
     IDLE MENU
  ====================================================== */

  if (msg.type === "text" && s.state === "IDLE") {
    await sendList(
      from,
      `${get("WELCOME_TITLE")}\n${get("WELCOME_DESC")}`,
      get("MAIN"),
      [
        {
          title: get("MAIN"),
          rows: [
            { id: "MENU_BOOK", title: get("MENU_BOOK") },
            { id: "MENU_TRACK", title: get("MENU_TRACK") },
            { id: "MENU_HELP", title: get("MENU_HELP") },
            { id: "MENU_ABOUT", title: get("MENU_ABOUT") },
          ],
        },
      ]
    );
    return true;
  }

  /* ======================================================
     FINAL SAFETY NET (STUCK CASE)
  ====================================================== */

  if (msg.type === "text" && s.state && s.state !== "IDLE") {
    await sendText(
      from,
      "⚠️ I didn’t understand that.\n\n" +
      "You can type:\n" +
      "• *RETRY* – Refill current step\n" +
      "• *BOOK AGAIN* – Start over\n" +
      "• *HELP* – Get assistance"
    );
    return true;
  }

  return false;
};

/* ================= RETRY HANDLER ================= */

async function retryCurrentStep(ctx) {
  const step = ctx.session.state;

  switch (step) {
    case "ASK_SOURCE":
    case "ASK_DESTINATION":
    case "ASK_DATE":
      return bookingFlow(ctx);

    case "ASK_PASSENGERS":
      return passengerFlow(ctx);

    case "BOOKING_REVIEW":
      return summaryFlow(ctx);

    default:
      return sendText(
        ctx.from,
        "⚠️ Unable to retry this step.\n\nType *BOOK AGAIN* to start fresh."
      );
  }
}

/* ================= STATUS ================= */

async function sendStatus(ctx) {
  const { session: s, from } = ctx;

  if (s?.pendingBooking) {
    const b = s.pendingBooking;

    await sendText(
      from,
      `📌 *Booking in progress*\n\n` +
      `Type: ${b.type}\n` +
      `${b.from ? `From: ${b.from}\n` : ""}` +
      `${b.to ? `To: ${b.to}\n` : ""}` +
      `${b.date ? `Date: ${b.date}\n` : ""}` +
      `\nCurrent step: ${s.state}\n\n` +
      "You can type:\n• *RETRY*\n• *BOOK AGAIN*\n• *HELP*"
    );
    return;
  }

  const last = getLastBookingByUser?.(from);

  if (last) {
    await sendText(
      from,
      `📄 *Last Booking Status*\n\n` +
      `🆔 ${last.id}\n` +
      `Status: ${last.status}\n\n` +
      "Need help? Type *HELP*"
    );
    return;
  }

  await sendText(
    from,
    "ℹ️ No active booking found.\n\nType *BOOK AGAIN* to start a new booking."
  );
}

/* ================= SAFE TEXT ================= */

function getText(msg) {
  if (!msg) return null;
  if (typeof msg.text === "string") return msg.text.trim();
  if (msg.text?.body) return msg.text.body.trim();
  return null;
}
