
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
        "❌ Invalid format.\n\nExample:\nCoimbatore to Chennai Cheran 26-03-2026 10:50PM Lower"
      );
      return true;
    }

    try {
      const timeMatch = text.match(/\b\d{1,2}:\d{2}\s?(AM|PM)?\b/i);
      const dateMatch = text.match(/\b\d{1,2}-\d{1,2}-\d{4}\b/);

      if (!timeMatch || !dateMatch) {
        await sendText(
          from,
          "❌ Missing required details.\n\nFormat:\nFrom to To TrainName 26-03-2026 10:50PM Lower"
        );
        return true;
      }

      const time = timeMatch[0];
      const dateObj = parseManualDate(dateMatch[0]);

      if (!dateObj) {
        await sendText(from, "❌ Invalid date. Use DD-MM-YYYY.");
        return true;
      }

      const formattedDate = formatDate(dateObj);

      const [fromPart, rest] = text.split(/ to /i);
      const restParts = rest.split(" ");

      const toStation = restParts[0];
      const trainName = restParts.slice(1, restParts.length - 3).join(" ");

      s.pendingBooking = {
        type: "TRAIN",
        user: from,
        from: fromPart.trim(),
        to: toStation.trim(),
        trainName: trainName.trim(),
        date: formattedDate,
        departureTime: time,
        berthPref: restParts[restParts.length - 1],
        paxCount: null,
        passengers: [],
        quickMode: true,
        status: "DRAFT",
      };

      s.state = "TRAIN_PASSENGERS";

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
        "🚆 *How would you like to enter journey details?*\n\n" +
          "1️⃣ *One by One*\n" +
          "Enter details step-by-step:\n" +
          "• From station\n• To station\n• Date\n• Train Name\n• Time\n• Berth\n\n" +
          "2️⃣ *Group Entry*\n" +
          "Send everything in one message.\n\n" +
          "Example:\nCoimbatore to Chennai Cheran 26-03-2026 10:50PM Lower",
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
          await sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
          return true;
        }

        if (interactiveId === "QB_GROUP_ENTRY") {
          s.state = STATES.GROUP_WAITING;

          await sendText(
            from,
            "📝 Send all journey details in one message.\n\nFormat:\nFrom to To TrainName 26-03-2026 10:50PM Lower"
          );

          return true;
        }
      }

      return true;

    /* ================= FROM ================= */

    case STATES.FROM: {
      // Handle number selection
      if (/^\d+$/.test(input) && s.cityOptions?.length) {
        const pick = s.cityOptions[Number(input) - 1];

        if (!pick) {
          await sendText(from, "❌ Invalid number. Please choose from the list.");
          return true;
        }

        s.quick.from = pick.name;
        s.cityOptions = null;
        s.state = STATES.TO;

        await sendText(from, t(lang, "TRAIN_TO_PROMPT"));
        return true;
      }

      const result = await resolveCitySmart(input);

      if (result.type === "exact") {
        s.quick.from = result.city.name;
        s.state = STATES.TO;

        await sendText(from, t(lang, "TRAIN_TO_PROMPT"));
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

      await sendText(from, t(lang, "TRAIN_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= TO ================= */

    case STATES.TO: {
      // Handle number selection
      if (/^\d+$/.test(input) && s.cityOptions?.length) {
        const pick = s.cityOptions[Number(input) - 1];

        if (!pick) {
          await sendText(from, "❌ Invalid number. Please choose from the list.");
          return true;
        }

        if (pick.name === s.quick.from) {
          await sendText(from, t(lang, "TRAIN_FROM_TO_SAME"));
          return true;
        }

        s.quick.to = pick.name;
        s.cityOptions = null;
        s.state = STATES.DATE;

        return sendList(from, t(lang, "TRAIN_DATE_PROMPT"), "Select Date", [
          {
            title: "Available Options",
            rows: [
              { id: "DATE_TODAY", title: "Today" },
              { id: "DATE_TOMORROW", title: "Tomorrow" },
              { id: "DATE_DAY_AFTER", title: "Day After Tomorrow" },
              { id: "DATE_MANUAL", title: "Pick Another Date" },
            ],
          },
        ]);
      }

      const result = await resolveCitySmart(input);

      if (result.type === "exact") {
        if (result.city.name === s.quick.from) {
          await sendText(from, t(lang, "TRAIN_FROM_TO_SAME"));
          return true;
        }

        s.quick.to = result.city.name;
        s.state = STATES.DATE;

        return sendList(from, t(lang, "TRAIN_DATE_PROMPT"), "Select Date", [
          {
            title: "Available Options",
            rows: [
              { id: "DATE_TODAY", title: "Today" },
              { id: "DATE_TOMORROW", title: "Tomorrow" },
              { id: "DATE_DAY_AFTER", title: "Day After Tomorrow" },
              { id: "DATE_MANUAL", title: "Pick Another Date" },
            ],
          },
        ]);
      }

      await sendText(from, t(lang, "TRAIN_CITY_NOT_UNDERSTOOD"));
      return true;
    }

    /* ================= DATE ================= */

    case STATES.DATE:
      if (msg?.type === "text") {
        const manualDate = parseManualDate(input);

        if (!manualDate) {
          await sendText(
            from,
            "📅 Enter date in DD-MM-YYYY\nExample: 26-03-2026"
          );
          return true;
        }

        s.quick.date = formatDate(manualDate);
        s.state = STATES.TRAIN;

        await sendText(from, "🚆 Enter Train Name\n\nExample:\nCheran Express");

        return true;
      }

      return true;

    /* ================= TRAIN ================= */

    case STATES.TRAIN:
      s.quick.trainName = input;
      s.state = STATES.TIME;

      await sendText(from, "⏰ Enter Departure Time\n\nExample:\n10:50 PM");

      return true;

    /* ================= TIME ================= */

    case STATES.TIME:
      s.quick.time = input;
      s.state = STATES.BERTH;

      await sendText(from, "🛏 Enter Berth Preference\n\nExample:\nLower");

      return true;

    /* ================= BERTH ================= */

    case STATES.BERTH:
      s.quick.berth = input;

      s.pendingBooking = {
        type: "TRAIN",
        user: from,
        from: s.quick.from,
        to: s.quick.to,
        date: s.quick.date,
        trainName: s.quick.trainName,
        departureTime: s.quick.time,
        berthPref: s.quick.berth,
        paxCount: null,
        passengers: [],
        quickMode: true,
        status: "DRAFT",
      };

      delete s.quick;

      s.state = "TRAIN_PASSENGERS";

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
