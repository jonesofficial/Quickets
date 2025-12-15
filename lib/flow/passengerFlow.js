// lib/flow/passengerFlow.js
const { sendText, sendButtons } = require("../waClient");
const { parsePassengerLine } = require("../validators");
const { nextBookingId } = require("../sessionStore");

module.exports=async function passengerFlow(ctx) {
  const { session: s, msg, interactiveType, interactiveId, from, get } = ctx;

  if (!s || !s.state || !s.state.startsWith("BUS_PAX")) return false;
  if (!s.pendingBooking) return false;

  /* =========================
   * BULK PASSENGER MODE
   * ========================= */
  if (s.state === "BUS_PAX_BULK" && msg.type === "text") {
    const want = s.pendingBooking.paxCount;

    const lines = msg.text.body
      .split(/\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);

    const parsed = [];
    for (const ln of lines) {
      const p = parsePassengerLine(ln);
      if (p) parsed.push(p);
    }

    if (parsed.length !== want) {
      await sendText(from, get("NEED_EXACT_PAX", { want, have: parsed.length }));
      return true;
    }

    s.pendingBooking.passengers = parsed;
    s.state = "BUS_SUMMARY";
    await showSummary(ctx);
    return true;
  }

  /* =========================
   * ONE BY ONE – NAME
   * ========================= */
  if (s.state === "BUS_PAX_ONE_NAME_WAIT" && msg.type === "text") {
    s.__tmpName = msg.text.body.trim();
    s.state = "BUS_PAX_ONE_AGE_WAIT";
    await sendText(from, get("ENTER_AGE"));
    return true;
  }

  /* =========================
   * ONE BY ONE – AGE
   * ========================= */
  if (s.state === "BUS_PAX_ONE_AGE_WAIT" && msg.type === "text") {
    const age = parseInt(msg.text.body.trim(), 10);
    if (isNaN(age) || age <= 0) {
      await sendText(from, get("INVALID_AGE"));
      return true;
    }

    s.__tmpAge = age;
    s.state = "BUS_PAX_ONE_GENDER_WAIT";

    await sendButtons(from, get("PICK_GENDER"), [
      { id: "G_M", title: get("G_M") },
      { id: "G_F", title: get("G_F") },
      { id: "G_O", title: get("G_O") },
    ]);
    return true;
  }

  /* =========================
   * ONE BY ONE – GENDER
   * ========================= */
  if (s.state === "BUS_PAX_ONE_GENDER_WAIT" && interactiveType === "button_reply") {
    const gender =
      interactiveId === "G_M" ? "M" :
      interactiveId === "G_F" ? "F" : "O";

    s.pendingBooking.passengers.push({
      name: s.__tmpName,
      age: s.__tmpAge,
      gender,
    });

    const total = s.pendingBooking.paxCount;

    if (s.pendingBooking.passengers.length < total) {
      s.__oneIndex++;
      s.state = "BUS_PAX_ONE_NAME_WAIT";
      await sendText(from, get("ENTER_NAME_PROMPT", {
        i: s.__oneIndex,
        total,
      }));
      return true;
    }

    s.state = "BUS_SUMMARY";
    await showSummary(ctx);
    return true;
  }

  /* =========================
   * SUMMARY ACTIONS
   * ========================= */
  if (s.state === "BUS_SUMMARY" && interactiveType === "button_reply") {
    if (interactiveId === "CONFIRM_BOOK") {
      s.pendingBooking.id = nextBookingId();
      s.pendingBooking.status = "Booked";

      s.bookings.push({
        ...s.pendingBooking,
        createdAt: Date.now(),
      });

      await sendText(from, get("CONFIRMED_BOOKING", { id: s.pendingBooking.id }));
      s.pendingBooking = null;
      s.state = "IDLE";
      return true;
    }

    if (interactiveId === "EDIT_BOOK") {
      s.state = "BUS_TIME";
      await sendText(from, get("EDIT_BOOK_PROMPT"));
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

/* =========================
 * SUMMARY VIEW
 * ========================= */
async function showSummary(ctx) {
  const { session: s, from, get } = ctx;
  const b = s.pendingBooking;

  const lines = [
    get("REVIEW_REQUEST"),
    `From: ${b.from}`,
    `To: ${b.to}`,
    `Date: ${b.date}`,
    `Time: ${b.timePref}`,
    `Pax: ${b.paxCount}`,
    `Seat: ${b.seatType}`,
    `Budget: ${b.budget || "-"}`,
    "Passengers:\n" +
      b.passengers
        .map((p, i) => `${i + 1}. ${p.name}, ${p.age}, ${p.gender}`)
        .join("\n"),
  ];

  await sendText(from, lines.join("\n"));
  await sendButtons(from, get("CONFIRM_BOOKING_PROMPT"), [
    { id: "CONFIRM_BOOK", title: get("CONFIRM_BOOK") },
    { id: "EDIT_BOOK", title: get("EDIT_BOOK") },
    { id: "CANCEL_BOOK", title: get("CANCEL_BOOK") },
  ]);
}


