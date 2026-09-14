import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/low-stock', InventoryController.getLowStock);
router.get('/transactions/:productId', InventoryController.getStockHistory);
router.post('/adjust', authorize(Role.OWNER, Role.MANAGER), InventoryController.adjustStock);

export const inventoryRouter = router;
