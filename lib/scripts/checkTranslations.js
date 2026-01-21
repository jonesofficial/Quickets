const optionSets = require("../i18n/optionSets");

function findMissing(base, target) {
  return Object.keys(base).filter(
    (key) => !(key in target)
  );
}

const base = optionSets.en;

["ta", "hi"].forEach((lang) => {
  const missing = findMissing(base, optionSets[lang]);

  console.log(`\n❌ Missing in ${lang.toUpperCase()} (${missing.length})`);
  missing.forEach((k) => console.log(" -", k));
});
