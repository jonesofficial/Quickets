const optionSets = require("../i18n/optionSets");

const base = optionSets.en;

function issues(lang) {
  const out = [];

  for (const key of Object.keys(base)) {
    const en = base[key];
    const tr = optionSets[lang][key];

    if (!tr) continue;

    // 1️⃣ Example missing
    if (en.includes("Example:") && !/(Example:|उदाहरण:|உதாரணம்:)/.test(tr)) {
      out.push(`${key} → missing example`);
    }

    // 2️⃣ Placeholder mismatch
    const varsEn = en.match(/{{\w+}}/g) || [];
    const varsTr = tr.match(/{{\w+}}/g) || [];
    if (varsEn.join() !== varsTr.join()) {
      out.push(`${key} → placeholder mismatch`);
    }

    // 3️⃣ Multiline loss
    if (en.includes("\n") && !tr.includes("\n")) {
      out.push(`${key} → formatting lost`);
    }

    // 4️⃣ Emoji / cue loss
    if (/^[^\w]/.test(en) && !/^[^\w]/.test(tr)) {
      out.push(`${key} → emoji/cue missing`);
    }
  }

  return out;
}

["ta", "hi"].forEach((lang) => {
  const problems = issues(lang);
  console.log(`\n⚠️ UX issues in ${lang.toUpperCase()} (${problems.length})`);
  problems.forEach((p) => console.log(" -", p));
});
