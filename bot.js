import mongoose from 'mongoose';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import { connectMongo } from './db.js';

let client;
let store;
let lastQr;
let ready = false;

function formatPhoneNumber(phone) {
  const sanitized = String(phone).replace(/\D/g, '');
  if (!sanitized) throw new Error('Invalid phone number');
  return `${sanitized}@c.us`;
}

export async function startBot() {
  if (client) return client;

  await connectMongo(process.env.MONGODB_URI);
  store = new MongoStore({ mongoose });

  client = new Client({
    authStrategy: new RemoteAuth({
      store,
      clientId: process.env.SESSION_NAME || 'whatsapp-session',
    }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  });

  client.on('qr', (qr) => {
    lastQr = qr;
    ready = false;
  });

  client.on('ready', () => {
    ready = true;
    lastQr = undefined;
  });

  client.on('auth_failure', () => {
    ready = false;
  });

  client.on('disconnected', () => {
    ready = false;
  });

  await client.initialize();
  return client;
}

export function getQr() {
  return lastQr || null;
}

export function isReady() {
  return ready;
}

export async function sendWhatsAppMessage(phone, text) {
  if (!client) throw new Error('Bot is not started');
  if (!ready) throw new Error('Bot is not ready');
  if (!phone || !text) throw new Error('phone and message are required');

  const chatId = formatPhoneNumber(phone);
  await client.sendMessage(chatId, text);
}
