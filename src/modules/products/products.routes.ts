import { Router } from 'express';
import { ProductsController } from './products.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

// All product routes require authentication and tenant isolation
router.use(authenticate, enforceTenantIsolation);

router.get('/', ProductsController.listProducts);
router.get('/barcode/:barcode', ProductsController.findByBarcode);

router.post('/', authorize(Role.OWNER, Role.MANAGER), ProductsController.createProduct);
router.put('/:id', authorize(Role.OWNER, Role.MANAGER), ProductsController.updateProduct);
router.delete('/:id', authorize(Role.OWNER, Role.MANAGER), ProductsController.deleteProduct);

export const productsRouter = router;
