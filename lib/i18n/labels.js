// lib/i18n/labels.js
const optionSets = require("./optionSets");

function L(session, key, vars = {}) {
  // 🔒 Safe guard: session or optionSet may be undefined
  const set = optionSets[session?.optionSet] || optionSets.en;
  let str = set[key] || optionSets.en[key] || key;

  for (const k in vars) {
    str = str.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), vars[k]);
  }
  return str;
}

module.exports = { L };
