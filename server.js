// const express = require("express");
// const axios = require("axios");
// const dotenv = require("dotenv");
// dotenv.config();

// const app = express();
// app.use(express.json());


// const sendText = async (to, body) => {
//   await axios.post(
//     `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
//     { messaging_product: "whatsapp", to, text: { body } },
//     { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
//   );
// };

// const sendButtonsTrainBus = async (to) => {
//   await axios.post(
//     `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
//     {
//       messaging_product: "whatsapp",
//       to,
//       type: "interactive",
//       interactive: {
//         type: "button",
//         body: { text: "Welcome to Quickets! ⚡\nChoose an option to begin:" },
//         action: {
//           buttons: [
//             { type: "reply", reply: { id: "train_btn", title: "🚆 Train" } },
//             { type: "reply", reply: { id: "bus_btn", title: "🚌 Bus" } },
//           ],
//         },
//       },
//     },
//     { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
//   );
// };


// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   console.log("Mode:", mode);
//   console.log("Token from Meta:", token);
//   console.log("Our VERIFY_TOKEN:", process.env.VERIFY_TOKEN);

//   if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
//     return res.status(200).send(challenge);
//   }

//   return res.sendStatus(403);
// });


// // --- Webhook receiver (POST) --------------------------------
// app.post("/webhook", async (req, res) => {
//   try {
//     const entry = req.body.entry?.[0];
//     const changes = entry?.changes?.[0];
//     const value = changes?.value;
//     const msg = value?.messages?.[0];
//     if (!msg) return res.sendStatus(200);

//     const from = msg.from; // user's WA number
//     // 1) Handle text messages (e.g., "Book")
//     if (msg.type === "text") {
//       const text = msg.text.body.trim().toLowerCase();
//       if (text === "book") {
//         await sendButtonsTrainBus(from);
//       } else {
//         await sendText(
//           from,
//           `Welcome to Quickets! Type "Book" to start.`
//         );
//       }
//     }

//     // 2) Handle button replies
//     if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
//       const id = msg.interactive.button_reply.id;
//       if (id === "train_btn") {
//         await sendText(
//           from,
//           `Great! Let's book your train ✅\n\nPlease send:\n• From → To\n• Journey Date\n• Number of Passengers\n• Passenger Details (Name, Age, Gender)`
//         );
//       }
//       if (id === "bus_btn") {
//         await sendText(
//           from,
//           `Bus booking selected 🚌\n\nPlease send:\n• From → To\n• Travel Date\n• Preferred Time (Morning/Evening/Night)\n• Number of Seats`
//         );
//       }
//     }

//     res.sendStatus(200);
//   } catch (e) {
//     console.error(e.response?.data || e.message);
//     res.sendStatus(200);
//   }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Quickets bot running on :${PORT}`));


//-------------------------------------------
// Quickets WhatsApp Bot
//-------------------------------------------
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

//-------------------------------------------
// Helper: Send Normal Text
//-------------------------------------------
const sendText = async (to, body) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      text: { body },
    },
    {
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` },
    }
  );
};

//-------------------------------------------
// Helper: Send Button Template (max 3 buttons)
//-------------------------------------------
const sendButtons = async (to, text, buttons) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text },
        action: { buttons },
      },
    },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
};

//-------------------------------------------
// Helper: Berth Selection LIST (fix for button limit)
//-------------------------------------------
const sendBerthList = async (to) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: "Berth Preference" },
        body: { text: "Choose your preferred berth:" },
        action: {
          button: "Select Berth",
          sections: [
            {
              title: "Berth Options",
              rows: [
                { id: "berth_window", title: "Window" },
                { id: "berth_upper", title: "Upper" },
                { id: "berth_middle", title: "Middle" },
                { id: "berth_sleeper", title: "Sleeper" },
              ],
            },
          ],
        },
      },
    },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
};

//-------------------------------------------
// Helper: Train/Bus selection buttons
//-------------------------------------------
const sendButtonsTrainBus = async (to) => {
  await sendButtons(to, "Welcome to Quickets ⚡\nChoose an option:", [
    { type: "reply", reply: { id: "train_btn", title: "🚆 Train" } },
    { type: "reply", reply: { id: "bus_btn", title: "🚌 Bus" } },
  ]);
};

//-------------------------------------------
// USER SESSION STORE
//-------------------------------------------
const userState = {}; // { number: { step: "", data:{} } }

//-------------------------------------------
// GET Webhook (Verification)
//-------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

//-------------------------------------------
// POST Webhook (Incoming Messages)
//-------------------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const msg = value?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const from = msg.from;

    //------------------------------------------------------
    // Start: User types "Book"
    //------------------------------------------------------
    if (msg.type === "text") {
      const text = msg.text.body.trim().toLowerCase();

      if (text === "book") {
        userState[from] = { step: "train_bus", data: {} };
        await sendButtonsTrainBus(from);
        return res.sendStatus(200);
      }

      // Handle steps
      const state = userState[from];

      if (!state) {
        await sendText(from, 'Welcome to Quickets! Type "Book" to begin.');
        return res.sendStatus(200);
      }

      // STORE USER RESPONSES STEP BY STEP
      switch (state.step) {
        case "ask_name":
          state.data.name = text;
          state.step = "ask_age";
          await sendText(from, "Enter passenger age:");
          break;

        case "ask_age":
          state.data.age = text;
          state.step = "ask_berth";
          await sendBerthList(from);
          break;

        case "ask_from":
          state.data.from = text;
          state.step = "ask_to";
          await sendText(from, "Enter destination station (To):");
          break;

        case "ask_to":
          state.data.to = text;
          state.step = "ask_date";
          await sendText(from, "Enter journey date (DD-MM-YYYY):");
          break;

        case "ask_date":
          state.data.date = text;
          state.step = "ask_passengers";
          await sendText(from, "Number of passengers:");
          break;

        case "ask_passengers":
          state.data.passengers = text;
          state.step = "completed";

          await sendText(
            from,
            `✅ *Booking Summary*\n\nName: ${state.data.name}\nAge: ${state.data.age}\nBerth: ${state.data.berth}\nFrom: ${state.data.from}\nTo: ${state.data.to}\nDate: ${state.data.date}\nPassengers: ${state.data.passengers}\n\nWe will now search trains...`
          );
          break;

        default:
          await sendText(from, "Type 'Book' to begin booking.");
      }

      return res.sendStatus(200);
    }

    //------------------------------------------------------
    // HANDLE BUTTONS (Train / Bus)
    //------------------------------------------------------
    if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
      const id = msg.interactive.button_reply.id;

      // Train selected
      if (id === "train_btn") {
        userState[from] = { step: "ask_name", data: {} };
        await sendText(from, "Great! Enter passenger *name*:");
      }

      // Bus selected
      if (id === "bus_btn") {
        await sendText(from, "🚌 Bus booking flow coming soon!");
      }

      return res.sendStatus(200);
    }

    //------------------------------------------------------
    // LIST REPLY (Berth selection)
    //------------------------------------------------------
    if (msg.type === "interactive" && msg.interactive.type === "list_reply") {
      const id = msg.interactive.list_reply.id;

      if (id.startsWith("berth_")) {
        userState[from].data.berth = id.replace("berth_", "");
        userState[from].step = "ask_from";
        await sendText(from, "Enter Origin Station (From):");
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error(e.response?.data || e.message);
    res.sendStatus(200);
  }
});

//-------------------------------------------
// Start Server
//-------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Quickets bot running on port: ${PORT}`)
);
