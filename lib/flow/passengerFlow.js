const { sendText, sendButtons } = require("../waClient");

/* ======================================================
 * COMMON PASSENGER FLOW
 * ====================================================== */
module.exports = async function passengerFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const { session: s, msg, interactiveType, interactiveId, from } = ctx;
  if (!s || !s.pendingBooking) return false;

  const booking = s.pendingBooking;
  const total = booking.paxCount;

  /* ===============================
   * PASSENGER MODE SELECTION
   * =============================== */
  if (s.state === "PAX_MODE" && interactiveType === "button_reply") {
    if (interactiveId === "PAX_BULK") {
      s.state = "PAX_BULK";
      booking.passengers = [];

      await sendText(
        from,
        "✍️ *Enter passenger details*\n\n" +
          "Format (one per line):\n" +
          "Name, Age, Gender\n\n" +
          "Example:\n" +
          "Ravi, 28, M\n" +
          "Sita, 25, F"
      );
      return true;
    }

    if (interactiveId === "PAX_ONEBYONE") {
      s.state = "PAX_ONE_NAME";
      booking.passengers = [];
      booking._paxIndex = 1;

      await sendText(from, "👤 Enter passenger 1 name:");
      return true;
    }
  }

  /* ===============================
   * BULK INPUT
   * =============================== */
  if (s.state === "PAX_BULK" && msg.type === "text") {
    const body = msg.text?.body;
    if (!body) return true;

    const lines = body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length !== total) {
      await sendText(
        from,
        `❌ Expected *${total} passengers* but got *${lines.length}*. Please try again.`
      );
      return true;
    }

    booking.passengers = lines.map((line) => {
      const [name, age, gender] = line.split(",").map((s) => s.trim());
      return { name, age, gender };
    });

    s.state = "ASK_CONTACT_PHONE";
    await sendText(
      from,
      "📞 *Contact phone number*\n\n" +
        "Please *type* your mobile number (do not share contact).\n" +
        "Example: 9876543210"
    );
    return true;
  }

  /* ===============================
   * ONE BY ONE INPUT
   * =============================== */
  if (s.state === "PAX_ONE_NAME" && msg.type === "text") {
    const name = msg.text?.body?.trim();
    if (!name) {
      await sendText(from, "❌ Name cannot be empty.");
      return true;
    }

    booking.passengers.push({ name });

    if (booking.passengers.length >= total) {
      s.state = "ASK_CONTACT_PHONE";
      await sendText(
        from,
        "📞 *Contact phone number*\n\n" +
          "Please *type* your mobile number (do not share contact).\n" +
          "Example: 9876543210"
      );
      return true;
    }

    booking._paxIndex += 1;
    await sendText(from, `👤 Enter passenger ${booking._paxIndex} name:`);
    return true;
  }

  /* ===============================
   * CONTACT PHONE (MANDATORY)
   * =============================== */

  // ❌ User shared contact card
  if (s.state === "ASK_CONTACT_PHONE" && msg.type === "contacts") {
    await sendText(
      from,
      "📞 Please *type* your mobile number as text.\nExample: 9876543210"
    );
    return true;
  }

  // ✅ User typed phone number
  if (s.state === "ASK_CONTACT_PHONE" && msg.type === "text") {
    const phone = msg.text?.body?.replace(/\D/g, "");

    if (!phone || phone.length < 10) {
      await sendText(
        from,
        "❌ Invalid phone number.\nPlease enter a valid 10-digit mobile number."
      );
      return true;
    }

    booking.contactPhone = phone;
    s.state = "REVIEW_BOOKING";
    return true;
  }

  return false;
};
