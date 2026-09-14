import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProductsService } from './products.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { Unit } from '@prisma/client';

const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  localName: z.string().optional(),
  categoryId: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  unit: z.nativeEnum(Unit).default(Unit.PIECE),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
  taxRate: z.number().min(0).max(100).optional().default(0),
  currentStock: z.number().min(0).default(0),
  minimumStock: z.number().min(0).default(5),
  aliases: z.array(z.string()).optional(),
});

const updateProductSchema = createProductSchema.partial().extend({
  active: z.boolean().optional(),
});

export class ProductsController {
  static async listProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const query = req.query.q as string;
      const lowStockOnly = req.query.lowStock === 'true';

      const products = await ProductsService.listProducts(tenantId, query, lowStockOnly);
      return sendSuccess(res, products, 'Products retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async findByBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const barcode = req.params.barcode;

      const product = await ProductsService.findByBarcode(tenantId, barcode);
      return sendSuccess(res, product, 'Product found by barcode');
    } catch (err) {
      next(err);
    }
  }

  static async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validated = createProductSchema.parse(req.body);
      const product = await ProductsService.createProduct(tenantId, validated);
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  static async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const productId = req.params.id;
      const validated = updateProductSchema.parse(req.body);

      const product = await ProductsService.updateProduct(tenantId, productId, validated);
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const productId = req.params.id;

      const result = await ProductsService.deleteProduct(tenantId, productId);
      return sendSuccess(res, result, 'Product deactivated successfully');
    } catch (err) {
      next(err);
    }
  }
}
