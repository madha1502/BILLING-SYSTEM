import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminService } from './admin.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const tenantStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED']),
});

export class AdminController {
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getGlobalStats();
      return sendSuccess(res, stats, 'Global SaaS platform stats retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async listTenants(_req: Request, res: Response, next: NextFunction) {
    try {
      const tenants = await AdminService.listTenants();
      return sendSuccess(res, tenants, 'Tenant list retrieved');
    } catch (err) {
      next(err);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.params.id;
      const { status } = tenantStatusSchema.parse(req.body);

      const result = await AdminService.updateTenantStatus(tenantId, status);
      return sendSuccess(res, result, 'Tenant status updated');
    } catch (err) {
      next(err);
    }
  }
}
