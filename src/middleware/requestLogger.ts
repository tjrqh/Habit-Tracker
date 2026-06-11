import { Request, Response, NextFunction } from 'express';
import { environment } from '../config/environment';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`;

    if (environment.LOG_LEVEL === 'debug') {
      console.log(`[${new Date().toISOString()}] ${log}`);
    }
  });

  next();
};
