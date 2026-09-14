import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SalesService } from './sales.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { PaymentMethod } from '@prisma/client';

const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
});

const createSaleSchema = z.object({
  idempotencyKey: z.string().optional(),
  items: z.array(cartItemSchema).min(1, 'Cart must contain at least one item'),
  discount: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  customerPhone: z.string().optional(),
  customerName: z.string().optional(),
  notes: z.string().optional(),
});

const voiceParseSchema = z.object({
  speechText: z.string().min(1, 'Speech text is required'),
});

const cancelSaleSchema = z.object({
  reason: z.string().min(2, 'Cancellation reason is required'),
});

export class SalesController {
  static async createSale(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const validated = createSaleSchema.parse(req.body);

      const sale = await SalesService.createSale(tenantId, userId, validated);
      return sendSuccess(res, sale, 'Bill completed successfully!', 201);
    } catch (err) {
      next(err);
    }
  }

  static async parseVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { speechText } = voiceParseSchema.parse(req.body);
      const parsed = SalesService.parseVoiceQuery(speechText);
      return sendSuccess(res, parsed, 'Voice query parsed successfully');
    } catch (err) {
      next(err);
    }
  }

  static async getSalesHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const query = req.query.q as string;

      const sales = await SalesService.getSalesHistory(tenantId, query);
      return sendSuccess(res, sales, 'Sales history retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async getSaleById(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const saleId = req.params.id;

      const sale = await SalesService.getSaleById(tenantId, saleId);
      return sendSuccess(res, sale, 'Sale details retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async cancelSale(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const saleId = req.params.id;
      const { reason } = cancelSaleSchema.parse(req.body);

      const sale = await SalesService.cancelSale(tenantId, userId, saleId, reason);
      return sendSuccess(res, sale, 'Bill cancelled and stock restored successfully');
    } catch (err) {
      next(err);
    }
  }
}
