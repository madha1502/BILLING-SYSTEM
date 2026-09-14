import { describe, it, expect } from 'vitest';
import { SmsService } from '../src/modules/sms/sms.service.js';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service.js';

describe('KiranaPro SMS Gateway Abstraction & SaaS Subscription Engine', () => {
  const tenantId = 'tenant-demo-101';

  it('should dispatch bill SMS and record delivery logs', async () => {
    const log = await SmsService.sendBillSms(
      tenantId,
      '9443322110',
      'Murugan Kirana Store',
      'MKS-2026-000101',
      370.00
    );

    expect(log.id).toBeDefined();
    expect(log.status).toBe('SENT');
    expect(log.message).toContain('MKS-2026-000101');

    const logs = await SmsService.listSmsLogs(tenantId);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should check tenant subscription status and quota usage metrics', async () => {
    const status = await SubscriptionsService.getSubscriptionStatus(tenantId);

    expect(status.plan.code).toBe('PRO');
    expect(status.usage.billsLimit).toBe(10000);
    expect(status.usage.billsUsed).toBeGreaterThan(0);
  });

  it('should enforce feature entitlement checks for billing and sms', async () => {
    const allowed = await SubscriptionsService.verifyEntitlement(tenantId, 'CREATE_BILL');
    expect(allowed).toBe(true);
  });

  it('should allow tenant to upgrade subscription plan', async () => {
    const upgraded = await SubscriptionsService.upgradeSubscription(tenantId, 'BUSINESS');
    expect(upgraded.plan.code).toBe('BUSINESS');
    expect(upgraded.plan.maxBillsPerMonth).toBe(50000);
  });
});
