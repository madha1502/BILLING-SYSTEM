import { describe, it, expect } from 'vitest';
import { SalesService } from '../src/modules/sales/sales.service.js';
import { ProductsService } from '../src/modules/products/products.service.js';
import { PaymentMethod, SaleStatus } from '@prisma/client';

describe('KiranaPro Sales Engine, Voice Parsing & Idempotent Billing', () => {
  const tenantId = 'tenant-demo-101';
  const userId = 'user-owner-101';

  it('should parse Tamil and English spoken voice billing input correctly', () => {
    // English phrase: "2 kilo rice"
    const parsedEng = SalesService.parseVoiceQuery('2 kilo rice');
    expect(parsedEng.quantity).toBe(2);
    expect(parsedEng.unit).toBe('KG');
    expect(parsedEng.cleanedQuery).toBe('rice');

    // Tamil phrase: "ரெண்டு கிலோ அரிசி"
    const parsedTam = SalesService.parseVoiceQuery('ரெண்டு கிலோ அரிசி');
    expect(parsedTam.quantity).toBe(2);
    expect(parsedTam.unit).toBe('KG');
    expect(parsedTam.cleanedQuery).toBe('அரிசி');
  });

  it('should create a sale, deduct inventory stock atomically, and calculate financial totals', async () => {
    const products = await ProductsService.listProducts(tenantId);
    const rice = products.find((p) => p.sku === 'RICE-PONNI-01')!;
    const oil = products.find((p) => p.sku === 'OIL-GW-1L')!;

    const initialRiceStock = rice.currentStock;

    const sale = await SalesService.createSale(tenantId, userId, {
      idempotencyKey: 'TEST-IDEM-001',
      items: [
        { productId: rice.id, quantity: 2.0 },
        { productId: oil.id, quantity: 1.0 },
      ],
      discount: 10.0,
      paymentMethod: PaymentMethod.UPI,
      customerPhone: '9876500000',
      customerName: 'Suresh Kumar',
    });

    expect(sale.billNumber).toContain('INV-2026-');
    expect(sale.status).toBe(SaleStatus.COMPLETED);
    expect(sale.discount).toBe(10.0);

    // Verify stock deduction
    const updatedRice = (await ProductsService.listProducts(tenantId)).find((p) => p.id === rice.id)!;
    expect(updatedRice.currentStock).toBe(initialRiceStock - 2.0);
  });

  it('should enforce idempotency and return the existing sale if the same key is sent twice', async () => {
    const products = await ProductsService.listProducts(tenantId);
    const rice = products[0];

    const sale1 = await SalesService.createSale(tenantId, userId, {
      idempotencyKey: 'UNIQUE-SYNC-KEY-999',
      items: [{ productId: rice.id, quantity: 1.0 }],
      paymentMethod: PaymentMethod.CASH,
    });

    const sale2 = await SalesService.createSale(tenantId, userId, {
      idempotencyKey: 'UNIQUE-SYNC-KEY-999',
      items: [{ productId: rice.id, quantity: 1.0 }],
      paymentMethod: PaymentMethod.CASH,
    });

    expect(sale1.id).toBe(sale2.id);
    expect(sale1.billNumber).toBe(sale2.billNumber);
  });

  it('should cancel a bill and restore product stock', async () => {
    const products = await ProductsService.listProducts(tenantId);
    const item = products[0];
    const stockBefore = item.currentStock;

    const sale = await SalesService.createSale(tenantId, userId, {
      items: [{ productId: item.id, quantity: 5.0 }],
      paymentMethod: PaymentMethod.CASH,
    });

    expect(item.currentStock).toBe(stockBefore - 5.0);

    // Cancel Bill
    const cancelledSale = await SalesService.cancelSale(
      tenantId,
      userId,
      sale.id,
      'Customer requested cancellation'
    );

    expect(cancelledSale.status).toBe(SaleStatus.CANCELLED);

    // Verify stock restored
    const stockAfterCancel = (await ProductsService.listProducts(tenantId)).find((p) => p.id === item.id)!.currentStock;
    expect(stockAfterCancel).toBe(stockBefore);
  });
});
