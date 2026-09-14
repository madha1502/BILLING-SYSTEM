import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SmsService } from './sms.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const sendSmsSchema = z.object({
  customerPhone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be a valid 10-digit Indian phone number'),
  shopName: z.string().min(1),
  billNumber: z.string().min(1),
  totalAmount: z.number().positive(),
});

export class SmsController {
  static async sendBillSms(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const { customerPhone, shopName, billNumber, totalAmount } = sendSmsSchema.parse(req.body);

      const log = await SmsService.sendBillSms(tenantId, customerPhone, shopName, billNumber, totalAmount);
      return sendSuccess(res, log, 'SMS notification sent');
    } catch (err) {
      next(err);
    }
  }

  static async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const logs = await SmsService.listSmsLogs(tenantId);
      return sendSuccess(res, logs, 'SMS delivery logs retrieved');
    } catch (err) {
      next(err);
    }
  }
}
