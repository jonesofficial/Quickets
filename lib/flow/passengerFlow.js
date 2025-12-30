// const { sendText, sendButtons } = require("../waClient");
// const { parsePassengerLine } = require("../validators");
// const { nextBookingId } = require("../sessionStore");

// const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

// /* ======================================================
//  * Helper: Retry current passenger step
//  * ====================================================== */
// async function resendPassengerPrompt(ctx) {
//   const { session: s, from, get } = ctx;

//   switch (s.state) {
//     case "BUS_PAX_BULK":
//       await sendText(
//         from,
//         get("FILL_PAX_BULK", { total: s.pendingBooking.paxCount })
//       );
//       break;

//     case "BUS_PAX_ONE_NAME":
//       await sendText(
//         from,
//         get("ENTER_NAME_PROMPT", {
//           i: s.pendingBooking.passengers.length + 1,
//           total: s.pendingBooking.paxCount,
//         })
//       );
//       break;

//     case "BUS_PAX_ONE_AGE":
//       await sendText(from, get("ENTER_AGE"));
//       break;

//     case "BUS_PAX_ONE_GENDER":
//       await sendButtons(from, get("PICK_GENDER"), [
//         { id: "G_M", title: get("G_M") },
//         { id: "G_F", title: get("G_F") },
//         { id: "G_O", title: get("G_O") },
//         HELP_BUTTON,
//       ]);
//       break;

//     case "BUS_SUMMARY":
//       await showSummary(ctx);
//       break;

//     default:
//       await sendText(
//         from,
//         "Nothing to retry here.\nType *MENU* to start again."
//       );
//   }
// }

// module.exports = async function passengerFlow(ctx) {
//   const {
//     session: s,
//     msg,
//     interactiveType,
//     interactiveId,
//     from,
//     get,
//     text,
//   } = ctx;

//   try {
//     /* ==================================================
//      * GLOBAL COMMANDS
//      * ================================================== */

//     // MENU → reset everything
//     if (msg.type === "text" && text?.trim().toUpperCase() === "MENU") {
//       s.state = null;
//       s.pendingBooking = null;

//       await sendButtons(from, get("MAIN_MENU"), [
//         { id: "MENU_BOOK", title: get("MENU_BOOK") },
//         { id: "MENU_HELP", title: get("MENU_HELP") },
//       ]);
//       return true;
//     }

//     // HELP (text or button)
//     if (
//       (msg.type === "text" && text?.trim().toUpperCase() === "HELP") ||
//       interactiveId === "MENU_HELP"
//     ) {
//       await sendText(from, get("HELP_TEXT"));
//       return true;
//     }

//     // RETRY
//     if (msg.type === "text" && text?.trim().toUpperCase() === "RETRY") {
//       if (!s || !s.state) {
//         await sendText(
//           from,
//           "Nothing to retry.\nType *MENU* to start a new booking."
//         );
//         return true;
//       }

//       await resendPassengerPrompt(ctx);
//       return true;
//     }

//     /* ==================================================
//      * SAFETY CHECK
//      * ================================================== */
//     if (!s || !s.pendingBooking) return false;

//     /* ================= BULK INPUT ================= */
//     if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
//       const want = s.pendingBooking.paxCount;

//       const parsed = msg.text.body
//         .split(/\n|,/)
//         .map(parsePassengerLine)
//         .filter(Boolean);

//       if (parsed.length !== want) {
//         await sendText(
//           from,
//           get("NEED_EXACT_PAX", { want, have: parsed.length }) +
//             "\n\nType *RETRY* to try again or *HELP* for assistance."
//         );
//         return true;
//       }

//       s.pendingBooking.passengers = parsed;
//       s.state = "BUS_SUMMARY";
//       await showSummary(ctx);
//       return true;
//     }

//     /* ================= ONE BY ONE ================= */
//     if (s.state === "BUS_PAX_ONE_NAME" && msg.type === "text") {
//       s._tmpPassenger = { name: msg.text.body.trim() };
//       s.state = "BUS_PAX_ONE_AGE";
//       await sendText(from, get("ENTER_AGE"));
//       return true;
//     }

//     if (s.state === "BUS_PAX_ONE_AGE" && msg.type === "text") {
//       const age = Number(msg.text.body.trim());
//       if (!age) {
//         await sendText(
//           from,
//           get("INVALID_AGE") +
//             "\n\nType *RETRY* to re-enter or *HELP* for help."
//         );
//         return true;
//       }

//       s._tmpPassenger.age = age;
//       s.state = "BUS_PAX_ONE_GENDER";

//       await sendButtons(from, get("PICK_GENDER"), [
//         { id: "G_M", title: get("G_M") },
//         { id: "G_F", title: get("G_F") },
//         { id: "G_O", title: get("G_O") },
//         HELP_BUTTON,
//       ]);
//       return true;
//     }

//     if (s.state === "BUS_PAX_ONE_GENDER" && interactiveType === "button_reply") {
//       s.pendingBooking.passengers.push({
//         ...s._tmpPassenger,
//         gender:
//           interactiveId === "G_M"
//             ? "M"
//             : interactiveId === "G_F"
//             ? "F"
//             : "O",
//       });

//       s._tmpPassenger = null;

//       if (s.pendingBooking.passengers.length < s.pendingBooking.paxCount) {
//         s.state = "BUS_PAX_ONE_NAME";
//         await sendText(
//           from,
//           get("ENTER_NAME_PROMPT", {
//             i: s.pendingBooking.passengers.length + 1,
//             total: s.pendingBooking.paxCount,
//           })
//         );
//         return true;
//       }

//       s.state = "BUS_SUMMARY";
//       await showSummary(ctx);
//       return true;
//     }

//     /* ================= SUMMARY ACTIONS ================= */
//     if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
//       if (interactiveId === "CONFIRM_BOOK") {
//         s.pendingBooking.id = nextBookingId();
//         s.pendingBooking.status = "Booked";

//         const b = s.pendingBooking;
//         s.bookings.push({ ...b, createdAt: Date.now() });

//         const bookedAt = new Date().toLocaleString("en-IN", {
//           dateStyle: "medium",
//           timeStyle: "short",
//         });

//         const ticketLines = [
//           get("TICKET_CONFIRMED_TITLE"),
//           "",
//           "━━━━━━━━━━━━━━━━━━",
//           `🆔 Booking ID: ${b.id}`,
//           `📱 Customer No: ${from}`,
//           `📅 Booked On: ${bookedAt}`,
//           "━━━━━━━━━━━━━━━━━━",
//           "",
//           get("TICKET_JOURNEY"),
//           `From: ${b.from}`,
//           `To: ${b.to}`,
//           `Travel Date: ${b.date}`,
//           `Preferred Time: ${b.timePref}`,
//           "",
//           `💺 Seat Type: ${b.seatType}`,
//           `💰 Budget: ${b.budget || "-"}`,
//           "",
//           "━━━━━━━━━━━━━━━━━━",
//           get("TICKET_PASSENGERS", { count: b.paxCount }),
//           ...b.passengers.map(
//             (p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`
//           ),
//           "━━━━━━━━━━━━━━━━━━",
//           "",
//           get("TICKET_NEXT_STEPS"),
//           "• We will process your booking shortly",
//           "• You will receive updates here",
//           "• Keep Booking ID for reference",
//           "",
//           get("TICKET_THANKS"),
//         ];

//         await sendText(from, ticketLines.join("\n"));

//         s.pendingBooking = null;
//         s.state = "IDLE";
//         return true;
//       }

//       if (interactiveId === "EDIT_BOOK") {
//         s.state = "BUS_TIME";
//         await sendText(from, get("EDIT_BOOK_PROMPT"));
//         return true;
//       }

//       if (interactiveId === "CANCEL_BOOK") {
//         s.pendingBooking = null;
//         s.state = "IDLE";
//         await sendText(from, get("CANCELLED"));
//         return true;
//       }
//     }

//     return false;
//   } catch (err) {
//     console.error("❌ Passenger Flow Error:", err);

//     await sendText(
//       from,
//       "⚠️ Something went wrong.\n\nType *MENU* to restart your booking safely."
//     );
//     return true;
//   }
// };

// /* ======================================================
//  * REVIEW MESSAGE
//  * ====================================================== */
// async function showSummary(ctx) {
//   const { session: s, from, get } = ctx;
//   const b = s.pendingBooking;

//   const bookingTime = new Date().toLocaleString("en-IN", {
//     dateStyle: "medium",
//     timeStyle: "short",
//   });

//   const lines = [
//     get("TICKET_REVIEW_TITLE"),
//     "",
//     `Booking ID: ${b.id || "DRAFT"}`,
//     `Customer No: ${from}`,
//     `Booking Date: ${bookingTime}`,
//     "",
//     get("TICKET_JOURNEY"),
//     `From: ${b.from}`,
//     `To: ${b.to}`,
//     `Travel Date: ${b.date}`,
//     `Preferred Time: ${b.timePref}`,
//     `Seat Type: ${b.seatType}`,
//     `Budget: ${b.budget || "-"}`,
//     "",
//     get("TICKET_PASSENGERS", { count: b.paxCount }),
//     ...b.passengers.map(
//       (p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`
//     ),
//     "",
//     "Please confirm to proceed.",
//   ];

//   await sendText(from, lines.join("\n"));

//   await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
//     { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
//     { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
//     { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
//     HELP_BUTTON,
//   ]);
// }

const { sendText, sendButtons } = require("../waClient");
const { parsePassengerLine } = require("../validators");
const { nextBookingId } = require("../sessionStore");

// Payment helpers
const { sendPaymentQR } = require("../payments/Razorpay_payments");
const { sendCardPaymentLink } = require("../payments/Razorpay_Card");

const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

/* ======================================================
 * Retry helper
 * ====================================================== */
async function resendPassengerPrompt(ctx) {
  const { session: s, from, get } = ctx;

  switch (s.state) {
    case "BUS_PAX_BULK":
      return sendText(from, get("FILL_PAX_BULK", { total: s.pendingBooking.paxCount }));

    case "BUS_PAX_ONE_NAME":
      return sendText(
        from,
        get("ENTER_NAME_PROMPT", {
          i: s.pendingBooking.passengers.length + 1,
          total: s.pendingBooking.paxCount,
        })
      );

    case "BUS_PAX_ONE_AGE":
      return sendText(from, get("ENTER_AGE"));

    case "BUS_PAX_ONE_GENDER":
      return sendButtons(from, get("PICK_GENDER"), [
        { id: "G_M", title: get("G_M") },
        { id: "G_F", title: get("G_F") },
        { id: "G_O", title: get("G_O") },
        HELP_BUTTON,
      ]);

    case "BUS_SUMMARY":
      return showSummary(ctx);

    case "PAYMENT_PENDING":
      return sendText(
        from,
        "💳 *Payment Pending*\n\nScan the QR sent above to pay.\nYou may also tap *Card / Net Banking* below."
      );

    default:
      return sendText(from, "⚠️ Nothing to retry.\nType *MENU* to start again.");
  }
}

/* ======================================================
 * MAIN FLOW
 * ====================================================== */
module.exports = async function passengerFlow(ctx) {
  const { session: s, msg, interactiveType, interactiveId, from, get, text } = ctx;

  try {
    /* ================= GLOBAL COMMANDS ================= */

    if (msg.type === "text" && text?.trim().toUpperCase() === "MENU") {
      s.state = null;
      s.pendingBooking = null;

      await sendButtons(from, get("MAIN_MENU"), [
        { id: "MENU_BOOK", title: get("MENU_BOOK") },
        { id: "MENU_HELP", title: get("MENU_HELP") },
      ]);
      return true;
    }

    if (
      (msg.type === "text" && text?.trim().toUpperCase() === "HELP") ||
      interactiveId === "MENU_HELP"
    ) {
      await sendText(from, get("HELP_TEXT"));
      return true;
    }

    if (msg.type === "text" && text?.trim().toUpperCase() === "RETRY") {
      if (!s || !s.state) {
        await sendText(from, "Nothing to retry.\nType *MENU* to start.");
        return true;
      }
      await resendPassengerPrompt(ctx);
      return true;
    }

    /* ================= GUARD ================= */
    if (!s || !s.pendingBooking) return false;

    /* ================= BULK MODE ================= */
    if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
      const want = s.pendingBooking.paxCount;

      const parsed = msg.text.body
        .split(/\n|,/)
        .map(parsePassengerLine)
        .filter(Boolean);

      if (parsed.length !== want) {
        await sendText(
          from,
          get("NEED_EXACT_PAX", { want, have: parsed.length }) +
            "\n\nType *RETRY* or *HELP*."
        );
        return true;
      }

      s.pendingBooking.passengers = parsed;
      s.state = "BUS_SUMMARY";
      await showSummary(ctx);
      return true;
    }

    /* ================= ONE BY ONE ================= */
    if (s.state === "BUS_PAX_ONE_NAME" && msg.type === "text") {
      s._tmpPassenger = { name: msg.text.body.trim() };
      s.state = "BUS_PAX_ONE_AGE";
      await sendText(from, get("ENTER_AGE"));
      return true;
    }

    if (s.state === "BUS_PAX_ONE_AGE" && msg.type === "text") {
      const age = Number(msg.text.body.trim());
      if (!age) {
        await sendText(from, get("INVALID_AGE"));
        return true;
      }

      s._tmpPassenger.age = age;
      s.state = "BUS_PAX_ONE_GENDER";

      await sendButtons(from, get("PICK_GENDER"), [
        { id: "G_M", title: get("G_M") },
        { id: "G_F", title: get("G_F") },
        { id: "G_O", title: get("G_O") },
        HELP_BUTTON,
      ]);
      return true;
    }

    if (s.state === "BUS_PAX_ONE_GENDER" && interactiveType === "button_reply") {
      s.pendingBooking.passengers.push({
        ...s._tmpPassenger,
        gender: interactiveId === "G_M" ? "M" : interactiveId === "G_F" ? "F" : "O",
      });

      s._tmpPassenger = null;

      if (s.pendingBooking.passengers.length < s.pendingBooking.paxCount) {
        s.state = "BUS_PAX_ONE_NAME";
        await resendPassengerPrompt(ctx);
        return true;
      }

      s.state = "BUS_SUMMARY";
      await showSummary(ctx);
      return true;
    }

    /* ================= SUMMARY ================= */
    if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
      if (interactiveId === "CONFIRM_BOOK") {
        if (!s.pendingBooking.id) {
          s.pendingBooking.id = nextBookingId();
        }

        const BASE_PRICE = 500;
        s.pendingBooking.amount = BASE_PRICE * s.pendingBooking.paxCount;
        s.pendingBooking.status = "AWAITING_PAYMENT";

        if (!Array.isArray(s.bookings)) s.bookings = [];
        s.bookings.push({ ...s.pendingBooking, createdAt: Date.now() });

        s.state = "PAYMENT_PENDING";
        s.pendingBooking.paymentMethod = "UPI";

        await sendText(
          from,
          "✅ *Booking confirmed*\n\n💳 *Payment Required*\n\nScan the QR below to pay via UPI.\nCard / Net Banking is also supported."
        );

        await sendPaymentQR(ctx);

        await sendButtons(from, "Other options 👇", [
          { id: "PAY_CARD", title: "Card / Net Banking" },
          { id: "CANCEL_BOOK", title: "Cancel" },
          HELP_BUTTON,
        ]);
        return true;
      }

      if (interactiveId === "EDIT_BOOK") {
        s.pendingBooking.passengers = [];
        s.state = "BUS_TIME";
        await sendText(from, get("EDIT_BOOK_PROMPT"));
        return true;
      }

      if (interactiveId === "CANCEL_BOOK") {
        s.pendingBooking = null;
        s.state = "IDLE";
        await sendText(from, get("CANCELLED"));
        return true;
      }
    }

    /* ================= PAYMENT (TEXT FALLBACK) ================= */
    if (s.state === "PAYMENT_PENDING" && msg.type === "text") {
      const t = text?.trim().toLowerCase();

      if (t === "card" || t === "net banking" || t === "card / net banking") {
        s.pendingBooking.paymentMethod = "CARD";

        await sendText(from, "💳 *Card / Net Banking*\n\nOpening secure payment page...");
        await sendCardPaymentLink(ctx);
        return true;
      }

      if (t === "retry") {
        await resendPassengerPrompt(ctx);
        return true;
      }
    }

    /* ================= PAYMENT (BUTTON) ================= */
    if (s.state === "PAYMENT_PENDING" && interactiveType === "button_reply") {
      if (interactiveId === "PAY_CARD") {
        s.pendingBooking.paymentMethod = "CARD";

        await sendText(from, "💳 *Card / Net Banking*\n\nOpening secure payment page...");
        await sendCardPaymentLink(ctx);
        return true;
      }

      if (interactiveId === "CANCEL_BOOK") {
        s.pendingBooking = null;
        s.state = "IDLE";
        await sendText(from, get("CANCELLED"));
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error("❌ Passenger Flow Error:", err);
    await sendText(from, "⚠️ Something went wrong.\n\nType *MENU* to restart safely.");
    return true;
  }
};

/* ======================================================
 * SUMMARY VIEW
 * ====================================================== */
async function showSummary(ctx) {
  const { session: s, from, get } = ctx;
  const b = s.pendingBooking;

  const lines = [
    get("TICKET_REVIEW_TITLE"),
    "",
    `From: ${b.from}`,
    `To: ${b.to}`,
    `Date: ${b.date}`,
    `Time: ${b.timePref}`,
    `Seat: ${b.seatType}`,
    `Budget: ${b.budget || "-"}`,
    "",
    get("TICKET_PASSENGERS", { count: b.paxCount }),
    ...b.passengers.map((p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`),
    "",
    "Please confirm to continue.",
  ];

  await sendText(from, lines.join("\n"));

  await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
    { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
    { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
    { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
    HELP_BUTTON,
  ]);
}
