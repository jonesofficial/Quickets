
// lib/waClient.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const { startOrGet } = require("./sessionStore");
const autoTranslate = require("./utils/translator");

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
 * MEDIA UPLOAD
 * ========================= */
async function uploadMedia(base64Image) {
  const buffer = Buffer.from(
    base64Image.replace(/^data:image\/png;base64,/, ""),
    "base64"
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
    }
  );

  return res.data.id;
}

/* =========================
 * SEND TEXT
 * ========================= */
const sendText = async (to, body, options = {}) => {
  const { track = true } = options;

  const { session } = startOrGet(to);
  const lang = session?.lang || "en";

  body = await autoTranslate(body, lang);

  if (track) {
    session.lastMessage = {
      type: "text",
      body,
    };
  }

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    text: { body },
  });
};

/* =========================
 * SEND BUTTONS
 * ========================= */
const sendButtons = async (to, bodyText, buttons, options = {}) => {
  const { track = true } = options;

  const { session } = startOrGet(to);
  const lang = session?.lang || "en";

  bodyText = await autoTranslate(bodyText, lang);

  const translatedButtons = await Promise.all(
    buttons.slice(0, 3).map(async (b) => ({
      type: "reply",
      reply: {
        id: String(b.id).slice(0, 256),
        title: (await autoTranslate(String(b.title), lang)).slice(0, 20),
      },
    }))
  );

  if (track) {
    session.lastMessage = {
      type: "buttons",
      bodyText,
      buttons,
    };
  }

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: translatedButtons },
    },
  });
};

/* =========================
 * SEND LIST
 * ========================= */
const sendList = async (to, bodyText, buttonText, sections, options = {}) => {
  const { track = true } = options;

  const { session } = startOrGet(to);
  const lang = session?.lang || "en";

  bodyText = await autoTranslate(bodyText, lang);
  buttonText = await autoTranslate(buttonText, lang);

  const translatedSections = await Promise.all(
    sections.map(async (section) => ({
      title: await autoTranslate(section.title, lang),
      rows: await Promise.all(
        section.rows.map(async (row) => ({
          ...row,
          title: await autoTranslate(row.title, lang),
          description: row.description
            ? await autoTranslate(row.description, lang)
            : undefined,
        }))
      ),
    }))
  );

  if (track) {
    session.lastMessage = {
      type: "list",
      bodyText,
      buttonText,
      sections,
    };
  }

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: translatedSections,
      },
    },
  });
};

/* =========================
 * SEND IMAGE
 * ========================= */
const sendImage = async (to, image, caption = "", options = {}) => {
  const { track = true } = options;

  const { session } = startOrGet(to);
  const lang = session?.lang || "en";

  caption = await autoTranslate(caption, lang);

  if (track) {
    session.lastMessage = {
      type: "image",
      caption,
    };
  }

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

  throw new Error("Invalid image format passed to sendImage");
};

/* =========================
 * SEND DOCUMENT
 * ========================= */
const sendDocument = async (to, filePath, options = {}) => {
  const {
    mimetype = "application/pdf",
    fileName = "document.pdf",
    caption = "",
  } = options;

  const { session } = startOrGet(to);
  const lang = session?.lang || "en";

  const translatedCaption = await autoTranslate(caption, lang);

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
    }
  );

  const mediaId = uploadRes.data.id;

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "document",
    document: {
      id: mediaId,
      caption: translatedCaption,
      filename: fileName,
    },
  });
};

/* =========================
 * SEND DOCUMENT BY MEDIA ID
 * ========================= */
const sendDocumentById = async (to, mediaId, options = {}) => {
  const { fileName = "document.pdf", caption = "" } = options;

  const { session } = startOrGet(to);
  const lang = session?.lang || "en";

  const translatedCaption = await autoTranslate(caption, lang);

  return safeWA(`/messages`, {
    messaging_product: "whatsapp",
    to: normalizeToE164(to),
    type: "document",
    document: {
      id: mediaId,
      filename: fileName,
      caption: translatedCaption,
    },
  });
};

/* =========================
 * OOPS / FALLBACK
 * ========================= */
async function sendOopsTapOptions(to) {
  await sendButtons(
    to,
    "⚠️ Oops! I couldn’t understand that.\n\nPlease tap one of the options above, or type:\n• RETRY – repeat the last step\n• BOOK AGAIN – start a new booking\n• HELP – see available commands\n\nNeed human help?\nTap *Chat with us* to talk to our support team.",
    [{ id: "CHAT_ADMIN", title: "💬 Chat with us" }]
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