import { SalesService } from '../sales/sales.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';

export class AdminService {
  static async getGlobalStats() {
    return {
      platform: 'KiranaPro SaaS Platform Engine',
      totalTenants: 148,
      activeShops: 142,
      suspendedShops: 6,
      totalSalesVolumeProcessed: 4850900.0,
      totalBillsProcessed: 18450,
      smsCreditsDispatched: 14200,
      monthlyRecurringRevenue: 42458.0, // INR
      serverStatus: 'HEALTHY',
    };
  }

  static async listTenants() {
    return [
      {
        id: 'tenant-demo-101',
        name: 'Murugan Kirana & General Store',
        phone: '9876543210',
        plan: 'PRO',
        status: 'ACTIVE',
        billsThisMonth: 47,
        createdAt: '2026-09-01T00:00:00.000Z',
      },
      {
        id: 'tenant-demo-102',
        name: 'Annapoorna General Stores',
        phone: '9123456789',
        plan: 'FREE',
        status: 'ACTIVE',
        billsThisMonth: 12,
        createdAt: '2026-09-10T00:00:00.000Z',
      },
    ];
  }

  static async updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'SUSPENDED') {
    return {
      tenantId,
      status,
      updatedAt: new Date(),
      message: `Tenant ${tenantId} status updated to ${status}`,
    };
  }
}
