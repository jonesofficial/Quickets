// index.js (ROOT)
const express = require("express");
const app = express();

const route = require("./lib/flow"); // exports FUNCTION
app.use(express.json());

app.post("/webhook", route);
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
