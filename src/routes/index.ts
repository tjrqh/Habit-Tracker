import { Router } from 'express';
import userRoutes from '../domains/users/routes';
import habitRoutes from '../domains/habits/routes';
import sessionRoutes from '../domains/sessions/routes';

const router = Router();

// API routes
router.use('/users', userRoutes);
router.use('/habits', habitRoutes);
router.use('/sessions', sessionRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;
