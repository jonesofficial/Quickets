// const { sendText, sendButtons } = require("../waClient");
// const { parsePassengerLine } = require("../validators");
// const { nextBookingId } = require("../sessionStore");

// // Payment helpers
// const { sendPaymentQR } = require("../payments/Razorpay_payments");
// const { sendCardPaymentLink } = require("../payments/Razorpay_Card");

// const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

// /* ======================================================
//  * Date helpers
//  * ====================================================== */
// function formatDate(d) {
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   return `${dd}-${mm}-${yyyy}`;
// }

// /* ======================================================
//  * Retry helper
//  * ====================================================== */
// async function resendPassengerPrompt(ctx) {
//   const { session: s, from, get } = ctx;

//   switch (s.state) {
//     case "BUS_PAX_BULK":
//       return sendText(from, get("FILL_PAX_BULK", { total: s.pendingBooking.paxCount }));

//     case "BUS_PAX_ONE_NAME":
//       return sendText(
//         from,
//         get("ENTER_NAME_PROMPT", {
//           i: s.pendingBooking.passengers.length + 1,
//           total: s.pendingBooking.paxCount,
//         })
//       );

//     case "BUS_PAX_ONE_AGE":
//       return sendText(from, get("ENTER_AGE"));

//     case "BUS_PAX_ONE_GENDER":
//       return sendButtons(from, get("PICK_GENDER"), [
//         { id: "G_M", title: get("G_M") },
//         { id: "G_F", title: get("G_F") },
//         { id: "G_O", title: get("G_O") },
//         HELP_BUTTON,
//       ]);

//     case "BUS_SUMMARY":
//       return showSummary(ctx);

//     case "PAYMENT_PENDING":
//       return sendButtons(from, "Payment options 👇", [
//         { id: "PAY_CARD", title: "Card / Net Banking" },
//         { id: "CANCEL_BOOK", title: "Cancel" },
//         HELP_BUTTON,
//       ]);

//     default:
//       return sendText(from, "⚠️ Nothing to retry.\nType *MENU* to start again.");
//   }
// }

// /* ======================================================
//  * MAIN FLOW
//  * ====================================================== */
// module.exports = async function passengerFlow(ctx) {
//   const { session: s, msg, interactiveType, interactiveId, from, get, text } = ctx;

//   try {
//     /* ================= GLOBAL ================= */

//     if (msg.type === "text" && text?.trim().toUpperCase() === "MENU") {
//       s.state = null;
//       s.pendingBooking = null;

//       await sendButtons(from, get("MAIN_MENU"), [
//         { id: "MENU_BOOK", title: get("MENU_BOOK") },
//         { id: "MENU_HELP", title: get("MENU_HELP") },
//       ]);
//       return true;
//     }

//     if (
//       (msg.type === "text" && text?.trim().toUpperCase() === "HELP") ||
//       interactiveId === "MENU_HELP"
//     ) {
//       await sendText(from, get("HELP_TEXT"));
//       return true;
//     }

//     if (msg.type === "text" && text?.trim().toUpperCase() === "RETRY") {
//       if (!s || !s.state) {
//         await sendText(from, "Nothing to retry.\nType *MENU* to start.");
//         return true;
//       }
//       await resendPassengerPrompt(ctx);
//       return true;
//     }

//     if (!s || !s.pendingBooking) return false;

//     /* ================= DATE PICKER ================= */

//     if (s.state === "BUS_DATE" && interactiveType === "button_reply") {
//       const d = new Date();

//       if (interactiveId === "DATE_TODAY") {
//         s.pendingBooking.date = formatDate(d);
//       }

//       if (interactiveId === "DATE_TOMORROW") {
//         d.setDate(d.getDate() + 1);
//         s.pendingBooking.date = formatDate(d);
//       }

//       if (interactiveId === "DATE_DAY_AFTER") {
//         d.setDate(d.getDate() + 2);
//         s.pendingBooking.date = formatDate(d);
//       }

//       if (interactiveId === "DATE_PICK_MANUAL") {
//         s.state = "BUS_DATE_MANUAL";
//         await sendText(
//           from,
//           "📅 Please type travel date in *DD-MM-YYYY* format\n(Future dates only)"
//         );
//         return true;
//       }

//       s.state = "BUS_TIME";
//       await sendText(from, `✅ Date selected: *${s.pendingBooking.date}*`);
//       return true;
//     }

//     if (s.state === "BUS_DATE_MANUAL" && msg.type === "text") {
//       const input = msg.text.body.trim();

//       if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) {
//         await sendText(from, "❌ Invalid format. Use *DD-MM-YYYY*");
//         return true;
//       }

//       const [dd, mm, yyyy] = input.split("-").map(Number);
//       const selected = new Date(yyyy, mm - 1, dd);
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       if (selected < today) {
//         await sendText(
//           from,
//           "❌ Past dates are not allowed.\nPlease enter a *future date*."
//         );
//         return true;
//       }

//       s.pendingBooking.date = input;
//       s.state = "BUS_TIME";
//       await sendText(from, `✅ Date selected: *${input}*`);
//       return true;
//     }

//     /* ================= BULK MODE ================= */

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
//             "\n\nType *RETRY* or *HELP*."
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
//         await sendText(from, get("INVALID_AGE"));
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
//         await resendPassengerPrompt(ctx);
//         return true;
//       }

//       s.state = "BUS_SUMMARY";
//       await showSummary(ctx);
//       return true;
//     }

//     /* ================= SUMMARY ================= */

//     if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
//       if (interactiveId === "CONFIRM_BOOK") {
//         if (!s.pendingBooking.id) s.pendingBooking.id = nextBookingId();

//         const BASE_PRICE = 500;
//         s.pendingBooking.amount = BASE_PRICE * s.pendingBooking.paxCount;
//         s.pendingBooking.status = "AWAITING_PAYMENT";

//         if (!Array.isArray(s.bookings)) s.bookings = [];
//         s.bookings.push({ ...s.pendingBooking, createdAt: Date.now() });

//         s.state = "PAYMENT_PENDING";
//         s.pendingBooking.paymentMethod = "UPI";

//         await sendText(
//           from,
//           "✅ *Booking confirmed*\n\n" +
//             "💳 *Payment Required*\n\n" +
//             "Scan the QR below to pay via UPI.\n\n" +
//             "👉 *Card / Net Banking available*\n" +
//             "Type *Card* to pay using Debit / Credit Card or Net Banking."
//         );

//         await sendPaymentQR(ctx);

//         await sendButtons(from, "Payment options 👇", [
//           { id: "PAY_CARD", title: "Card / Net Banking" },
//           { id: "CANCEL_BOOK", title: "Cancel" },
//           HELP_BUTTON,
//         ]);
//         return true;
//       }

//       if (interactiveId === "EDIT_BOOK") {
//         s.pendingBooking.passengers = [];
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

//     /* ================= PAYMENT ================= */

//     if (s.state === "PAYMENT_PENDING" && msg.type === "text") {
//       const t = text?.trim().toLowerCase();

//       if (t === "card" || t === "net banking" || t === "card / net banking") {
//         s.pendingBooking.paymentMethod = "CARD";
//         await sendText(from, "💳 *Card / Net Banking*\n\nOpening secure payment page...");
//         await sendCardPaymentLink(ctx);
//         return true;
//       }

//       if (t === "retry") {
//         await resendPassengerPrompt(ctx);
//         return true;
//       }
//     }

//     if (s.state === "PAYMENT_PENDING" && interactiveType === "button_reply") {
//       if (interactiveId === "PAY_CARD") {
//         s.pendingBooking.paymentMethod = "CARD";
//         await sendText(from, "💳 *Card / Net Banking*\n\nOpening secure payment page...");
//         await sendCardPaymentLink(ctx);
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

//     if (s?.state === "PAYMENT_PENDING") return true;

//     await sendText(from, "⚠️ Something went wrong.\n\nType *MENU* to restart safely.");
//     return true;
//   }
// };

// /* ======================================================
//  * SUMMARY VIEW
//  * ====================================================== */
// async function showSummary(ctx) {
//   const { session: s, from, get } = ctx;
//   const b = s.pendingBooking;

//   const lines = [
//     get("TICKET_REVIEW_TITLE"),
//     "",
//     `From: ${b.from}`,
//     `To: ${b.to}`,
//     `Date: ${b.date}`,
//     `Time: ${b.timePref}`,
//     `Seat: ${b.seatType}`,
//     `Budget: ${b.budget || "-"}`,
//     "",
//     get("TICKET_PASSENGERS", { count: b.paxCount }),
//     ...b.passengers.map((p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`),
//     "",
//     "Please confirm to continue.",
//   ];

//   await sendText(from, lines.join("\n"));

//   await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
//     { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
//     { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
//     { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
//     HELP_BUTTON,
//   ]);
// }

// lib/flow/passengerFlow.js
const { sendText } = require("../waClient");

module.exports = async function passengerFlow(ctx) {
  const {
    session: s,
    msg,
    interactiveType,
    interactiveId,
    from,
    get,
  } = ctx;

  if (!s || !s.pendingBooking) return false;

  /* ===============================
   * PASSENGER MODE SELECTION
   * =============================== */
  if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
    // Paste all at once
    if (interactiveId === "PAX_BULK") {
      s.pendingBooking.paxMode = "BULK";
      s.state = "BUS_PAX_BULK";

      await sendText(
        from,
        "✍️ *Enter passenger details*\n\n" +
          "Format:\n" +
          "Name, Age, Gender\n\n" +
          "Example:\n" +
          "Ravi, 28, M\n" +
          "Sita, 25, F"
      );
      return true;
    }

    // One by one
    if (interactiveId === "PAX_ONEBYONE") {
      s.pendingBooking.paxMode = "ONE_BY_ONE";
      s.state = "BUS_PAX_ONE_NAME";

      await sendText(from, "👤 Enter passenger 1 name:");
      return true;
    }
  }

  /* ===============================
   * BULK INPUT
   * =============================== */
  if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
    // You can enhance parsing later
    s.pendingBooking.passengers = msg.text.body.trim().split("\n");

    s.state = "BUS_SUMMARY";
    await sendText(from, "✅ Passenger details received.");
    return true;
  }

  /* ===============================
   * ONE BY ONE (START)
   * =============================== */
  if (s.state === "BUS_PAX_ONE_NAME" && msg.type === "text") {
    s.pendingBooking.passengers.push({
      name: msg.text.body.trim(),
    });

    s.state = "BUS_SUMMARY";
    await sendText(from, "✅ Passenger details saved.");
    return true;
  }

  return false;
};
