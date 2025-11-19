import mongoose from 'mongoose';

let connection;

export async function connectMongo(uri) {
  if (connection) return connection;
  if (!uri) throw new Error('MONGODB_URI is required');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });
  connection = mongoose.connection;
  return connection;
}

export function getDB() {
  if (!connection) {
    throw new Error('MongoDB connection has not been initialized');
  }
  return connection;
}
