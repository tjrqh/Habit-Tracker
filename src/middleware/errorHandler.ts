import { Request, Response, NextFunction } from 'express';
import { ApplicationException } from '../common/exceptions/ApplicationException';
import { ValidationException } from '../common/exceptions/ValidationException';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('Error:', err);

  if (err instanceof ValidationException) {
    res.status(err.statusCode).json({
      message: err.message,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (err instanceof ApplicationException) {
    res.status(err.statusCode).json({
      message: err.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Unhandled error
  res.status(500).json({
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
  });
};
