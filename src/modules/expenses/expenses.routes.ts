import { Router } from 'express';
import { ExpensesController } from './expenses.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.get('/', ExpensesController.listExpenses);
router.post('/', authorize(Role.OWNER, Role.MANAGER), ExpensesController.createExpense);
router.delete('/:id', authorize(Role.OWNER, Role.MANAGER), ExpensesController.deleteExpense);

export const expensesRouter = router;
