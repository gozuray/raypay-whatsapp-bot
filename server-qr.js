import express from "express";
import { getBotQrStatus } from "./src/whatsapp-bot.js";

const app = express();
const PORT = 3000;

app.get("/qr", (req, res) => {
  const { qrDataUrl, state } = getBotQrStatus();

  if (!qrDataUrl) {
    return res.send("<h2>QR no disponible (bot ya conectado o sin generar)</h2>");
  }

  res.send(`
    <html>
      <body style="display:flex;flex-direction:column;align-items:center;gap:20px;font-family:sans-serif;">
        <h2>Escanea tu QR de WhatsApp</h2>
        <img src="${qrDataUrl}" style="width:300px;height:300px" />
        <p>Estado: ${state}</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log("QR server running on http://localhost:3000/qr");
});
