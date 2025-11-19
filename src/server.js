import express from 'express';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { startBot, getQr, getStatus, sendMessage, getSessionData } from './bot.js';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/status', (_req, res) => {
  res.json({ status: getStatus() });
});

app.get("/qr", (req, res) => {
  const qr = getQr();

  if (!qr) {
    return res.send("QR no disponible. Espera unos segundos y actualiza.");
  }

  res.send(`
    <html>
      <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#111;">
        <img src="${qr}" style="width:350px;height:350px"/>
      </body>
    </html>
  `);
});


app.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ message: 'Both phone and message are required.' });
  }

  try {
    const result = await sendMessage(phone, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error('[API] Failed to send message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/session', async (_req, res) => {
  const session = await getSessionData();
  res.json({ session });
});

const startServer = async () => {
  try {
    await connectDB();
    await startBot();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`[SERVER] API listening on port ${port}`);
    });
  } catch (error) {
    console.error('[SERVER] Startup error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
