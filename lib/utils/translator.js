const translate = require("google-translate-api-x");

const cache = new Map();
const pending = new Map();

/* ===============================
   Detect if translation should be skipped
================================ */
function shouldSkip(text) {
  if (!text) return true;

  const t = text.trim();

  /* already english / ascii */
  if (/^[a-zA-Z0-9\s.,!?@#&()\-:/₹]+$/.test(t)) return true;

  /* numbers */
  if (/^\d+$/.test(t)) return true;

  /* train numbers */
  if (/^\d{4,5}/.test(t)) return true;

  /* station codes MAS NDLS */
  if (/^[A-Z]{2,5}$/.test(t)) return true;

  /* PNR */
  if (/PNR/i.test(t)) return true;

  /* routes */
  if (t.includes("→") || t.includes("->")) return true;

  /* very short text */
  if (t.length < 3) return true;

  return false;
}

/* ===============================
   Main Translation Function
================================ */
async function autoTranslate(text, lang = "en") {
  try {
    if (!text) return text;

    /* skip english target */
    if (lang === "en") return text;

    /* skip protected text */
    if (shouldSkip(text)) return text;

    const key = `${lang}:${text}`;

    /* cache hit */
    if (cache.has(key)) {
      return cache.get(key);
    }

    /* if same request already running */
    if (pending.has(key)) {
      return pending.get(key);
    }

    /* start translation */
    const promise = translate(text, { to: lang })
      .then((res) => {
        const translated = res.text;

        cache.set(key, translated);
        pending.delete(key);

        return translated;
      })
      .catch((err) => {
        pending.delete(key);
        console.log("Translation error:", err.message);
        return text;
      });

    pending.set(key, promise);

    return promise;

  } catch (err) {
    console.log("Translation error:", err.message);
    return text;
  }
}

module.exports = autoTranslate;