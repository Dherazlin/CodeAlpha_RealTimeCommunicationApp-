import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Connect to MongoDB database instance
 * Connects to MongoDB Atlas when MONGO_URI is provided.
 * Does NOT silently hide Atlas connection failures behind in-memory fallback.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (mongoUri) {
    try {
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(`[MongoDB] Atlas connection failure: Could not connect to configured MONGO_URI: ${error.message}`);
      if (process.env.ALLOW_MEMORY_DB_FALLBACK === 'true') {
        console.warn(`[MongoDB] Explicit fallback enabled via ALLOW_MEMORY_DB_FALLBACK. Starting in-memory instance...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Development in-memory database ready at: ${memoryUri}`);
        return conn;
      }
      throw error;
    }
  }

  // If no MONGO_URI is provided in development, allow explicit in-memory initialization
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log(`[MongoDB] No MONGO_URI configured. Starting development in-memory MongoDB instance...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();

      const conn = await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Development database ready at: ${memoryUri}`);
      return conn;
    } catch (memError) {
      console.error(`[MongoDB] Failed to start fallback MongoDB:`, memError.message);
      throw memError;
    }
  } else {
    console.error(`[MongoDB] Fatal: MONGO_URI is required in production.`);
    process.exit(1);
  }
};

export default connectDB;

