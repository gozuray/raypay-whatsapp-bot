import { Client, RemoteAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs/promises';

class MemoryStore {
  constructor() {
    this.sessions = new Map();
  }

  async save({ session }) {
    const zipPath = `${session}.zip`;
    const data = await fs.readFile(zipPath);
    this.sessions.set(session, data);
  }

  async extract({ session, path }) {
    const data = this.sessions.get(session);
    if (!data) {
      throw new Error('Session not found in memory');
    }
    await fs.writeFile(path, data);
  }

  async delete({ session }) {
    this.sessions.delete(session);
  }

  async sessionExists({ session }) {
    return this.sessions.has(session);
  }
}

let client;
let qrDataUrl = null;
let ready = false;

const createClient = () => {
  const clientId = process.env.WA_CLIENT_ID || 'whatsapp-remote-bot';
  const store = new MemoryStore();

  return new Client({
    authStrategy: new RemoteAuth({
      clientId,
      store,
      dataPath: './.wwebjs_auth',
      backupSyncIntervalMs: 120000,
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });
};

export const startBot = async () => {
  if (client) return client;

  client = createClient();
  ready = false;
  qrDataUrl = null;

  client.on('qr', async (qr) => {
    qrDataUrl = await qrcode.toDataURL(qr);
    ready = false;
  });

  client.on('ready', () => {
    ready = true;
    qrDataUrl = null;
  });

  client.on('disconnected', () => {
    ready = false;
    qrDataUrl = null;
  });

  await client.initialize();
  return client;
};

export const getQr = () => qrDataUrl;

export const isReady = () => ready;

export const sendMessage = async (phone, message) => {
  if (!client) {
    throw new Error('WhatsApp client not initialized');
  }

  if (!ready) {
    throw new Error('WhatsApp client not ready');
  }

  const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
  await client.sendMessage(chatId, message);
  return { to: chatId, message };
};
