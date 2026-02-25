const { sendText } = require("../waClient");
const { findBookingById, updateBooking } = require("../bookingStore");
const { markPaymentSuccess, markPaymentFailed } = require("../payments");

function normalize(num = "") {
	return String(num).replace(/\D/g, "");
}

/* ======================================================
 * HANDLE SCREENSHOT RECEIVED (FORWARD ONLY VERSION)
 * ====================================================== */

async function handleScreenshot(ctx, booking) {
	if (!booking) return false;

	if (
		booking.status !== "PAYMENT_PENDING" &&
		booking.status !== "AWAITING_MANUAL_VERIFICATION"
	) {
		return false;
	}

	if (booking.payment?.screenshotReceived) return true;

	const message = ctx.msg?.message;

	const hasImage =
		message?.imageMessage ||
		message?.ephemeralMessage?.message?.imageMessage ||
		message?.viewOnceMessage?.message?.imageMessage;

	if (!hasImage) return false;

	/* ===============================
	   Update Booking
	=============================== */

	updateBooking(booking.id, {
		status: "AWAITING_MANUAL_VERIFICATION",
		payment: {
			...booking.payment,
			screenshotReceived: true,
		},
		meta: {
			...(booking.meta || {}),
			screenshotReceivedAt: Date.now(),
		},
	});

	/* ===============================
	   Notify User
	=============================== */

	if (booking.user) {
		await sendText(
			booking.user,
`📸 *Screenshot Received*

🧾 Booking ID: *${booking.id}*

⏳ Your payment is under manual verification.
You will be notified once confirmed.

— *Team Quickets*`
		);
	}

	/* ===============================
	   Forward Screenshot To Admin
	=============================== */

	const ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

	if (ADMIN && ctx.client) {
		// Forward original screenshot
		await ctx.client.sendMessage(ADMIN, {
			forward: ctx.msg,
		});

		// Send booking details below it
		await sendText(
			ADMIN,
`📥 *Payment Screenshot Received*

🧾 Booking ID: *${booking.id}*
💰 Amount: ₹${booking.payment?.amount?.total || "N/A"}
👤 User: ${booking.user}

Status: AWAITING_MANUAL_VERIFICATION`
		);
	}

	return true;
}

/* ======================================================
 * ADMIN: PAYMENT RECEIVED (SUCCESS)
 * ====================================================== */

async function handleAdminPaymentReceived(from, bookingId) {
	const booking = await findBookingById(bookingId);
	if (!booking) return { error: "Booking not found." };

	if (booking.status === "CONFIRMED") {
		return { error: "Booking already confirmed." };
	}

	if (booking.status === "CANCELLED") {
		return { error: "Cannot confirm a cancelled booking." };
	}

	if (!booking.payment?.screenshotReceived && !booking.payment?.utr) {
		return { error: "No payment proof received for this booking." };
	}

	if (booking.status !== "AWAITING_MANUAL_VERIFICATION") {
		return { error: `Invalid status: ${booking.status}` };
	}

	markPaymentSuccess(booking);

	updateBooking(bookingId, {
		payment: booking.payment,
		status: "CONFIRMED",
		meta: {
			...(booking.meta || {}),
			manuallyVerifiedAt: Date.now(),
			manuallyVerifiedBy: normalize(from),
		},
	});

	if (booking.user) {
		await sendText(
			booking.user,
`💳 *Payment Verified Successfully!*

🧾 Booking ID: *${bookingId}*

🎟️ Your ticket is being processed.
Please wait for further updates.

— *Team Quickets*`
		);
	}

	return { success: true };
}

/* ======================================================
 * ADMIN: PAYMENT FAILED
 * ====================================================== */

async function handleAdminPaymentFailed(from, bookingId, reason) {
	const booking = await findBookingById(bookingId);
	if (!booking) return { error: "Booking not found." };

	if (booking.status === "PAYMENT_FAILED") {
		return { error: "Payment already marked as failed." };
	}

	if (booking.status === "CONFIRMED") {
		return { error: "Cannot fail a confirmed booking." };
	}

	markPaymentFailed(booking);

	updateBooking(bookingId, {
		payment: booking.payment,
		status: "PAYMENT_FAILED",
		meta: {
			...(booking.meta || {}),
			paymentFailureReason: reason || "Manual rejection",
			manuallyVerifiedBy: normalize(from),
			manuallyVerifiedAt: Date.now(),
		},
	});

	if (booking.user) {
		await sendText(
			booking.user,
`❌ *Payment Verification Failed*

🧾 Booking ID: *${bookingId}*

${reason ? `Reason: ${reason}\n\n` : ""}Please contact support or try again.

— *Team Quickets*`
		);
	}

	return { success: true };
}

module.exports = {
	handleScreenshot,
	handleAdminPaymentReceived,
	handleAdminPaymentFailed,
};