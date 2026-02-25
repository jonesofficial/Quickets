// lib/waClient.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

if (!process.env.PHONE_NUMBER_ID || !process.env.WHATSAPP_TOKEN) {
  console.warn(
    "⚠️ Warning: PHONE_NUMBER_ID or WHATSAPP_TOKEN not set. WhatsApp API calls will fail.",
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
  baseURL: `https://graph.facebook.com/v24.0/${process.env.PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
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
 * MEDIA UPLOAD (REQUIRED)
 * ========================= */
async function uploadMedia(base64Image) {
  const buffer = Buffer.from(
    base64Image.replace(/^data:image\/png;base64,/, ""),
    "base64",
  );

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", buffer, {
    filename: "image.png",
    contentType: "image/png",
  });

  const res = await axios.post(
    `https://graph.facebook.com/v24.0/${process.env.PHONE_NUMBER_ID}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        ...form.getHeaders(),
      },
    },
  );

  return res.data.id; // media_id
}

/* =========================
 * SEND TEXT
 * ========================= */
const sendText = async (to, body) => {
  try {
    const res = await safeWA(`/messages`, {
      messaging_product: "whatsapp",
      to: normalizeToE164(to),
      text: { body },
    });

    console.log("✅ WhatsApp message sent:", res.data.messages?.[0]?.id);
    return res.data;
  } catch (err) {
    console.error("❌ sendText failed for:", to);
    throw err;
  }
};

/* =========================
 * SEND BUTTONS
 * ========================= */
const sendButtons = async (to, bodyText, buttons) => {
  const text = bodyText.length > 900 ? bodyText.slice(0, 900) : bodyText;

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
 * SEND IMAGE (SAFE)
 * ========================= */
/* =========================
 * SEND IMAGE (SAFE + CLOUD API)
 * ========================= */
const sendImage = async (to, image, caption = "") => {
  // Case 1: Public URL
  if (typeof image === "string" && image.startsWith("http")) {
    return safeWA(`/messages`, {
      messaging_product: "whatsapp",
      to: normalizeToE164(to),
      type: "image",
      image: {
        link: image,
        caption,
      },
    });
  }

  // Case 2: Base64 image → upload
  if (typeof image === "string" && image.startsWith("data:image")) {
    const mediaId = await uploadMedia(image);

    return safeWA(`/messages`, {
      messaging_product: "whatsapp",
      to: normalizeToE164(to),
      type: "image",
      image: {
        id: mediaId,
        caption,
      },
    });
  }

  // ✅ Case 3: Existing WhatsApp media ID (THIS WAS MISSING)
  if (typeof image === "string") {
    return safeWA(`/messages`, {
      messaging_product: "whatsapp",
      to: normalizeToE164(to),
      type: "image",
      image: {
        id: image,
        caption,
      },
    });
  }

  // ❌ Truly invalid
  throw new Error("Invalid image format passed to sendImage");
};

/* =========================
 * SEND DOCUMENT (PDF)
 * ========================= */
const sendDocument = async (to, filePath, options = {}) => {
  const {
    mimetype = "application/pdf",
    fileName = "document.pdf",
    caption = "",
  } = options;

  // Upload file first
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", fs.createReadStream(filePath), {
    filename: fileName,
    contentType: mimetype,
  });

  const uploadRes = await axios.post(
    `https://graph.facebook.com/v24.0/${process.env.PHONE_NUMBER_ID}/media`,
    form,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        ...form.getHeaders(),
      },
    },
  );

  const mediaId = uploadRes.data.id;

  // Send document using media ID
  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "document",
    document: {
      id: mediaId,
      caption,
      filename: fileName,
    },
  });
};

/* =========================
 * SEND DOCUMENT BY MEDIA ID (CLOUD API)
 * ========================= */
const sendDocumentById = async (to, mediaId, options = {}) => {
  const {
    fileName = "document.pdf",
    caption = "",
  } = options;

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "document",
    document: {
      id: mediaId,
      filename: fileName,
      caption,
    },
  });
};

/* =========================
 * OOPS / FALLBACK
 * ========================= */
async function sendOopsTapOptions(to) {
  await sendButtons(
    to,
    "⚠️ Oops! I couldn’t understand that.\n\n" +
      "Please tap one of the options above, or type:\n" +
      "• RETRY – repeat the last step\n" +
      "• BOOK AGAIN – start a new booking\n" +
      "• HELP – see available commands\n\n" +
      "Need human help?\nTap *Chat with us* to talk to our support team.",
    [{ id: "CHAT_ADMIN", title: "💬 Chat with us" }],
  );
}

module.exports = {
  sendText,
  sendButtons,
  sendList,
  sendImage,
  sendDocument,
  sendDocumentById,
  sendOopsTapOptions,
};
