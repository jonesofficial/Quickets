const { sendText, sendList, sendButtons } = require("../../../waClient");
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

    case "TRAIN_PREF_MODE":
      return sendButtons(from, "🚆 How would you like to choose the train?", [
        { id: "PREF_NAME", title: "By Train Name" },
        { id: "PREF_NUMBER", title: "By Train Number" },
        { id: "PREF_TIME", title: "By Time" },
        { id: "PREF_TYPE", title: "By Train Type" },
      ]);

    case "TRAIN_PREF_VALUE":
      return sendText(from, "✍️ Please enter your train preference.");

    case "TRAIN_CLASS":
      return sendList(from, get("TRAIN_PICK_CLASS"), "Class", [
        {
          title: "Select class",
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
          title: "Select quota",
          rows: [
            { id: "GN", title: get("TRAIN_QUOTA_GN") },
            { id: "TATKAL", title: get("TRAIN_QUOTA_TATKAL") },
            { id: "LADIES", title: get("TRAIN_QUOTA_LADIES") },
            { id: "SENIOR", title: get("TRAIN_QUOTA_SENIOR") },
          ],
        },
      ]);

    case "TRAIN_BERTH":
      return sendList(from, get("TRAIN_PICK_BERTH"), "Berth", [
        {
          title: "Berth preference",
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
      return sendList(from, get("HOW_MANY_PAX"), "Passengers", [
        {
          title: "Select passengers",
          rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
            id: `PAX_${n}`,
            title: n,
          })),
        },
      ]);

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

    /* ================= GLOBAL ================= */

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
        trainPref: null, // ⭐ NEW
        class: null,
        quota: "GN",
        berthPref: "NA",
        paxCount: null,
        passengers: [],
        contactPhone: null,
        status: "DRAFT",
      };

      s.state = "TRAIN_FROM";
      await sendText(from, get("TRAIN_ASK_FROM"));
      return true;
    }

    /* ================= FROM ================= */

    if (s.state === "TRAIN_FROM" && msg.type === "text") {
      const resolved = resolveCityAlias(safeText(msg, text));
      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }
      s.pendingBooking.from = resolved.canonical;
      s.state = "TRAIN_TO";
      await sendText(from, get("TRAIN_ASK_TO"));
      return true;
    }

    /* ================= TO ================= */

    if (s.state === "TRAIN_TO" && msg.type === "text") {
      const resolved = resolveCityAlias(safeText(msg, text));
      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }
      s.pendingBooking.to = resolved.canonical;
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

      s.state = "TRAIN_PREF_MODE";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= PREF MODE ================= */

    if (s.state === "TRAIN_PREF_MODE" && interactiveType === "button_reply") {
      const map = {
        PREF_NAME: "NAME",
        PREF_NUMBER: "NUMBER",
        PREF_TIME: "TIME",
        PREF_TYPE: "TYPE",
      };

      s.pendingBooking.trainPref = {
        mode: map[interactiveId],
        value: null,
      };

      s.state = "TRAIN_PREF_VALUE";

      const prompt = {
        NAME: "✍️ Enter train name (Eg: Chennai Mail)",
        NUMBER: "🔢 Enter train number (Eg: 12607)",
        TIME: "⏰ Enter preferred time (Eg: Night / 9 PM)",
        TYPE: "🚆 Enter train type (Express / Mail / Any)",
      };

      await sendText(from, prompt[s.pendingBooking.trainPref.mode]);
      return true;
    }

    /* ================= PREF VALUE ================= */

    if (s.state === "TRAIN_PREF_VALUE" && msg.type === "text") {
      s.pendingBooking.trainPref.value = safeText(msg, text);

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
        "🛏️ Berth preference (optional)\n⚠️ Subject to availability as per IRCTC rules.",
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

      // 👉 HANDOVER TO passengerFlow
      s.state = "PAX_MODE";

      await sendButtons(from, get("PASSENGER_DETAILS_MODE"), [
        { id: "PAX_BULK", title: get("PAX_BULK") },
        { id: "PAX_ONEBYONE", title: get("PAX_ONEBYONE") },
      ]);

      return true; // 🔴 MUST be true
    }

    return false;
  } catch (err) {
    console.error("❌ Train Booking Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *BOOK AGAIN*");
    return true;
  }
};
