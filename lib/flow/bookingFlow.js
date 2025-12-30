// // lib/flow/bookingFlow.js

// const {
//   sendText,
//   sendButtons,
//   sendList,
//   sendOopsTapOptions,
// } = require("../waClient");

// const {
//   parseDateInput,
//   resolveCityAlias,
// } = require("../validators");

// /**
//  * Booking Flow
//  * -----------------------------
//  * Responsibility:
//  * - Collect booking preferences ONLY
//  * - No passenger detail parsing
//  * - Handoff cleanly to passengerFlow
//  */
// module.exports = async function bookingFlow(ctx) {
//   const {
//     session: s,
//     msg,
//     text,
//     interactiveType,
//     interactiveId,
//     from,
//     get,
//   } = ctx;

//   /* ==================================================
//    * ENTRY — MENU_BOOK
//    * ================================================== */
//   if (interactiveId === "MENU_BOOK") {
//     s.pendingBooking = {
//       id: null,
//       type: "BUS",

//       from: null,
//       to: null,
//       date: null,
//       timePref: null,

//       paxCount: null,
//       paxMode: null,

//       seatType: null,
//       budget: null,

//       passengers: [],
//       status: "DRAFT",
//       createdAt: Date.now(),
//     };

//     s.state = "BUS_FROM";
//     await sendText(from, get("ASK_FROM"));
//     return true;
//   }

//   /* ==================================================
//    * BUS_FROM
//    * ================================================== */
//   if (s.state === "BUS_FROM" && msg.type === "text") {
//     const candidate = text.trim();
//     const resolved = resolveCityAlias(candidate);

//     if (resolved.kind === "invalid") {
//       await sendText(from, get("CITY_NOT_UNDERSTOOD"));
//       return true;
//     }

//     if (resolved.kind === "alias") {
//       s.temp = { field: "from", value: resolved.canonical };
//       s.state = "BUS_FROM_CONFIRM";
//       await sendButtons(
//         from,
//         get("CONFIRM_FROM_PROMPT", {
//           canonical: resolved.canonical,
//           candidate,
//         }),
//         [
//           { id: "YES", title: "✅ Yes" },
//           { id: "NO", title: "❌ No" },
//         ]
//       );
//       return true;
//     }

//     s.pendingBooking.from = resolved.canonical || candidate;
//     s.state = "BUS_TO";
//     await sendText(from, get("ASK_TO"));
//     return true;
//   }

//   /* ==================================================
//    * BUS_FROM_CONFIRM
//    * ================================================== */
//   if (s.state === "BUS_FROM_CONFIRM" && interactiveType === "button_reply") {
//     if (interactiveId === "YES") {
//       s.pendingBooking.from = s.temp.value;
//       s.temp = null;
//       s.state = "BUS_TO";
//       await sendText(from, get("ASK_TO"));
//       return true;
//     }

//     if (interactiveId === "NO") {
//       s.temp = null;
//       s.state = "BUS_FROM";
//       await sendText(from, get("CITY_NOT_UNDERSTOOD"));
//       return true;
//     }
//   }

//   /* ==================================================
//    * BUS_TO
//    * ================================================== */
//   if (s.state === "BUS_TO" && msg.type === "text") {
//     const candidate = text.trim();
//     const resolved = resolveCityAlias(candidate);

//     if (resolved.kind === "invalid") {
//       await sendText(from, get("CITY_NOT_UNDERSTOOD"));
//       return true;
//     }

//     if (resolved.kind === "alias") {
//       s.temp = { field: "to", value: resolved.canonical };
//       s.state = "BUS_TO_CONFIRM";
//       await sendButtons(
//         from,
//         get("CONFIRM_TO_PROMPT", {
//           canonical: resolved.canonical,
//           candidate,
//         }),
//         [
//           { id: "YES", title: "✅ Yes" },
//           { id: "NO", title: "❌ No" },
//         ]
//       );
//       return true;
//     }

//     s.pendingBooking.to = resolved.canonical || candidate;
//     s.state = "BUS_DATE";
//     await sendText(from, get("ASK_DATE"));
//     return true;
//   }

//   /* ==================================================
//    * BUS_TO_CONFIRM
//    * ================================================== */
//   if (s.state === "BUS_TO_CONFIRM" && interactiveType === "button_reply") {
//     if (interactiveId === "YES") {
//       s.pendingBooking.to = s.temp.value;
//       s.temp = null;
//       s.state = "BUS_DATE";
//       await sendText(from, get("ASK_DATE"));
//       return true;
//     }

//     if (interactiveId === "NO") {
//       s.temp = null;
//       s.state = "BUS_TO";
//       await sendText(from, get("CITY_NOT_UNDERSTOOD"));
//       return true;
//     }
//   }

//   /* ==================================================
//    * BUS_DATE
//    * ================================================== */
//   if (s.state === "BUS_DATE" && msg.type === "text") {
//     const parsed = parseDateInput(text);

//     if (!parsed.ok) {
//       await sendText(from, get("INVALID_DATE"));
//       return true;
//     }

//     s.pendingBooking.date = parsed.dateStr;
//     s.state = "BUS_TIME";

//     await sendList(from, get("PICK_TIME_PREF"), "Select", [
//       {
//         title: "Time slots",
//         rows: [
//           { id: "TIME_MORNING", title: get("TIME_MORNING") },
//           { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
//           { id: "TIME_EVENING", title: get("TIME_EVENING") },
//           { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
//         ],
//       },
//     ]);
//     return true;
//   }

//   /* ==================================================
//    * BUS_TIME
//    * ================================================== */
//   if (s.state === "BUS_TIME") {
//     if (interactiveType !== "list_reply") {
//       await sendOopsTapOptions(from);
//       return true;
//     }

//     s.pendingBooking.timePref = get(interactiveId) || "Any";
//     s.state = "BUS_PAX_COUNT";

//     await sendList(from, get("HOW_MANY_PAX"), "Choose", [
//       {
//         title: "Passengers",
//         rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
//           id: `PAX_${n}`,
//           title: n,
//         })),
//       },
//     ]);
//     return true;
//   }

//   /* ==================================================
//    * BUS_PAX_COUNT
//    * ================================================== */
//   if (s.state === "BUS_PAX_COUNT") {
//     if (interactiveType !== "list_reply") {
//       await sendOopsTapOptions(from);
//       return true;
//     }

//     s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
//     s.state = "BUS_SEAT_TYPE";

//     await sendList(from, get("SEAT_TYPE_PROMPT"), "Pick type", [
//       {
//         title: "Type",
//         rows: [
//           { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
//           { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
//           { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
//           { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
//         ],
//       },
//     ]);
//     return true;
//   }

//   /* ==================================================
//    * BUS_SEAT_TYPE
//    * ================================================== */
//   if (s.state === "BUS_SEAT_TYPE") {
//     if (interactiveType !== "list_reply") {
//       await sendOopsTapOptions(from);
//       return true;
//     }

//     s.pendingBooking.seatType = get(interactiveId);
//     s.state = "BUS_BUDGET";

//     await sendList(from, get("BUDGET_PROMPT"), "Budget", [
//       {
//         title: "Budget options",
//         rows: [
//           "BUDGET_300U",
//           "BUDGET_500",
//           "BUDGET_700",
//           "BUDGET_1000",
//           "BUDGET_1500",
//           "BUDGET_2000PLUS",
//         ].map((id) => ({ id, title: get(id) })),
//       },
//     ]);
//     return true;
//   }

//   /* ==================================================
//    * BUS_BUDGET
//    * ================================================== */
//   if (s.state === "BUS_BUDGET") {
//     if (interactiveType !== "list_reply") {
//       await sendOopsTapOptions(from);
//       return true;
//     }

//     s.pendingBooking.budget = get(interactiveId);
//     s.state = "BUS_PAX_MODE";

//     await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
//       { id: "PAX_BULK", title: get("PAX_BULK") },
//       { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
//     ]);
//     return true;
//   }

//   /* ==================================================
//    * BUS_PAX_MODE → HANDOFF
//    * ================================================== */
//   if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
//     if (interactiveId === "PAX_BULK") {
//       s.pendingBooking.paxMode = "BULK";
//       s.state = "BUS_PAX_START";
//       return false;
//     }

//     if (interactiveId === "PAX_ONEBYONE") {
//       s.pendingBooking.paxMode = "ONE_BY_ONE";
//       s.state = "BUS_PAX_START";
//       return false;
//     }
//   }

//   return false;
// };

// // lib/flow/bookingFlow.js
// const {
//   sendText,
//   sendButtons,
//   sendList,
// } = require("../waClient");

// const {
//   parseDateInput,
//   resolveCityAlias,
// } = require("../validators");

// const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

// /* ======================================================
//  * Helper: resend current step (RETRY)
//  * ====================================================== */
// async function resendCurrentPrompt(ctx) {
//   const { session: s, from, get } = ctx;

//   switch (s.state) {
//     case "BUS_FROM":
//       return sendText(from, get("ASK_FROM"));

//     case "BUS_TO":
//       return sendText(from, get("ASK_TO"));

//     case "BUS_DATE":
//       return sendText(from, get("ASK_DATE"));

//     case "BUS_TIME":
//       return sendList(from, get("PICK_TIME_PREF"), "Select", [
//         {
//           title: "Time",
//           rows: [
//             { id: "TIME_MORNING", title: get("TIME_MORNING") },
//             { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
//             { id: "TIME_EVENING", title: get("TIME_EVENING") },
//             { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
//           ],
//         },
//         {
//           title: "Need help?",
//           rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
//         },
//       ]);

//     case "BUS_PAX_COUNT":
//       return sendList(from, get("HOW_MANY_PAX"), "Passengers", [
//         {
//           title: "Count",
//           rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
//             id: `PAX_${n}`,
//             title: n,
//           })),
//         },
//         {
//           title: "Need help?",
//           rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
//         },
//       ]);

//     case "BUS_SEAT_TYPE":
//       return sendList(from, get("SEAT_TYPE_PROMPT"), "Seat", [
//         {
//           title: "Seat",
//           rows: [
//             { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
//             { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
//             { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
//             { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
//           ],
//         },
//         {
//           title: "Need help?",
//           rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
//         },
//       ]);

//     case "BUS_BUDGET":
//       return sendList(from, get("BUDGET_PROMPT"), "Budget", [
//         {
//           title: "Budget",
//           rows: [
//             "BUDGET_300U",
//             "BUDGET_500",
//             "BUDGET_700",
//             "BUDGET_1000",
//             "BUDGET_1500",
//             "BUDGET_2000PLUS",
//           ].map((id) => ({ id, title: get(id) })),
//         },
//         {
//           title: "Need help?",
//           rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
//         },
//       ]);

//     case "BUS_PAX_MODE":
//       return sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
//         { id: "PAX_BULK", title: get("PAX_BULK") },
//         { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
//         HELP_BUTTON,
//       ]);

//     default:
//       return sendText(
//         from,
//         "⚠️ Unable to retry this step.\n\n" +
//           "• Type *RETRY* to try again\n" +
//           "• Type *MENU* to restart\n" +
//           "• Type *HELP* for assistance\n\n" +
//           "💬 Admin Support: 91xxxxxxxxxx"
//       );
//   }
// }

// module.exports = async function bookingFlow(ctx) {
//   const {
//     session: s,
//     msg,
//     text,
//     interactiveType,
//     interactiveId,
//     from,
//     get,
//   } = ctx;

//   try {
//     /* ==================================================
//      * GLOBAL COMMANDS
//      * ================================================== */

//     // MENU → reset
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
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     /* ==================================================
//      * ENTRY
//      * ================================================== */
//     if (interactiveId === "MENU_BOOK") {
//       s.pendingBooking = {
//         id: null,
//         type: "BUS",
//         from: null,
//         to: null,
//         date: null,
//         timePref: null,
//         paxCount: null,
//         paxMode: null,
//         seatType: null,
//         budget: null,
//         passengers: [],
//         status: "DRAFT",
//         createdAt: Date.now(),
//       };

//       s.state = "BUS_FROM";
//       await sendText(
//         from,
//         get("ASK_FROM") +
//           "\n\n🆘 Type *HELP* if you need assistance."
//       );
//       return true;
//     }

//     /* ==================================================
//      * SAFETY CHECK
//      * ================================================== */
//     if (!s || !s.state || !s.pendingBooking) return false;

//     /* ================= FROM ================= */
//     if (s.state === "BUS_FROM" && msg.type === "text") {
//       const resolved = resolveCityAlias(text.trim());
//       if (resolved.kind === "invalid") {
//         await sendText(
//           from,
//           get("CITY_NOT_UNDERSTOOD") +
//             "\n\n• Type *RETRY* to re-enter\n• Type *HELP* for help\n• Admin: 91xxxxxxxxxx"
//         );
//         return true;
//       }

//       s.pendingBooking.from = resolved.canonical || text.trim();
//       s.state = "BUS_TO";
//       await sendText(from, get("ASK_TO"));
//       return true;
//     }

//     /* ================= TO ================= */
//     if (s.state === "BUS_TO" && msg.type === "text") {
//       const resolved = resolveCityAlias(text.trim());
//       if (resolved.kind === "invalid") {
//         await sendText(
//           from,
//           get("CITY_NOT_UNDERSTOOD") +
//             "\n\n• Type *RETRY* to re-enter\n• Type *HELP* for help\n• Admin: 91xxxxxxxxxx"
//         );
//         return true;
//       }

//       s.pendingBooking.to = resolved.canonical || text.trim();
//       s.state = "BUS_DATE";
//       await sendText(from, get("ASK_DATE"));
//       return true;
//     }

//     /* ================= DATE ================= */
//     if (s.state === "BUS_DATE" && msg.type === "text") {
//       const parsed = parseDateInput(text);
//       if (!parsed.ok) {
//         await sendText(
//           from,
//           get("INVALID_DATE") +
//             "\n\n• Type *RETRY* to try again\n• Type *HELP* for help\n• Admin: 91xxxxxxxxxx"
//         );
//         return true;
//       }

//       s.pendingBooking.date = parsed.dateStr;
//       s.state = "BUS_TIME";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     /* ================= TIME ================= */
//     if (s.state === "BUS_TIME" && interactiveType === "list_reply") {
//       s.pendingBooking.timePref = get(interactiveId);
//       s.state = "BUS_PAX_COUNT";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     /* ================= PAX COUNT ================= */
//     if (s.state === "BUS_PAX_COUNT" && interactiveType === "list_reply") {
//       s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
//       s.state = "BUS_SEAT_TYPE";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     /* ================= SEAT ================= */
//     if (s.state === "BUS_SEAT_TYPE" && interactiveType === "list_reply") {
//       s.pendingBooking.seatType = get(interactiveId);
//       s.state = "BUS_BUDGET";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     /* ================= BUDGET ================= */
//     if (s.state === "BUS_BUDGET" && interactiveType === "list_reply") {
//       s.pendingBooking.budget = get(interactiveId);
//       s.state = "BUS_PAX_MODE";

//       await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
//         { id: "PAX_BULK", title: get("PAX_BULK") },
//         { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
//         HELP_BUTTON,
//       ]);
//       return true;
//     }

//     /* ================= PASSENGER MODE ================= */
//     if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
//       s.pendingBooking.passengers = [];

//       if (interactiveId === "PAX_BULK") {
//         s.pendingBooking.paxMode = "BULK";
//         s.state = "BUS_PAX_BULK";
//         await sendText(from, get("FILL_PAX_BULK", {
//           total: s.pendingBooking.paxCount,
//         }));
//         return true;
//       }

//       if (interactiveId === "PAX_ONEBYONE") {
//         s.pendingBooking.paxMode = "ONE_BY_ONE";
//         s.state = "BUS_PAX_ONE_NAME";
//         s._paxIndex = 1;

//         await sendText(
//           from,
//           get("ENTER_NAME_PROMPT", {
//             i: 1,
//             total: s.pendingBooking.paxCount,
//           })
//         );
//         return true;
//       }
//     }

//     return false;
//   } catch (err) {
//     console.error("❌ Booking Flow Error:", err);

//     await sendText(
//       from,
//       "⚠️ Something went wrong.\n\n" +
//         "• Type *RETRY* to try again\n" +
//         "• Type *MENU* to restart\n" +
//         "• Type *HELP* for help\n\n" +
//         "💬 Admin Support: 91xxxxxxxxxx"
//     );
//     return true;
//   }
// };

const {
  sendText,
  sendButtons,
  sendList,
} = require("../waClient");

const {
  resolveCityAlias,
} = require("../validators");

const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

/* ======================================================
 * Date helpers
 * ====================================================== */
function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/* ======================================================
 * RETRY helper
 * ====================================================== */
async function resendCurrentPrompt(ctx) {
  const { session: s, from, get } = ctx;

  switch (s.state) {
    case "BUS_FROM":
      return sendText(from, get("ASK_FROM"));

    case "BUS_TO":
      return sendText(from, get("ASK_TO"));

    case "BUS_DATE":
      return sendButtons(
        from,
        "📅 *Choose travel date*\n\n👉 You can also *type the date* (DD-MM-YYYY)",
        [
          { id: "DATE_TODAY", title: "Today" },
          { id: "DATE_TOMORROW", title: "Tomorrow" },
          { id: "DATE_DAY_AFTER", title: "Day After" },
          { id: "DATE_PICK_MANUAL", title: "Pick another date" },
        ]
      );

    case "BUS_TIME":
      return sendList(from, get("PICK_TIME_PREF"), "Select", [
        {
          title: "Time",
          rows: [
            { id: "TIME_MORNING", title: get("TIME_MORNING") },
            { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
            { id: "TIME_EVENING", title: get("TIME_EVENING") },
            { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
          ],
        },
        {
          title: "Need help?",
          rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
        },
      ]);

    case "BUS_PAX_COUNT":
      return sendList(from, get("HOW_MANY_PAX"), "Passengers", [
        {
          title: "Count",
          rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
            id: `PAX_${n}`,
            title: n,
          })),
        },
        {
          title: "Need help?",
          rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
        },
      ]);

    case "BUS_SEAT_TYPE":
      return sendList(from, get("SEAT_TYPE_PROMPT"), "Seat", [
        {
          title: "Seat",
          rows: [
            { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
            { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
            { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
            { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
          ],
        },
        {
          title: "Need help?",
          rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
        },
      ]);

    case "BUS_BUDGET":
      return sendList(from, get("BUDGET_PROMPT"), "Budget", [
        {
          title: "Budget",
          rows: [
            "BUDGET_300U",
            "BUDGET_500",
            "BUDGET_700",
            "BUDGET_1000",
            "BUDGET_1500",
            "BUDGET_2000PLUS",
          ].map((id) => ({ id, title: get(id) })),
        },
        {
          title: "Need help?",
          rows: [{ id: "MENU_HELP", title: "Help 🆘" }],
        },
      ]);

    case "BUS_PAX_MODE":
      return sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: get("PAX_BULK") },
        { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
        HELP_BUTTON,
      ]);

    default:
      return sendText(
        from,
        "⚠️ Unable to retry this step.\n\n" +
          "• Type *RETRY* to try again\n" +
          "• Type *MENU* to restart\n" +
          "• Type *HELP* for assistance"
      );
  }
}

/* ======================================================
 * MAIN BOOKING FLOW
 * ====================================================== */
module.exports = async function bookingFlow(ctx) {
  const {
    session: s,
    msg,
    text,
    interactiveType,
    interactiveId,
    from,
    get,
  } = ctx;

  try {
    /* ================= GLOBAL ================= */

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
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= ENTRY ================= */

    if (interactiveId === "MENU_BOOK") {
      s.pendingBooking = {
        id: null,
        type: "BUS",
        from: null,
        to: null,
        date: null,
        timePref: null,
        paxCount: null,
        paxMode: null,
        seatType: null,
        budget: null,
        passengers: [],
        status: "DRAFT",
        createdAt: Date.now(),
      };

      s.state = "BUS_FROM";
      await sendText(from, get("ASK_FROM"));
      return true;
    }

    if (!s || !s.state || !s.pendingBooking) return false;

    /* ================= FROM ================= */

    if (s.state === "BUS_FROM" && msg.type === "text") {
      const resolved = resolveCityAlias(text.trim());
      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }

      s.pendingBooking.from = resolved.canonical || text.trim();
      s.state = "BUS_TO";
      await sendText(from, get("ASK_TO"));
      return true;
    }

    /* ================= TO ================= */

    if (s.state === "BUS_TO" && msg.type === "text") {
      const resolved = resolveCityAlias(text.trim());
      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }

      s.pendingBooking.to = resolved.canonical || text.trim();
      s.state = "BUS_DATE";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= DATE (BUTTON) ================= */

    if (s.state === "BUS_DATE" && interactiveType === "button_reply") {
      const d = new Date();

      if (interactiveId === "DATE_TODAY") {
        s.pendingBooking.date = formatDate(d);
      }

      if (interactiveId === "DATE_TOMORROW") {
        d.setDate(d.getDate() + 1);
        s.pendingBooking.date = formatDate(d);
      }

      if (interactiveId === "DATE_DAY_AFTER") {
        d.setDate(d.getDate() + 2);
        s.pendingBooking.date = formatDate(d);
      }

      if (interactiveId === "DATE_PICK_MANUAL") {
        s.state = "BUS_DATE_MANUAL";
        await sendText(from, "📅 Type date in *DD-MM-YYYY* (future only)");
        return true;
      }

      s.state = "BUS_TIME";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= DATE (TEXT DIRECT) ================= */

    if (s.state === "BUS_DATE" && msg.type === "text") {
      s.state = "BUS_DATE_MANUAL";
    }

    /* ================= DATE (MANUAL) ================= */

    if (s.state === "BUS_DATE_MANUAL" && msg.type === "text") {
      const input = msg.text.body.trim();

      if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) {
        await sendText(from, "❌ Invalid format. Use *DD-MM-YYYY*");
        return true;
      }

      const [dd, mm, yyyy] = input.split("-").map(Number);
      const selected = new Date(yyyy, mm - 1, dd);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selected < today) {
        await sendText(from, "❌ Past dates are not allowed.");
        return true;
      }

      s.pendingBooking.date = input;
      s.state = "BUS_TIME";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= TIME / PAX / SEAT / BUDGET ================= */

    if (s.state === "BUS_TIME" && interactiveType === "list_reply") {
      s.pendingBooking.timePref = get(interactiveId);
      s.state = "BUS_PAX_COUNT";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_PAX_COUNT" && interactiveType === "list_reply") {
      s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
      s.state = "BUS_SEAT_TYPE";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_SEAT_TYPE" && interactiveType === "list_reply") {
      s.pendingBooking.seatType = get(interactiveId);
      s.state = "BUS_BUDGET";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_BUDGET" && interactiveType === "list_reply") {
      s.pendingBooking.budget = get(interactiveId);
      s.state = "BUS_PAX_MODE";

      await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: get("PAX_BULK") },
        { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
        HELP_BUTTON,
      ]);
      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ Booking Flow Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *MENU*.");
    return true;
  }
};
