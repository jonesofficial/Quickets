const { sendText, sendButtons } = require("../../../../waClient");
const STATES = require("./states");

const {
  resolveCitySmart,
  formatCityList,
  parseManualDate,
  formatDate,
  t,
} = require("./quickBookHelper"); 

async function handleQuickBook(ctx) {
  const { session: s, msg, text, from } = ctx;
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

      if (result.type === "confirm") {
        s.tempCityConfirm = { field: "quick_from", city: result.city };
        await sendButtons(from, `❓ Did you mean *${result.city.name}*?`, [
          { id: "CITY_YES", title: "✅ Yes" },
          { id: "CITY_NO", title: "❌ No" },
        ]);
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
        await sendText(from, t(lang, "BUS_DATE_PROMPT"));
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
      s.quick.seat = input.toUpperCase();

      /* ===== MERGE INTO MAIN FLOW ===== */

      s.pendingBooking = {
        type: "BUS",
        user: from,
        from: s.quick.from,
        to: s.quick.to,
        date: s.quick.date,
        operator: s.quick.operator,
        departureTime: s.quick.time,
        status: "DRAFT",
        quickMode: true,
      };

      s.seatSelectionActive = true;
      s.selectedSeat = null;

      await sendText(
        from,
        `🪑 Please confirm your seat selection.\n\nType seat number again to validate:`
      );

      return true;
  }

  return false;
}

module.exports = handleQuickBook;