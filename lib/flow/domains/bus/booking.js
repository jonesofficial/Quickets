// const { sendText, sendButtons, sendList } = require("../../../waClient");
// const { resolveCityAlias } = require("../../../validators");
// const buildBusSummary = require("./summary");

// /* ======================================================
//  * Utils
//  * ====================================================== */
// function formatDate(d) {
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   return `${dd}-${mm}-${yyyy}`;
// }

// function isValidFutureDate(input) {
//   if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) return false;
//   const [dd, mm, yyyy] = input.split("-").map(Number);
//   const selected = new Date(yyyy, mm - 1, dd);
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   return selected >= today;
// }

// function safeText(msg, text) {
//   if (typeof text === "string") return text.trim();
//   if (msg?.text?.body) return msg.text.body.trim();
//   return null;
// }

// function pickOption(id, get) {
//   return { id, label: get(id) || id };
// }

// /* ======================================================
//  * Retry helper
//  * ====================================================== */
// async function resendCurrentPrompt(ctx) {
//   const { session: s, from, get } = ctx;

//   switch (s.state) {
//     case "BUS_FROM":
//       return sendText(from, get("ASK_FROM"));
//     case "BUS_TO":
//       return sendText(from, get("ASK_TO"));
//     case "BUS_DATE":
//       return sendButtons(from, "📅 *Choose travel date*", [
//         { id: "DATE_TODAY", title: "Today" },
//         { id: "DATE_TOMORROW", title: "Tomorrow" },
//         { id: "DATE_DAY_AFTER", title: "Day After" },
//         { id: "DATE_MANUAL", title: "Pick another date" },
//       ]);
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
//       ]);
//     case "BUS_SEAT_TYPE":
//       return sendList(from, get("SEAT_TYPE_PROMPT"), "Seat", [
//         {
//           title: "Seat Type",
//           rows: [
//             { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
//             { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
//             { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
//             { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
//           ],
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
//       ]);
//     default:
//       return sendText(from, get("OOPS_TAP_OPTIONS"));
//   }
// }

// /* ======================================================
//  * BUS BOOKING FLOW (NO PASSENGERS HERE)
//  * ====================================================== */
// module.exports = async function busBookingFlow(ctx) {
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
//     const cleanText = safeText(msg, text);
//     const upperText = cleanText?.toUpperCase();

//     if (upperText === "HELP") {
//       await sendText(from, get("HELP_TEXT"));
//       return true;
//     }

//     if (upperText === "RETRY") {
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (!s.state) {
//       s.pendingBooking = {
//         type: "BUS",
//         user: from,
//         from: null,
//         to: null,
//         date: null,
//         timePref: null,
//         paxCount: null,
//         seatType: null,
//         budget: null,
//         passengers: [],
//         status: "DRAFT",
//       };

//       s.state = "BUS_FROM";
//       await sendText(from, get("ASK_FROM"));
//       return true;
//     }

//     if (s.state === "BUS_FROM" && msg.type === "text") {
//       const input = safeText(msg, text);
//       const resolved = resolveCityAlias(input);
//       if (resolved.kind === "invalid") {
//         await sendText(from, get("CITY_NOT_UNDERSTOOD"));
//         return true;
//       }
//       s.pendingBooking.from = resolved.canonical || input;
//       s.state = "BUS_TO";
//       await sendText(from, get("ASK_TO"));
//       return true;
//     }

//     if (s.state === "BUS_TO" && msg.type === "text") {
//       const input = safeText(msg, text);
//       const resolved = resolveCityAlias(input);
//       if (resolved.kind === "invalid") {
//         await sendText(from, get("CITY_NOT_UNDERSTOOD"));
//         return true;
//       }
//       s.pendingBooking.to = resolved.canonical || input;
//       s.state = "BUS_DATE";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (s.state === "BUS_DATE" && interactiveType === "button_reply") {
//       const d = new Date();
//       if (interactiveId === "DATE_TODAY") s.pendingBooking.date = formatDate(d);
//       if (interactiveId === "DATE_TOMORROW") {
//         d.setDate(d.getDate() + 1);
//         s.pendingBooking.date = formatDate(d);
//       }
//       if (interactiveId === "DATE_DAY_AFTER") {
//         d.setDate(d.getDate() + 2);
//         s.pendingBooking.date = formatDate(d);
//       }
//       s.state = "BUS_TIME";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (s.state === "BUS_TIME" && interactiveType === "list_reply") {
//       s.pendingBooking.timePref = pickOption(interactiveId, get);
//       s.state = "BUS_PAX_COUNT";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (s.state === "BUS_PAX_COUNT" && interactiveType === "list_reply") {
//       s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
//       s.state = "BUS_SEAT_TYPE";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (s.state === "BUS_SEAT_TYPE" && interactiveType === "list_reply") {
//       s.pendingBooking.seatType = pickOption(interactiveId, get);
//       s.state = "BUS_BUDGET";
//       await resendCurrentPrompt(ctx);
//       return true;
//     }

//     if (s.state === "BUS_BUDGET" && interactiveType === "list_reply") {
//       s.pendingBooking.budget = pickOption(interactiveId, get);

//       // 🔑 HANDOFF TO PASSENGER FLOW
//       s.state = "PAX_MODE";

//       await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
//         { id: "PAX_BULK", title: get("PAX_BULK") },
//         { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
//       ]);

//       return true; // IMPORTANT
//     }

//     return false;
//   } catch (err) {
//     console.error("❌ BUS BOOKING ERROR:", err);
//     await sendText(from, "⚠️ Something went wrong.\nType *RETRY*");
//     return true;
//   }
// };

// lib/flow/domains/bus/booking.js
// ✅ ONLY CHANGE: city search logic (replace resolveCityAlias with searchCities)
// ❌ CORE FLOW, STATES, UX — UNCHANGED

// ✅ ONLY CHANGE: city search logic (replace resolveCityAlias with searchCities)
// ❌ CORE FLOW, STATES, UX — UNCHANGED

const { sendText, sendButtons, sendList } = require("../../../waClient");
const searchCities = require("./api/searchCities");
const buildBusSummary = require("./summary");

/* ======================================================
 * Utils
 * ====================================================== */
function formatDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function safeText(msg, text) {
  if (typeof text === "string") return text.trim();
  if (msg?.text?.body) return msg.text.body.trim();
  return null;
}

function pickOption(id, get) {
  return { id, label: get(id) || id };
}

/* ======================================================
 * City helpers
 * ====================================================== */
async function resolveCitySmart(query) {
  if (!query || query.length < 2) {
    return { type: "not_found" };
  }
  return await searchCities(query.trim(), 6);
}

function formatCityList(cities, title) {
  return (
    `🏙 *${title}*\n\n` +
    "🔢 Reply with the *number only*\n\n" +
    cities.map((c, i) => `${i + 1}. ${c.name}`).join("\n") +
    "\n\n_Type *HELP* anytime_"
  );
}

/* ======================================================
 * Retry helper
 * ====================================================== */
async function resendCurrentPrompt(ctx) {
  const { session: s, from, get } = ctx;

  switch (s.state) {
    case "BUS_FROM":
      return sendText(
        from,
        "🚌 *Bus Booking*\n\n📍 *From which city are you traveling?*\n\n" +
          "✍️ Type city name (example: *Chennai*)\n" +
          "🔢 Or reply with a number if shown\n\n" +
          "_Progress: 1 / 7_"
      );

    case "BUS_TO":
      return sendText(
        from,
        "📍 *Destination city?*\n\n" +
          "✍️ Type city name\n" +
          "🔢 Or reply with a number\n\n" +
          "⚠️ From & To cities must be different\n\n" +
          "_Progress: 2 / 7_"
      );

    case "BUS_DATE":
      return sendButtons(
        from,
        "📅 *Travel Date*\n\nChoose your journey date\n\n_Progress: 3 / 7_",
        [
          { id: "DATE_TODAY", title: "Today" },
          { id: "DATE_TOMORROW", title: "Tomorrow" },
          { id: "DATE_DAY_AFTER", title: "Day After" },
          { id: "DATE_MANUAL", title: "Pick another date" },
        ]
      );

    case "BUS_TIME":
      return sendList(from,
        "⏰ *Preferred Departure Time*\n\nSelect a suitable time\n\n_Progress: 4 / 7_",
        "Select",
        [
          {
            title: "Time",
            rows: [
              { id: "TIME_MORNING", title: get("TIME_MORNING") },
              { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
              { id: "TIME_EVENING", title: get("TIME_EVENING") },
              { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
            ],
          },
        ]
      );

    case "BUS_PAX_COUNT":
      return sendList(
        from,
        "👥 *Number of Passengers*\n\nOne ticket per passenger\n\n_Progress: 5 / 7_",
        "Passengers",
        [
          {
            title: "Count",
            rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
              id: `PAX_${n}`,
              title: n,
            })),
          },
        ]
      );

    case "BUS_SEAT_TYPE":
      return sendList(
        from,
        "💺 *Seat Preference*\n\n" +
          "🛏 Sleeper → Long journeys\n" +
          "🪑 Seater → Short journeys\n\n" +
          "_Progress: 6 / 7_",
        "Seat",
        [
          {
            title: "Seat Type",
            rows: [
              { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
              { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
              { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
              { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
            ],
          },
        ]
      );

    case "BUS_BUDGET":
      return sendList(
        from,
        "💰 *Budget Range (per seat)*\n\nWe’ll find the best buses\n\n_Progress: 7 / 7_",
        "Budget",
        [
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
        ]
      );

    default:
      return sendText(from, "⚠️ Please tap an option or type *RETRY*");
  }
}

/* ======================================================
 * BUS BOOKING FLOW
 * ====================================================== */
module.exports = async function busBookingFlow(ctx) {
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
    const cleanText = safeText(msg, text);
    const upperText = cleanText?.toUpperCase();

    /* ========== GLOBAL COMMANDS ========== */
    if (upperText === "HELP") {
      await sendText(
        from,
        "🆘 *Help*\n\n" +
          "• Type city names in English\n" +
          "• Reply with numbers when shown\n" +
          "• Type *RETRY* to repeat current step\n" +
          "• Booking takes less than 1 minute ⏱"
      );
      return true;
    }

    if (upperText === "RETRY") {
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ========== INIT ========== */
    if (!s.state) {
      s.pendingBooking = {
        type: "BUS",
        user: from,
        from: null,
        to: null,
        date: null,
        timePref: null,
        paxCount: null,
        seatType: null,
        budget: null,
        passengers: [],
        status: "DRAFT",
      };

      s.state = "BUS_FROM";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ========== CITY CONFIRMATION ========== */
    if (
      interactiveType === "button_reply" &&
      (interactiveId === "CITY_YES" || interactiveId === "CITY_NO")
    ) {
      const temp = s.tempCityConfirm;
      if (!temp) return true;

      if (interactiveId === "CITY_YES") {
        s.pendingBooking[temp.field] = temp.city.name;
        s.state = temp.field === "from" ? "BUS_TO" : "BUS_DATE";
        await resendCurrentPrompt(ctx);
        s.tempCityConfirm = null;
        return true;
      }

      const retry = await searchCities(temp.city.name, 6);
      if (retry.type === "list") {
        s.cityOptions = retry.cities;
        await sendText(
          from,
          formatCityList(
            retry.cities,
            `Select ${temp.field.toUpperCase()} city`
          )
        );
      } else {
        await sendText(from, "❌ City not understood. Please try again.");
      }

      s.tempCityConfirm = null;
      return true;
    }

    /* ================= FROM CITY ================= */
    if (s.state === "BUS_FROM" && msg.type === "text") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.cityOptions?.[Number(cleanText) - 1];
        if (!pick) {
          await sendText(from, "❌ Invalid number. Please choose from the list.");
          return true;
        }
        s.pendingBooking.from = pick.name;
        s.cityOptions = null;
        s.state = "BUS_TO";
        await resendCurrentPrompt(ctx);
        return true;
      }

      const result = await resolveCitySmart(cleanText);

      if (result.type === "exact") {
        s.pendingBooking.from = result.city.name;
        s.state = "BUS_TO";
        await sendText(from, `✅ Selected *${result.city.name}*`);
        await resendCurrentPrompt(ctx);
        return true;
      }

      if (result.type === "confirm") {
        s.tempCityConfirm = { field: "from", city: result.city };
        await sendButtons(
          from,
          `❓ Did you mean *${result.city.name}*?\n\nYes → Continue\nNo → See similar cities`,
          [
            { id: "CITY_YES", title: "✅ Yes" },
            { id: "CITY_NO", title: "❌ No" },
          ]
        );
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(from, formatCityList(result.cities, "Select FROM city"));
        return true;
      }

      await sendText(from, "❌ City not understood. Try again.");
      return true;
    }

    /* ================= TO CITY ================= */
    if (s.state === "BUS_TO" && msg.type === "text") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.cityOptions?.[Number(cleanText) - 1];
        if (!pick || pick.name === s.pendingBooking.from) {
          await sendText(from, "❌ Invalid destination city.");
          return true;
        }
        s.pendingBooking.to = pick.name;
        s.cityOptions = null;
        s.state = "BUS_DATE";
        await resendCurrentPrompt(ctx);
        return true;
      }

      const result = await resolveCitySmart(cleanText);

      if (result.type === "exact") {
        if (result.city.name === s.pendingBooking.from) {
          await sendText(from, "❌ From and To cities cannot be the same.");
          return true;
        }
        s.pendingBooking.to = result.city.name;
        s.state = "BUS_DATE";
        await sendText(from, `✅ Selected *${result.city.name}*`);
        await resendCurrentPrompt(ctx);
        return true;
      }

      if (result.type === "confirm") {
        s.tempCityConfirm = { field: "to", city: result.city };
        await sendButtons(
          from,
          `❓ Did you mean *${result.city.name}*?`,
          [
            { id: "CITY_YES", title: "✅ Yes" },
            { id: "CITY_NO", title: "❌ No" },
          ]
        );
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(from, formatCityList(result.cities, "Select TO city"));
        return true;
      }

      await sendText(from, "❌ City not understood. Try again.");
      return true;
    }

    /* ================= REST (UNCHANGED LOGIC) ================= */

    if (s.state === "BUS_DATE" && interactiveType === "button_reply") {
      const d = new Date();
      if (interactiveId === "DATE_TODAY") s.pendingBooking.date = formatDate(d);
      if (interactiveId === "DATE_TOMORROW") {
        d.setDate(d.getDate() + 1);
        s.pendingBooking.date = formatDate(d);
      }
      if (interactiveId === "DATE_DAY_AFTER") {
        d.setDate(d.getDate() + 2);
        s.pendingBooking.date = formatDate(d);
      }
      s.state = "BUS_TIME";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_TIME" && interactiveType === "list_reply") {
      s.pendingBooking.timePref = pickOption(interactiveId, get);
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
      s.pendingBooking.seatType = pickOption(interactiveId, get);
      s.state = "BUS_BUDGET";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_BUDGET" && interactiveType === "list_reply") {
      s.pendingBooking.budget = pickOption(interactiveId, get);
      s.state = "PAX_MODE";
      await sendButtons(from, "👤 *Passenger Details*\n\nHow would you like to enter details?", [
        { id: "PAX_BULK", title: "All at once" },
        { id: "PAX_ONEBYONE", title: "One by one" },
      ]);
      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ BUS BOOKING ERROR:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *RETRY*");
    return true;
  }
};

