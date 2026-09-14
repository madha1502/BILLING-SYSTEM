import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SyncService } from './sync.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { PaymentMethod } from '@prisma/client';

const syncItemSchema = z.object({
  syncId: z.string().min(1, 'Sync ID is required'),
  idempotencyKey: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().positive(),
    })
  ).min(1),
  discount: z.number().min(0).default(0),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  customerPhone: z.string().optional(),
});

const batchSyncSchema = z.object({
  items: z.array(syncItemSchema).min(1, 'Sync batch must contain at least one item'),
});

export class SyncController {
  static async processBatchSync(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user!.id;
      const { items } = batchSyncSchema.parse(req.body);

      const result = await SyncService.processBatchSync(tenantId, userId, items);
      return sendSuccess(res, result, 'Batch offline synchronization completed');
    } catch (err) {
      next(err);
    }
  }

  static async getSyncStatus(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(
        res,
        {
          status: 'READY',
          serverTime: new Date().toISOString(),
          idempotencyEnabled: true,
        },
        'Sync server ready'
      );
    } catch (err) {
      next(err);
    }
  }
}
