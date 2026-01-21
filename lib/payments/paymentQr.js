const QRCode = require("qrcode");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const LOGO_PATH = path.join(__dirname, "../../assets/quickets-logo.png");

async function generateQR(upiLink) {
  const size = 512;

  // 1️⃣ Create QR
  const canvas = createCanvas(size, size);
  await QRCode.toCanvas(canvas, upiLink, {
    errorCorrectionLevel: "H", // REQUIRED for logo
    margin: 2,
    scale: 8,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  // 2️⃣ Load logo
  const ctx = canvas.getContext("2d");
  const logo = await loadImage(LOGO_PATH);

  // 3️⃣ Calculate logo size (20%)
  const logoSize = size * 0.22;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;

  // 4️⃣ White background behind logo (VERY IMPORTANT)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x - 8, y - 8, logoSize + 16, logoSize + 16);

  // 5️⃣ Draw logo
  ctx.drawImage(logo, x, y, logoSize, logoSize);

  // 6️⃣ Return base64
  return canvas.toDataURL("image/png");
}

module.exports = { generateQR };
