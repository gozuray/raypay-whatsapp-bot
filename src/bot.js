import pkg from "whatsapp-web.js";
const { Client, RemoteAuth } = pkg;

import qrcode from "qrcode";
import fs from "fs/promises";
import path from "path";

// ===============================
// FileStore ZIP persistente (reemplaza MemoryStore)
// Guarda la sesión en ./.wwebjs_auth/<session>.zip
// ===============================
class FileStore {
  constructor(basePath = "./.wwebjs_auth") {
    this.basePath = basePath;
  }

  async ensureDir() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  getFilePath(session) {
    return path.join(this.basePath, `${session}.zip`);
  }

  // Guarda el ZIP de sesión en disco
  async save({ session, data }) {
    if (!session || !data) {
      console.log("[FileStore] save llamado sin session o data, se ignora.");
      return;
    }

    await this.ensureDir();
    const filePath = this.getFilePath(session);

    try {
      await fs.writeFile(filePath, data);
      console.log(`[FileStore] Sesión guardada en: ${filePath}`);
    } catch (err) {
      console.log("[FileStore] Error guardando sesión:", err.message);
    }
  }

  // Restaura el ZIP desde disco a una ruta temporal
  async extract({ session, path: destPath }) {
    const filePath = this.getFilePath(session);

    try {
      const data = await fs.readFile(filePath);
      await fs.writeFile(destPath, data);
      console.log(
        `[FileStore] Sesión restaurada desde ${filePath} hacia ${destPath}`
      );
    } catch (err) {
      console.log("[FileStore] Error restaurando sesión:", err.message);
      throw err;
    }
  }

  // Elimina la sesión persistida (si algún día la quieres borrar)
  async delete({ session }) {
    const filePath = this.getFilePath(session);

    try {
      await fs.unlink(filePath);
      console.log(`[FileStore] Sesión eliminada: ${filePath}`);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.log("[FileStore] Error eliminando sesión:", err.message);
      }
    }
  }

  // Comprueba si existe una sesión guardada
  async sessionExists({ session }) {
    const filePath = this.getFilePath(session);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// ===============================
// PATCH SEGURO PARA RemoteAuth EN WINDOWS
// Evita que RemoteAuth use fs.unlink interno y trabaje solo con FileStore
// ===============================
const RemoteAuthPrototype = RemoteAuth.prototype;

RemoteAuthPrototype.storeRemoteSession = async function (sessionData) {
  // A veces es llamado sin datos → lo ignoramos
  if (!sessionData || !sessionData.session || !sessionData.data) {
    console.log("[PATCH] storeRemoteSession llamado sin datos, se ignora.");
    return;
  }

  const { session, data } = sessionData;

  try {
    await this.store.save({ session, data });
  } catch (err) {
    console.log("[PATCH] Error en store.save:", err.message);
  }
};

// ===============================
// Variables internas
// ===============================
let client;
let qrDataUrl = null;
let ready = false;

// ===============================
// Crear cliente
// ===============================
const createClient = () => {
  const clientId = process.env.WA_CLIENT_ID || "whatsapp-remote-bot";
  const store = new FileStore("./.wwebjs_auth");

  console.log("[BOT] Creando cliente de WhatsApp con RemoteAuth + FileStore...");

  return new Client({
    authStrategy: new RemoteAuth({
      clientId,
      store,
      dataPath: "./.wwebjs_auth",
      backupSyncIntervalMs: 120000,
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });
};

// ===============================
// Iniciar bot
// ===============================
export const startBot = async () => {
  if (client) return client;

  console.log("[BOT] Inicializando cliente...");
  client = createClient();
  ready = false;
  qrDataUrl = null;

  // 🔵 Nuevo código QR generado
  client.on("qr", async (qr) => {
    console.log(
      "[BOT] 🔵 Nuevo QR generado. Escanéalo en: http://localhost:3000/qr"
    );
    qrDataUrl = await qrcode.toDataURL(qr);
    ready = false;
  });

  // 🟢 Cuando el bot está listo
  client.on("ready", () => {
    console.log("[BOT] 🟢 Cliente listo y conectado ✔️");
    ready = true;
    qrDataUrl = null;
  });

  // 🔴 Cuando se desconecta
  client.on("disconnected", (reason) => {
    console.log(`[BOT] 🔴 Cliente desconectado. Razón: ${reason}`);
    ready = false;
    qrDataUrl = null;
  });

  // 🧩 Errores de auth
  client.on("auth_failure", (msg) => {
    console.log(`[BOT] ❌ Error de autenticación: ${msg}`);
  });

  console.log("[BOT] Iniciando sesión...");
  await client.initialize();
  console.log("[BOT] Sesión inicializada.");

  return client;
};

// ===============================
// Utilidades
// ===============================
export const getQr = () => qrDataUrl;

export const isReady = () => ready;

export const sendMessage = async (phone, message) => {
  if (!client) {
    throw new Error("WhatsApp client not initialized");
  }

  if (!ready) {
    throw new Error("WhatsApp client not ready");
  }

  const chatId = phone.includes("@c.us") ? phone : `${phone}@c.us`;
  await client.sendMessage(chatId, message);
  return { to: chatId, message };
};
