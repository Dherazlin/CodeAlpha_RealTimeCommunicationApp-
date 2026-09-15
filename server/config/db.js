import mongoose from 'mongoose';

/**
 * Connect to MongoDB database instance
 * Supports standard MONGO_URI, and falls back to an in-memory development MongoDB
 * instance if local MongoDB service is not currently running.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/korus_db';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to ${mongoUri}: ${error.message}`);

    // In development, seamlessly fallback to MongoMemoryServer so auth and persistence work out of the box
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log(`[MongoDB] Starting development in-memory MongoDB instance...`);
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();

        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] Development database ready at: ${memoryUri}`);
        return conn;
      } catch (memError) {
        console.error(`[MongoDB] Failed to start fallback MongoDB:`, memError.message);
      }
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
