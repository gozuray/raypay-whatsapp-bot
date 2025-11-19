import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    data: { type: Object, required: true },
  },
  {
    timestamps: true,
  }
);

export class MongoRemoteAuthStore {
  constructor({ mongoose: mongooseInstance = mongoose, collectionName = 'wwebjs_remote_auth', sessionId = 'default' } = {}) {
    this.mongoose = mongooseInstance;
    this.sessionId = sessionId;
    const modelName = `${collectionName}_model`;
    this.SessionModel = this.mongoose.models[modelName] || this.mongoose.model(modelName, sessionSchema, collectionName);
  }

  async save(data) {
    await this.SessionModel.findOneAndUpdate(
      { sessionId: this.sessionId },
      { data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async load() {
    const record = await this.SessionModel.findOne({ sessionId: this.sessionId }).lean();
    return record ? record.data : null;
  }

  async remove() {
    await this.SessionModel.deleteOne({ sessionId: this.sessionId });
  }
}

export default MongoRemoteAuthStore;
