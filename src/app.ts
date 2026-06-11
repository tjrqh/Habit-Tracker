import path from 'path';
import express, { Express } from 'express';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // API Routes
  app.use('/api', routes);

  // Static files (Frontend SPA)
  app.use(express.static(path.join(process.cwd(), 'public')));

  // 404 handler
  app.use((_req, res, next) => {
    // If it's an API route, send JSON 404
    if (_req.path.startsWith('/api')) {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    // Otherwise serve index.html for SPA routing
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  });

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
