// // lib/waClient.js
// const axios = require("axios");

// if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
//   console.warn("Warning: PHONE_NUMBER_ID or WHATSAPP_TOKEN not set. WhatsApp API calls will fail until set.");
// }

// const WA = axios.create({
//   baseURL: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}`,
//   headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
// });

// const safeWA = async (path, body) => {
//   try {
//     return await WA.post(path, body);
//   } catch (err) {
//     const errData = err.response?.data;
//     if (errData?.error?.code === 190) {
//       console.error("WHATSAPP TOKEN ERROR: Token invalid/expired (OAuth 190). Replace WHATSAPP_TOKEN immediately.", errData);
//     } else {
//       console.error("WhatsApp API error:", errData || err.message);
//     }
//     throw err;
//   }
// };

// const sendText = async (to, body) => {
//   return safeWA(`/messages`, {
//     messaging_product: "whatsapp",
//     to,
//     text: { body },
//   });
// };

// const sendButtons = async (to, bodyText, buttons /* [{id,title}] max 3 */) => {
//   const safeButtons = buttons.slice(0, 3).map((b) => ({
//     type: "reply",
//     reply: { id: b.id, title: b.title },
//   }));
//   return safeWA(`/messages`, {
//     messaging_product: "whatsapp",
//     to,
//     type: "interactive",
//     interactive: {
//       type: "button",
//       body: { text: bodyText },
//       action: { buttons: safeButtons },
//     },
//   });
// };

// const sendList = async (to, bodyText, buttonText, sections) => {
//   return safeWA(`/messages`, {
//     messaging_product: "whatsapp",
//     to,
//     type: "interactive",
//     interactive: {
//       type: "list",
//       body: { text: bodyText },
//       action: { button: buttonText, sections },
//     },
//   });
// };

// const sendOopsTapOptions = (to) =>
//   sendText(
//     to,
//    "Please tap one of the options shown above.\nIf it didn’t work, try again later.🙂"
//   );

// module.exports = { safeWA, sendText, sendButtons, sendList, sendOopsTapOptions };

// lib/waClient.js
const axios = require("axios");

if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
  console.warn(
    "Warning: PHONE_NUMBER_ID or WHATSAPP_TOKEN not set. WhatsApp API calls will fail until set."
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

const WA = axios.create({
  baseURL: `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}`,
  headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
});

const safeWA = async (path, body) => {
  try {
    return await WA.post(path, body);
  } catch (err) {
    const errData = err.response?.data;
    console.error("WhatsApp API error:", errData || err.message);
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
 * SEND BUTTONS
 * ========================= */
const sendButtons = async (to, bodyText, buttons) => {
  const safeButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: { id: b.id, title: b.title },
  }));

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
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
      action: { button: buttonText, sections },
    },
  });
};

/* =========================
 * SEND IMAGE
 * ========================= */
const sendImage = async (to, image, caption, isBase64 = false) => {
  const payload = isBase64
    ? {
        messaging_product: "whatsapp",
        to: normalizeToE164(to),
        type: "image",
        image: {
          mime_type: "image/png",
          data: image,
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
