import mongoose from 'mongoose';
// import dns from "node:dns/promises";

import { DB_URI, NODE_ENV } from '../config/env.js';

// Set custom DNS servers to avoid potential DNS resolution issues with MongoDB Atlas
// dns.setServers(["1.1.1.1"]);

if (!DB_URI) {
    throw new Error('DB_URI is not defined in environment variables');
}

const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log(`MongoDB connected successfully in ${NODE_ENV} mode.`);
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }};

export default connectDB;