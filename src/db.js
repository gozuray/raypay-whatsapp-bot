import mongoose from 'mongoose';

export const connectMongo = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 15000,
  });

  return mongoose.connection;
};

export default connectMongo;
