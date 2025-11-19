import express from 'express';
import dotenv from 'dotenv';
import qrcode from 'qrcode';
import { startBot, sendWhatsAppMessage, getQr, isReady } from './bot.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

startBot().catch((error) => {
  console.error('Failed to start bot', error);
  process.exit(1);
});

app.get('/status', (_req, res) => {
  res.json({ ready: isReady() });
});

app.get('/qr', async (_req, res) => {
  const qr = getQr();
  if (!qr) {
    res.status(isReady() ? 404 : 503).send('QR not available');
    return;
  }

  const dataUrl = await qrcode.toDataURL(qr);
  res.send(`<html><body><img src="${dataUrl}" alt="QR" /></body></html>`);
});

app.get('/qr.json', (_req, res) => {
  const qr = getQr();
  res.json({ qr, ready: isReady() });
});

app.post('/send', async (req, res) => {
  const { phone, message, receipt } = req.body || {};
  const text = message ?? receipt;

  if (!phone || !text) {
    res.status(400).json({ error: 'phone and message/receipt are required' });
    return;
  }

  try {
    await sendWhatsAppMessage(phone, text);
    res.json({ success: true });
  } catch (error) {
    res.status(503).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
