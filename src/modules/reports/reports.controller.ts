import { Request, Response, NextFunction } from 'express';
import { ReportsService } from './reports.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

export class ReportsController {
  static async getTodaySummary(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const summary = await ReportsService.getTodayDashboardSummary(tenantId);
      return sendSuccess(res, summary, 'Today summary fetched');
    } catch (err) {
      next(err);
    }
  }

  static async getProfitReport(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const report = await ReportsService.getProfitReport(tenantId);
      return sendSuccess(res, report, 'Profit report calculated');
    } catch (err) {
      next(err);
    }
  }

  static async getDayClose(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const openingCash = parseFloat((req.query.openingCash as string) || '0');

      const reconciliation = await ReportsService.getDayCloseReconciliation(tenantId, openingCash);
      return sendSuccess(res, reconciliation, 'Day close reconciliation calculated');
    } catch (err) {
      next(err);
    }
  }
}
