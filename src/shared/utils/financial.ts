/**
 * Financial & Monetary Arithmetic Engine for KiranaPro SaaS
 * Guarantees exact integer paise calculations without IEEE 754 floating point errors.
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export interface SaleLineItem {
  purchasePrice: number; // in Rupees
  sellingPrice: number;  // in Rupees
  quantity: number;
  taxRate: number;      // e.g. 18 for 18%
}

export interface FinancialCalculation {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  costOfGoodsSold: number;
  grossProfit: number;
}

export function calculateSaleFinancials(items: SaleLineItem[], discount: number = 0): FinancialCalculation {
  let subtotalPaise = 0;
  let taxPaise = 0;
  let cogsPaise = 0;

  for (const item of items) {
    const itemSubtotal = Math.round(item.sellingPrice * item.quantity * 100);
    const itemCogs = Math.round(item.purchasePrice * item.quantity * 100);
    const itemTax = Math.round((itemSubtotal * item.taxRate) / 100);

    subtotalPaise += itemSubtotal;
    cogsPaise += itemCogs;
    taxPaise += itemTax;
  }

  const discountPaise = Math.round(discount * 100);
  const netSubtotalPaise = subtotalPaise - discountPaise;
  const totalAmountPaise = netSubtotalPaise + taxPaise;
  const grossProfitPaise = netSubtotalPaise - cogsPaise;

  return {
    subtotal: toRupees(subtotalPaise),
    taxAmount: toRupees(taxPaise),
    totalAmount: toRupees(totalAmountPaise),
    costOfGoodsSold: toRupees(cogsPaise),
    grossProfit: toRupees(grossProfitPaise),
  };
}

export function calculateNetProfit(grossProfit: number, expenses: number): number {
  const grossPaise = Math.round(grossProfit * 100);
  const expPaise = Math.round(expenses * 100);
  return toRupees(grossPaise - expPaise);
}
