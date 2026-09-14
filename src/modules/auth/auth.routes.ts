import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

// Public Routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);

// Protected Routes
router.get('/me', authenticate, enforceTenantIsolation, AuthController.getMe);
router.post(
  '/employee',
  authenticate,
  enforceTenantIsolation,
  authorize(Role.OWNER, Role.MANAGER),
  AuthController.createEmployee
);

export const authRouter = router;
