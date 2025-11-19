import { Client, RemoteAuth } from 'whatsapp-web.js';
import { MongoRemoteAuthStore } from 'wwebjs-remote-auth';
import mongoose from 'mongoose';
import qrcode from 'qrcode';

let client;
let qrDataUrl = null;
let connectionStatus = 'idle';
let store;

export const startBot = async () => {
  if (client) {
    return client;
  }

  const clientId = process.env.WA_CLIENT_ID || 'whatsapp-remote-bot';
  const collectionName = process.env.WA_AUTH_COLLECTION || 'wwebjs_remote_auth';

  connectionStatus = 'initializing';

  store = new MongoRemoteAuthStore({
    mongoose,
    collectionName,
    sessionId: clientId,
  });

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
  });

  client.on('ready', () => {
    connectionStatus = 'ready';
    qrDataUrl = null;
  });

  client.on('authenticated', () => {
    connectionStatus = 'authenticated';
  });

  client.on('auth_failure', () => {
    connectionStatus = 'auth_failure';
  });

  client.on('disconnected', () => {
    connectionStatus = 'disconnected';
    qrDataUrl = null;
  });

  await client.initialize();
  return client;
};

export const getQr = () => qrDataUrl;

export const getStatus = () => connectionStatus;

export const sendMessage = async (phone, message) => {
  if (!client) {
    throw new Error('WhatsApp client not initialized');
  }

  const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
  await client.sendMessage(chatId, message);
  return { to: chatId, message };
};

export default {
  startBot,
  getQr,
  getStatus,
  sendMessage,
};
