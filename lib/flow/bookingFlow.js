const { sendText, sendButtons, sendList } = require(".././waClient");
const { resolveCityAlias } = require(".././validators");
const { saveBooking } = require("../bookingStore");
const { buildBusSummary } = require("./summary");
const trainBookingFlow = require("./domains/train/booking");


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
  if (ctx.session?.__isAdmin) return false;
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
          rows: [HELP_BUTTON],
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
      ]);

    case "BUS_PAX_MODE":
      return sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: get("PAX_BULK") },
        { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
        HELP_BUTTON,
      ]);

    case "BUS_CONFIRM":
    return sendButtons(
    from,
    "✅ *Review completed*\n\nPress *Confirm Booking* to generate your Booking ID.",
    [
      { id: "CONFIRM_BOOKING", title: "✅ Confirm Booking" },
      HELP_BUTTON,
    ]
  );


    case "BUS_SUMMARY":
      return sendText(
        from,
        "⏳ Your booking is being reviewed.\nWe’ll update you shortly."
      );

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

    if (s?.pendingBooking?.type === "TRAIN") {
    return trainBookingFlow(ctx);
  }

  try {
    /* ================= GLOBAL COMMANDS ================= */

    if (msg.type === "text" && text?.trim().toUpperCase() === "MENU") {
      s.state = null;
      s.pendingBooking = null;

      await sendButtons(from, get("MAIN_MENU"), [
        { id: "MENU_BOOK", title: get("MENU_BOOK") },
        HELP_BUTTON,
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
        type: "BUS",
        user: from,
        amount: null,
        payment: { status: "INIT" },

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

    /* ================= DATE ================= */

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

      if (interactiveId === "DATE_PICK_MANUAL") {
        s.state = "BUS_DATE_MANUAL";
        await sendText(from, "📅 Type date in *DD-MM-YYYY* (future only)");
        return true;
      }

      s.state = "BUS_TIME";
      await resendCurrentPrompt(ctx);
      return true;
    }

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
      s.pendingBooking.timePref = {
        id: interactiveId,
        label: get(interactiveId),
      };
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
      s.pendingBooking.seatType = {
        id: interactiveId,
        label: get(interactiveId),
      };
      s.state = "BUS_BUDGET";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_BUDGET" && interactiveType === "list_reply") {
      s.pendingBooking.budget = {
        id: interactiveId,
        label: get(interactiveId),
      };

      s.pendingBooking.amount = 999; // temp
      s.state = "BUS_PAX_MODE";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= CONFIRM ================= */

    if (s.state === "BUS_PAX_MODE" && interactiveType === "button_reply") {
      s.pendingBooking.paxMode = interactiveId;
      s.state = "BUS_CONFIRM";
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (s.state === "BUS_CONFIRM" && interactiveId === "CONFIRM_BOOKING") {
      const saved = saveBooking(s.pendingBooking);

      s.pendingBooking = saved;
      s.state = "BUS_SUMMARY";

     // 1️⃣ Confirm message
      await sendText(
        from,
        `🎟 *Booking Confirmed!*\n\n🆔 Booking ID: *${saved.id}*\n⏳ Waiting for admin approval.`
      );

// 2️⃣ FULL SUMMARY — NOW ID EXISTS
      await sendText(from, buildBusSummary(saved));
      console.log("📨 NEW BOOKING:", saved.id);
      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ Booking Flow Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *MENU*");
    return true;
  }
};
