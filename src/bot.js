import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import MongoAuthStore from './auth/mongoAuth.js';

let client;
let qrDataUrl = null;
let connectionStatus = 'initializing';
let store;

// Initialize the WhatsApp client with RemoteAuth and MongoDB storage
export const startBot = async () => {
  if (client) {
    return client;
  }

  const clientId = process.env.WA_CLIENT_ID || 'raypay-whatsapp-bot';
  store = new MongoAuthStore(clientId);

  client = new Client({
    authStrategy: new RemoteAuth({
      clientId,
      store,
      backupSyncIntervalMs: 300000,
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    qrDataUrl = await qrcode.toDataURL(qr);
    connectionStatus = 'qr';
    console.log('[BOT] QR code received. Scan to authenticate.');
  });

  client.on('ready', () => {
    connectionStatus = 'ready';
    qrDataUrl = null;
    console.log('[BOT] WhatsApp client is ready.');
  });

  client.on('auth_failure', (message) => {
    connectionStatus = 'auth_failure';
    console.error('[BOT] Authentication failure:', message);
  });

  client.on('disconnected', (reason) => {
    connectionStatus = 'disconnected';
    console.warn('[BOT] Disconnected:', reason);
  });

  client.on('message', (message) => {
    console.log(`[BOT] Message from ${message.from}: ${message.body}`);
  });

  client.on('remote_session_saved', async () => {
    console.log('[BOT] Remote session saved to MongoDB.');
    // Optionally retrieve the latest persisted session for debugging
    await store.getSession();
  });

  await client.initialize();
  return client;
};

// Return the latest QR code as a data URL
export const getQr = () => qrDataUrl;

// Return the current connection status
export const getStatus = () => connectionStatus;

// Return persisted session snapshot
export const getSessionData = async () => {
  if (!store) return null;
  return store.getSession();
};

// Send a WhatsApp message using the connected client
export const sendMessage = async (phone, message) => {
  if (!client) {
    throw new Error('WhatsApp client not initialized');
  }

  const formattedNumber = phone.includes('@c.us') ? phone : `${phone}@c.us`;
  await client.sendMessage(formattedNumber, message);
  return { to: formattedNumber, message };
};

export default {
  startBot,
  getQr,
  getStatus,
  getSessionData,
  sendMessage,
};
