import { ProductsService } from '../products/products.service.js';
import { NotFoundError, AppError } from '../../shared/errors/app-error.js';

export interface AdjustStockInput {
  productId: string;
  type: 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'DAMAGE';
  quantityChange: number; // positive for addition, negative for reduction
  notes?: string;
}

const memoryInventoryLedger = new Map<string, any[]>();

export class InventoryService {
  static getTenantLedger(tenantId: string) {
    if (!memoryInventoryLedger.has(tenantId)) {
      memoryInventoryLedger.set(tenantId, []);
    }
    return memoryInventoryLedger.get(tenantId)!;
  }

  static async getLowStockProducts(tenantId: string) {
    return ProductsService.listProducts(tenantId, undefined, true);
  }

  static async adjustStock(tenantId: string, userId: string, input: AdjustStockInput) {
    const products = ProductsService.getTenantProducts(tenantId);
    const product = products.find((p) => p.id === input.productId && p.active);

    if (!product) {
      throw new NotFoundError('Product not found for inventory adjustment.', 'PRODUCT_NOT_FOUND');
    }

    const previousStock = product.currentStock;
    const newStock = previousStock + input.quantityChange;

    if (newStock < 0) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Current: ${previousStock}, Requested deduction: ${Math.abs(input.quantityChange)}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    // Update Product Stock
    product.currentStock = newStock;

    // Record Stock Movement Transaction Ledger
    const ledgerEntry = {
      id: `invtx-${Date.now()}`,
      tenantId,
      productId: product.id,
      productName: product.name,
      type: input.type,
      quantityChange: input.quantityChange,
      previousStock,
      stockAfter: newStock,
      notes: input.notes || null,
      userId,
      createdAt: new Date(),
    };

    const ledger = this.getTenantLedger(tenantId);
    ledger.unshift(ledgerEntry);

    return {
      product: {
        id: product.id,
        name: product.name,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
        isLowStock: product.currentStock <= product.minimumStock,
      },
      transaction: ledgerEntry,
    };
  }

  static async getProductStockHistory(tenantId: string, productId: string) {
    const ledger = this.getTenantLedger(tenantId);
    return ledger.filter((tx) => tx.productId === productId);
  }
}
