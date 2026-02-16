const path = require("path");
const { sendText } = require("../waClient");
const sendFare = require("../flow/domains/bus/manual/fareFlow");

const {
  createPayment,
  initiatePayment,
  markPaymentSuccess,
  markPaymentFailed,
} = require("../payments");

const {
  findBookingById,
  updateBooking,
  getLastBookingByUser,
} = require("../bookingStore");

async function handleDebug(ctx) {
  if (process.env.NODE_ENV === "production") return false;

  const raw = ctx.msg?.text?.body?.trim();
  if (!raw || !raw.toUpperCase().startsWith("DEBUG")) return false;

  const parts = raw.split(/\s+/);
  const action = parts[1]?.toUpperCase();

  /* =========================================
     DEBUG STATE <STATE_NAME>
  ========================================= */
  if (action === "STATE") {
    const stateName = parts[2];
    if (!stateName) {
      await sendText(ctx.from, "Usage: DEBUG STATE <STATE_NAME>");
      return true;
    }

    ctx.session.state = stateName;
    await sendText(ctx.from, `✅ State set to: ${stateName}`);
    return true;
  }

  /* =========================================
     DEBUG FARE <base> <gst> <agent>
  ========================================= */
  if (action === "FARE") {
    const base = Number(parts[2]);
    const gst = Number(parts[3]);
    const agent = Number(parts[4] || 0);

    if (isNaN(base) || isNaN(gst)) {
      await sendText(ctx.from, "Usage: DEBUG FARE <base> <gst> <agent>");
      return true;
    }

    ctx.session.fare = { base, gst, agent };
    await sendFare(ctx);
    return true;
  }

  /* =========================================
     DEBUG RUN <relativePath> [exportName]
  ========================================= */
  if (action === "RUN") {
    const targetPath = parts[2];
    const exportName = parts[3];

    if (!targetPath) {
      await sendText(ctx.from, "Usage: DEBUG RUN <relativePath> [exportName]");
      return true;
    }

    try {
      const fullPath = path.join(__dirname, "..", targetPath);
      const required = require(fullPath);

      let fn;

      if (exportName) {
        fn = required[exportName];
      } else if (typeof required === "function") {
        fn = required;
      } else {
        await sendText(
          ctx.from,
          "❌ Module loaded but no callable export found."
        );
        return true;
      }

      await fn(ctx);
      await sendText(ctx.from, `✅ Executed: ${targetPath}`);
    } catch (err) {
      console.error("DEBUG RUN ERROR:", err);
      await sendText(ctx.from, `❌ Failed to execute: ${targetPath}`);
    }

    return true;
  }

  /* =========================================
     DEBUG PAYMENT <CREATE|INIT|SUCCESS|FAIL|SHOW|AUTO>
  ========================================= */
  if (action === "PAYMENT") {
    const sub = parts[2]?.toUpperCase();

    // 🔥 Get booking via session OR fallback to latest user booking
    const booking = ctx.session.bookingId
      ? findBookingById(ctx.session.bookingId)
      : getLastBookingByUser(ctx.from);

    if (!booking) {
      await sendText(ctx.from, "⚠️ No active booking found.");
      return true;
    }

    try {
      /* ===== CREATE ===== */
      if (sub === "CREATE") {
        const fare =
          booking.fare ||
          ctx.session.lockedFare ||
          ctx.session.fare;

        if (!fare) {
          await sendText(ctx.from, "⚠️ No fare available.");
          return true;
        }

        booking.payment = createPayment({
          bookingId: booking.bookingId,
          amount: {
            baseFare: fare.base,
            taxes: fare.gst,
            fee: fare.agent,
            total:
              fare.total ||
              fare.base + fare.gst + fare.agent,
          },
        });

        updateBooking(booking.bookingId, {
          payment: booking.payment,
        });

        await sendText(ctx.from, "✅ Payment object created.");
        return true;
      }

      /* ===== INIT ===== */
      if (sub === "INIT") {
        if (!booking.payment) {
          await sendText(ctx.from, "⚠️ Payment not created yet.");
          return true;
        }

        initiatePayment(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
          status: "PAYMENT_PENDING",
        });

        await sendText(ctx.from, "✅ Payment initiated (PENDING).");
        return true;
      }

      /* ===== SUCCESS ===== */
      if (sub === "SUCCESS") {
        if (!booking.payment) {
          await sendText(ctx.from, "⚠️ No payment found.");
          return true;
        }

        markPaymentSuccess(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
          status: "CONFIRMED",
        });

        await sendText(ctx.from, "✅ Payment marked SUCCESS.");
        return true;
      }

      /* ===== FAIL ===== */
      if (sub === "FAIL") {
        if (!booking.payment) {
          await sendText(ctx.from, "⚠️ No payment found.");
          return true;
        }

        markPaymentFailed(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
          status: "PAYMENT_FAILED",
        });

        await sendText(ctx.from, "✅ Payment marked FAILED.");
        return true;
      }

      /* ===== SHOW ===== */
      if (sub === "SHOW") {
        await sendText(
          ctx.from,
          "💳 Payment Object:\n" +
            JSON.stringify(booking.payment, null, 2)
        );
        return true;
      }

      /* ===== AUTO ===== */
      if (sub === "AUTO") {
        const fare =
          booking.fare ||
          ctx.session.lockedFare ||
          ctx.session.fare || {
            base: 1000,
            gst: 50,
            agent: 20,
            total: 1070,
          };

        booking.payment = createPayment({
          bookingId: booking.bookingId,
          amount: {
            baseFare: fare.base,
            taxes: fare.gst,
            fee: fare.agent,
            total:
              fare.total ||
              fare.base + fare.gst + fare.agent,
          },
        });

        initiatePayment(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
          status: "PAYMENT_PENDING",
        });

        await sendText(
          ctx.from,
          "✅ Auto payment created & initiated."
        );
        return true;
      }

      await sendText(
        ctx.from,
        "Usage: DEBUG PAYMENT <CREATE|INIT|SUCCESS|FAIL|SHOW|AUTO>"
      );
    } catch (err) {
      await sendText(ctx.from, `❌ ${err.message}`);
    }

    return true;
  }

  /* =========================================
     DEBUG SET <key> <value>
  ========================================= */
  if (action === "SET") {
    const key = parts[2];
    const value = parts.slice(3).join(" ");

    if (!key || !value) {
      await sendText(ctx.from, "Usage: DEBUG SET <key> <value>");
      return true;
    }

    ctx.session[key] = value;
    await sendText(
      ctx.from,
      `✅ Session updated: ${key} = ${value}`
    );
    return true;
  }

  /* =========================================
     DEBUG JSON <json>
  ========================================= */
  if (action === "JSON") {
    try {
      const jsonString = raw.substring(raw.indexOf("{"));
      const parsed = JSON.parse(jsonString);

      Object.assign(ctx.session, parsed);

      await sendText(ctx.from, "✅ Session updated with JSON.");
    } catch (err) {
      await sendText(ctx.from, "❌ Invalid JSON.");
    }
    return true;
  }

  /* =========================================
     DEBUG SESSION
  ========================================= */
  if (action === "SESSION") {
    await sendText(
      ctx.from,
      "📦 Current Session:\n" +
        JSON.stringify(ctx.session, null, 2)
    );
    return true;
  }

  /* =========================================
     DEBUG CLEAR
  ========================================= */
  if (action === "CLEAR") {
    Object.keys(ctx.session).forEach((k) => delete ctx.session[k]);
    await sendText(ctx.from, "🗑 Session cleared.");
    return true;
  }

  await sendText(ctx.from, "❌ Unknown DEBUG command.");
  return true;
}

module.exports = { handleDebug };
