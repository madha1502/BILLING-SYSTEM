import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InventoryService } from './inventory.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const adjustStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE']),
  quantityChange: z.number().refine((n) => n !== 0, { message: 'Quantity change cannot be zero' }),
  notes: z.string().optional(),
});

export class InventoryController {
  static async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const items = await InventoryService.getLowStockProducts(tenantId);
      return sendSuccess(res, items, 'Low-stock items retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const validated = adjustStockSchema.parse(req.body);

      const result = await InventoryService.adjustStock(tenantId, userId, validated);
      return sendSuccess(res, result, 'Stock updated successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getStockHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const productId = req.params.productId;

      const history = await InventoryService.getProductStockHistory(tenantId, productId);
      return sendSuccess(res, history, 'Product stock movement history retrieved');
    } catch (err) {
      next(err);
    }
  }
}
