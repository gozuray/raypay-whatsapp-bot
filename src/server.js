import express from "express";
import {
  getStatus,
  getBotQrStatus,
  sendWhatsAppMessage,
  startBot,
} from "./whatsapp-bot.js";

const app = express();
app.use(express.json());

function ensureReady(res) {
  const status = getStatus();
  if (!status.ready) {
    res.status(503).json({ error: "El bot no está listo", status });
    return { ready: false, status };
  }
  return { ready: true, status };
}

app.get("/status", (_req, res) => {
  const status = getStatus();
  res.json({
    ready: status.ready,
    connected: status.connected,
    hasQR: status.hasQR,
  });
});

app.get("/qr", async (_req, res) => {
  try {
    await startBot();
  } catch (error) {
    res
      .status(502)
      .json({ error: error?.message || "No se pudo iniciar el bot" });
    return;
  }

  const { qrDataUrl, updatedAt, state, lastError, ready } = getBotQrStatus();

  res.json({ qrDataUrl: qrDataUrl || null, updatedAt, state, lastError, ready });
});

app.post("/send", async (req, res) => {
  const { ready } = ensureReady(res);
  if (!ready) return;

  const { phone, message } = req.body || {};

  if (!phone || !message) {
    res
      .status(400)
      .json({ error: "Se requieren los campos phone y message" });
    return;
  }

  try {
    await sendWhatsAppMessage(phone, message);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error?.message || "Error enviando mensaje" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[API] Servidor Express escuchando en el puerto ${PORT}`);
});

