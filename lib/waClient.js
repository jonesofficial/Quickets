// lib/waClient.js
const axios = require("axios");

if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
  console.warn("Warning: PHONE_NUMBER_ID or WHATSAPP_TOKEN not set. WhatsApp API calls will fail until set.");
}

const WA = axios.create({
  baseURL: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}`,
  headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
});

const safeWA = async (path, body) => {
  try {
    return await WA.post(path, body);
  } catch (err) {
    const errData = err.response?.data;
    if (errData?.error?.code === 190) {
      console.error("WHATSAPP TOKEN ERROR: Token invalid/expired (OAuth 190). Replace WHATSAPP_TOKEN immediately.", errData);
    } else {
      console.error("WhatsApp API error:", errData || err.message);
    }
    throw err;
  }
};

const sendText = async (to, body) => {
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to,
    text: { body },
  });
};

const sendButtons = async (to, bodyText, buttons /* [{id,title}] max 3 */) => {
  const safeButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: { id: b.id, title: b.title },
  }));
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: safeButtons },
    },
  });
};

const sendList = async (to, bodyText, buttonText, sections) => {
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: { button: buttonText, sections },
    },
  });
};

const sendOopsTapOptions = (to) =>
  sendText(
    to,
    "Please use the on-screen options (buttons or the ‘Select’ list). If you can’t see them, update WhatsApp and try again. 🙂"
  );

module.exports = { safeWA, sendText, sendButtons, sendList, sendOopsTapOptions };
