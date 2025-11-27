// lib/db.js
import mongoose from 'mongoose';

let cached = global._mongoConnection;

if (!cached) {
  cached = global._mongoConnection = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      // options recommended for modern mongoose
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    }).then(m => m.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
