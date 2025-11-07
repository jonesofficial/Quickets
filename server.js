const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());


const sendText = async (to, body) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, text: { body } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
};

const sendButtonsTrainBus = async (to) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: "Welcome to Quickets! ⚡\nChoose an option to begin:" },
        action: {
          buttons: [
            { type: "reply", reply: { id: "train_btn", title: "🚆 Train" } },
            { type: "reply", reply: { id: "bus_btn", title: "🚌 Bus" } },
          ],
        },
      },
    },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
};


app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Mode:", mode);
  console.log("Token from Meta:", token);
  console.log("Our VERIFY_TOKEN:", process.env.VERIFY_TOKEN);

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});


// --- Webhook receiver (POST) --------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const msg = value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from; // user's WA number
    // 1) Handle text messages (e.g., "Book")
    if (msg.type === "text") {
      const text = msg.text.body.trim().toLowerCase();
      if (text === "book") {
        await sendButtonsTrainBus(from);
      } else {
        await sendText(
          from,
          `Welcome to Quickets! Type "Book" to start.`
        );
      }
    }

    // 2) Handle button replies
    if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
      const id = msg.interactive.button_reply.id;
      if (id === "train_btn") {
        await sendText(
          from,
          `Great! Let's book your train ✅\n\nPlease send:\n• From → To\n• Journey Date\n• Number of Passengers\n• Passenger Details (Name, Age, Gender)`
        );
      }
      if (id === "bus_btn") {
        await sendText(
          from,
          `Bus booking selected 🚌\n\nPlease send:\n• From → To\n• Travel Date\n• Preferred Time (Morning/Evening/Night)\n• Number of Seats`
        );
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));
