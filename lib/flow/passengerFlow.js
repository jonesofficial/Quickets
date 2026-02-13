const { sendText, sendButtons } = require("../waClient");
const buildBusSummary = require("./domains/bus/summary"); // reused for now

/* ======================================================
 * COMMON PASSENGER FLOW
 * (Bus / Train / Flight)
 * ====================================================== */
module.exports = async function passengerFlow(ctx) {
  if (ctx.session?.__isAdmin) return false;

  const { session: s, msg, interactiveType, interactiveId, from, get } = ctx;
  if (!s || !s.pendingBooking) return false;

  const booking = s.pendingBooking;
  const total = booking.paxCount;

  /* ===============================
   * PASSENGER MODE SELECTION
   * =============================== */
  if (s.state === "PAX_MODE" && interactiveType === "button_reply") {
    booking.passengers = [];

    // ✅ BULK MODE
    if (interactiveId === "PAX_BULK") {
      s.state = "PAX_BULK";

      await sendText(from, get("FILL_PAX_BULK").replace("{{total}}", total));
      return true;
    }

    // ✅ ONE BY ONE MODE
    if (interactiveId === "PAX_ONEBYONE") {
      s.state = "PAX_ONE_NAME";
      booking._paxIndex = 1;

      await sendText(
        from,
        get("ENTER_NAME_PROMPT")
          .replace("{{i}}", 1)
          .replace("{{total}}", total),
      );
      return true;
    }
  }

  /* ===============================
   * BULK INPUT
   * =============================== */
  if (s.state === "PAX_BULK" && msg.type === "text") {
    const body = msg.text?.body?.trim();
    if (!body) return true;

    const lines = body
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length !== total) {
      await sendText(
        from,
        get("NEED_EXACT_PAX")
          .replace("{{want}}", total)
          .replace("{{have}}", lines.length),
      );
      return true;
    }

    const passengers = [];

    for (const line of lines) {
      const parts = line.split(/[, ]+/);

      if (parts.length < 3) {
        await sendText(
          from,
          "❌ Invalid format.\nUse: Name, Age, Gender\nExample: Ravi, 28, M",
        );
        return true;
      }

      const age = Number(parts[parts.length - 2]);
      const genderRaw = parts[parts.length - 1].toUpperCase();
      const name = parts.slice(0, parts.length - 2).join(" ");

      if (!age || age < 1 || age > 120) {
        await sendText(from, get("INVALID_AGE"));
        return true;
      }

      const gender = genderRaw.startsWith("M")
        ? "Male"
        : genderRaw.startsWith("F")
          ? "Female"
          : "Other";

      passengers.push({ name, age, gender });
    }

    booking.passengers = passengers;

    // ➡️ NEXT: CONTACT NUMBER
    s.state = "ASK_CONTACT_PHONE";
    await sendText(from, get("ASK_CONTACT_PHONE"));
    return true;
  }

  /* ======================================================
   ONE BY ONE MODE
====================================================== */

  /* ===============================
   STEP 1: NAME
=============================== */
  if (s.state === "PAX_ONE_NAME" && msg.type === "text") {
    const name = msg.text?.body?.trim();

    if (!name) {
      await sendText(from, "❌ Name cannot be empty.");
      return true;
    }

    booking._currentPassenger = { name };
    s.state = "PAX_ONE_AGE";

    await sendText(from, `Enter age for *${name}* (in years):`);

    return true;
  }

  /* ===============================
   STEP 2: AGE
=============================== */
  if (s.state === "PAX_ONE_AGE" && msg.type === "text") {
    const age = Number(msg.text?.body?.trim());

    if (!age || age < 1 || age > 120) {
      await sendText(from, "❌ Please enter a valid age between 1 and 120.");
      return true;
    }

    booking._currentPassenger.age = age;
    s.state = "PAX_ONE_GENDER";

    await sendButtons(from, "Select gender:", [
      { id: "GENDER_MALE", title: "Male" },
      { id: "GENDER_FEMALE", title: "Female" },
      { id: "GENDER_OTHER", title: "Other" },
    ]);

    return true;
  }

  /* ===============================
   STEP 3: GENDER
=============================== */
  if (s.state === "PAX_ONE_GENDER" && interactiveType === "button_reply") {
    let gender = null;

    if (interactiveId === "GENDER_MALE") gender = "Male";
    if (interactiveId === "GENDER_FEMALE") gender = "Female";
    if (interactiveId === "GENDER_OTHER") gender = "Other";

    if (!gender) return true;

    booking._currentPassenger.gender = gender;

    // Push completed passenger
    booking.passengers.push(booking._currentPassenger);

    delete booking._currentPassenger;

    // Check if all passengers entered
    if (booking.passengers.length === total) {
      s.state = "ASK_CONTACT_PHONE";
      await sendText(from, get("ASK_CONTACT_PHONE"));
      return true;
    }

    // Move to next passenger
    booking._paxIndex += 1;
    s.state = "PAX_ONE_NAME";

    await sendText(
      from,
      get("ENTER_NAME_PROMPT")
        .replace("{{i}}", booking._paxIndex)
        .replace("{{total}}", total),
    );

    return true;
  }

  /* ===============================
   * CONTACT PHONE (MANDATORY)
   * =============================== */

  // ❌ Reject contact cards
  if (s.state === "ASK_CONTACT_PHONE" && msg.type === "contacts") {
    await sendText(from, get("INVALID_PHONE"));
    return true;
  }

  // ✅ Validate typed phone
  if (s.state === "ASK_CONTACT_PHONE" && msg.type === "text") {
    let phoneRaw = msg.text?.body?.trim();
    if (!phoneRaw) {
      await sendText(from, get("INVALID_PHONE"));
      return true;
    }

    // Remove non-digits
    let phone = phoneRaw.replace(/\D/g, "");

    // Remove 91 prefix if present
    if (phone.startsWith("91") && phone.length === 12) {
      phone = phone.slice(2);
    }

    // Must be exactly 10 digits
    if (phone.length !== 10) {
      await sendText(from, get("INVALID_PHONE"));
      return true;
    }

    // Must start with 6–9 (Indian mobile validation)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      await sendText(
        from,
        "❌ Invalid mobile number.\nPlease enter a valid 10-digit Indian mobile number.",
      );
      return true;
    }

    booking.contactPhone = phone;

    /* ===============================
     * REVIEW + CONFIRM
     * =============================== */
    s.state = "BOOKING_REVIEW";

    await sendText(from, buildBusSummary(booking));

    await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
      { id: "CONFIRM_BOOKING", title: get("CONFIRM_BOOKING") },
      { id: "EDIT_BOOKING", title: get("EDIT_BOOKING") },
    ]);

    return true;
  }

  return false;
};
