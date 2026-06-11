import { Router } from 'express';
import { HabitController } from './controller/HabitController';

const router = Router();
const habitController = new HabitController();

/**
 * POST /api/habits
 * Create a new habit
 */
router.post('/', (req, res, next) => habitController.createHabit(req, res, next));

/**
 * GET /api/habits
 * Get all habits
 */
router.get('/', (req, res, next) => habitController.getAllHabits(req, res, next));

/**
 * GET /api/habits/:id
 * Get habit by ID
 */
router.get('/:id', (req, res, next) => habitController.getHabitById(req, res, next));

/**
 * GET /api/habits/user/:userId
 * Get all habits by user ID
 */
router.get('/user/:userId', (req, res, next) =>
  habitController.getHabitsByUserId(req, res, next),
);

/**
 * GET /api/habits/user/:userId/active
 * Get active habits by user ID
 */
router.get('/user/:userId/active', (req, res, next) =>
  habitController.getActiveHabits(req, res, next),
);

/**
 * PUT /api/habits/:id
 * Update habit by ID
 */
router.put('/:id', (req, res, next) => habitController.updateHabit(req, res, next));

/**
 * DELETE /api/habits/:id
 * Delete habit by ID
 */
router.delete('/:id', (req, res, next) => habitController.deleteHabit(req, res, next));

export default router;
