const { sendText, sendList, sendButtons } = require("../../../waClient");
const stationSearch = require("./api/stationSearch");
const optionSets = require("../../../i18n/optionSets");
const translate = require("google-translate-api-x");
const handleTrainSelection = require("./trainSelection");

const {
  saveBooking,
  generateReadableBookingId,
} = require("../../../bookingStore");

const { updateBooking } = require("../../../bookingStore");
const TRAIN_MANUAL_STATES = require("./manual/states");
const { handleFinalConfirmation } = require("./manual/finalConfirmation");
const BOOKING_STATUS = require("./bookingStates");

const handleTrainMode = require("../train/modeSelector");
const handleQuickBook = require("./quickbook");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
 * Language helper (SAFE)
 * ====================================================== */
function t(lang, key) {
  return optionSets[lang]?.[key] ?? optionSets.en[key] ?? key;
}

/* ======================================================
 * Utils
 * ====================================================== */
function isValidFutureDate(input) {
  if (!input) return false;
  if (!/^\d{2}-\d{2}-\d{4}$/.test(input)) return false;

  const [dd, mm, yyyy] = input.split("-").map(Number);
  const selected = new Date(yyyy, mm - 1, dd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected >= today;
}

function safeText(msg, text) {
  if (typeof text === "string") return text.trim();
  if (msg?.text?.body) return msg.text.body.trim();
  return null;
}

/* ======================================================
 * 🌍 Translate to English (input only)
 * ====================================================== */
async function translateToEnglish(input, lang) {
  if (!input || lang === "en") return input;
  if (/^[a-zA-Z\s]+$/.test(input)) return input;

  try {
    const res = await translate(input, { to: "en" });
    return res.text;
  } catch (err) {
    console.error("❌ Translation failed:", err.message);
    return input;
  }
}

/* ======================================================
 * Station helpers
 * ====================================================== */
function formatStationList(stations, titleKey, lang) {
  return (
    `🚉 *${t(lang, titleKey)}*\n` +
    `${t(lang, "NUMBER_SELECT_HINT")}\n\n` +
    stations.map((s, i) => `${i + 1}. ${s.name} (${s.code})`).join("\n")
  );
}

async function resolveStations(query, lang) {
  if (!query || query.length < 2) return [];
  const translated = await translateToEnglish(query.trim(), lang);
  return stationSearch(translated, 6);
}

/* ======================================================
 * LIST SENDERS (TEXT ONLY CHANGED)
 * ====================================================== */

function sendClass(from, lang) {
  return sendList(from, t(lang, "TRAIN_CLASS_HELP"), t(lang, "CHOOSE_CLASS"), [
    {
      title: t(lang, "AVAILABLE_CLASSES"),
      rows: [
        { id: "CLASS_SL", title: t(lang, "TRAIN_CLASS_SL") },
        { id: "CLASS_3A", title: t(lang, "TRAIN_CLASS_3A") },
        { id: "CLASS_2A", title: t(lang, "TRAIN_CLASS_2A") },
        { id: "CLASS_CC", title: t(lang, "TRAIN_CLASS_CC") },
        { id: "CLASS_2S", title: t(lang, "TRAIN_CLASS_2S") },
      ],
    },
  ]);
}

function sendQuota(from, lang) {
  return sendList(from, t(lang, "TRAIN_QUOTA_HELP"), t(lang, "CHOOSE_QUOTA"), [
    {
      title: t(lang, "QUOTA_TYPE"),
      rows: [
        { id: "QUOTA_GEN", title: t(lang, "TRAIN_QUOTA_GN") },
        { id: "QUOTA_TATKAL", title: t(lang, "TRAIN_QUOTA_TATKAL") },
        { id: "QUOTA_PT", title: t(lang, "TRAIN_QUOTA_PT") },
        { id: "QUOTA_LADIES", title: t(lang, "TRAIN_QUOTA_LADIES") },
        { id: "QUOTA_SC", title: t(lang, "TRAIN_QUOTA_SENIOR") },
      ],
    },
  ]);
}

function sendBerth(from, lang) {
  return sendList(from, t(lang, "TRAIN_BERTH_HELP"), t(lang, "CHOOSE_BERTH"), [
    {
      title: t(lang, "BERTH_PREFERENCE"),
      rows: [
        { id: "BERTH_L", title: t(lang, "BERTH_L") },
        { id: "BERTH_M", title: t(lang, "BERTH_M") },
        { id: "BERTH_U", title: t(lang, "BERTH_U") },
        { id: "BERTH_SL", title: t(lang, "BERTH_SL") },
        { id: "BERTH_SU", title: t(lang, "BERTH_SU") },
        { id: "BERTH_NONE", title: t(lang, "BERTH_NONE") },
      ],
    },
  ]);
}

function sendPassengers(from, lang) {
  return sendList(
    from,
    t(lang, "PASSENGER_COUNT_HELP"),
    t(lang, "PASSENGERS"),
    [
      {
        title: t(lang, "PASSENGER_COUNT"),
        rows: [
          { id: "PAX_1", title: "1" },
          { id: "PAX_2", title: "2" },
          { id: "PAX_3", title: "3" },
          { id: "PAX_4", title: "4" },
          { id: "PAX_5", title: "5" },
          { id: "PAX_6", title: "6" },
        ],
      },
    ],
  );
}

/* ======================================================
 * MAIN TRAIN BOOKING FLOW
 * ====================================================== */
module.exports = async function trainBookingFlow(ctx) {
  if (ctx.session?.state?.startsWith("BUS_")) {
    return false;
  }
  const { session: s, msg, text, interactiveType, interactiveId, from } = ctx;
  const lang = s.lang || "en";

  try {
    const cleanText = safeText(msg, text);
    const upper = cleanText?.toUpperCase();

    /* ======================================================
   TRAIN SELECTION (T1, T2, T3...)
====================================================== */

    if (await handleTrainSelection(ctx, cleanText)) {
      return true;
    }

    /* ======================================================
   TRAIN SELECT (USER CHOOSES TRAIN)
====================================================== */

    if (s.state === "TRAIN_SELECT") {
      const index = Number(cleanText) - 1;

      const train = s.availableTrains?.[index];

      if (!train) {
        await sendText(from, "⚠️ Please reply with a valid train number.");
        return true;
      }

      s.pendingBooking.trainNo = train.trainNo;
      s.pendingBooking.trainName = train.trainName;
      s.pendingBooking.departureTime = train.departure;
      s.pendingBooking.arrivalTime = train.arrival;

      await sendText(
        from,
        `✅ *Train Selected*

🚆 *${train.trainNo} ${train.trainName}*
🕐 ${train.departure} → ${train.arrival}`,
      );

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚆 *Train Selected*

🆔 ${s.bookingId}
👤 ${from}

🚆 ${train.trainNo} ${train.trainName}
🕐 ${train.departure} → ${train.arrival}`,
        );
      }

      s.state = "TRAIN_CLASS";

      await sendClass(from, lang);

      return true;
    }

    const isUserMessage = msg?.type === "text" || msg?.type === "interactive";

    if (!isUserMessage) return true;

    /* ================= TRAIN MODE ================= */

    const modeResult = await handleTrainMode(ctx);

    if (modeResult === "MODE_HANDLED") return true;

    if (modeResult === "QUICK") {
      return handleQuickBook(ctx);
    }

    if (modeResult === "SEARCH") {
      s.state = "TRAIN_FROM";
      await sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
      return true;
    }

    if (s.state?.startsWith("TRAIN_QUICK_BOOK")) {
      return handleQuickBook(ctx);
    }

    /* ======================================================
   🔥 MANUAL FLOW ROUTING (ADMIN → USER)
====================================================== */

    /* ================================================
   TRAIN AVAILABILITY BUTTON HANDLER
====================================================== */

    const buttonId =
      interactiveId ||
      msg?.interactive?.button_reply?.id ||
      msg?.interactive?.list_reply?.id;

    console.log("🔍 BUTTON DEBUG");
    console.log("STATE:", s.state);
    console.log("BOOKING ID:", s.bookingId);
    console.log("BUTTON:", buttonId);

    if (
      buttonId &&
      s.state === TRAIN_MANUAL_STATES.AWAITING_AVAILABILITY_DECISION
    ) {
      if (!s.bookingId && s.pendingBooking?.id) {
        s.bookingId = s.pendingBooking.id;
      }

      return await handleFinalConfirmation(ctx);
    }

    // Handle Fare Sent → Payment buttons
    if (s.state === TRAIN_MANUAL_STATES.FARE_SENT) {
      if (buttonId === "PROCEED_PAYMENT") {
        s.state = TRAIN_MANUAL_STATES.PAYMENT_PENDING;

        if (s.bookingId) {
          updateBooking(s.bookingId, {
            status: BOOKING_STATUS.PAYMENT_PENDING,
          });
        }

        return true;
      }
      //checking branches

      if (buttonId === "CANCEL_BOOKING") {
        s.state = TRAIN_MANUAL_STATES.CANCELLED;

        if (s.bookingId) {
          updateBooking(s.bookingId, {
            status: BOOKING_STATUS.CANCELLED,
          });
        }

        await sendText(
          from,
          "🚫 Booking cancelled successfully.\n\nType *BOOK AGAIN* to start a new booking.",
        );

        return true;
      }
    }

    if (upper === "RETRY") return resend(ctx);

    if (upper === "BOOK AGAIN") {
      s.pendingBooking = null;
      s.stationOptions = null;
      s.state = null;
      s.bookingId = null;
      await sendText(from, t(lang, "BOOK_AGAIN_MSG"));
      return false;
    }

    if (!s.state) {
      s.pendingBooking = {
        type: "TRAIN",
        origin: null,
        destination: null,
        date: null,
        class: null,
        quota: null,
        berth: null,
        paxCount: null,
        status: BOOKING_STATUS.DRAFT,
      };

      s.state = "TRAIN_FROM";
      await sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
      return true;
    }

    if (s.state === "TRAIN_FROM") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.stationOptions?.[Number(cleanText) - 1];
        if (!pick) {
          await sendText(from, t(lang, "INVALID_NUMBER"));
          return true;
        }

        s.pendingBooking.origin = pick;
        s.stationOptions = null;
        s.state = "TRAIN_TO";
        await sendText(from, t(lang, "TRAIN_TO_PROMPT"));
        return true;
      }

      const stations = await resolveStations(cleanText, lang);
      if (!stations.length) {
        await sendText(from, t(lang, "NO_STATIONS_FOUND"));
        return true;
      }

      s.stationOptions = stations;
      await sendText(
        from,
        formatStationList(stations, "SELECT_FROM_STATION", lang),
      );
      return true;
    }

    if (s.state === "TRAIN_TO") {
      if (/^\d+$/.test(cleanText)) {
        const pick = s.stationOptions?.[Number(cleanText) - 1];
        if (!pick || pick.code === s.pendingBooking.origin.code) {
          await sendText(from, t(lang, "FROM_TO_SAME_ERROR"));
          return true;
        }

        s.pendingBooking.destination = pick;
        s.stationOptions = null;
        s.state = "TRAIN_DATE";
        await sendText(from, t(lang, "TRAIN_DATE_PROMPT"));
        return true;
      }

      const stations = await resolveStations(cleanText, lang);
      if (!stations.length) {
        await sendText(from, t(lang, "NO_STATIONS_FOUND"));
        return true;
      }

      s.stationOptions = stations;
      await sendText(
        from,
        formatStationList(stations, "SELECT_TO_STATION", lang),
      );
      return true;
    }

    if (s.state === "TRAIN_DATE") {
      if (!isValidFutureDate(cleanText)) {
        await sendText(from, t(lang, "INVALID_DATE_MSG"));
        return true;
      }

      s.pendingBooking.date = cleanText;

      s.state = "TRAIN_CLASS";

      await sendClass(from, lang);

      return true;
    }

    if (s.state === "TRAIN_CLASS" && interactiveType === "list_reply") {
      s.pendingBooking.class = msg.interactive.list_reply.title;
      s.state = "TRAIN_QUOTA";
      await sendQuota(from, lang);
      return true;
    }

    if (s.state === "TRAIN_QUOTA" && interactiveType === "list_reply") {
      s.pendingBooking.quota = msg.interactive.list_reply.title;
      s.state = "TRAIN_BERTH";
      await sendBerth(from, lang);
      return true;
    }

    if (s.state === "TRAIN_BERTH" && interactiveType === "list_reply") {
      s.pendingBooking.berth = msg.interactive.list_reply.title;
      s.state = "TRAIN_PASSENGERS";
      await sendPassengers(from, lang);
      return true;
    }

    if (s.state === "TRAIN_PASSENGERS" && interactiveType === "list_reply") {
      s.pendingBooking.paxCount = Number(interactiveId.split("_")[1]);

      console.log("STATE:", s.state);
      console.log("interactiveType:", interactiveType);
      console.log("interactiveId:", interactiveId);
      console.log("msg.interactive:", msg?.interactive);

      if (!s.pendingBooking.paxCount) {
        await sendText(from, t(lang, "INVALID_PAX_COUNT"));
        return true;
      }

      // 🔥 If QuickBook, skip train search and go directly to passenger entry
      if (s.pendingBooking.quickMode) {
        s.state = "PAX_MODE";

        await sendButtons(
          from,
          "👥 *How would you like to enter passenger details?*\n\n" +
            "1️⃣ *Bulk Mode (All at Once)*\n" +
            "Send all passenger details in one message.\n\n" +
            "Format:\n" +
            "Name, Age, Gender\n\n" +
            "Example:\n" +
            "Ravi, 28, M\n" +
            "Priya, 25, F\n\n" +
            "2️⃣ *One by One*\n" +
            "Enter each passenger step-by-step.\n" +
            "You will be asked for:\n" +
            "• Name\n" +
            "• Age\n" +
            "• Gender\n\n" +
            "👉 Choose your preferred method below:",
          [
            { id: "PAX_BULK", title: "Bulk Mode" },
            { id: "PAX_ONEBYONE", title: "One by One" },
          ],
        );

        return true;
      }

      const bookingId = generateReadableBookingId("TRAIN");

      const savedBooking = saveBooking({
        id: bookingId,
        type: "TRAIN",

        user: from, // WhatsApp number

        from: s.pendingBooking.origin?.name,
        to: s.pendingBooking.destination?.name,

        date: s.pendingBooking.date,
        class: s.pendingBooking.class,
        quota: s.pendingBooking.quota,
        berth: s.pendingBooking.berth,
        paxCount: s.pendingBooking.paxCount,

        status: BOOKING_STATUS.PROCESSING,
      });

      s.pendingBooking.id = savedBooking.id;
      s.bookingId = savedBooking.id;
      s.state = TRAIN_MANUAL_STATES.PROCESSING;

      if (RAW_ADMIN) {
        await sendText(
          RAW_ADMIN,
          `🚆 *New Train Booking*\n\n🆔 ${savedBooking.id}\n👤 ${from}`,
        );
      }

      s.state = "PAX_MODE";

      await sendButtons(from, "👥 Choose how to enter passenger details:", [
        { id: "PAX_BULK", title: "Bulk Mode" },
        { id: "PAX_ONEBYONE", title: "One by One" },
      ]);

      return true;
    }
    console.log("⚠️ Unhandled TRAIN state:", s.state);

    return false;
  } catch (err) {
    console.error("❌ Train Booking Error:", err);
    await sendText(from, t(lang, "GENERIC_ERROR"));
    return true;
  }
};

/* ======================================================
 * RESEND HANDLER
 * ====================================================== */
async function resend(ctx) {
  const { session: s, from } = ctx;
  const lang = s.lang || "en";

  switch (s.state) {
    case "TRAIN_FROM":
      return sendText(from, t(lang, "TRAIN_FROM_PROMPT"));
    case "TRAIN_TO":
      return sendText(from, t(lang, "TRAIN_TO_PROMPT"));
    case "TRAIN_DATE":
      return sendText(from, t(lang, "TRAIN_DATE_PROMPT"));
    case "TRAIN_CLASS":
      return sendClass(from, lang);
    case "TRAIN_QUOTA":
      return sendQuota(from, lang);
    case "TRAIN_BERTH":
      return sendBerth(from, lang);
    case "TRAIN_PASSENGERS":
      return sendPassengers(from, lang);
    default:
      return sendText(from, t(lang, "HELP_FALLBACK"));
  }
}
