import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ExpensesService } from './expenses.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

const createExpenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Expense amount must be greater than zero'),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  description: z.string().optional(),
});

export class ExpensesController {
  static async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const validated = createExpenseSchema.parse(req.body);

      const expense = await ExpensesService.createExpense(tenantId, userId, validated);
      return sendSuccess(res, expense, 'Expense recorded successfully!', 201);
    } catch (err) {
      next(err);
    }
  }

  static async listExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const category = req.query.category as ExpenseCategory;

      const expenses = await ExpensesService.listExpenses(tenantId, category);
      return sendSuccess(res, expenses, 'Expenses retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const expenseId = req.params.id;

      const result = await ExpensesService.deleteExpense(tenantId, expenseId);
      return sendSuccess(res, result, 'Expense deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}
