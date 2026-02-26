const { sendText, sendButtons, sendList } = require("../waClient");

function isRetry(text) {
  if (!text) return false;
  return text.trim().toLowerCase() === "retry";
}

async function handleRetry(ctx) {
  const { session, from } = ctx;

  if (!session?.lastMessage) {
    return sendText(from, "⚠️ Nothing to retry.");
  }

  /* =========================
     Clear ONLY current step data
  ========================= */

  if (session.data && session.state) {
    delete session.data[session.state];
  }

  await sendText(from, "🔁 Retrying...\n");

  const last = session.lastMessage;

  switch (last.type) {
    case "text":
      return sendText(from, last.body);

    case "buttons":
      return sendButtons(from, last.bodyText, last.buttons);

    case "list":
      return sendList(
        from,
        last.bodyText,
        last.buttonText,
        last.sections
      );

    default:
      return sendText(from, "⚠️ Unable to retry.");
  }
}

module.exports = { isRetry, handleRetry };