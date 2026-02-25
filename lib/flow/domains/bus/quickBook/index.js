const { sendText, sendButtons } = require("../../../../waClient");
const STATES = require("./states");
const buildBusSummary = require("../summary"); 

const {
  resolveCitySmart,
  formatCityList,
  parseManualDate,
  formatDate,
  t,
} = require("./quickBookHelper");

async function handleQuickBook(ctx) {
  const { session: s, msg, interactiveType, interactiveId, from } = ctx;
  const lang = s.lang || "en";
  const input = msg?.text?.body?.trim();

  switch (s.state) {
    /* ================= START ================= */
    case STATES.START:
      s.quick = {};
      s.state = STATES.FROM;
      await sendText(from, t(lang, "BUS_FROM_PROMPT"));
      return true;

    /* ================= FROM ================= */
    case STATES.FROM: {
      const result = await resolveCitySmart(input);

      if (result.type === "exact") {
        s.quick.from = result.city.name;
        s.state = STATES.TO;
        await sendText(from, t(lang, "BUS_TO_PROMPT"));
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(
          from,
          formatCityList(result.cities, "SELECT_FROM_STATION", lang)
        );
        return true;
      }

      await sendText(from, t(lang, "BUS_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= TO ================= */
    case STATES.TO: {
      const result = await resolveCitySmart(input);

      if (result.type === "exact") {
        if (result.city.name === s.quick.from) {
          await sendText(from, t(lang, "BUS_FROM_TO_SAME"));
          return true;
        }

        s.quick.to = result.city.name;
        s.state = STATES.DATE;
        await sendText(from, "📅 Enter Journey Date (DD-MM-YYYY):");
        return true;
      }

      if (result.type === "list") {
        s.cityOptions = result.cities;
        await sendText(
          from,
          formatCityList(result.cities, "SELECT_TO_STATION", lang)
        );
        return true;
      }

      await sendText(from, t(lang, "BUS_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= DATE ================= */
    case STATES.DATE: {
      const manualDate = parseManualDate(input);

      if (!manualDate) {
        await sendText(
          from,
          "❌ Invalid date.\n\nPlease enter in format:\nDD-MM-YYYY"
        );
        return true;
      }

      s.quick.date = formatDate(manualDate);
      s.state = STATES.OPERATOR;
      await sendText(from, "🚌 Enter Bus Operator Name:");
      return true;
    }

    /* ================= OPERATOR ================= */
    case STATES.OPERATOR:
      s.quick.operator = input;
      s.state = STATES.TIME;
      await sendText(from, "⏰ Enter Departure Time:");
      return true;

    /* ================= TIME ================= */
    case STATES.TIME:
      s.quick.time = input;
      s.state = STATES.SEAT;
      await sendText(from, "🪑 Enter Seat Number:");
      return true;

    /* ================= SEAT ================= */
    case STATES.SEAT:
      s.quick.seat = input?.toUpperCase();
      s.state = STATES.SUMMARY;

      // 🔥 Build temporary booking object (no ID yet)
      const tempBooking = {
        type: "BUS",
        mode: "QUICKBOOK",
        user: from,
        from: s.quick.from,
        to: s.quick.to,
        date: s.quick.date,
        operator: s.quick.operator,
        departureTime: s.quick.time,
        seatNumber: s.quick.seat,
        createdAt: Date.now(),
        quickMode: true,
        status: "Awaiting Confirmation",
      };

      const summaryText = buildBusSummary(tempBooking);

      await sendText(from, summaryText);

      await sendButtons(from, "Confirm this booking?", [
        { id: "QB_CONFIRM", title: "✅ Confirm" },
        { id: "QB_EDIT", title: "✏ Edit" },
      ]);

      return true;

    /* ================= SUMMARY ACTION ================= */
    case STATES.SUMMARY:
      if (interactiveType === "button_reply") {
        if (interactiveId === "QB_CONFIRM") {
          return confirmQuickBook(ctx);
        }

        if (interactiveId === "QB_EDIT") {
          s.state = STATES.START;
          await sendText(from, "🔄 Restarting QuickBook...");
          return true;
        }
      }
      return true;
  }

  return false;
}

/* ================= CONFIRM QUICKBOOK ================= */

async function confirmQuickBook(ctx) {
  const { session: s, from } = ctx;

  const bookingId = "QB" + Date.now().toString().slice(-6);

  s.pendingBooking = {
    id: bookingId,
    type: "BUS",
    mode: "QUICKBOOK",
    user: from,
    ...s.quick,
    createdAt: Date.now(),
    quickMode: true,
    status: "QB_CONFIRMED",
  };

  s.state = "BUS_ADMIN_WAITING";

  await sendText(
    from,
    `✅ Booking Confirmed!\n\n🆔 Booking ID: *${bookingId}*\n\nWaiting for admin verification.`
  );

  return true;
}

module.exports = handleQuickBook;