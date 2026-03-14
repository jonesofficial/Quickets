const fs = require("fs");
const path = require("path");

const imagePath = path.join(__dirname, "../../assets/welcome.jpg");

const cachedImage =
  "data:image/jpeg;base64," +
  fs.readFileSync(imagePath, { encoding: "base64" });

async function getWelcomeImage() {
  return cachedImage;
}

module.exports = { getWelcomeImage };