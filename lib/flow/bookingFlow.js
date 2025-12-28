// lib/flow/bookingFlow.js

const {
  sendText,
  sendButtons,
  sendList,
  sendOopsTapOptions,
} = require("../waClient");

const {
  parseDateInput,
  resolveCityAlias,
} = require("../validators");

/**
 * Booking Flow
 * -----------------------------
 * Responsibility:
 * - Collect booking preferences ONLY
 * - No passenger detail parsing
 * - Handoff cleanly to passengerFlow
 */
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

  /* ==================================================
   * ENTRY — MENU_BOOK
   * ================================================== */
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

  /* ==================================================
   * BUS_FROM
   * ================================================== */
  if (s.state === "BUS_FROM" && msg.type === "text") {
    const candidate = text.trim();
    const resolved = resolveCityAlias(candidate);

    if (resolved.kind === "invalid") {
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }

    if (resolved.kind === "alias") {
      s.temp = { field: "from", value: resolved.canonical };
      s.state = "BUS_FROM_CONFIRM";
      await sendButtons(
        from,
        get("CONFIRM_FROM_PROMPT", {
          canonical: resolved.canonical,
          candidate,
        }),
        [
          { id: "YES", title: "✅ Yes" },
          { id: "NO", title: "❌ No" },
        ]
      );
      return true;
    }

    s.pendingBooking.from = resolved.canonical || candidate;
    s.state = "BUS_TO";
    await sendText(from, get("ASK_TO"));
    return true;
  }

  /* ==================================================
   * BUS_FROM_CONFIRM
   * ================================================== */
  if (s.state === "BUS_FROM_CONFIRM" && interactiveType === "button_reply") {
    if (interactiveId === "YES") {
      s.pendingBooking.from = s.temp.value;
      s.temp = null;
      s.state = "BUS_TO";
      await sendText(from, get("ASK_TO"));
      return true;
    }

    if (interactiveId === "NO") {
      s.temp = null;
      s.state = "BUS_FROM";
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }
  }

  /* ==================================================
   * BUS_TO
   * ================================================== */
  if (s.state === "BUS_TO" && msg.type === "text") {
    const candidate = text.trim();
    const resolved = resolveCityAlias(candidate);

    if (resolved.kind === "invalid") {
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }

    if (resolved.kind === "alias") {
      s.temp = { field: "to", value: resolved.canonical };
      s.state = "BUS_TO_CONFIRM";
      await sendButtons(
        from,
        get("CONFIRM_TO_PROMPT", {
          canonical: resolved.canonical,
          candidate,
        }),
        [
          { id: "YES", title: "✅ Yes" },
          { id: "NO", title: "❌ No" },
        ]
      );
      return true;
    }

    s.pendingBooking.to = resolved.canonical || candidate;
    s.state = "BUS_DATE";
    await sendText(from, get("ASK_DATE"));
    return true;
  }

  /* ==================================================
   * BUS_TO_CONFIRM
   * ================================================== */
  if (s.state === "BUS_TO_CONFIRM" && interactiveType === "button_reply") {
    if (interactiveId === "YES") {
      s.pendingBooking.to = s.temp.value;
      s.temp = null;
      s.state = "BUS_DATE";
      await sendText(from, get("ASK_DATE"));
      return true;
    }

    if (interactiveId === "NO") {
      s.temp = null;
      s.state = "BUS_TO";
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }
  }

  /* ==================================================
   * BUS_DATE
   * ================================================== */
  if (s.state === "BUS_DATE" && msg.type === "text") {
    const parsed = parseDateInput(text);

    if (!parsed.ok) {
      await sendText(from, get("INVALID_DATE"));
      return true;
    }

    s.pendingBooking.date = parsed.dateStr;
    s.state = "BUS_TIME";

    await sendList(from, get("PICK_TIME_PREF"), "Select", [
      {
        title: "Time slots",
        rows: [
          { id: "TIME_MORNING", title: get("TIME_MORNING") },
          { id: "TIME_AFTERNOON", title: get("TIME_AFTERNOON") },
          { id: "TIME_EVENING", title: get("TIME_EVENING") },
          { id: "TIME_NIGHT", title: get("TIME_NIGHT") },
        ],
      },
    ]);
    return true;
  }

  /* ==================================================
   * BUS_TIME
   * ================================================== */
  if (s.state === "BUS_TIME") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    s.pendingBooking.timePref = get(interactiveId) || "Any";
    s.state = "BUS_PAX_COUNT";

    await sendList(from, get("HOW_MANY_PAX"), "Choose", [
      {
        title: "Passengers",
        rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
          id: `PAX_${n}`,
          title: n,
        })),
      },
    ]);
    return true;
  }

  /* ==================================================
   * BUS_PAX_COUNT
   * ================================================== */
  if (s.state === "BUS_PAX_COUNT") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
    s.state = "BUS_SEAT_TYPE";

    await sendList(from, get("SEAT_TYPE_PROMPT"), "Pick type", [
      {
        title: "Type",
        rows: [
          { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
          { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
          { id: "SEAT_NONAC_SLEEPER", title: get("SEAT_NONAC_SLEEPER") },
          { id: "SEAT_NONAC_SEATER", title: get("SEAT_NONAC_SEATER") },
        ],
      },
    ]);
    return true;
  }

  /* ==================================================
   * BUS_SEAT_TYPE
   * ================================================== */
  if (s.state === "BUS_SEAT_TYPE") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    s.pendingBooking.seatType = get(interactiveId);
    s.state = "BUS_BUDGET";

    await sendList(from, get("BUDGET_PROMPT"), "Budget", [
      {
        title: "Budget options",
        rows: [
          "BUDGET_300U",
          "BUDGET_500",
          "BUDGET_700",
          "BUDGET_1000",
          "BUDGET_1500",
          "BUDGET_2000PLUS",
        ].map((id) => ({ id, title: get(id) })),
      },
    ]);
    return true;
  }

  /* ==================================================
   * BUS_BUDGET
   * ================================================== */
  if (s.state === "BUS_BUDGET") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    s.pendingBooking.budget = get(interactiveId);
    s.state = "BUS_PAX_MODE";

    await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
      { id: "PAX_BULK", title: get("PAX_BULK") },
      { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
    ]);
    return true;
  }

  /* ==================================================
   * BUS_PAX_MODE → HANDOFF
   * ================================================== */
  if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
    if (interactiveId === "PAX_BULK") {
      s.pendingBooking.paxMode = "BULK";
      s.state = "BUS_PAX_START";
      return false;
    }

    if (interactiveId === "PAX_ONEBYONE") {
      s.pendingBooking.paxMode = "ONE_BY_ONE";
      s.state = "BUS_PAX_START";
      return false;
    }
  }

  return false;
};
