import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/today', ReportsController.getTodaySummary);
router.get('/profit', authorize(Role.OWNER, Role.MANAGER), ReportsController.getProfitReport);
router.get('/day-close', authorize(Role.OWNER, Role.MANAGER), ReportsController.getDayClose);

export const reportsRouter = router;
