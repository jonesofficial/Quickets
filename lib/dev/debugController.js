const path = require("path");
const { sendText } = require("../waClient");
const sendFare = require("../flow/domains/bus/manual/fareFlow");

const {
  createPayment,
  initiatePayment,
  markPaymentSuccess,
  markPaymentFailed,
} = require("../payments");

const { findBookingById, updateBooking } = require("../bookingStore");

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
   Example:
   DEBUG FARE 1000 50 20
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
     Example:
     DEBUG RUN flow/paymentFlow
     DEBUG RUN flow/domains/bus/manual/sendFare
  ========================================= */
  if (action === "RUN") {
    const targetPath = parts[2];
    const exportName = parts[3]; // optional

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
          "❌ Module loaded but no callable export found.",
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
   DEBUG PAYMENT <CREATE | INIT | SUCCESS | FAIL | SHOW>
   Example:
   DEBUG PAYMENT CREATE
   DEBUG PAYMENT INIT
   DEBUG PAYMENT SUCCESS
   DEBUG PAYMENT FAIL
   DEBUG PAYMENT SHOW
========================================= */
  if (action === "PAYMENT") {
    const sub = parts[2]?.toUpperCase();

    if (!ctx.session.bookingId) {
      await sendText(ctx.from, "⚠️ No active booking in session.");
      return true;
    }

    const booking = findBookingById(ctx.session.bookingId);

    if (!booking) {
      await sendText(ctx.from, "⚠️ Booking not found.");
      return true;
    }

    try {
      if (sub === "CREATE") {
        const lockedFare = ctx.session.lockedFare;

        if (!lockedFare) {
          await sendText(ctx.from, "⚠️ No lockedFare in session.");
          return true;
        }

        booking.payment = createPayment({
          bookingId: booking.bookingId,
          amount: {
            baseFare: lockedFare.base,
            taxes: lockedFare.gst,
            fee: lockedFare.agent,
            total: lockedFare.total,
          },
        });

        updateBooking(booking.bookingId, { payment: booking.payment });

        await sendText(ctx.from, "✅ Payment object created.");
        return true;
      }

      if (sub === "INIT") {
        initiatePayment(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
        });

        await sendText(ctx.from, "✅ Payment initiated (PENDING).");
        return true;
      }

      if (sub === "SUCCESS") {
        markPaymentSuccess(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
          status: "CONFIRMED",
        });

        await sendText(ctx.from, "✅ Payment marked SUCCESS.");
        return true;
      }

      if (sub === "FAIL") {
        markPaymentFailed(booking);

        updateBooking(booking.bookingId, {
          payment: booking.payment,
          status: "PAYMENT_FAILED",
        });

        await sendText(ctx.from, "✅ Payment marked FAILED.");
        return true;
      }

      if (sub === "SHOW") {
        await sendText(
          ctx.from,
          "💳 Payment Object:\n" + JSON.stringify(booking.payment, null, 2),
        );
        return true;
      }

      await sendText(
        ctx.from,
        "Usage: DEBUG PAYMENT <CREATE|INIT|SUCCESS|FAIL|SHOW>",
      );
    } catch (err) {
      await sendText(ctx.from, `❌ ${err.message}`);
    }

    return true;
  }

  /* =========================================
     DEBUG SET <key> <value><
  ========================================= */
  if (action === "SET") {
    const key = parts[2];
    const value = parts.slice(3).join(" ");

    if (!key || !value) {
      await sendText(ctx.from, "Usage: DEBUG SET <key> <value>");
      return true;
    }

    ctx.session[key] = value;
    await sendText(ctx.from, `✅ Session updated: ${key} = ${value}`);
    return true;
  }

  /* =========================================
     DEBUG JSON <json>
     Example:
     DEBUG JSON {"fare":{"base":1000,"gst":50,"agent":20}}
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
      "📦 Current Session:\n" + JSON.stringify(ctx.session, null, 2),
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
