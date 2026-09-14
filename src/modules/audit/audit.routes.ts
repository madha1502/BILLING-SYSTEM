import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/logs', authorize(Role.OWNER), AuditController.listLogs);

export const auditRouter = router;
