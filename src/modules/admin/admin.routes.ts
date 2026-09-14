import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, authorize(Role.OWNER));

router.get('/stats', AdminController.getStats);
router.get('/tenants', AdminController.listTenants);
router.post('/tenants/:id/status', AdminController.updateStatus);

export const adminRouter = router;
