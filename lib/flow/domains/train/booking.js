const { sendText, sendList } = require("../../../waClient");
const { resolveCityAlias } = require("../../../validators");

const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

/* ======================================================
 * Utils
 * ====================================================== */
function isValidFutureDate(input) {
  if (!input) return false;
  if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) return false;
  const [dd, mm, yyyy] = input.split("-").map(Number);
  const selected = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected >= today;
}

// Safe text helper
function safeText(msg, text) {
  if (typeof text === "string") return text.trim();
  if (msg?.text?.body) return msg.text.body.trim();
  return null;
}

/* ======================================================
 * Retry helper
 * ====================================================== */
async function resendCurrentPrompt(ctx) {
  const { session: s, from, get } = ctx;

  switch (s.state) {
    case "TRAIN_FROM":
      return sendText(from, get("TRAIN_ASK_FROM"));

    case "TRAIN_TO":
      return sendText(from, get("TRAIN_ASK_TO"));

    case "TRAIN_DATE":
      return sendText(from, get("TRAIN_ASK_DATE"));

    case "TRAIN_CLASS":
      return sendList(from, get("TRAIN_PICK_CLASS"), "Class", [
        {
          title: get("TRAIN_PICK_CLASS"),
          rows: [
            { id: "SL", title: get("TRAIN_CLASS_SL") },
            { id: "3A", title: get("TRAIN_CLASS_3A") },
            { id: "2A", title: get("TRAIN_CLASS_2A") },
            { id: "1A", title: get("TRAIN_CLASS_1A") },
            { id: "CC", title: get("TRAIN_CLASS_CC") },
            { id: "2S", title: get("TRAIN_CLASS_2S") },
          ],
        },
      ]);

    case "TRAIN_QUOTA":
      return sendList(from, get("TRAIN_PICK_QUOTA"), "Quota", [
        {
          title: get("TRAIN_PICK_QUOTA"),
          rows: [
            { id: "GN", title: get("TRAIN_QUOTA_GN") },
            { id: "TATKAL", title: get("TRAIN_QUOTA_TATKAL") },
            { id: "LADIES", title: get("TRAIN_QUOTA_LADIES") },
            { id: "SENIOR", title: get("TRAIN_QUOTA_SENIOR") },
          ],
        },
      ]);

    case "TRAIN_BERTH":
      return sendList(from, get("TRAIN_PICK_BERTH"), "Berth Preference", [
        {
          title: get("TRAIN_PICK_BERTH"),
          rows: [
            { id: "LB", title: "Lower Berth" },
            { id: "UB", title: "Upper Berth" },
            { id: "SL", title: "Side Lower" },
            { id: "SU", title: "Side Upper" },
            { id: "NA", title: "No Preference" },
          ],
        },
      ]);
    case "TRAIN_PAX_COUNT":
      return sendList(
        from,
        get("HOW_MANY_PAX"), // body text → emojis & formatting OK
        "Passengers", // button text → short & plain
        [
          {
            title: "Select passengers", // ✅ PLAIN TEXT ONLY
            rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
              id: `PAX_${n}`,
              title: n,
            })),
          },
        ],
      );

    default:
      return sendText(from, get("OOPS_TAP_OPTIONS"));
  }
}

/* ======================================================
 * MAIN TRAIN BOOKING FLOW
 * ====================================================== */
module.exports = async function trainBookingFlow(ctx) {
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
    const cleanText = safeText(msg, text)?.toUpperCase();

    /* ================= GLOBAL COMMANDS ================= */

    if (cleanText === "HELP" || interactiveId === "MENU_HELP") {
      await sendText(
        from,
        `${get("HELP_TEXT")}\n\nYou can type anytime:\n• HELP\n• RETRY\n• BOOK AGAIN`,
      );
      return true;
    }

    if (cleanText === "RETRY") {
      await resendCurrentPrompt(ctx);
      return true;
    }

    if (cleanText === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.state = null;
      await sendText(from, "🔄 Starting a new booking…");
      return false;
    }

    /* ================= ENTRY ================= */

    if (!s.state) {
      s.pendingBooking = {
        type: "TRAIN",
        user: from,
        from: null,
        to: null,
        date: null,
        class: null,
        quota: "GN",
        berthPref: "NA", // optional, not guaranteed
        paxCount: null,
        passengers: [],
        contactPhone: null,
        status: "DRAFT",
      };

      s.state = "TRAIN_FROM";
      await sendText(
        from,
        `${get("TRAIN_ASK_FROM")}\n\n💡 Type: HELP | RETRY | BOOK AGAIN`,
      );
      return true;
    }

    /* ================= FROM ================= */

    if (s.state === "TRAIN_FROM" && msg.type === "text") {
      const input = safeText(msg, text);
      const resolved = resolveCityAlias(input);

      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }

      s.pendingBooking.from = resolved.canonical || input;
      s.state = "TRAIN_TO";
      await sendText(from, get("TRAIN_ASK_TO"));
      return true;
    }

    /* ================= TO ================= */

    if (s.state === "TRAIN_TO" && msg.type === "text") {
      const input = safeText(msg, text);
      const resolved = resolveCityAlias(input);

      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }

      s.pendingBooking.to = resolved.canonical || input;
      s.state = "TRAIN_DATE";
      await sendText(from, get("TRAIN_ASK_DATE"));
      return true;
    }

    /* ================= DATE ================= */

    if (s.state === "TRAIN_DATE" && msg.type === "text") {
      const input = safeText(msg, text);
      if (!isValidFutureDate(input)) {
        await sendText(from, get("INVALID_DATE"));
        return true;
      }

      s.pendingBooking.date = input;
      s.state = "TRAIN_CLASS";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= CLASS ================= */

    if (s.state === "TRAIN_CLASS" && interactiveType === "list_reply") {
      s.pendingBooking.class = interactiveId;
      s.state = "TRAIN_QUOTA";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= QUOTA ================= */

    if (s.state === "TRAIN_QUOTA" && interactiveType === "list_reply") {
      s.pendingBooking.quota = interactiveId;

      s.state = "TRAIN_BERTH";
      await sendText(
        from,
        "🛏️ *Berth Preference (optional)*\n\n⚠️ Berth allotment is subject to availability and *not guaranteed as per IRCTC rules*.",
      );
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= BERTH ================= */

    if (s.state === "TRAIN_BERTH" && interactiveType === "list_reply") {
      s.pendingBooking.berthPref = interactiveId;
      s.state = "TRAIN_PAX_COUNT";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= PAX COUNT ================= */

    if (s.state === "TRAIN_PAX_COUNT" && interactiveType === "list_reply") {
      s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);

      // ✅ Explicitly ask how passenger details will be entered
      s.state = "PAX_MODE";

      await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: get("PAX_BULK") },
        { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
      ]);

      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ Train Booking Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *BOOK AGAIN*");
    return true;
  }
};
