// const { sendText } = require("./waClient");
// const {
//   findBookingById,
//   updateBooking,
//   getAdminStats,
// } = require("./bookingStore");

// const BUS_STATES = require("./flow/domains/bus/manual/states");
// const handleBusAdmin = require("./flow/domains/bus/manual");
// const {
//   handleAdminSeatSender,
// } = require("./flow/domains/bus/manual/adminSeatSender");

// const {
//   handleBoardingPoints,
//   handleDroppingPoints,
// } = require("./flow/domains/bus/manual/boardingDropping");

// const {
//   handleAdminPaymentReceived,
//   handleAdminPaymentFailed,
// } = require("./payments/paymentConfirmation");

// const sendTicket = require("./utils/sendTicket");

// /* ======================================================
//  * ADMIN CONFIG
//  * ====================================================== */

// const RAW_ADMIN = process.env.ADMIN_PHONE || process.env.ADMIN_NUMBER;

// function normalize(num = "") {
//   return String(num).replace(/\D/g, "");
// }

// if (!RAW_ADMIN) {
//   console.warn("⚠️ ADMIN_PHONE / ADMIN_NUMBER not set in .env");
// }

// /* ======================================================
//  * Admin Command Handler
//  * ====================================================== */

// async function handleAdminCommands(ctx) {
//   try {
//     if (!ctx || !ctx.msg) return false;

//     ctx.session = ctx.session || {};
//     ctx.sendText = sendText;

//     const from = ctx.from;

//     if (!RAW_ADMIN || normalize(from) !== normalize(RAW_ADMIN)) {
//       return false;
//     }

//     /* ======================================================
//      * STORE ADMIN PDF TEMPORARILY
//      * ====================================================== */

//     if (
//       ctx.msg?.document &&
//       ctx.msg?.document?.mimetype === "application/pdf"
//     ) {
//       ctx.session = ctx.session || {};

//       const buffer = await ctx.downloadMedia();

//       if (!buffer) {
//         await sendText(ctx.from, "❌ Failed to download PDF.");
//         return true;
//       }

//       ctx.session.pendingTicketPdf = buffer;

//       await sendText(
//         ctx.from,
//         "📄 PDF received.\n\nNow send:\nSEND TICKET <BOOKING_ID>",
//       );

//       return true;
//     }

//     const text = ctx.msg?.text?.body?.trim() || ctx.msg?.image?.caption?.trim();

//     if (!text) return true;

//     const upper = text.toUpperCase();
//     console.log("🛂 ADMIN RAW TEXT:", text);

//     /* ======================================================
//      * SEAT OPTIONS
//      * ====================================================== */
//     if (
//       /^SEAT[_\s]?OPTIONS/i.test(upper) ||
//       /^SEAT[_\s]?SELECTED/i.test(upper)
//     ) {
//       return await handleAdminSeatSender(ctx, text);
//     }

//     /* ======================================================
//      * BoARDING AND DEPARTURE POINTS
//      * ====================================================== */

//     if (/^B_POINTS/i.test(upper)) {
//       return await handleBoardingPoints(ctx, text);
//     }

//     if (/^D_POINTS/i.test(upper)) {
//       return await handleDroppingPoints(ctx, text);
//     }

//     /* ======================================================
//      * BUS MANUAL FLOW
//      * ====================================================== */
//     if (/^BUS(_OPTIONS)?/i.test(upper)) {
//       await handleBusAdmin(ctx, text);
//       return true;
//     }

//     /* ======================================================
//      * TICKET PRICE (AUTO TOTAL + AGENT SUPPORT)
//      * ====================================================== */

//     if (/^TICKET_PRICE/i.test(upper)) {
//       if (!ctx.session.bookingId) {
//         await sendText(
//           from,
//           "⚠️ No active booking.\nUse PROCESS <BOOKING_ID> first.",
//         );
//         return true;
//       }

//       if (!ctx.session.bookingUser) {
//         await sendText(from, "⚠️ No booking user found in session.");
//         return true;
//       }

//       const lines = text
//         .split("\n")
//         .map((l) => l.trim())
//         .filter((l) => l && !/^TICKET_PRICE/i.test(l));

//       const fareData = {};

//       for (const line of lines) {
//         const [keyRaw, valueRaw] = line.split(/\s+/);
//         if (!keyRaw || !valueRaw) continue;

//         const key = keyRaw.toUpperCase();
//         const value = Number(valueRaw);

//         if (isNaN(value) || value < 0) continue;

//         if (key === "COST") fareData.base = value;
//         if (key === "GST") fareData.gst = value;
//         if (key === "AGENT") fareData.agent = value;
//       }

//       if (fareData.base == null) {
//         await sendText(
//           from,
//           "❌ COST is required.\n\nExample:\nTICKET_PRICE\nCOST 782\nGST 52\nAGENT 20",
//         );
//         return true;
//       }

//       // Defaults
//       fareData.gst = fareData.gst || 0;
//       fareData.agent = fareData.agent || 0;

//       const total = Number(
//         (fareData.base + fareData.gst + fareData.agent).toFixed(2),
//       );

//       // 🔥 SAVE FARE TO BOOKINGSTORE (CRITICAL)
//       updateBooking(ctx.session.bookingId, {
//         fare: {
//           base: fareData.base,
//           gst: fareData.gst,
//           agent: fareData.agent,
//           total,
//         },
//       });

//       // Optional: keep session copy for display
//       ctx.session.fare = {
//         base: fareData.base,
//         gst: fareData.gst,
//         agent: fareData.agent,
//         total,
//         source: "ADMIN",
//         createdAt: Date.now(),
//       };

//       await sendText(
//         from,
//         `✅ Fare Processed Successfully\n\n` +
//           `🎫 COST   : ₹${fareData.base}\n` +
//           `🧾 GST    : ₹${fareData.gst}\n` +
//           `💼 AGENT  : ₹${fareData.agent}\n` +
//           `━━━━━━━━━━━━━━\n` +
//           `💰 TOTAL  : ₹${total}`,
//       );

//       // Send fare to user
//       const sendFare = require("./flow/domains/bus/manual/fareFlow");
//       await sendFare(ctx);

//       await sendText(
//         from,
//         `💰 *Fare Sent to User*\n\n` +
//           `🆔 Booking ID: ${ctx.session.bookingId}\n` +
//           `👤 User: ${ctx.session.bookingUser}\n` +
//           `💰 Total: ₹${total}\n\n` +
//           `Status: Waiting for user confirmation.`,
//       );

//       return true;
//     }

//     if (/^PAYMENT\s+RECEIVED/i.test(upper)) {
//       const parts = text.split(/\s+/);

//       if (parts.length < 3) {
//         await sendText(from, "⚠️ Usage: PAYMENT RECEIVED <BOOKING_ID>");
//         return true;
//       }

//       const bookingId = parts[2];

//       const result = await handleAdminPaymentReceived(from, bookingId);

//       if (result.error) {
//         await sendText(from, `❌ ${result.error}`);
//       } else {
//         await sendText(from, `✅ Payment confirmed: ${bookingId}`);
//       }

//       return true;
//     }

//     if (/^PAYMENT\s+FAILED/i.test(upper)) {
//       const parts = text.split(/\s+/);

//       if (parts.length < 3) {
//         await sendText(from, "⚠️ Usage: PAYMENT RECEIVED <BOOKING_ID>");
//         return true;
//       }

//       const bookingId = parts[2];

//       const reason = parts.slice(3).join(" ");

//       const result = await handleAdminPaymentFailed(from, bookingId, reason);

//       if (result.error) {
//         await sendText(from, `❌ ${result.error}`);
//       } else {
//         await sendText(from, `❌ Payment marked failed: ${bookingId}`);
//       }

//       return true;
//     }

//     /* ======================================================
//      * CURRENT ACTIVE BOOKING (NEW - SAFE ADD)
//      * ====================================================== */
//     if (upper === "CURRENT") {
//       if (!ctx.session.bookingId) {
//         await sendText(from, "📭 No active booking.");
//       } else {
//         await sendText(
//           from,
//           `📌 *Current Active Booking*\n\n🆔 ${ctx.session.bookingId}`,
//         );
//       }
//       return true;
//     }

//     /* ======================================================
//      * HELP
//      * ====================================================== */
//     if (upper === "HELP") {
//       await sendText(
//         from,
//         "🛂 *Quickets Admin Commands*\n\n" +
//           "📦 *Booking*\n" +
//           "• PROCESS <BOOKING_ID>\n" +
//           "• PAUSE <BOOKING_ID>\n" +
//           "• RESUME <BOOKING_ID>\n" +
//           "• CONFIRM <BOOKING_ID>\n" +
//           "• FAIL <BOOKING_ID> <reason>\n" +
//           "• CANCEL <BOOKING_ID> <reason>\n\n" +
//           "🚌 *Bus Manual Flow*\n" +
//           "• BUS / BUS_OPTIONS\n" +
//           "• SEAT_OPTIONS\n",
//       );
//       return true;
//     }

//     /* ======================================================
//      * SEND TICKET
//      * ====================================================== */

//     if (/^SEND\s+TICKET/i.test(upper)) {
//       const parts = text.split(/\s+/);

//       if (parts.length < 3) {
//         await sendText(from, "⚠️ Usage: SEND TICKET <BOOKING_ID>");
//         return true;
//       }

//       const bookingId = parts[2];

//       if (!ctx.session?.pendingTicketPdf) {
//         await sendText(
//           from,
//           "⚠️ No PDF uploaded.\n\nPlease send the ticket PDF first.",
//         );
//         return true;
//       }

//       const booking = findBookingById(bookingId);

//       if (!booking) {
//         await sendText(from, `❌ Booking not found: ${bookingId}`);
//         return true;
//       }

//       if (booking.ticketFileName) {
//         await sendText(
//           from,
//           `⚠️ Ticket already exists for ${bookingId}.\n\nUse RESEND TICKET if needed.`,
//         );
//         return true;
//       }

//       const fs = require("fs");
//       const path = require("path");

//       const fileName = `internal_${bookingId}.pdf`;
//       const filePath = path.join(__dirname, "../tickets", fileName);

//       fs.writeFileSync(filePath, ctx.session.pendingTicketPdf);

//       updateBooking(bookingId, {
//         ticketFileName: fileName,
//       });

//       const success = await sendTicket({
//         ...booking,
//         ticketFileName: fileName,
//       });

//       delete ctx.session.pendingTicketPdf;

//       if (success) {
//         await sendText(from, `✅ Ticket sent successfully\n\n🆔 ${bookingId}`);
//       } else {
//         await sendText(from, `❌ Failed to send ticket\n\n🆔 ${bookingId}`);
//       }

//       return true;
//     }

//     /* ======================================================
//      * PARSE COMMAND
//      * ====================================================== */

//     const parts = upper.split(/\s+/);
//     const command = parts[0];
//     const bookingId = parts[1];
//     const reason = parts.slice(2).join(" ");

//     const BOOKING_COMMANDS = {
//       PROCESS: "PROCESSING",
//       CONFIRM: "CONFIRMED",
//       FAIL: "FAILED",
//       CANCEL: "CANCELLED",
//       PAUSE: "PAUSED", // NEW
//       RESUME: "PROCESSING", // NEW
//     };

//     const PAYMENT_COMMANDS = {
//       PAYSUCCESS: "SUCCESS",
//       PAYFAIL: "FAILED",
//       PAYCANCEL: "CANCELLED",
//     };

//     if (!BOOKING_COMMANDS[command] && !PAYMENT_COMMANDS[command]) {
//       await sendText(
//         from,
//         "⚠️ Unknown admin command.\nSend *HELP* to see valid commands.",
//       );
//       return true;
//     }

//     if (!bookingId) {
//       await sendText(
//         from,
//         "⚠️ Booking ID missing.\nExample: CONFIRM QB2026021201",
//       );
//       return true;
//     }

//     const booking = await findBookingById(bookingId);

//     if (!booking) {
//       await sendText(from, `❌ Booking not found: ${bookingId}`);
//       return true;
//     }

//     if (booking.type !== "BUS") {
//       await sendText(
//         from,
//         "⚠️ This system currently supports BUS bookings only.",
//       );
//       return true;
//     }

//     /* ======================================================
//      * PROCESS (UNCHANGED)
//      * ====================================================== */

//     if (command === "PROCESS") {
//       if (ctx.session.bookingId) {
//         await sendText(
//           from,
//           `⚠️ Cannot process new booking.\n\n` +
//             `📌 Active Booking: ${ctx.session.bookingId}\n\n` +
//             `Finish or cancel it first.`,
//         );
//         return true;
//       }

//       ctx.session.bookingId = bookingId;
//       ctx.session.bookingUser = booking.user;
//       ctx.session.state = BUS_STATES.BUS_SEARCH_PENDING;

//       updateBooking(bookingId, { status: "PROCESSING" });

//       if (booking.user) {
//         await sendText(
//           booking.user,
//           `🕒 *Booking Update*\n\n` +
//             `Our team has reviewed your booking request and its under review\n\n` +
//             `You will receive further updates shortly.\n\n` +
//             `— *Team Quickets*`,
//         );
//       }

//       await sendText(
//         from,
//         `✅ Booking Activated\n\n🆔 ${bookingId}\n👤 User notified: Yes`,
//       );

//       return true;
//     }

//     /* ======================================================
//      * STRICT ACTIVE BOOKING CHECK
//      * ====================================================== */

//     if (!ctx.session.bookingId) {
//       await sendText(
//         from,
//         "⚠️ No active booking.\nUse PROCESS <BOOKING_ID> first.",
//       );
//       return true;
//     }

//     if (bookingId !== ctx.session.bookingId) {
//       await sendText(
//         from,
//         `❌ Booking mismatch.\n\n` +
//           `📌 Active Booking: ${ctx.session.bookingId}\n` +
//           `❌ You sent: ${bookingId}\n\n` +
//           `Finish or cancel the active booking first.`,
//       );
//       return true;
//     }

//     const patch = {};

//     /* ======================================================
//      * PAUSE (NEW - SAFE ADD)
//      * ====================================================== */

//     if (command === "PAUSE") {
//       patch.status = "PAUSED";

//       if (booking.user) {
//         await sendText(
//           booking.user,
//           `⏸ *Booking Paused*\n\n` +
//             `🆔 Booking ID: *${bookingId}*\n\n` +
//             `Your booking has been paused due to no response.\n\n` +
//             `Reply anytime to resume.\n\n` +
//             `— *Team Quickets*`,
//         );
//       }

//       ctx.session.bookingId = null;
//       ctx.session.bookingUser = null;
//       ctx.session.state = null;
//     }

//     /* ======================================================
//      * RESUME (NEW - SAFE ADD)
//      * ====================================================== */

//     if (command === "RESUME") {
//       if (booking.status !== "PAUSED") {
//         await sendText(from, "⚠️ Only paused bookings can be resumed.");
//         return true;
//       }

//       patch.status = "PROCESSING";

//       if (booking.user) {
//         await sendText(
//           booking.user,
//           `▶️ *Booking Resumed*\n\n` +
//             `🆔 Booking ID: *${bookingId}*\n\n` +
//             `We have resumed processing your booking.\n\n` +
//             `— *Team Quickets*`,
//         );
//       }
//     }

//     /* ======================================================
//      * BOOKING STATUS COMMANDS (UNCHANGED)
//      * ====================================================== */

//     if (["CONFIRM", "FAIL", "CANCEL"].includes(command)) {
//       patch.status = BOOKING_COMMANDS[command];

//       if (command === "CONFIRM" && booking.user) {
//         await sendText(
//           booking.user,
//           `🎉 *Booking Confirmed!*\n\n` +
//             `🆔 Booking ID: *${bookingId}*\n\n` +
//             `Thank you for choosing Quickets.\n\n` +
//             `— *Team Quickets*`,
//         );
//       }

//       if (command === "FAIL" && booking.user) {
//         await sendText(
//           booking.user,
//           `❌ *Booking Update*\n\n` +
//             `${reason ? `Reason: ${reason}\n\n` : ""}` +
//             `Please try again.\n\n— *Team Quickets*`,
//         );
//       }

//       if (command === "CANCEL" && booking.user) {
//         await sendText(
//           booking.user,
//           `🚫 *Booking Cancelled*\n\n` +
//             `${reason ? `Reason: ${reason}\n\n` : ""}` +
//             `— *Team Quickets*`,
//         );
//       }

//       ctx.session.bookingId = null;
//       ctx.session.bookingUser = null;
//       ctx.session.state = null;
//     }

//     if (reason) {
//       patch.meta = {
//         ...(booking.meta || {}),
//         reason,
//       };
//     }

//     updateBooking(bookingId, patch);

//     await sendText(
//       from,
//       `✅ Update successful\n\n🆔 ${bookingId}\n📦 Status: ${patch.status || booking.status}`,
//     );

//     const stats = getAdminStats();

//     await sendText(
//       from,
//       "📊 *Admin Status*\n\n" +
//         `🕒 Pending Bus: ${stats.pendingBus}\n` +
//         `💳 Payment Pending: ${stats.paymentPending}\n` +
//         `✅ Confirmed: ${stats.confirmed}\n` +
//         `❌ Failed: ${stats.failed}\n` +
//         `🚫 Cancelled: ${stats.cancelled}`,
//     );
//     return true;
//   } catch (err) {
//     console.error("🔥 ADMIN COMMAND ERROR:", err);

//     try {
//       await sendText(
//         ctx?.from,
//         "❌ Internal error occurred. Please check server logs.",
//       );
//     } catch (notifyErr) {
//       console.error("🔥 Failed to notify admin:", notifyErr);
//     }

//     return true;
//   }
// }

// module.exports = { handleAdminCommands };
