import { Router } from 'express';
import { SessionController } from './controller/SessionController';

const router = Router();
const sessionController = new SessionController();

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', (req, res, next) => sessionController.createSession(req, res, next));

/**
 * GET /api/sessions
 * Get all sessions
 */
router.get('/', (req, res, next) => sessionController.getAllSessions(req, res, next));

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
router.get('/:id', (req, res, next) => sessionController.getSessionById(req, res, next));

/**
 * GET /api/sessions/user/:userId
 * Get all sessions by user ID
 */
router.get('/user/:userId', (req, res, next) =>
  sessionController.getSessionsByUserId(req, res, next),
);

/**
 * GET /api/sessions/user/:userId/running
 * Get running sessions by user ID
 */
router.get('/user/:userId/running', (req, res, next) =>
  sessionController.getRunningSessionsByUserId(req, res, next),
);

/**
 * GET /api/sessions/habit/:habitId
 * Get all sessions by habit ID
 */
router.get('/habit/:habitId', (req, res, next) =>
  sessionController.getSessionsByHabitId(req, res, next),
);

/**
 * PATCH /api/sessions/:id/start
 * Start a session
 */
router.patch('/:id/start', (req, res, next) => sessionController.startSession(req, res, next));

/**
 * PATCH /api/sessions/:id/complete
 * Complete a session
 */
router.patch('/:id/complete', (req, res, next) =>
  sessionController.completeSession(req, res, next),
);

/**
 * PATCH /api/sessions/:id/fail
 * Fail a session
 */
router.patch('/:id/fail', (req, res, next) => sessionController.failSession(req, res, next));

export default router;
