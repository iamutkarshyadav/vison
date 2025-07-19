import mongoose from "mongoose";
import { APP_CONSTANTS, ENV_CONSTANTS } from "../utils/constants";

const MONGODB_URI = ENV_CONSTANTS.MONGODB_URI;
const DB_NAME = APP_CONSTANTS.DB_NAME;

if (!MONGODB_URI && !ENV_CONSTANTS.IS_DEVELOPMENT) {
  console.warn(
    "MONGODB_URI environment variable not defined. Using fallback for development.",
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  connecting: boolean;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
  connecting: false
};

if (!global.mongoose) {
  global.mongoose = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    console.warn("⚠️ MongoDB URI not provided. Database operations will fail.");
    throw new Error("MongoDB connection not configured");
  }

  // If already connected, return the connection
  if (cached.conn) {
    return cached.conn;
  }

  // If already connecting, wait for the existing promise
  if (cached.connecting) {
    if (cached.promise) {
      return await cached.promise;
    }
  }

  // Start new connection
  cached.connecting = true;

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: DB_NAME,
      maxPoolSize: APP_CONSTANTS.DB_MAX_POOL_SIZE,
      serverSelectionTimeoutMS: APP_CONSTANTS.DB_TIMEOUT,
      socketTimeoutMS: APP_CONSTANTS.DB_SOCKET_TIMEOUT,
      family: 4, // Use IPv4, skip trying IPv6
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log("✅ Connected to MongoDB");
        cached.connecting = false;
        return mongoose;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        cached.connecting = false;
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    global.mongoose = cached; // Store globally for middleware checks
  } catch (e) {
    cached.promise = null;
    cached.connecting = false;
    global.mongoose = { conn: null, promise: null, connecting: false }; // Reset global state
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
