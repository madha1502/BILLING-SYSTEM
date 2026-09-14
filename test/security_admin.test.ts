import { describe, it, expect } from 'vitest';
import { AuditService } from '../src/modules/audit/audit.service.js';
import { AdminService } from '../src/modules/admin/admin.service.js';
import { ProductsService } from '../src/modules/products/products.service.js';

describe('KiranaPro Audit Logging, Security Hardening & SaaS Admin Suite', () => {
  const tenantId = 'tenant-demo-101';
  const userId = 'user-owner-101';

  it('should log sensitive actions into audit trail', async () => {
    const log = await AuditService.log({
      tenantId,
      userId,
      action: 'SALE_CANCEL',
      entity: 'Sale',
      entityId: 'sale-101',
      metadata: { reason: 'Customer return' },
    });

    expect(log.id).toBeDefined();
    expect(log.action).toBe('SALE_CANCEL');

    const logs = await AuditService.listLogs(tenantId);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should strictly isolate data across tenants (Store A vs Store B)', async () => {
    const tenantA = 'tenant-demo-101';
    const tenantB = 'tenant-demo-102';

    const productsA = await ProductsService.listProducts(tenantA);
    const productsB = await ProductsService.listProducts(tenantB);

    // Products of Tenant B should not contain Tenant A products
    for (const p of productsB) {
      expect(p.tenantId).toBe(tenantB);
    }
  });

  it('should allow SaaS superadmin to query platform stats and manage tenant status', async () => {
    const stats = await AdminService.getGlobalStats();
    expect(stats.totalTenants).toBeGreaterThan(0);
    expect(stats.serverStatus).toBe('HEALTHY');

    const tenants = await AdminService.listTenants();
    expect(tenants.length).toBeGreaterThan(0);

    const updated = await AdminService.updateTenantStatus('tenant-demo-102', 'SUSPENDED');
    expect(updated.status).toBe('SUSPENDED');
  });
});
