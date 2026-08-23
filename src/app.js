import path from 'node:path';
import express from 'express';
import cors from 'cors';
import nunjucks from 'nunjucks';

import errorHandler from './middleware/errorHandler.js';
import { getRouter } from "./routes.js";

/**
 * Creates and configures the Express application instance.
 *
 * @param {Object} config - Application configuration object
 * @param {Object} logger - Pino logger instance
 * @returns {import('express').Express} Configured Express application
 */
export function getApp(config, logger) {
  const app = express();
  const router = getRouter(config, logger);
  const publicPath = path.resolve(process.cwd(), 'public');
  const viewsPath = path.resolve(process.cwd(), 'views');

  nunjucks.configure(viewsPath, {
    autoescape: true,
    express: app,
  });

  app.set('view engine', 'njk');
  app.set('views', viewsPath);

  // Attach logger to request object
  if (logger) {
    app.use((req, res, next) => {
      req.logger = logger;
      next();
    });
  }

  // Core middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Cookie parser middleware
  app.use((req, res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=');
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        req.cookies[key] = decodeURIComponent(value);
      });
    }
    next();
  });

  app.use('/', router);

  // Static assets
  app.use(express.static(publicPath));

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
