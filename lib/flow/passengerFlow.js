// // lib/flow/passengerFlow.js

// const { sendText, sendButtons } = require("../waClient");
// const { parsePassengerLine } = require("../validators");
// const { nextBookingId } = require("../sessionStore");

// module.exports = async function passengerFlow(ctx) {
//   const { session: s, msg, interactiveType, interactiveId, from, get } = ctx;

//   // 🔒 Guard
//   if (!s || !s.pendingBooking) return false;

//   /* ==================================================
//    * HANDOFF ENTRY (from bookingFlow)
//    * ================================================== */
//   if (s.state === "BUS_PAX_START") {
//     s.pendingBooking.passengers = [];

//     // BULK MODE
//     if (s.pendingBooking.paxMode === "BULK") {
//       s.state = "BUS_PAX_BULK";
//       await sendText(
//         from,
//         get("FILL_PAX_BULK", {
//           total: s.pendingBooking.paxCount,
//         })
//       );
//       return true;
//     }

//     // ONE-BY-ONE MODE
//     if (s.pendingBooking.paxMode === "ONE_BY_ONE") {
//       s.state = "BUS_PAX_ONE_NAME";
//       s._paxIndex = 1;
//       await sendText(
//         from,
//         get("ENTER_NAME_PROMPT", {
//           i: s._paxIndex,
//           total: s.pendingBooking.paxCount,
//         })
//       );
//       return true;
//     }
//   }

//   /* ==================================================
//    * BULK MODE — IGNORE BUTTON CLICK (CRITICAL FIX)
//    * ================================================== */
//   if (s.state === "BUS_PAX_BULK" && msg.type === "interactive") {
//     // Button click already handled, wait for text input
//     return true;
//   }

//   /* ==================================================
//    * BULK MODE — TEXT INPUT
//    * ================================================== */
//   if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
//     const want = s.pendingBooking.paxCount;

//     const lines = msg.text.body
//       .split(/\n|,/)
//       .map((x) => x.trim())
//       .filter(Boolean);

//     const parsed = lines
//       .map(parsePassengerLine)
//       .filter(Boolean);

//     if (parsed.length !== want) {
//       await sendText(
//         from,
//         get("NEED_EXACT_PAX", {
//           want,
//           have: parsed.length,
//         })
//       );
//       return true;
//     }

//     s.pendingBooking.passengers = parsed;
//     s.state = "BUS_SUMMARY";
//     await showSummary(ctx);
//     return true;
//   }

//   /* ==================================================
//    * ONE-BY-ONE — NAME
//    * ================================================== */
//   if (s.state === "BUS_PAX_ONE_NAME" && msg.type === "text") {
//     s._tmpPassenger = {
//       name: msg.text.body.trim(),
//     };

//     s.state = "BUS_PAX_ONE_AGE";
//     await sendText(from, get("ENTER_AGE"));
//     return true;
//   }

//   /* ==================================================
//    * ONE-BY-ONE — AGE
//    * ================================================== */
//   if (s.state === "BUS_PAX_ONE_AGE" && msg.type === "text") {
//     const age = parseInt(msg.text.body.trim(), 10);

//     if (isNaN(age) || age <= 0) {
//       await sendText(from, get("INVALID_AGE"));
//       return true;
//     }

//     s._tmpPassenger.age = age;
//     s.state = "BUS_PAX_ONE_GENDER";

//     await sendButtons(from, get("PICK_GENDER"), [
//       { id: "G_M", title: get("G_M") },
//       { id: "G_F", title: get("G_F") },
//       { id: "G_O", title: get("G_O") },
//     ]);
//     return true;
//   }

//   /* ==================================================
//    * ONE-BY-ONE — GENDER
//    * ================================================== */
//   if (
//     s.state === "BUS_PAX_ONE_GENDER" &&
//     interactiveType === "button_reply"
//   ) {
//     const gender =
//       interactiveId === "G_M"
//         ? "M"
//         : interactiveId === "G_F"
//         ? "F"
//         : "O";

//     s.pendingBooking.passengers.push({
//       ...s._tmpPassenger,
//       gender,
//     });

//     s._tmpPassenger = null;
//     s._paxIndex++;

//     if (s.pendingBooking.passengers.length < s.pendingBooking.paxCount) {
//       s.state = "BUS_PAX_ONE_NAME";
//       await sendText(
//         from,
//         get("ENTER_NAME_PROMPT", {
//           i: s._paxIndex,
//           total: s.pendingBooking.paxCount,
//         })
//       );
//       return true;
//     }

//     s.state = "BUS_SUMMARY";
//     await showSummary(ctx);
//     return true;
//   }

//   /* ==================================================
//    * SUMMARY ACTIONS
//    * ================================================== */
//   if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
//     // Prevent double confirm
//     if (s.pendingBooking.status === "Booked") {
//       await sendText(from, get("ALREADY_CONFIRMED"));
//       return true;
//     }

//     if (interactiveId === "CONFIRM_BOOK") {
//       s.pendingBooking.id = nextBookingId();
//       s.pendingBooking.status = "Booked";

//       s.bookings.push({
//         ...s.pendingBooking,
//         createdAt: Date.now(),
//       });

//       await sendText(
//         from,
//         get("CONFIRMED_BOOKING", {
//           id: s.pendingBooking.id,
//         })
//       );

//       s.pendingBooking = null;
//       s.state = "IDLE";
//       return true;
//     }

//     if (interactiveId === "EDIT_BOOK") {
//       s.pendingBooking.passengers = [];
//       s.state = "BUS_TIME";
//       await sendText(from, get("EDIT_BOOK_PROMPT"));
//       return true;
//     }

//     if (interactiveId === "CANCEL_BOOK") {
//       s.pendingBooking = null;
//       s.state = "IDLE";
//       await sendText(from, get("CANCELLED"));
//       return true;
//     }
//   }

//   return false;
// };

// /* ==================================================
//  * SUMMARY VIEW
//  * ================================================== */
// async function showSummary(ctx) {
//   const { session: s, from, get } = ctx;
//   const b = s.pendingBooking;

//   const lines = [
//     get("REVIEW_REQUEST"),
//     `From: ${b.from}`,
//     `To: ${b.to}`,
//     `Date: ${b.date}`,
//     `Time: ${b.timePref}`,
//     `Passengers: ${b.paxCount}`,
//     `Seat: ${b.seatType}`,
//     `Budget: ${b.budget || "-"}`,
//     "",
//     "Passenger details:",
//     ...b.passengers.map(
//       (p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`
//     ),
//   ];

//   await sendText(from, lines.join("\n"));

//   await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
//     { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
//     { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
//     { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
//   ]);
// }


// lib/flow/passengerFlow.js

const { sendText, sendButtons } = require("../waClient");
const { parsePassengerLine } = require("../validators");
const { nextBookingId } = require("../sessionStore");

module.exports = async function passengerFlow(ctx) {
  const { session: s, msg, interactiveType, interactiveId, from, get } = ctx;

  if (!s || !s.pendingBooking) return false;

  /* ================= BULK INPUT ================= */
  if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
    const want = s.pendingBooking.paxCount;

    const parsed = msg.text.body
      .split(/\n|,/)
      .map(parsePassengerLine)
      .filter(Boolean);

    if (parsed.length !== want) {
      await sendText(from, get("NEED_EXACT_PAX", { want, have: parsed.length }));
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
    ]);
    return true;
  }

  if (s.state === "BUS_PAX_ONE_GENDER" && interactiveType === "button_reply") {
    s.pendingBooking.passengers.push({
      ...s._tmpPassenger,
      gender:
        interactiveId === "G_M" ? "M" :
        interactiveId === "G_F" ? "F" : "O",
    });

    s._tmpPassenger = null;

    if (s.pendingBooking.passengers.length < s.pendingBooking.paxCount) {
      s.state = "BUS_PAX_ONE_NAME";
      await sendText(
        from,
        get("ENTER_NAME_PROMPT", {
          i: s.pendingBooking.passengers.length + 1,
          total: s.pendingBooking.paxCount,
        })
      );
      return true;
    }

    s.state = "BUS_SUMMARY";
    await showSummary(ctx);
    return true;
  }

  /* ================= SUMMARY ================= */
  if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
    if (interactiveId === "CONFIRM_BOOK") {
      s.pendingBooking.id = nextBookingId();
      s.pendingBooking.status = "Booked";
      s.bookings.push({ ...s.pendingBooking, createdAt: Date.now() });

      await sendText(from, get("CONFIRMED_BOOKING", { id: s.pendingBooking.id }));
      s.pendingBooking = null;
      s.state = "IDLE";
      return true;
    }

    if (interactiveId === "EDIT_BOOK") {
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

  return false;
};

async function showSummary(ctx) {
  const { session: s, from, get } = ctx;
  const b = s.pendingBooking;

  const customerNumber =
    from ? `+${from.slice(0, 2)}XXXXXXXXXX` : "N/A";

  const bookingTime = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const lines = [
    "🧾 *BOOKING REVIEW*",
    "",
    `Booking ID: ${b.id || "DRAFT"}`,
    `Customer No: ${customerNumber}`,
    `Booking Date: ${bookingTime}`,
    "",
    "🚍 *Journey Details*",
    `From: ${b.from}`,
    `To: ${b.to}`,
    `Travel Date: ${b.date}`,
    `Preferred Time: ${b.timePref}`,
    `Seat Type: ${b.seatType}`,
    `Budget: ${b.budget || "-"}`,
    "",
    `👥 *Passengers (${b.paxCount})*`,
    ...b.passengers.map(
      (p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`
    ),
    "",
    "Please confirm to proceed with booking.",
  ];

  await sendText(from, lines.join("\n"));

  await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
    { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
    { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
    { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
  ]);
}


  await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
    { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
    { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
    { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
  ]);
}
