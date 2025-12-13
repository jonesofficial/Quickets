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
  parsePassengerLine,
} = require("../validators");

const { anonymizePassenger } = require("../privacy");
const { nextBookingId } = require("../sessionStore");

async function handleBooking(ctx) {
  const {
    session: s,
    msg,
    text,
    interactiveType,
    interactiveId,
    from,
    get,
  } = ctx;

  /* --------------------------------------------------
   * BOOK PICK
   * -------------------------------------------------- */
  if (s.state === "BOOK_PICK" && interactiveType === "button_reply") {
    if (interactiveId === "BOOK_INFO") {
      await sendText(
        from,
        "We’ll ask a few quick questions and confirm with you before booking."
      );
      s.state = "IDLE";
      return true;
    }

    if (interactiveId === "BOOK_BUS") {
      s.pendingBooking = {
        id: null,
        type: "BUS",
        from: null,
        to: null,
        date: null,
        timePref: null,
        paxCount: null,
        seatType: null,
        budget: null,
        passengers: [],
        status: "Pending",
        createdAt: Date.now(),
      };
      s.state = "BUS_FROM";
      await sendText(from, get("ASK_FROM"));
      return true;
    }
  }

  /* --------------------------------------------------
   * BUS_FROM
   * -------------------------------------------------- */
  if (s.state === "BUS_FROM" && msg.type === "text") {
    const candidate = text.trim();
    const resolved = resolveCityAlias(candidate);

    if (resolved.kind === "invalid") {
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }

    if (resolved.kind === "alias") {
      s.__pendingFromCandidate = resolved.canonical;
      s.state = "CONFIRM_BOARDING";
      await sendButtons(
        from,
        get("CONFIRM_FROM_PROMPT", {
          canonical: resolved.canonical,
          candidate,
        }),
        [
          { id: "CONFIRM_FROM_YES", title: "✅ Yes" },
          { id: "CONFIRM_FROM_NO", title: "❌ No" },
        ]
      );
      return true;
    }

    s.pendingBooking.from = resolved.canonical || candidate;
    s.state = "BUS_TO";
    await sendText(from, get("ASK_TO"));
    return true;
  }

  /* --------------------------------------------------
   * CONFIRM_BOARDING
   * -------------------------------------------------- */
  if (s.state === "CONFIRM_BOARDING" && interactiveType === "button_reply") {
    if (interactiveId === "CONFIRM_FROM_YES") {
      s.pendingBooking.from = s.__pendingFromCandidate;
      delete s.__pendingFromCandidate;
      s.state = "BUS_TO";
      await sendText(from, get("ASK_TO"));
      return true;
    }

    if (interactiveId === "CONFIRM_FROM_NO") {
      delete s.__pendingFromCandidate;
      s.state = "BUS_FROM";
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }
  }

  /* --------------------------------------------------
   * BUS_TO
   * -------------------------------------------------- */
  if (s.state === "BUS_TO" && msg.type === "text") {
    const candidate = text.trim();
    const resolved = resolveCityAlias(candidate);

    if (resolved.kind === "invalid") {
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }

    if (resolved.kind === "alias") {
      s.__pendingToCandidate = resolved.canonical;
      s.state = "CONFIRM_DESTINATION";
      await sendButtons(
        from,
        get("CONFIRM_TO_PROMPT", {
          canonical: resolved.canonical,
          candidate,
        }),
        [
          { id: "CONFIRM_TO_YES", title: "✅ Yes" },
          { id: "CONFIRM_TO_NO", title: "❌ No" },
        ]
      );
      return true;
    }

    s.pendingBooking.to = resolved.canonical || candidate;
    s.state = "BUS_DATE";
    await sendText(from, get("ASK_DATE"));
    return true;
  }

  /* --------------------------------------------------
   * CONFIRM_DESTINATION
   * -------------------------------------------------- */
  if (
    s.state === "CONFIRM_DESTINATION" &&
    interactiveType === "button_reply"
  ) {
    if (interactiveId === "CONFIRM_TO_YES") {
      s.pendingBooking.to = s.__pendingToCandidate;
      delete s.__pendingToCandidate;
      s.state = "BUS_DATE";
      await sendText(from, get("ASK_DATE"));
      return true;
    }

    if (interactiveId === "CONFIRM_TO_NO") {
      delete s.__pendingToCandidate;
      s.state = "BUS_TO";
      await sendText(from, get("CITY_NOT_UNDERSTOOD"));
      return true;
    }
  }

  /* --------------------------------------------------
   * BUS_DATE
   * -------------------------------------------------- */
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

  /* --------------------------------------------------
   * BUS_TIME
   * -------------------------------------------------- */
  if (s.state === "BUS_TIME") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    const map = {
      TIME_MORNING: get("TIME_MORNING"),
      TIME_AFTERNOON: get("TIME_AFTERNOON"),
      TIME_EVENING: get("TIME_EVENING"),
      TIME_NIGHT: get("TIME_NIGHT"),
    };

    s.pendingBooking.timePref = map[interactiveId] || "Any";
    s.state = "BUS_PAX";

    await sendList(from, get("HOW_MANY_PAX"), "Choose", [
      {
        title: "Passengers (max 6)",
        rows: [
          { id: "PAX_1", title: get("PAX_1") },
          { id: "PAX_2", title: get("PAX_2") },
          { id: "PAX_3", title: get("PAX_3") },
          { id: "PAX_4", title: get("PAX_4") },
          { id: "PAX_5", title: get("PAX_5") },
          { id: "PAX_6", title: get("PAX_6") },
        ],
      },
    ]);
    return true;
  }

  /* --------------------------------------------------
   * BUS_PAX
   * -------------------------------------------------- */
  if (s.state === "BUS_PAX") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    s.pendingBooking.paxCount = parseInt(
      interactiveId.split("_")[1],
      10
    );
    s.state = "BUS_SEAT_TYPE";

    await sendList(from, get("SEAT_TYPE_PROMPT"), "Pick type", [
      {
        title: "Type",
        rows: [
          { id: "SEAT_AC_SLEEPER", title: get("SEAT_AC_SLEEPER") },
          { id: "SEAT_AC_SEATER", title: get("SEAT_AC_SEATER") },
          {
            id: "SEAT_NONAC_SLEEPER",
            title: get("SEAT_NONAC_SLEEPER"),
          },
          {
            id: "SEAT_NONAC_SEATER",
            title: get("SEAT_NONAC_SEATER"),
          },
        ],
      },
    ]);
    return true;
  }

  /* --------------------------------------------------
   * BUS_SEAT_TYPE
   * -------------------------------------------------- */
  if (s.state === "BUS_SEAT_TYPE") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    const map = {
      SEAT_AC_SLEEPER: get("SEAT_AC_SLEEPER"),
      SEAT_AC_SEATER: get("SEAT_AC_SEATER"),
      SEAT_NONAC_SLEEPER: get("SEAT_NONAC_SLEEPER"),
      SEAT_NONAC_SEATER: get("SEAT_NONAC_SEATER"),
    };

    s.pendingBooking.seatType = map[interactiveId] || "Any";
    s.state = "BUS_BUDGET";

    await sendList(from, get("BUDGET_PROMPT"), "Budget", [
      {
        title: "Budget options",
        rows: [
          { id: "BUDGET_300U", title: get("BUDGET_300U") },
          { id: "BUDGET_500", title: get("BUDGET_500") },
          { id: "BUDGET_700", title: get("BUDGET_700") },
          { id: "BUDGET_1000", title: get("BUDGET_1000") },
          { id: "BUDGET_1500", title: get("BUDGET_1500") },
          {
            id: "BUDGET_2000PLUS",
            title: get("BUDGET_2000PLUS"),
          },
        ],
      },
    ]);
    return true;
  }

  /* --------------------------------------------------
   * BUS_BUDGET
   * -------------------------------------------------- */
  if (s.state === "BUS_BUDGET") {
    if (interactiveType !== "list_reply") {
      await sendOopsTapOptions(from);
      return true;
    }

    const bmap = {
      BUDGET_300U: get("BUDGET_300U"),
      BUDGET_500: get("BUDGET_500"),
      BUDGET_700: get("BUDGET_700"),
      BUDGET_1000: get("BUDGET_1000"),
      BUDGET_1500: get("BUDGET_1500"),
      BUDGET_2000PLUS: get("BUDGET_2000PLUS"),
    };

    s.pendingBooking.budget = bmap[interactiveId] || "Any";
    s.state = "BUS_PAX_MODE";

    await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
      { id: "PAX_BULK", title: get("PAX_BULK") },
      { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
    ]);
    return true;
  }

  /* --------------------------------------------------
   * PASSENGER MODE
   * -------------------------------------------------- */
  if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
    const total = s.pendingBooking.paxCount;

    if (interactiveId === "PAX_BULK") {
      s.state = "BUS_PAX_BULK";
      await sendText(from, get("FILL_PAX_BULK", { total }));
      return true;
    }

    if (interactiveId === "PAX_ONEBYONE") {
      s.state = "BUS_PAX_ONE_NAME_WAIT";
      s.pendingBooking.passengers = [];
      s.__oneIndex = 1;
      await sendText(
        from,
        get("ENTER_NAME_PROMPT", { i: 1, total })
      );
      return true;
    }
  }

  /* --------------------------------------------------
   * CONFIRM / EDIT / CANCEL
   * -------------------------------------------------- */
  if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
    if (interactiveId === "CONFIRM_BOOK") {
      s.pendingBooking.id = nextBookingId();
      s.pendingBooking.status = "Booked";

      s.bookings.push({ ...s.pendingBooking });
      await sendText(
        from,
        get("CONFIRMED_BOOKING", { id: s.pendingBooking.id })
      );

      s.pendingBooking = null;
      s.state = "IDLE";
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
}

module.exports = { handleBooking };
