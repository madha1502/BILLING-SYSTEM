import { PaymentMethod, SaleStatus, Unit } from '@prisma/client';
import { ProductsService } from '../products/products.service.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { AppError, ConflictError, NotFoundError } from '../../shared/errors/app-error.js';
import { calculateSaleFinancials } from '../../shared/utils/financial.js';

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  idempotencyKey?: string;
  items: CartItemInput[];
  discount?: number;
  paymentMethod: PaymentMethod;
  customerPhone?: string;
  customerName?: string;
  notes?: string;
  localCreatedAt?: Date;
}

// In-Memory Sales Database Store
const memorySales = new Map<string, any[]>();
const memoryCustomers = new Map<string, any[]>();

// Seed initial sales for demo tenant `tenant-demo-101`
const demoTenantId = 'tenant-demo-101';
memorySales.set(demoTenantId, [
  {
    id: 'sale-101',
    tenantId: demoTenantId,
    billNumber: 'MKS-2026-000101',
    status: SaleStatus.COMPLETED,
    subtotal: 370.00,
    discount: 0.00,
    taxAmount: 18.00,
    totalAmount: 370.00,
    costOfGoodsSold: 317.00,
    grossProfit: 53.00,
    paymentMethod: 'UPI',
    createdAt: new Date(),
  },
]);

export class SalesService {
  static getTenantSales(tenantId: string) {
    if (!memorySales.has(tenantId)) {
      memorySales.set(tenantId, []);
    }
    return memorySales.get(tenantId)!;
  }

  static getTenantCustomers(tenantId: string) {
    if (!memoryCustomers.has(tenantId)) {
      memoryCustomers.set(tenantId, []);
    }
    return memoryCustomers.get(tenantId)!;
  }

  /**
   * Voice Signal Parser for Indian Kirana Speech
   * Converts Tamil & English speech phrases into structured search intents
   * e.g. "2 kilo rice" -> { query: "rice", quantity: 2, unit: "KG" }
   * e.g. "ரெண்டு கிலோ அரிசி" -> { query: "அரிசி", quantity: 2, unit: "KG" }
   */
  static parseVoiceQuery(speechText: string) {
    const text = speechText.toLowerCase().trim();
    let quantity = 1;
    let unit: Unit = Unit.PIECE;
    let queryText = text;

    // Number mapping for English & Tamil spoken words
    const numMap: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
      ஒரு: 1, ஒன்னு: 1, ரெண்டு: 2, இரண்டு: 2, மூணு: 3, மூன்று: 3, நாலு: 4, நான்கு: 4, அஞ்சு: 5, ஐந்து: 5,
    };

    // Extract quantity digits or word matches
    const digitMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (digitMatch) {
      quantity = parseFloat(digitMatch[1]);
      queryText = text.replace(digitMatch[1], '').trim();
    } else {
      for (const [word, num] of Object.entries(numMap)) {
        if (text.includes(word)) {
          quantity = num;
          queryText = text.replace(word, '').trim();
          break;
        }
      }
    }

    // Extract units (kg, grams, litre, packet, piece, etc.)
    if (queryText.includes('kilo') || queryText.includes('kg') || queryText.includes('கிலோ')) {
      unit = Unit.KG;
      queryText = queryText.replace(/kilo|kg|கிலோ/g, '').trim();
    } else if (queryText.includes('gram') || queryText.includes('கிராம்')) {
      unit = Unit.GRAM;
      queryText = queryText.replace(/gram|grams|கிராம்/g, '').trim();
      quantity = quantity / 1000; // Convert grams to fractional kg
    } else if (queryText.includes('litre') || queryText.includes('liter') || queryText.includes('லிட்டர்')) {
      unit = Unit.LITRE;
      queryText = queryText.replace(/litre|liter|லிட்டர்/g, '').trim();
    } else if (queryText.includes('packet') || queryText.includes('பாக்கெட்')) {
      unit = Unit.PACKET;
      queryText = queryText.replace(/packet|பாக்கெட்/g, '').trim();
    }

    return {
      originalSpeech: speechText,
      cleanedQuery: queryText,
      quantity,
      unit,
    };
  }

  static async createSale(tenantId: string, userId: string, input: CreateSaleInput) {
    const sales = this.getTenantSales(tenantId);

    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = sales.find((s) => s.idempotencyKey === input.idempotencyKey);
      if (existing) {
        console.log(`[Idempotency] Returning existing sale for key: ${input.idempotencyKey}`);
        return existing;
      }
    }

    // 2. Validate Cart Items & Products
    if (!input.items || input.items.length === 0) {
      throw new AppError('Cannot complete sale with an empty cart.', 400, 'EMPTY_CART');
    }

    const products = ProductsService.getTenantProducts(tenantId);
    const lineItemsToProcess: any[] = [];
    const dbItemsForFinancials: any[] = [];

    for (const itemInput of input.items) {
      const product = products.find((p) => p.id === itemInput.productId && p.active);
      if (!product) {
        throw new NotFoundError(`Product ID "${itemInput.productId}" not found in catalog.`, 'PRODUCT_NOT_FOUND');
      }

      if (product.currentStock < itemInput.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Requested: ${itemInput.quantity}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }

      const itemSubtotal = Math.round(product.sellingPrice * itemInput.quantity * 100) / 100;
      const itemTax = Math.round(((itemSubtotal * product.taxRate) / 100) * 100) / 100;
      const itemTotal = itemSubtotal + itemTax;

      lineItemsToProcess.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        purchasePriceAtSale: product.purchasePrice,
        taxRateAtSale: product.taxRate,
        quantity: itemInput.quantity,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemTotal,
      });

      dbItemsForFinancials.push({
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        quantity: itemInput.quantity,
        taxRate: product.taxRate,
      });
    }

    // 3. Compute Financial Totals
    const financials = calculateSaleFinancials(dbItemsForFinancials, input.discount || 0);

    // 4. Generate Bill Number (e.g. MKS-2026-000106)
    const billCount = sales.length + 101;
    const billNumber = `INV-2026-${String(billCount).padStart(6, '0')}`;

    // 5. Customer Record Handling
    let customerObj = null;
    if (input.customerPhone) {
      const customers = this.getTenantCustomers(tenantId);
      customerObj = customers.find((c) => c.phone === input.customerPhone);
      if (!customerObj) {
        customerObj = {
          id: `cust-${Date.now()}`,
          tenantId,
          name: input.customerName || `Customer ${input.customerPhone}`,
          phone: input.customerPhone,
          totalPurchases: 0.0,
          createdAt: new Date(),
        };
        customers.push(customerObj);
      }
      customerObj.totalPurchases += financials.totalAmount;
      customerObj.lastPurchaseAt = new Date();
    }

    // 6. Deduct Stock Atomically
    for (const item of lineItemsToProcess) {
      await InventoryService.adjustStock(tenantId, userId, {
        productId: item.productId,
        type: 'SALE',
        quantityChange: -item.quantity,
        notes: `Deducted for Bill ${billNumber}`,
      });
    }

    // 7. Save Sale Transaction
    const newSale = {
      id: `sale-${Date.now()}`,
      tenantId,
      billNumber,
      idempotencyKey: input.idempotencyKey || null,
      customerId: customerObj ? customerObj.id : null,
      userId,
      status: SaleStatus.COMPLETED,
      subtotal: financials.subtotal,
      discount: input.discount || 0,
      taxAmount: financials.taxAmount,
      totalAmount: financials.totalAmount,
      costOfGoodsSold: financials.costOfGoodsSold,
      grossProfit: financials.grossProfit,
      paymentMethod: input.paymentMethod,
      items: lineItemsToProcess,
      notes: input.notes || null,
      smsSent: input.customerPhone ? true : false,
      createdAt: new Date(),
    };

    sales.unshift(newSale);
    return newSale;
  }

  static async getSalesHistory(tenantId: string, query?: string) {
    const sales = this.getTenantSales(tenantId);

    if (query) {
      const q = query.toLowerCase().trim();
      return sales.filter(
        (s) =>
          s.billNumber.toLowerCase().includes(q) ||
          s.paymentMethod.toLowerCase().includes(q)
      );
    }

    return sales;
  }

  static async getSaleById(tenantId: string, saleId: string) {
    const sales = this.getTenantSales(tenantId);
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) {
      throw new NotFoundError('Invoice record not found.', 'SALE_NOT_FOUND');
    }
    return sale;
  }

  static async cancelSale(tenantId: string, userId: string, saleId: string, reason: string) {
    const sales = this.getTenantSales(tenantId);
    const sale = sales.find((s) => s.id === saleId);

    if (!sale) {
      throw new NotFoundError('Invoice record not found.', 'SALE_NOT_FOUND');
    }

    if (sale.status === SaleStatus.CANCELLED) {
      throw new ConflictError('This invoice has already been cancelled.', 'ALREADY_CANCELLED');
    }

    // Restore Stock for all sale items
    for (const item of sale.items) {
      await InventoryService.adjustStock(tenantId, userId, {
        productId: item.productId,
        type: 'RETURN',
        quantityChange: item.quantity,
        notes: `Stock restored from cancelled Bill ${sale.billNumber}. Reason: ${reason}`,
      });
    }

    sale.status = SaleStatus.CANCELLED;
    sale.cancelledAt = new Date();
    sale.cancellationReason = reason;

    return sale;
  }
}
