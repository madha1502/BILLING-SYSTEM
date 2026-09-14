import { Router } from 'express';
import { SyncController } from './sync.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.post('/batch', SyncController.processBatchSync);
router.get('/status', SyncController.getSyncStatus);

export const syncRouter = router;
