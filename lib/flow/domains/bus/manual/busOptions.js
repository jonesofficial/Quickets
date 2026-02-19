const path = require("path");
const { sendText } = require(
  path.resolve(__dirname, "../../../../waClient.js")
);

module.exports = async function sendBusOptions(ctx) {
  console.log("🟢 SEND BUS OPTIONS START");

  const user = ctx?.user || ctx?.from;

  if (!user) {
    console.error("❌ Missing user in sendBusOptions", ctx);
    return;
  }

  try {
    let buses;

    /* ================================
       STEP 1: Extract bus options
    ================================= */
    try {
      buses = ctx?.session?.busOptions;

      console.log("🧪 BUS OPTIONS EXTRACTED", {
        bookingId: ctx?.session?.bookingId,
        count: Array.isArray(buses) ? buses.length : "not-array",
      });
    } catch (err) {
      console.error("🔥 ERROR EXTRACTING BUS OPTIONS", {
        bookingId: ctx?.session?.bookingId,
        error: err.message,
      });
      throw err;
    }

    /* ================================
       STEP 2: Validate bus list
    ================================= */
    if (!Array.isArray(buses) || !buses.length) {
      console.warn("⚠️ NO BUS OPTIONS AVAILABLE", {
        bookingId: ctx?.session?.bookingId,
      });

      await sendText(
        user,
        "❌ No buses available at the moment.\nPlease wait while we check again."
      );

      return;
    }

    /* ================================
       STEP 3: Build message
    ================================= */
    let msg = "🚌 *Choose the bus that suits you* 👇\n\n";

    try {
      buses.forEach((b, index) => {
        const busNumber = index + 1;

        msg += `*${busNumber}️⃣ ${b?.name ?? "Unknown Bus"}*\n`;
        msg += `${b?.type ?? "-"}\n`;
        msg += `⏰ ${b?.time ?? "-"} | ⌛ ${b?.duration ?? "-"}\n`;
        msg += `💺 Seats: ${b?.seats ?? "-"}\n`;
        msg += `💰 Price: ₹${b?.price ?? "-"}\n\n`;
      });

      msg += "👉 Reply with the *bus number* to continue.";

      console.log("🧪 BUS OPTIONS MESSAGE BUILT");
    } catch (err) {
      console.error("🔥 ERROR BUILDING BUS MESSAGE", {
        bookingId: ctx?.session?.bookingId,
        error: err.message,
      });
      throw err;
    }

    /* ================================
       STEP 4: Send message
    ================================= */
    try {
      await sendText(user, msg);

      console.log("✅ BUS OPTIONS SENT SUCCESSFULLY", {
        bookingId: ctx?.session?.bookingId,
        user,
      });
    } catch (err) {
      console.error("🔥 ERROR SENDING BUS OPTIONS MESSAGE", {
        bookingId: ctx?.session?.bookingId,
        user,
        error: err.message,
      });
      throw err;
    }

    console.log("🟢 SEND BUS OPTIONS END — SUCCESS");

  } catch (err) {
    console.error("🔥🔥 FATAL SEND BUS OPTIONS ERROR", {
      bookingId: ctx?.session?.bookingId,
      user,
      error: err.message,
    });

    try {
      await sendText(
        user,
        "❌ Something went wrong while sending bus options.\nPlease try again."
      );
    } catch (sendErr) {
      console.error("🔥 ERROR SENDING FAILURE MESSAGE", sendErr);
    }
  }
};
