const { sendText } = require("../waClient");

function isBack(text) {
  if (!text) return false;
  return text.trim().toLowerCase() === "back";
}
async function handleBack(ctx) {
  const { session, from } = ctx;

  if (!session.stateHistory || session.stateHistory.length === 0) {
    await sendText(from, "⚠️ No previous step available.", { track: false });
    return false;
  }

  const previousState = session.stateHistory.pop();
  session.state = previousState;

  if (session.data) {
    delete session.data[previousState];
  }

  await sendText(from, "🔙 Going back...\n", { track: false });

  return true;
}

module.exports = { isBack, handleBack };
