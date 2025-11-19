import mongoose from 'mongoose';

// Establish a connection to MongoDB using Mongoose
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables.');
  }

  if (!dbName) {
    throw new Error('MONGODB_DB is not set in environment variables.');
  }

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 15000,
      autoIndex: true,
    });
    console.log(`[DB] Connected to MongoDB database: ${dbName}`);
  } catch (error) {
    console.error('[DB] MongoDB connection error:', error);
    throw error;
  }
};

export default connectDB;
