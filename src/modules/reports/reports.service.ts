import { SalesService } from '../sales/sales.service.js';
import { ExpensesService } from '../expenses/expenses.service.js';
import { ProductsService } from '../products/products.service.js';
import { SaleStatus } from '@prisma/client';
import { calculateNetProfit } from '../../shared/utils/financial.js';

export class ReportsService {
  static async getTodayDashboardSummary(tenantId: string) {
    const sales = await SalesService.getSalesHistory(tenantId);
    const completedSales = sales.filter((s) => s.status === SaleStatus.COMPLETED);

    // Calculate today's revenue, bill count, average bill value
    let todaySalesVolume = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;

    for (const sale of completedSales) {
      todaySalesVolume += sale.totalAmount;
      if (sale.paymentMethod === 'CASH') cashSales += sale.totalAmount;
      else if (sale.paymentMethod === 'UPI') upiSales += sale.totalAmount;
      else if (sale.paymentMethod === 'CARD') cardSales += sale.totalAmount;
    }

    const billsCount = completedSales.length;
    const averageBillValue = billsCount > 0 ? Math.round((todaySalesVolume / billsCount) * 100) / 100 : 0;

    // Fetch low stock count
    const lowStockProducts = await ProductsService.listProducts(tenantId, undefined, true);

    return {
      todaySalesVolume: Math.round(todaySalesVolume * 100) / 100,
      billsCount,
      averageBillValue,
      paymentBreakdown: {
        cash: Math.round(cashSales * 100) / 100,
        upi: Math.round(upiSales * 100) / 100,
        card: Math.round(cardSales * 100) / 100,
      },
      lowStockCount: lowStockProducts.length,
    };
  }

  static async getProfitReport(tenantId: string) {
    const sales = await SalesService.getSalesHistory(tenantId);
    const completedSales = sales.filter((s) => s.status === SaleStatus.COMPLETED);

    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCogs = 0;

    for (const sale of completedSales) {
      grossSales += sale.subtotal;
      totalDiscount += sale.discount || 0;
      totalTax += sale.taxAmount || 0;
      totalCogs += sale.costOfGoodsSold || 0;
    }

    const netSales = grossSales - totalDiscount;
    const grossProfit = netSales - totalCogs;

    // Fetch operating expenses
    const expenses = await ExpensesService.listExpenses(tenantId);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netProfit = calculateNetProfit(grossProfit, totalExpenses);

    return {
      financials: {
        grossSales: Math.round(grossSales * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        costOfGoodsSold: Math.round(totalCogs * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        operatingExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
      },
      explanation: 'Net Profit = (Net Sales - COGS) - Operating Expenses. Tax collected is tracked separately.',
    };
  }

  static async getDayCloseReconciliation(tenantId: string, openingCash: number = 0) {
    const sales = await SalesService.getSalesHistory(tenantId);
    const completedSales = sales.filter((s) => s.status === SaleStatus.COMPLETED);
    const cashSales = completedSales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    const expenses = await ExpensesService.listExpenses(tenantId);
    const cashExpenses = expenses
      .filter((e) => e.paymentMethod === 'CASH')
      .reduce((sum, e) => sum + e.amount, 0);

    const expectedClosingCash = openingCash + cashSales - cashExpenses;

    return {
      openingCash,
      cashSales: Math.round(cashSales * 100) / 100,
      cashExpenses: Math.round(cashExpenses * 100) / 100,
      expectedClosingCash: Math.round(expectedClosingCash * 100) / 100,
    };
  }
}
