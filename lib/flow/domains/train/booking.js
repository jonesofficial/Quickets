const { sendText, sendButtons, sendList } = require("../../../waClient");
const { resolveCityAlias } = require("../../../validators");
const { saveBooking } = require("../../../bookingStore");

const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

/* ======================================================
 * Date validation
 * ====================================================== */
function isValidFutureDate(input) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) return false;

  const [dd, mm, yyyy] = input.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return d >= today;
}

/* ======================================================
 * RETRY helper (TRAIN)
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

    case "TRAIN_PAX_COUNT":
      return sendList(from, get("HOW_MANY_PAX"), "Passengers", [
        {
          title: get("HOW_MANY_PAX"),
          rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
            id: `PAX_${n}`,
            title: n,
          })),
        },
      ]);

    case "TRAIN_CONFIRM":
      return sendButtons(
        from,
        get("TRAIN_REVIEW"),
        [{ id: "CONFIRM_TRAIN", title: "✅ Confirm Booking" }, HELP_BUTTON]
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
    /* ================= RETRY ================= */

    if (msg.type === "text" && text?.trim().toUpperCase() === "RETRY") {
      if (!s || !s.state) {
        await sendText(from, "Nothing to retry.\nType *MENU* to start.");
        return true;
      }
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= ENTRY ================= */

    if (!s.state) {
      s.pendingBooking = {
        ...(s.pendingBooking || {}),
        type: "TRAIN",
        user: from,
        from: null,
        to: null,
        date: null,
        class: null,
        quota: "GN",
        paxCount: null,
        passengers: [],
        mobile: from,
        payment: { status: "INIT" },
        status: "DRAFT",
      };

      s.state = "TRAIN_FROM";
      await sendText(from, get("TRAIN_ASK_FROM"));
      return true;
    }

    /* ================= FROM ================= */

    if (s.state === "TRAIN_FROM" && msg.type === "text") {
      const resolved = resolveCityAlias(text.trim());
      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }

      s.pendingBooking.from = resolved.canonical || text.trim();
      s.state = "TRAIN_TO";
      await sendText(from, get("TRAIN_ASK_TO"));
      return true;
    }

    /* ================= TO ================= */

    if (s.state === "TRAIN_TO" && msg.type === "text") {
      const resolved = resolveCityAlias(text.trim());
      if (resolved.kind === "invalid") {
        await sendText(from, get("CITY_NOT_UNDERSTOOD"));
        return true;
      }

      s.pendingBooking.to = resolved.canonical || text.trim();
      s.state = "TRAIN_DATE";
      await sendText(from, get("TRAIN_ASK_DATE"));
      return true;
    }

    /* ================= DATE ================= */

    if (s.state === "TRAIN_DATE" && msg.type === "text") {
      if (!isValidFutureDate(text.trim())) {
        await sendText(from, get("INVALID_DATE"));
        return true;
      }

      s.pendingBooking.date = text.trim();
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
      s.state = "TRAIN_PAX_COUNT";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= PAX COUNT ================= */

    if (s.state === "TRAIN_PAX_COUNT" && interactiveType === "list_reply") {
      s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);
      s.state = "TRAIN_CONFIRM";
      await resendCurrentPrompt(ctx);
      return true;
    }

    /* ================= CONFIRM ================= */

    if (s.state === "TRAIN_CONFIRM" && interactiveId === "CONFIRM_TRAIN") {
      const saved = saveBooking(s.pendingBooking);

      s.pendingBooking = saved;
      s.state = "TRAIN_SUMMARY";

      await sendText(
        from,
        get("TRAIN_CONFIRMED", { id: saved.id })
      );

      console.log("🚆 NEW TRAIN BOOKING:", saved.id);
      return true;
    }

    return false;
  } catch (err) {
    console.error("❌ Train Booking Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *MENU*");
    return true;
  }
};
