import { describe, it, expect } from 'vitest';
import { ReportsService } from '../src/modules/reports/reports.service.js';
import { ExpensesService } from '../src/modules/expenses/expenses.service.js';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';

describe('KiranaPro Revenue Analytics, Expense Ledger & Net Profit Engine', () => {
  const tenantId = 'tenant-demo-101';
  const userId = 'user-owner-101';

  it('should fetch today dashboard summary with revenue, bill count, and average bill value', async () => {
    const summary = await ReportsService.getTodayDashboardSummary(tenantId);

    expect(summary.todaySalesVolume).toBeGreaterThan(0);
    expect(summary.billsCount).toBeGreaterThan(0);
    expect(summary.averageBillValue).toBeGreaterThan(0);
    expect(summary.paymentBreakdown).toBeDefined();
    expect(summary.lowStockCount).toBeGreaterThanOrEqual(0);
  });

  it('should log an operating expense and calculate Net Profit correctly', async () => {
    // 1. Log Electricity Expense
    const expense = await ExpensesService.createExpense(tenantId, userId, {
      category: ExpenseCategory.ELECTRICITY,
      amount: 1450.0,
      paymentMethod: PaymentMethod.CASH,
      description: 'TNEB Shop Electricity Bill',
    });

    expect(expense.id).toBeDefined();
    expect(expense.amount).toBe(1450.0);

    // 2. Fetch Profit Report
    const profitReport = await ReportsService.getProfitReport(tenantId);

    expect(profitReport.financials.grossSales).toBeGreaterThan(0);
    expect(profitReport.financials.operatingExpenses).toBeGreaterThanOrEqual(1450.0);
    expect(profitReport.financials.netProfit).toBeDefined();

    // Verify Net Profit formula: (Net Sales - COGS) - Operating Expenses
    const expectedNetProfit = Math.round(
      (profitReport.financials.grossProfit - profitReport.financials.operatingExpenses) * 100
    ) / 100;
    expect(profitReport.financials.netProfit).toBe(expectedNetProfit);
  });

  it('should perform day close cash reconciliation accurately', async () => {
    const openingCash = 500.0;
    const dayClose = await ReportsService.getDayCloseReconciliation(tenantId, openingCash);

    expect(dayClose.openingCash).toBe(500.0);
    expect(dayClose.cashSales).toBeGreaterThanOrEqual(0);
    expect(dayClose.cashExpenses).toBeGreaterThanOrEqual(0);

    const expectedClosing = openingCash + dayClose.cashSales - dayClose.cashExpenses;
    expect(dayClose.expectedClosingCash).toBe(expectedClosing);
  });
});
