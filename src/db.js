// src/db.js
import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "raypay";

let client;
let db;

export async function connectMongo() {
  if (db) return db;

  if (!MONGODB_URI) {
    throw new Error("Falta MONGODB_URI en .env");
  }

  client = new MongoClient(MONGODB_URI, {});
  await client.connect();
  db = client.db(DB_NAME);

  console.log("✅ MongoDB conectado (bot)");
  return db;
}

export function getDB() {
  if (!db) {
    throw new Error("MongoDB no inicializado. Llama connectMongo()");
  }
  return db;
}
