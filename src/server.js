import express from 'express';
import dotenv from 'dotenv';
import { startBot, getStatus, getQrDataUrl, sendWhatsAppMessage } from './bot.js';

dotenv.config();

const app = express();
app.use(express.json());

startBot().catch(err => {
  console.error('Error al iniciar el bot:', err);
});

app.get('/status', (req, res) => {
  res.json(getStatus());
});

app.get('/qr.json', (req, res) => {
  res.json({ qrDataUrl: getQrDataUrl() });
});

app.get('/qr', (req, res) => {
  const status = getStatus();
  const qrDataUrl = getQrDataUrl();

  if (!status.ready && !qrDataUrl) {
    return res.status(503).send('<h1>Bot no está listo, escanea el QR primero.</h1>');
  }

  if (!qrDataUrl) {
    return res.status(200).send('<h1>No hay QR disponible. Espera unos segundos y actualiza.</h1>');
  }

  res.send(`<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <title>Escanea este QR para vincular tu WhatsApp</title>
    </head>
    <body>
      <h1>Escanea este QR para vincular tu WhatsApp</h1>
      <img src="${qrDataUrl}" alt="QR de WhatsApp" />
    </body>
  </html>`);
});

app.post('/send', async (req, res) => {
  const status = getStatus();
  if (!status.ready) {
    return res.status(503).json({ message: 'Bot no está listo, escanea el QR primero.' });
  }

  const { phone, message } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ message: 'Faltan phone o message en el cuerpo de la petición.' });
  }

  try {
    await sendWhatsAppMessage(phone, message);
    res.json({ message: 'Mensaje enviado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al enviar el mensaje', error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor HTTP escuchando en puerto ${PORT}`);
});
