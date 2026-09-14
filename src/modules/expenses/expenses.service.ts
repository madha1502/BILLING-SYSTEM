import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/app-error.js';

export interface CreateExpenseInput {
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  expenseDate?: Date;
}

const memoryExpenses = new Map<string, any[]>();

// Seed sample expense for demo tenant
const demoTenantId = 'tenant-demo-101';
memoryExpenses.set(demoTenantId, [
  {
    id: 'exp-101',
    tenantId: demoTenantId,
    category: 'ELECTRICITY',
    amount: 1450.0,
    paymentMethod: 'UPI',
    description: 'TNEB Electricity Bill August 2026',
    userId: 'user-owner-101',
    expenseDate: new Date(),
    createdAt: new Date(),
  },
]);

export class ExpensesService {
  static getTenantExpenses(tenantId: string) {
    if (!memoryExpenses.has(tenantId)) {
      memoryExpenses.set(tenantId, []);
    }
    return memoryExpenses.get(tenantId)!;
  }

  static async createExpense(tenantId: string, userId: string, input: CreateExpenseInput) {
    const expenses = this.getTenantExpenses(tenantId);

    const newExpense = {
      id: `exp-${Date.now()}`,
      tenantId,
      category: input.category,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      description: input.description || null,
      userId,
      expenseDate: input.expenseDate || new Date(),
      createdAt: new Date(),
    };

    expenses.unshift(newExpense);
    return newExpense;
  }

  static async listExpenses(tenantId: string, category?: ExpenseCategory) {
    const expenses = this.getTenantExpenses(tenantId);
    if (category) {
      return expenses.filter((e) => e.category === category);
    }
    return expenses;
  }

  static async deleteExpense(tenantId: string, expenseId: string) {
    const expenses = this.getTenantExpenses(tenantId);
    const index = expenses.findIndex((e) => e.id === expenseId);
    if (index === -1) {
      throw new NotFoundError('Expense record not found.', 'EXPENSE_NOT_FOUND');
    }
    expenses.splice(index, 1);
    return { success: true, message: 'Expense deleted successfully' };
  }
}
