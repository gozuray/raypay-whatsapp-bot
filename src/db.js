import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

let client = null;
let database = null;

export async function connectMongo() {
  if (database) return database;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Falta MONGODB_URI en .env');
  }

  const dbName = process.env.MONGODB_DB;
  if (!dbName) {
    throw new Error('Falta MONGODB_DB en .env');
  }

  client = new MongoClient(uri);
  await client.connect();
  database = client.db(dbName);
  console.log('✅ MongoDB conectado');
  return database;
}

export function getDB() {
  if (!database) {
    throw new Error('Base de datos no inicializada. Ejecuta connectMongo() primero.');
  }
  return database;
}
