import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class AuditController {
  static async listLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const logs = await AuditService.listLogs(tenantId);
      return sendSuccess(res, logs, 'Audit trail logs retrieved');
    } catch (err) {
      next(err);
    }
  }
}
