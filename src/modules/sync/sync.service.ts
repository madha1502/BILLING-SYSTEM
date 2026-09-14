import { SalesService, CreateSaleInput } from '../sales/sales.service.js';
import { ProductsService } from '../products/products.service.js';

export interface SyncBatchItem extends CreateSaleInput {
  syncId: string;
}

export interface SyncResultItem {
  syncId: string;
  idempotencyKey?: string;
  serverBillNumber?: string;
  status: 'SYNCHRONIZED' | 'DUPLICATE_SKIPPED' | 'ERROR';
  error?: string;
}

export class SyncService {
  /**
   * Batch Offline Sync Processor
   * Resolves conflicts by preserving all valid sales and adjusting inventory stock authoritatively.
   */
  static async processBatchSync(tenantId: string, userId: string, items: SyncBatchItem[]) {
    const results: SyncResultItem[] = [];

    for (const item of items) {
      try {
        const saleResult = await SalesService.createSale(tenantId, userId, {
          idempotencyKey: item.idempotencyKey || item.syncId,
          items: item.items,
          discount: item.discount,
          paymentMethod: item.paymentMethod,
          customerPhone: item.customerPhone,
          notes: `Synchronized offline bill (${item.syncId})`,
        });

        results.push({
          syncId: item.syncId,
          idempotencyKey: item.idempotencyKey || item.syncId,
          serverBillNumber: saleResult.billNumber,
          status: 'SYNCHRONIZED',
        });
      } catch (err: any) {
        console.warn(`[Sync Conflict Engine] Batch item ${item.syncId} processing warning:`, err.message);
        results.push({
          syncId: item.syncId,
          idempotencyKey: item.idempotencyKey || item.syncId,
          status: 'ERROR',
          error: err.message || 'Synchronization conflict',
        });
      }
    }

    // Check post-sync catalog low stock conditions
    const lowStockItems = await ProductsService.listProducts(tenantId, undefined, true);

    return {
      processedCount: results.length,
      successCount: results.filter((r) => r.status === 'SYNCHRONIZED').length,
      results,
      lowStockWarnings: lowStockItems.length,
    };
  }
}
