// lib/flow/context.js
const { maskPhone } = require("../privacy");
const { L } = require("../i18n/labels");

function buildContext(req, session) {
  const msg = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!msg) return null;

  // 🛡️ HARD SAFETY
  if (!session) {
    console.error("❌ buildContext called without session");
    return null;
  }

  const from = msg.from;
  const maskedFrom = maskPhone(from);

  const text = msg.type === "text" ? msg.text.body.trim() : "";
  const lower = text.toLowerCase();

  let interactiveType = null;
  let interactiveId = null;

  if (msg.type === "interactive") {
    interactiveType = msg.interactive?.type || null;

    if (interactiveType === "button_reply") {
      interactiveId = msg.interactive?.button_reply?.id || null;
    }

    if (interactiveType === "list_reply") {
      interactiveId = msg.interactive?.list_reply?.id || null;
    }
  }

  // ✅ SAFE i18n getter
  // → DOES NOT block language selection
  // → Defaults to English ONLY if optionSet missing
  const get = (key, vars) =>
    L(
      { optionSet: session.optionSet || "en" },
      key,
      vars
    );

  console.log(`Incoming ${msg.type} from=${maskedFrom} id=${msg.id}`);

  return {
    req,
    msg,
    from,
    session,
    text,
    lower,
    interactiveType,
    interactiveId,
    get,
  };
}

module.exports = { buildContext };
