import express from 'express';
import dotenv from 'dotenv';
import { startBot, getQr, isReady, sendMessage } from './bot.js';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/qr', (_req, res) => {
  const qr = getQr();

  if (!qr) {
    return res.status(404).send('QR no disponible. Espera unos segundos y actualiza.');
  }

  res.send(`
    <html>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0b1727;">
        <img src="${qr}" alt="Código QR de WhatsApp" style="width:360px;height:360px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.35);" />
      </body>
    </html>
  `);
});

app.get('/status', (_req, res) => {
  res.json({ ready: isReady() });
});

app.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ success: false, message: 'Both phone and message are required.' });
  }

  try {
    const result = await sendMessage(phone, message);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const startServer = async () => {
  try {
    await startBot();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Startup error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
