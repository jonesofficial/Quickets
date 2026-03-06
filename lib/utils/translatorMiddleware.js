const autoTranslate = require("./translator");

async function translateText(text, lang) {
  if (!text) return text;
  return autoTranslate(text, lang);
}

async function translateButtons(buttons, lang) {
  if (!buttons) return buttons;

  return Promise.all(
    buttons.map(async (btn) => ({
      ...btn,
      title: await autoTranslate(btn.title, lang)
    }))
  );
}

async function translateList(sections, lang) {
  if (!sections) return sections;

  return Promise.all(
    sections.map(async (section) => ({
      ...section,
      title: await autoTranslate(section.title, lang),
      rows: await Promise.all(
        section.rows.map(async (row) => ({
          ...row,
          title: await autoTranslate(row.title, lang),
          description: row.description
            ? await autoTranslate(row.description, lang)
            : undefined
        }))
      )
    }))
  );
}

module.exports = {
  translateText,
  translateButtons,
  translateList
};