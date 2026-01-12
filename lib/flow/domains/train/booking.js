const { sendText, sendButtons, sendList } = require("../waClient");
const { resolveCityAlias } = require("../validators");
const { saveBooking } = require("../bookingStore");

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
  const { session: s, from } = ctx;

  switch (s.state) {
    case "TRAIN_FROM":
      return sendText(from, "🚆 Enter *From Station*:");

    case "TRAIN_TO":
      return sendText(from, "🚆 Enter *To Station*:");

    case "TRAIN_DATE":
      return sendText(from, "📅 Enter *Journey Date* (DD-MM-YYYY):");

    case "TRAIN_CLASS":
      return sendList(from, "Select Class", "Class", [
        {
          title: "Travel Class",
          rows: [
            { id: "SL", title: "Sleeper (SL)" },
            { id: "3A", title: "AC 3 Tier (3A)" },
            { id: "2A", title: "AC 2 Tier (2A)" },
            { id: "1A", title: "First AC (1A)" },
            { id: "CC", title: "Chair Car (CC)" },
            { id: "2S", title: "Second Sitting (2S)" },
          ],
        },
      ]);

    case "TRAIN_QUOTA":
      return sendList(from, "Select Quota", "Quota", [
        {
          title: "Quota",
          rows: [
            { id: "GN", title: "General" },
            { id: "TATKAL", title: "Tatkal" },
            { id: "LADIES", title: "Ladies" },
            { id: "SENIOR", title: "Senior Citizen" },
          ],
        },
      ]);

    case "TRAIN_PAX_COUNT":
      return sendList(from, "Passengers count", "Passengers", [
        {
          title: "Count",
          rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
            id: `PAX_${n}`,
            title: n,
          })),
        },
      ]);

    case "TRAIN_CONFIRM":
      return sendButtons(
        from,
        "✅ *Review completed*\n\nPress *Confirm Booking* to send request to IRCTC agent.",
        [
          { id: "CONFIRM_TRAIN", title: "✅ Confirm Booking" },
          HELP_BUTTON,
        ]
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
  } = ctx;

  try {
    /* ================= GLOBAL COMMANDS ================= */

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
        type: "TRAIN",
        user: from,

        from: null,
        to: null,
        date: null,
        class: null,
        quota: "GN",
        paxCount: null,
        passengers: [],
        mobile: from, // OTP will go here

        payment: { status: "INIT" },
        status: "DRAFT",
      };

      s.state = "TRAIN_FROM";
      await sendText(from, "🚆 Enter *From Station*:");
      return true;
    }

    /* ================= FROM ================= */

    if (s.state === "TRAIN_FROM" && msg.type === "text") {
      const resolved = resolveCityAlias(text.trim());
      if (resolved.kind === "invalid") {
        await sendText(from, "❌ Station not understood. Try again.");
        return true;
      }

      s.pendingBooking.from = resolved.canonical || text.trim();
      s.state = "TRAIN_TO";
      await sendText(from, "🚆 Enter *To Station*:");
      return true;
    }

    /* ================= TO ================= */

    if (s.state === "TRAIN_TO" && msg.type === "text") {
      const resolved = resolveCityAlias(text.trim());
      if (resolved.kind === "invalid") {
        await sendText(from, "❌ Station not understood. Try again.");
        return true;
      }

      s.pendingBooking.to = resolved.canonical || text.trim();
      s.state = "TRAIN_DATE";
      await sendText(from, "📅 Enter *Journey Date* (DD-MM-YYYY):");
      return true;
    }

    /* ================= DATE ================= */

    if (s.state === "TRAIN_DATE" && msg.type === "text") {
      if (!isValidFutureDate(text.trim())) {
        await sendText(from, "❌ Invalid date. Use *DD-MM-YYYY* (future only).");
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
        `🎟 *Train Booking Received!*\n\n` +
          `🆔 Booking ID: *${saved.id}*\n` +
          `⏳ Our IRCTC agent will check availability and update you shortly.`
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
