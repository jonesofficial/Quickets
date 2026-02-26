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

  /* ======================================================
     GROUP ENTRY MODE
  ====================================================== */
  if (s.state === STATES.GROUP_WAITING && msg?.type === "text") {
    const text = input;

    if (!text.toLowerCase().includes(" to ")) {
      await sendText(
        from,
        "❌ Invalid format.\n\nExample:\nCoimbatore to Chennai KPN Travels 26-03-2026 11:30PM L5"
      );
      return true;
    }

    try {
      const seatMatch = text.match(/\b[UL]\d+\b/i);
      const timeMatch = text.match(/\b\d{1,2}:\d{2}\s?(AM|PM)?\b/i);
      const dateMatch = text.match(/\b\d{1,2}-\d{1,2}-\d{4}\b/);

      if (!seatMatch || !timeMatch || !dateMatch) {
        await sendText(
          from,
          "❌ Missing required details.\n\nFormat:\nFrom to To Operator 26-03-2026 11:30PM L5"
        );
        return true;
      }

      const seat = seatMatch[0].toUpperCase();
      const time = timeMatch[0];
      const dateObj = parseManualDate(dateMatch[0]);

      if (!dateObj) {
        await sendText(from, "❌ Invalid date. Use DD-MM-YYYY.");
        return true;
      }

      const formattedDate = formatDate(dateObj);

      const [fromPart, rest] = text.split(/ to /i);
      const restParts = rest.split(" ");

      const toCity = restParts[0];
      const operator = restParts.slice(1, restParts.length - 3).join(" ");

      s.pendingBooking = {
        type: "BUS",
        user: from,
        from: fromPart.trim(),
        to: toCity.trim(),
        operator: operator.trim(),
        date: formattedDate,
        departureTime: time,
        seatNumber: seat,
        paxCount: null,
        seatType: null,
        budget: null,
        passengers: [],
        quickMode: true,
        status: "DRAFT",
      };

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
    } catch {
      await sendText(from, "❌ Unable to parse details. Please try again.");
      return true;
    }
  }

  /* ======================================================
     MAIN STATE SWITCH
  ====================================================== */
  switch (s.state) {

    /* ================= START ================= */
    case STATES.START:
      s.quick = {};
      s.state = STATES.ENTRY_MODE;

      await sendButtons(
        from,
        "🚌 *How would you like to enter journey details?*\n\n" +
          "1️⃣ *One by One*\n" +
          "Enter details step-by-step:\n" +
          "• From city\n• To city\n• Date\n• Operator\n• Time\n• Seat\n\n" +
          "2️⃣ *Group Entry*\n" +
          "Send everything in one message.\n\n" +
          "Example:\n" +
          "Coimbatore to Chennai KPN Travels 26-03-2026 11:30PM L5",
        [
          { id: "QB_ONE_BY_ONE", title: "One by One" },
          { id: "QB_GROUP_ENTRY", title: "Group Entry" },
        ]
      );
      return true;

    /* ================= ENTRY MODE ================= */
    case STATES.ENTRY_MODE:
      if (interactiveType === "button_reply") {

        if (interactiveId === "QB_ONE_BY_ONE") {
          s.state = STATES.FROM;
          await sendText(from, t(lang, "BUS_FROM_PROMPT"));
          return true;
        }

        if (interactiveId === "QB_GROUP_ENTRY") {
          s.state = STATES.GROUP_WAITING;
          await sendText(
            from,
            "📝 Send all journey details in one message.\n\n" +
              "Format:\nFrom to To Operator 26-03-2026 11:30PM L5"
          );
          return true;
        }
      }
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
          "Select Date",
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

      if (
        interactiveType === "list_reply" ||
        interactiveType === "button_reply"
      ) {
        const d = new Date();

        if (interactiveId === "DATE_TODAY") {
          s.quick.date = formatDate(d);
        }

        if (interactiveId === "DATE_TOMORROW") {
          d.setDate(d.getDate() + 1);
          s.quick.date = formatDate(d);
        }

        if (interactiveId === "DATE_DAY_AFTER") {
          d.setDate(d.getDate() + 2);
          s.quick.date = formatDate(d);
        }

        if (interactiveId === "DATE_MANUAL") {
          await sendText(
            from,
            "📅 Enter Journey Date\n\nFormat: DD-MM-YYYY\nExample: 28-02-2026"
          );
          return true;
        }

        if (s.quick.date) {
          s.state = STATES.OPERATOR;
          await sendText(
            from,
            "🚌 Enter Bus Operator Name\n\nExample:\n• KPN\n• SRS"
          );
          return true;
        }
      }

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