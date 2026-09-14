import { Router } from 'express';
import { SubscriptionsController } from './subscriptions.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/current', SubscriptionsController.getCurrentSubscription);
router.post('/upgrade', authorize(Role.OWNER), SubscriptionsController.upgradePlan);

export const subscriptionsRouter = router;
