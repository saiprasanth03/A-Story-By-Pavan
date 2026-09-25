import mongoose from 'mongoose';
import dns from 'dns';

// Ensure IPv4 resolution on Node 17+
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/studio-template', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`Connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection warning: ${error.message}`);
    console.error(`Check your database connection string and MongoDB Atlas IP whitelist.`);
    // Do not crash server process immediately so HTTP server can remain accessible
  }
};

export default connectDB;
