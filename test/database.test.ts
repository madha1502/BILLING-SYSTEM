import { describe, it, expect } from 'vitest';
import { calculateSaleFinancials, calculateNetProfit, SaleLineItem } from '../src/shared/utils/financial.js';

describe('KiranaPro SaaS Financial Engine & Decimal Precision', () => {
  it('should calculate sale totals, COGS, and gross profit accurately without floating point errors', () => {
    const items: SaleLineItem[] = [
      { purchasePrice: 42.00, sellingPrice: 50.00, quantity: 2.0, taxRate: 0 },   // Rice: Sub: 100, COGS: 84
      { purchasePrice: 155.00, sellingPrice: 180.00, quantity: 1.0, taxRate: 5 }, // Oil: Sub: 180, COGS: 155, Tax: 9
      { purchasePrice: 26.00, sellingPrice: 30.00, quantity: 3.0, taxRate: 18 },  // Soap: Sub: 90, COGS: 78, Tax: 16.20
    ];

    const result = calculateSaleFinancials(items, 0);

    expect(result.subtotal).toBe(370.00);
    expect(result.costOfGoodsSold).toBe(317.00); // 84 + 155 + 78
    expect(result.taxAmount).toBe(25.20);
    expect(result.totalAmount).toBe(395.20);
    expect(result.grossProfit).toBe(53.00); // Net subtotal 370 - COGS 317 = 53
  });

  it('should calculate Net Profit correctly by subtracting Operating Expenses from Gross Profit', () => {
    const grossProfit = 12500.00;
    const totalExpenses = 1450.00; // Rent/Power/Salary

    const netProfit = calculateNetProfit(grossProfit, totalExpenses);

    expect(netProfit).toBe(11050.00);
  });

  it('should handle fractional unit calculations (e.g. 0.25 kg = 250 grams)', () => {
    const items: SaleLineItem[] = [
      { purchasePrice: 100.00, sellingPrice: 120.00, quantity: 0.25, taxRate: 0 }, // 250g cashews
    ];

    const result = calculateSaleFinancials(items, 0);

    expect(result.subtotal).toBe(30.00);
    expect(result.costOfGoodsSold).toBe(25.00);
    expect(result.grossProfit).toBe(5.00);
  });
});
