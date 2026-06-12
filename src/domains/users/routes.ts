import { Router } from 'express';
import { UserController } from './controller/UserController';

const router = Router();
const userController = new UserController();

/**
 * POST /api/users/register
 * Register a new user
 */
router.post('/register', (req, res, next) => userController.register(req, res, next));

/**
 * POST /api/users/login
 * Login a user
 */
router.post('/login', (req, res, next) => userController.login(req, res, next));

/**
 * GET /api/users
 * Get all users
 */
router.get('/', (req, res, next) => userController.getAllUsers(req, res, next));

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));

/**
 * DELETE /api/users/:id
 * Delete user by ID
 */
router.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

export default router;
