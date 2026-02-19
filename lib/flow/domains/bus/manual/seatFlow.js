const { sendText, sendImage } = require("../../../../waClient");

const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

/* ======================================================
   Normalize Seat Map
====================================================== */
function normalizeSeatMap(seatMap = {}) {
  return {
    upper: Array.isArray(seatMap.availableUpper)
      ? seatMap.availableUpper
      : [],
    lower: Array.isArray(seatMap.availableLower)
      ? seatMap.availableLower
      : [],
    ladies: Array.isArray(seatMap.ladies)
      ? seatMap.ladies
      : [],
  };
}

/* ======================================================
   Build Seat Selection Message
====================================================== */
function buildSeatMessage(seatMap, gender) {
  const { upper, lower, ladies } = normalizeSeatMap(seatMap);

  const showLadies = gender === "Female";

  let msg = "🪑 *Choose your seat* 👇\n\n";
  msg += "🟢 *Available Seats*\n\n";

  if (upper.length) {
    msg += "⬆️ *Upper Deck*\n";
    msg += upper.join(", ");
    msg += "\n\n";
  }

  if (lower.length) {
    msg += "⬇️ *Lower Deck*\n";
    msg += lower.join(", ");
    msg += "\n\n";
  }

  if (showLadies && ladies.length) {
    msg += "🚺 *Ladies Seats*\n";
    msg += ladies.join(", ");
    msg += "\n\n";
  }

  msg +=
    "👉 Reply with the *seat code only*\n\n" +
    "Examples:\n" +
    "• `U11`\n" +
    "• `L15`\n\n" +
    "⚠️ Please verify the seat from the image above before replying.";

  return msg;
}

/* ======================================================
   Send Seat Layout (Image + Text)
====================================================== */
async function sendSeatLayout(ctx, image) {
  const { session } = ctx;

  try {
    if (!session?.bookingUser) {
      console.warn("⚠️ sendSeatLayout: Missing bookingUser");
      return false;
    }

    if (!session?.seatMap) {
      console.warn("⚠️ sendSeatLayout: Missing seatMap");
      return false;
    }

    if (!image) {
      console.warn("⚠️ sendSeatLayout: Missing image");
    }

    const user = session.bookingUser;
    const bookingId = session.bookingId;

    const gender = Array.isArray(session.passengers)
      ? session.passengers[0]?.gender || "Male"
      : "Male";

    console.log("🪑 Sending seat layout", {
      bookingId,
      user,
    });

    /* =========================
       Send Image (optional)
    ========================= */
    if (image) {
      try {
        await sendImage(user, image);
      } catch (err) {
        console.error("❌ Seat image send failed", {
          bookingId,
          user,
          error: err.response?.data || err.message,
        });
      }
    }

    /* =========================
       Send Seat Text
    ========================= */
    const message = buildSeatMessage(session.seatMap, gender);

    try {
      await sendText(user, message);
    } catch (err) {
      console.error("❌ Seat text send failed", {
        bookingId,
        user,
        error: err.response?.data || err.message,
      });

      await sendText(
        user,
        "❌ Unable to send seat options. Please try again."
      );

      return false;
    }

    /* =========================
       Activate Seat Selection
    ========================= */
    session.seatSelectionActive = true;
    session.selectedSeat = null;
    session.tempSelectedSeat = null;
    session.tempSelectedDeck = null;

    console.log("🪑 Seat layout sent successfully", {
      bookingId,
      user,
    });

    return true;

  } catch (err) {
    console.error("🔥 FATAL sendSeatLayout error", {
      bookingId: session?.bookingId,
      user: session?.bookingUser,
      error: err.message,
    });

    if (session?.bookingUser) {
      await sendText(
        session.bookingUser,
        "❌ Something went wrong while sending seat layout."
      );
    }

    if (RAW_ADMIN) {
      await sendText(
        RAW_ADMIN,
        `❌ Seat layout failed

🆔 Booking ID: ${session?.bookingId || "-"}
👤 User: ${session?.bookingUser || "-"}

━━━━━━━━━━━━━━━━━━
👉 NEXT STEP:
Resend SEAT_OPTIONS with seat image.`
      );
    }

    return false;
  }
}

module.exports = sendSeatLayout;
