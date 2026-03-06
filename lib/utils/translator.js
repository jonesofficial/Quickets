const translate = require("google-translate-api-x");

const cache = new Map();

async function autoTranslate(text, lang = "en") {
  try {
    if (!text) return text;

    // skip english
    if (lang === "en") return text;

    const key = `${lang}:${text}`;

    // return cached translation
    if (cache.has(key)) {
      return cache.get(key);
    }

    const res = await translate(text, { to: lang });

    cache.set(key, res.text);

    return res.text;

  } catch (err) {
    console.log("Translation error:", err.message);
    return text;
  }
}

module.exports = autoTranslate;