// lib/waClient.js
const axios = require("axios");

if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
  console.warn(
    "⚠️ Warning: PHONE_NUMBER_ID or WHATSAPP_TOKEN not set. WhatsApp API calls will fail."
  );
}

/* =========================
 * Normalize phone to E.164
 * ========================= */
function normalizeToE164(to) {
  if (!to) return to;
  const digits = String(to).replace(/\D/g, "");
  return digits.startsWith("91") ? `+${digits}` : `+91${digits}`;
}

/* =========================
 * WhatsApp Axios Client
 * ========================= */
const WA = axios.create({
  baseURL: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  },
});

const safeWA = async (path, body) => {
  try {
    return await WA.post(path, body);
  } catch (err) {
    const errData = err.response?.data;
    console.error("❌ WhatsApp API error:", errData || err.message);
    throw err;
  }
};

/* =========================
 * SEND TEXT
 * ========================= */
const sendText = async (to, body) => {
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    text: { body },
  });
};

/* =========================
 * SEND BUTTONS (REPLY ONLY)
 * ========================= */
const sendButtons = async (to, bodyText, buttons) => {
  const text =
    bodyText.length > 900 ? bodyText.slice(0, 900) : bodyText;

  const safeButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: {
      id: String(b.id).slice(0, 256),
      title: String(b.title).slice(0, 20),
    },
  }));

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text },
      action: { buttons: safeButtons },
    },
  });
};

/* =========================
 * SEND LIST
 * ========================= */
const sendList = async (to, bodyText, buttonText, sections) => {
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections,
      },
    },
  });
};

/* =========================
 * SEND IMAGE (Link OR Base64)
 * ========================= */
const sendImage = async (to, image, caption = "") => {
  const isBase64 = image?.startsWith("data:image");

  const payload = isBase64
    ? {
        messaging_product: "whatsapp",
        to: normalizeToE164(to),
        type: "image",
        image: {
          mime_type: "image/png",
          data: image.replace(/^data:image\/png;base64,/, ""),
          caption,
        },
      }
    : {
        messaging_product: "whatsapp",
        to: normalizeToE164(to),
        type: "image",
        image: {
          link: image,
          caption,
        },
      };

  return safeWA(`/messages`, payload);
};

/* =========================
 * OOPS / FALLBACK
 * ========================= */
const sendOopsTapOptions = (to) =>
  sendText(
    to,
    "Please tap one of the options shown above.\nIf it didn’t work, try again later 🙂"
  );

module.exports = {
  sendText,
  sendButtons,
  sendList,
  sendImage,
  sendOopsTapOptions,
};
