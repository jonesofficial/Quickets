const { sendText, sendButtons, sendList } = require("../../../../waClient");
const STATES = require("./states");

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

        return sendList(
          from,
          t(lang, "BUS_DATE_PROMPT"),
          t(lang, "SELECT") || "Select Date",
          [
            {
              title: "Available Options",
              rows: [
                { id: "DATE_TODAY", title: "Today" },
                { id: "DATE_TOMORROW", title: "Tomorrow" },
                { id: "DATE_DAY_AFTER", title: "Day After Tomorrow" },
                { id: "DATE_MANUAL", title: "Pick Another Date" },
              ],
            },
          ]
        );
      }

      await sendText(from, t(lang, "BUS_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= DATE ================= */
    case STATES.DATE:
      if (msg?.type === "text") {
        const manualDate = parseManualDate(input);

        if (!manualDate) {
          await sendText(
            from,
            "📅 Enter Journey Date\n\nFormat: DD-MM-YYYY\nExample: 28-02-2026"
          );
          return true;
        }

        s.quick.date = formatDate(manualDate);
        s.state = STATES.OPERATOR;

        await sendText(
          from,
          "🚌 Enter Bus Operator Name\n\nExample:\n• KPN\n• SRS"
        );
        return true;
      }
      return true;

    /* ================= OPERATOR ================= */
    case STATES.OPERATOR:
      s.quick.operator = input;
      s.state = STATES.TIME;

      await sendText(
        from,
        "⏰ Enter Departure Time\n\nExample:\n• 10:30 PM\n• 21:45"
      );
      return true;

    /* ================= TIME ================= */
    case STATES.TIME:
      s.quick.time = input;
      s.state = STATES.SEAT;

      await sendText(
        from,
        "🪑 Enter Seat Number\n\nExample:\n• U11\n• L5"
      );
      return true;

    /* ================= SEAT ================= */
    case STATES.SEAT:
      s.quick.seat = input?.toUpperCase();

      /* 🔥 CONVERT INTO NORMAL BOOKING ENGINE */

      s.pendingBooking = {
        type: "BUS",
        user: from,
        from: s.quick.from,
        to: s.quick.to,
        date: s.quick.date,
        departureTime: s.quick.time,
        operator: s.quick.operator,
        seatNumber: s.quick.seat,
        paxCount: null,
        seatType: null,
        budget: null,
        passengers: [],
        quickMode: true,
        status: "DRAFT",
      };

      delete s.quick;

      /* 🔥 JUMP TO NORMAL PASSENGER FLOW */
      s.state = "BUS_PAX_COUNT";

      await sendList(from, "How many passengers?", "Passengers", [
        {
          title: "Select",
          rows: ["1", "2", "3", "4", "5", "6"].map((n) => ({
            id: `PAX_${n}`,
            title: n,
          })),
        },
      ]);

      return true;
  }

  return false;
}

module.exports = handleQuickBook;