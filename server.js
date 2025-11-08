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


const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

// TEMP MEMORY STORAGE
let userState = {};

// SEND SIMPLE TEXT ---------------------------------------
const sendText = async (to, body) => {
  await axios.post(
    `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, text: { body } },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
};

// SEND BUTTONS -------------------------------------------
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
        action: { buttons }
      }
    },
    { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
  );
};

// MAIN OPTIONS BUTTONS -----------------------------------
const sendButtonsTrainBus = async (to) => {
  await sendButtons(to, "Welcome to Quickets ⚡\nChoose an option:", [
    { type: "reply", reply: { id: "train_btn", title: "🚆 Train" } },
    { type: "reply", reply: { id: "bus_btn", title: "🚌 Bus" } },
  ]);
};

// WEBHOOK VERIFY -----------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// MAIN WEBHOOK LISTENER ----------------------------------
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const msg = entry?.changes?.[0]?.value?.messages?.[0];
    if (!msg) return res.sendStatus(200);

    const from = msg.from;

    // If user presses button
    if (msg.type === "interactive" && msg.interactive.type === "button_reply") {
      const id = msg.interactive.button_reply.id;

      // TRAIN BUTTON ------------------------------------------------
      if (id === "train_btn") {
        userState[from] = { step: "ask_name", data: {} };
        await sendText(from, "Great! Let's book your train ✅\n\nEnter passenger name:");
      }

      // BERTH SELECTION BUTTON -------------------------------------
      if (id.startsWith("berth_")) {
        userState[from].data.berth = id.replace("berth_", "");
        userState[from].step = "ask_from";
        await sendText(from, "Enter Origin Station (From):");
      }
      return res.sendStatus(200);
    }

    // USER TEXT MESSAGE --------------------------------------------
    if (msg.type === "text") {
      const text = msg.text.body.trim();

      // START FLOW IF USER TYPES BOOK ------------------------------
      if (text.toLowerCase() === "book") {
        await sendButtonsTrainBus(from);
        return res.sendStatus(200);
      }

      // IF USER IS IN A TRAIN BOOKING FLOW -------------------------
      if (userState[from]) {
        const state = userState[from];

        if (state.step === "ask_name") {
          state.data.name = text;
          state.step = "ask_age";
          await sendText(from, "Enter passenger age:");
        }

        else if (state.step === "ask_age") {
          state.data.age = text;
          state.step = "ask_berth";

          // SEND BERTH OPTIONS AS BUTTONS
          await sendButtons(from, "Choose berth preference:", [
            { type: "reply", reply: { id: "berth_window", title: "Window" } },
            { type: "reply", reply: { id: "berth_upper", title: "Upper" } },
            { type: "reply", reply: { id: "berth_middle", title: "Middle" } },
            { type: "reply", reply: { id: "berth_sleeper", title: "Sleeper" } },
          ]);
        }

        else if (state.step === "ask_from") {
          state.data.from = text;
          state.step = "ask_to";
          await sendText(from, "Enter Destination Station (To):");
        }

        else if (state.step === "ask_to") {
          state.data.to = text;
          state.step = "ask_date";
          await sendText(from, "Enter Journey Date (DD-MM-YYYY):");
        }

        else if (state.step === "ask_date") {
          state.data.date = text;
          state.step = "done";

          const d = state.data;

          await sendText(
            from,
            `✅ Train Booking Details:\n\nName: ${d.name}\nAge: ${d.age}\nBerth: ${d.berth}\nFrom: ${d.from}\nTo: ${d.to}\nDate: ${d.date}\n\nWe will process your booking shortly ✅`
          );
        }
      } else {
        await sendText(from, "Type *Book* to begin your booking.");
      }
    }

    res.sendStatus(200);
  } catch (e) {
    console.error("ERR:", e.response?.data || e);
    res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Quickets bot running on :${PORT}`));
