import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SubscriptionsService } from './subscriptions.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const upgradeSchema = z.object({
  planCode: z.enum(['FREE', 'PRO', 'BUSINESS']),
});

export class SubscriptionsController {
  static async getCurrentSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const status = await SubscriptionsService.getSubscriptionStatus(tenantId);
      return sendSuccess(res, status, 'Subscription status retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async upgradePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { planCode } = upgradeSchema.parse(req.body);

      const status = await SubscriptionsService.upgradeSubscription(tenantId, planCode);
      return sendSuccess(res, status, `Shop subscription upgraded to ${planCode}!`);
    } catch (err) {
      next(err);
    }
  }
}
