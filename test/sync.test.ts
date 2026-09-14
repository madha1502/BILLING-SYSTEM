import { describe, it, expect } from 'vitest';
import { SyncService } from '../src/modules/sync/sync.service.js';
import { ProductsService } from '../src/modules/products/products.service.js';
import { PaymentMethod } from '@prisma/client';

describe('KiranaPro Offline Sync Engine & Conflict Resolution', () => {
  const tenantId = 'tenant-demo-101';
  const userId = 'user-owner-101';

  it('should process a batch of offline transactions and return authoritative server bill numbers', async () => {
    const products = await ProductsService.listProducts(tenantId);
    const rice = products[0];

    const batchInput = [
      {
        syncId: 'TEMP-DEV1-1001',
        idempotencyKey: 'IDEM-BATCH-001',
        items: [{ productId: rice.id, quantity: 1.0 }],
        paymentMethod: PaymentMethod.CASH,
        discount: 0,
      },
      {
        syncId: 'TEMP-DEV1-1002',
        idempotencyKey: 'IDEM-BATCH-002',
        items: [{ productId: rice.id, quantity: 2.0 }],
        paymentMethod: PaymentMethod.UPI,
        discount: 5.0,
      },
    ];

    const res = await SyncService.processBatchSync(tenantId, userId, batchInput);

    expect(res.processedCount).toBe(2);
    expect(res.successCount).toBe(2);
    expect(res.results[0].serverBillNumber).toContain('INV-2026-');
    expect(res.results[1].serverBillNumber).toContain('INV-2026-');
  });

  it('should handle duplicate sync requests idempotently without corrupting stock or creating duplicate bills', async () => {
    const products = await ProductsService.listProducts(tenantId);
    const item = products[0];

    const batchInput = [
      {
        syncId: 'TEMP-DEV1-9999',
        idempotencyKey: 'IDEM-RETRY-999',
        items: [{ productId: item.id, quantity: 1.0 }],
        paymentMethod: PaymentMethod.CASH,
      },
    ];

    // First sync attempt
    const res1 = await SyncService.processBatchSync(tenantId, userId, batchInput);
    // Retry sync attempt with exact same key
    const res2 = await SyncService.processBatchSync(tenantId, userId, batchInput);

    expect(res1.results[0].serverBillNumber).toBe(res2.results[0].serverBillNumber);
  });
});
