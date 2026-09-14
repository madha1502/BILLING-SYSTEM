import { describe, it, expect } from 'vitest';
import { ProductsService } from '../src/modules/products/products.service.js';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { Unit } from '@prisma/client';

describe('KiranaPro Product Catalog & Inventory Ledger', () => {
  const tenantId = 'tenant-demo-101';

  it('should list products and support Tamil and English voice alias searching', async () => {
    // English query "rice"
    const riceResults = await ProductsService.listProducts(tenantId, 'rice');
    expect(riceResults.length).toBeGreaterThan(0);
    expect(riceResults[0].name).toContain('Ponni');

    // Tamil query "அரிசி"
    const tamilResults = await ProductsService.listProducts(tenantId, 'அரிசி');
    expect(tamilResults.length).toBeGreaterThan(0);
    expect(tamilResults[0].name).toContain('Ponni');
  });

  it('should support instant barcode lookup for camera scanner', async () => {
    const barcodeProduct = await ProductsService.findByBarcode(tenantId, '890123456789');
    expect(barcodeProduct).toBeDefined();
    expect(barcodeProduct.name).toContain('Gold Winner');
  });

  it('should add a new grocery product and detect low stock condition when minimum stock is crossed', async () => {
    const newProduct = await ProductsService.createProduct(tenantId, {
      name: 'Aashirvaad Shuddh Chakki Atta 5kg',
      localName: 'ஆசீர்வாத் கோதுமை மாவு',
      barcode: '890105800999',
      sku: 'ATTA-AASH-5KG',
      unit: Unit.PACKET,
      purchasePrice: 210.0,
      sellingPrice: 245.0,
      taxRate: 0.0,
      currentStock: 3.0, // Initial stock 3
      minimumStock: 10.0, // Minimum 10 -> Low stock!
      aliases: ['atta', 'aashirvaad', 'wheat flour', 'மாவு'],
    });

    expect(newProduct.id).toBeDefined();
    expect(newProduct.name).toBe('Aashirvaad Shuddh Chakki Atta 5kg');

    // Query Low stock products
    const lowStock = await InventoryService.getLowStockProducts(tenantId);
    const found = lowStock.find((p) => p.id === newProduct.id);
    expect(found).toBeDefined();
  });

  it('should adjust inventory stock and record audit ledger entry', async () => {
    const products = await ProductsService.listProducts(tenantId);
    const item = products[0];
    const initialStock = item.currentStock;

    // Add 25 kg stock via PURCHASE adjustment
    const result = await InventoryService.adjustStock(tenantId, 'user-owner-101', {
      productId: item.id,
      type: 'PURCHASE',
      quantityChange: 25.0,
      notes: 'Fresh stock arrived from Madurai wholesale market',
    });

    expect(result.product.currentStock).toBe(initialStock + 25.0);
    expect(result.transaction.quantityChange).toBe(25.0);
    expect(result.transaction.stockAfter).toBe(initialStock + 25.0);

    // Verify stock ledger history
    const history = await InventoryService.getProductStockHistory(tenantId, item.id);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].quantityChange).toBe(25.0);
  });
});
