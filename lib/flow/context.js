// lib/flow/context.js
const { maskPhone } = require("../privacy");
const { L } = require("../i18n/labels");

function buildContext(req, session) {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const msg = value?.messages?.[0];

  // No user message (status update etc.)
  if (!msg) return null;

  const from = msg.from;

  const text = msg.type === "text" ? msg.text.body.trim() : "";
  const lower = text.toLowerCase();

  let interactiveType = null;
  let interactiveId = null;

  if (msg.type === "interactive") {
    interactiveType = msg.interactive?.type || null;
    interactiveId =
      msg.interactive?.button_reply?.id ||
      msg.interactive?.list_reply?.id ||
      null;
  }

  const get = (key, vars) => L(session, key, vars);

  console.log(
    `Incoming ${msg.type} from=${maskPhone(from)} id=${msg.id}`
  );

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
