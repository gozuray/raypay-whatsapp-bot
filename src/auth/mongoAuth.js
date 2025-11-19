import mongoose from 'mongoose';

// Schema to persist WhatsApp session credentials and state
const sessionSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true },
    creds: { type: mongoose.Schema.Types.Mixed, default: null },
    state: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'whatsapp_sessions', minimize: false }
);

const SessionModel = mongoose.model('WhatsappSession', sessionSchema);

export class MongoAuthStore {
  constructor(clientId) {
    if (!clientId) {
      throw new Error('clientId is required for MongoAuthStore');
    }

    this.clientId = clientId;
  }

  // Store handler used by whatsapp-web.js RemoteAuth
  async save(data) {
    const serialized = this.#serialize(data);
    await SessionModel.findOneAndUpdate(
      { clientId: this.clientId },
      { $set: { creds: serialized?.creds ?? null, state: serialized?.state ?? null, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();
  }

  // Load the entire session document used by RemoteAuth
  async get() {
    const doc = await SessionModel.findOne({ clientId: this.clientId }).lean();
    if (!doc) return null;
    return { creds: doc.creds, state: doc.state };
  }

  // Whether a session exists (to skip QR prompt when possible)
  async sessionExists() {
    const count = await SessionModel.countDocuments({ clientId: this.clientId });
    return count > 0;
  }

  // Remove stored session
  async delete() {
    await SessionModel.deleteOne({ clientId: this.clientId });
  }

  // Save credentials emitted by whatsapp-web.js
  async saveCreds(creds) {
    const serialized = this.#serialize(creds);
    await SessionModel.findOneAndUpdate(
      { clientId: this.clientId },
      { $set: { creds: serialized, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();
    return serialized;
  }

  // Persist connection state (stream/chats/contacts)
  async saveState(state) {
    const serialized = this.#serialize(state);
    await SessionModel.findOneAndUpdate(
      { clientId: this.clientId },
      { $set: { state: serialized, updatedAt: new Date() } },
      { upsert: true, new: true }
    ).lean();
    return serialized;
  }

  // Retrieve credentials when booting the client
  async getCreds() {
    const doc = await SessionModel.findOne({ clientId: this.clientId }).lean();
    return doc?.creds ?? null;
  }

  // Retrieve state when booting the client
  async getState() {
    const doc = await SessionModel.findOne({ clientId: this.clientId }).lean();
    return doc?.state ?? null;
  }

  // Convenience helper to inspect what is persisted
  async getSession() {
    const doc = await SessionModel.findOne({ clientId: this.clientId }).lean();
    if (!doc) return null;
    return {
      clientId: doc.clientId,
      updatedAt: doc.updatedAt,
      creds: doc.creds,
      state: doc.state,
    };
  }

  // Ensure all data is plain JSON without mongoose metadata
  #serialize(data) {
    if (!data) return null;
    return JSON.parse(JSON.stringify(data));
  }
}

export default MongoAuthStore;
