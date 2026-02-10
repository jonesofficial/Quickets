const path = require("path");
const { sendText } = require(
  path.resolve(__dirname, "../../../../waClient.js")
);

module.exports = async function sendBusOptions(ctx) {
  console.log("🟢 SEND BUS OPTIONS START");

  try {
    let buses;

    /* ================================
     * STEP 1: Extract bus options
     * ================================ */
    try {
      buses = ctx?.session?.busOptions;

      console.log("🧪 BUS OPTIONS EXTRACTED", {
        count: Array.isArray(buses) ? buses.length : "not-array",
      });
    } catch (err) {
      console.error("🔥 ERROR EXTRACTING BUS OPTIONS", err);
      throw err;
    }

    /* ================================
     * STEP 2: Validate bus list
     * ================================ */
    try {
      if (!Array.isArray(buses) || !buses.length) {
        console.log("❌ NO BUS OPTIONS AVAILABLE");

        await sendText(
          ctx.user,
          "❌ No buses available at the moment. Please wait while we check again."
        );
        return;
      }
    } catch (err) {
      console.error("🔥 ERROR VALIDATING BUS OPTIONS", err);
      throw err;
    }

    /* ================================
     * STEP 3: Build message
     * ================================ */
    let msg;
    try {
      msg = "🚌 *Choose the bus that suits you* 👇\n\n";

      buses.forEach((b, index) => {
        const busNumber = index + 1; // ONLY source of truth

        msg += `*${busNumber}️⃣ ${b?.name ?? "Unknown Bus"}*\n`;
        msg += `${b?.type ?? "-"}\n`;
        msg += `⏰ ${b?.time ?? "-"} | ⌛ ${b?.duration ?? "-"}\n`;
        msg += `💺 Seats: ${b?.seats ?? "-"}\n`;
        msg += `💰 Price: ₹${b?.price ?? "-"}\n\n`;
      });

      msg += "👉 Reply with the *bus number* to continue.";

      console.log("🧪 BUS OPTIONS MESSAGE BUILT");
    } catch (err) {
      console.error("🔥 ERROR BUILDING BUS MESSAGE", err);
      throw err;
    }

    /* ================================
     * STEP 4: Send message
     * ================================ */
    try {
      await sendText(ctx.user, msg);
      console.log("✅ BUS OPTIONS SENT SUCCESSFULLY");
    } catch (err) {
      console.error("🔥 ERROR SENDING BUS OPTIONS MESSAGE", err);
      throw err;
    }

    console.log("🟢 SEND BUS OPTIONS END — SUCCESS");
  } catch (err) {
    console.error("🔥🔥 FATAL SEND BUS OPTIONS ERROR", err);

    try {
      await sendText(
        ctx.user,
        "❌ Something went wrong while sending bus options.\nPlease try again."
      );
    } catch (sendErr) {
      console.error("🔥 ERROR SENDING FAILURE MESSAGE", sendErr);
    }
  }
};
//ssss