const { sendText, sendButtons } = require("../../../waClient");
const { saveBooking } = require("../../../bookingStore");
const buildFlightSummary = require("./summary");

const HELP_BUTTON = { id: "MENU_HELP", title: "Help 🆘" };

/* ======================================================
 * MAIN FLIGHT BOOKING FLOW (FUTURE)
 * ====================================================== */
module.exports = async function flightBookingFlow(ctx) {
  const {
    session: s,
    msg,
    text,
    interactiveId,
    from,
    get,
  } = ctx;

  try {
    /* ================= GLOBAL ================= */

    if (
      (msg.type === "text" && text?.trim().toUpperCase() === "HELP") ||
      interactiveId === "MENU_HELP"
    ) {
      await sendText(from, get("HELP_TEXT"));
      return true;
    }

    if (msg.type === "text" && text?.trim().toUpperCase() === "RETRY") {
      s.state = null;
      return true;
    }

    /* ================= ENTRY ================= */

    if (!s.state) {
      // Create a placeholder booking (future-ready)
      s.pendingBooking = {
        ...(s.pendingBooking || {}),
        type: "FLIGHT",
        user: from,
        status: "COMING_SOON",
        payment: { status: "NA" },
        createdAt: new Date().toISOString(),
      };

      s.state = "FLIGHT_UNAVAILABLE";

      await sendButtons(
        from,
        "✈️ *Flight bookings are coming soon on Quickets!*\n\n" +
          "We’re currently enabling reliable flight bookings.\n\n" +
          "👉 You can still *register your interest*, and we’ll notify you once it’s live.",
        [
          { id: "FLIGHT_NOTIFY_ME", title: "🔔 Notify me" },
          { id: "FLIGHT_BACK", title: "⬅️ Back to Menu" },
        ]
      );
      return true;
    }

    /* ================= ACTIONS ================= */
    /* ================= ACTIONS ================= */

if (s.state === "FLIGHT_UNAVAILABLE") {
  if (interactiveId === "FLIGHT_NOTIFY_ME") {
    const saved = saveBooking(s.pendingBooking);

    s.pendingBooking = null;
    s.state = null;

    // Send ticket-style summary (consistent UX)
    await sendText(from, buildFlightSummary(saved));

    console.log("✈️ FLIGHT INTEREST REGISTERED:", saved.id);
    return true;
  }

  if (interactiveId === "FLIGHT_BACK") {
    s.pendingBooking = null;
    s.state = null;
    return false; // let menuFlow show menu
  }
}


    return false;
  } catch (err) {
    console.error("❌ Flight Booking Error:", err);
    await sendText(from, "⚠️ Something went wrong.\nType *MENU*");
    return true;
  }
};
