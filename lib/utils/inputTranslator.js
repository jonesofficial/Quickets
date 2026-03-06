const translate = require("google-translate-api-x");

/*
  Independent input translator
  Converts user message → English
*/

async function normalizeInput(ctx) {
  try {
    const { msg } = ctx;

    if (!msg || msg.type !== "text") return;

    const original = msg.text?.body;
    if (!original) return;

    /* Skip if already English */
    if (/^[a-zA-Z0-9\s.,!?@#&()\-]+$/.test(original)) {
      return;
    }

    const res = await translate(original, { to: "en" });

    const english = res.text;

    /* Store both versions safely */
    ctx.originalText = original;
    ctx.translatedText = english;

    /* Replace message body */
    ctx.msg.text.body = english;
    ctx.lower = english.toLowerCase();

    console.log("INPUT TRANSLATED:", original, "→", english);

  } catch (err) {
    console.log("Input translation error:", err.message);
  }
}

module.exports = normalizeInput;