import fs from 'fs';
import qrcode from 'qrcode';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import { connectMongo } from './db.js';

class MongoSessionStore {
  constructor(db, collectionName = 'whatsapp_sessions') {
    this.collection = db.collection(collectionName);
  }

  async sessionExists({ session }) {
    const doc = await this.collection.findOne({ _id: session }, { projection: { _id: 1 } });
    return !!doc;
  }

  async save({ session }) {
    const filePath = `${session}.zip`;
    const data = await fs.promises.readFile(filePath);
    await this.collection.updateOne(
      { _id: session },
      { $set: { zip: data, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  async extract({ session, path }) {
    const doc = await this.collection.findOne({ _id: session });
    if (!doc || !doc.zip) {
      throw new Error('No hay sesión almacenada');
    }
    const buffer = doc.zip.buffer ? Buffer.from(doc.zip.buffer) : Buffer.from(doc.zip);
    await fs.promises.writeFile(path, buffer);
  }

  async delete({ session }) {
    await this.collection.deleteOne({ _id: session });
  }
}

let client = null;
let qrDataUrl = null;
let isReady = false;
let lastError = null;

export async function startBot() {
  if (client) return client;

  const db = await connectMongo();
  const store = new MongoSessionStore(db, 'whatsapp_sessions');

  client = new Client({
    authStrategy: new RemoteAuth({
      clientId: 'raypay-bot',
      dataPath: './auth',
      store,
      backupSyncIntervalMs: 300000,
    }),
    puppeteer: {
      headless: true,
    },
  });

  client.on('qr', async qr => {
    qrDataUrl = await qrcode.toDataURL(qr);
    console.log('[WhatsApp Bot] Nuevo QR listo para escanear');
  });

  client.on('ready', () => {
    isReady = true;
    qrDataUrl = null;
    console.log('[WhatsApp Bot] Cliente listo y conectado');
  });

  client.on('auth_failure', message => {
    lastError = message || 'Error de autenticación';
  });

  client.on('disconnected', () => {
    isReady = false;
  });

  await client.initialize();
  return client;
}

export function getStatus() {
  return {
    ready: isReady,
    hasQR: !!qrDataUrl,
    lastError,
  };
}

export function getQrDataUrl() {
  return qrDataUrl;
}

export async function sendWhatsAppMessage(phone, message) {
  if (!client) {
    throw new Error('Cliente de WhatsApp no inicializado');
  }
  return client.sendMessage(phone, message);
}
