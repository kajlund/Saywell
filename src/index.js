import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from './db.js';
import { getConfig } from './config.js';
import { getLogger } from './logger.js';
import { getApp } from './app.js';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Validate configuration
    const config = await getConfig();

    // Initialize Pino logger
    const logger = getLogger(config);

    // Connect to MongoDB using validated URI and logger
    await connectDB(config.mongoUri, logger);

    // Initialize Express App
    const app = getApp(config, logger);

    const server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.env} mode on port ${config.port} (Log level: ${config.logLevel})`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await mongoose.connection.close();
          logger.info('MongoDB connection closed cleanly.');
          process.exit(0);
        } catch (err) {
          logger.error(`Error during MongoDB disconnection: ${err.message}`);
          process.exit(1);
        }
      });
    };

    // Process Signal Listeners
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Exception Listeners
    process.on('uncaughtException', (err) => {
      logger.fatal({ err }, `Uncaught Exception: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason) => {
      const message = reason instanceof Error ? reason.message : String(reason);
      logger.fatal({ err: reason }, `Unhandled Rejection: ${message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error(`Initialization Error: ${error.message}`);
    process.exit(1);
  }
}

startServer();
