import { Unit } from '@prisma/client';
import { NotFoundError, ConflictError, AppError } from '../../shared/errors/app-error.js';

export interface CreateProductInput {
  name: string;
  localName?: string;
  categoryId?: string;
  barcode?: string;
  sku?: string;
  unit: Unit;
  purchasePrice: number;
  sellingPrice: number;
  taxRate?: number;
  currentStock: number;
  minimumStock: number;
  aliases?: string[];
}

export interface UpdateProductInput {
  name?: string;
  localName?: string;
  categoryId?: string;
  barcode?: string;
  sku?: string;
  unit?: Unit;
  purchasePrice?: number;
  sellingPrice?: number;
  taxRate?: number;
  minimumStock?: number;
  aliases?: string[];
  active?: boolean;
}

// In-Memory store initialized with Kirana sample catalog for dev speed
const memoryProducts = new Map<string, any[]>();
const memoryStockTx = new Map<string, any[]>();

// Seed default products for demo tenant `tenant-demo-101`
const demoTenantId = 'tenant-demo-101';
memoryProducts.set(demoTenantId, [
  {
    id: 'prod-101',
    tenantId: demoTenantId,
    name: 'Ponni Boiled Rice (Standard)',
    localName: 'பொன்னி அரிசி',
    barcode: '890100000001',
    sku: 'RICE-PONNI-01',
    unit: 'KG',
    purchasePrice: 42.0,
    sellingPrice: 50.0,
    taxRate: 0.0,
    currentStock: 150.0,
    minimumStock: 20.0,
    active: true,
    aliases: ['rice', 'ponni rice', 'arisi', 'அரிசி', 'பொன்னி அரிசி'],
    createdAt: new Date(),
  },
  {
    id: 'prod-102',
    tenantId: demoTenantId,
    name: 'Gold Winner Refined Sunflower Oil 1L',
    localName: 'கோல்ட் வின்னர் சமையல் எண்ணெய் 1லி',
    barcode: '890123456789',
    sku: 'OIL-GW-1L',
    unit: 'PACKET',
    purchasePrice: 155.0,
    sellingPrice: 180.0,
    taxRate: 5.0,
    currentStock: 45.0,
    minimumStock: 10.0,
    active: true,
    aliases: ['oil', 'sunflower oil', 'gold winner', 'ennai', 'எண்ணெய்'],
    createdAt: new Date(),
  },
  {
    id: 'prod-103',
    tenantId: demoTenantId,
    name: 'Hamam Bath Soap 100g',
    localName: 'ஹமாம் சோப் 100கி',
    barcode: '890103001122',
    sku: 'SOAP-HAM-100G',
    unit: 'PIECE',
    purchasePrice: 26.0,
    sellingPrice: 30.0,
    taxRate: 18.0,
    currentStock: 6.0, // Low stock trigger
    minimumStock: 15.0,
    active: true,
    aliases: ['soap', 'hamam', 'hamam soap', 'சோப்', 'ஹமாம்'],
    createdAt: new Date(),
  },
]);

export class ProductsService {
  static getTenantProducts(tenantId: string) {
    if (!memoryProducts.has(tenantId)) {
      memoryProducts.set(tenantId, []);
    }
    return memoryProducts.get(tenantId)!;
  }

  static async listProducts(
    tenantId: string,
    query?: string,
    lowStockOnly: boolean = false
  ) {
    let products = this.getTenantProducts(tenantId).filter((p) => p.active);

    if (lowStockOnly) {
      products = products.filter((p) => p.currentStock <= p.minimumStock);
    }

    if (query) {
      const q = query.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.localName && p.localName.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.aliases && p.aliases.some((alias: string) => alias.toLowerCase().includes(q)))
      );
    }

    return products;
  }

  static async findByBarcode(tenantId: string, barcode: string) {
    const products = this.getTenantProducts(tenantId);
    const product = products.find(
      (p) => p.active && p.barcode === barcode
    );
    if (!product) {
      throw new NotFoundError(
        `Product with barcode "${barcode}" not found in your shop catalog.`,
        'PRODUCT_BARCODE_NOT_FOUND'
      );
    }
    return product;
  }

  static async createProduct(tenantId: string, input: CreateProductInput) {
    const products = this.getTenantProducts(tenantId);

    if (input.barcode) {
      const existingBarcode = products.find((p) => p.barcode === input.barcode && p.active);
      if (existingBarcode) {
        throw new ConflictError(
          `Another product "${existingBarcode.name}" already uses barcode "${input.barcode}".`,
          'BARCODE_ALREADY_EXISTS'
        );
      }
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      tenantId,
      name: input.name,
      localName: input.localName || null,
      categoryId: input.categoryId || null,
      barcode: input.barcode || null,
      sku: input.sku || `SKU-${Date.now()}`,
      unit: input.unit,
      purchasePrice: input.purchasePrice,
      sellingPrice: input.sellingPrice,
      taxRate: input.taxRate || 0.0,
      currentStock: input.currentStock,
      minimumStock: input.minimumStock,
      active: true,
      aliases: input.aliases || [input.name.toLowerCase()],
      createdAt: new Date(),
    };

    products.push(newProduct);
    return newProduct;
  }

  static async updateProduct(tenantId: string, productId: string, input: UpdateProductInput) {
    const products = this.getTenantProducts(tenantId);
    const index = products.findIndex((p) => p.id === productId);

    if (index === -1) {
      throw new NotFoundError('Product not found in your store catalog.', 'PRODUCT_NOT_FOUND');
    }

    const current = products[index];

    // If price changed, we log historical price change
    if (
      (input.sellingPrice && input.sellingPrice !== current.sellingPrice) ||
      (input.purchasePrice && input.purchasePrice !== current.purchasePrice)
    ) {
      console.log(`[Price Ledger] Product ${current.id} price changed from ₹${current.sellingPrice} to ₹${input.sellingPrice}`);
    }

    const updatedProduct = {
      ...current,
      ...input,
      updatedAt: new Date(),
    };

    products[index] = updatedProduct;
    return updatedProduct;
  }

  static async deleteProduct(tenantId: string, productId: string) {
    const products = this.getTenantProducts(tenantId);
    const index = products.findIndex((p) => p.id === productId);

    if (index === -1) {
      throw new NotFoundError('Product not found in your store catalog.', 'PRODUCT_NOT_FOUND');
    }

    products[index].active = false;
    return { success: true, message: 'Product deactivated successfully' };
  }
}
