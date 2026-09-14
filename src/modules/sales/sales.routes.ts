import { Router } from 'express';
import { SalesController } from './sales.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.post('/', SalesController.createSale);
router.post('/voice-parse', SalesController.parseVoice);
router.get('/', SalesController.getSalesHistory);
router.get('/:id', SalesController.getSaleById);
router.post('/:id/cancel', authorize(Role.OWNER, Role.MANAGER), SalesController.cancelSale);

export const salesRouter = router;
