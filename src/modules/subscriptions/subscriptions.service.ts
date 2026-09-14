import { AppError, ForbiddenError } from '../../shared/errors/app-error.js';

export interface SaaSPlan {
  code: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxProducts: number;
  maxBillsPerMonth: number;
  includesSms: boolean;
  includesVoice: boolean;
}

export const SAAS_PLANS: Record<string, SaaSPlan> = {
  FREE: {
    code: 'FREE',
    name: 'Free Trial Plan',
    priceMonthly: 0,
    maxUsers: 1,
    maxProducts: 100,
    maxBillsPerMonth: 250,
    includesSms: false,
    includesVoice: true,
  },
  PRO: {
    code: 'PRO',
    name: 'Kirana Pro Plan',
    priceMonthly: 299,
    maxUsers: 5,
    maxProducts: 2000,
    maxBillsPerMonth: 10000,
    includesSms: true,
    includesVoice: true,
  },
  BUSINESS: {
    code: 'BUSINESS',
    name: 'Multi-Store Business Plan',
    priceMonthly: 799,
    maxUsers: 20,
    maxProducts: 10000,
    maxBillsPerMonth: 50000,
    includesSms: true,
    includesVoice: true,
  },
};

const memorySubscriptions = new Map<string, any>();

// Seed default subscription for demo tenant
const demoTenantId = 'tenant-demo-101';
memorySubscriptions.set(demoTenantId, {
  tenantId: demoTenantId,
  planCode: 'PRO',
  status: 'ACTIVE',
  currentPeriodStart: new Date(),
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  billsThisMonth: 47,
  productsCount: 4,
});

export class SubscriptionsService {
  static getTenantSubscription(tenantId: string) {
    if (!memorySubscriptions.has(tenantId)) {
      memorySubscriptions.set(tenantId, {
        tenantId,
        planCode: 'FREE',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        billsThisMonth: 0,
        productsCount: 0,
      });
    }
    return memorySubscriptions.get(tenantId)!;
  }

  static async getSubscriptionStatus(tenantId: string) {
    const sub = this.getTenantSubscription(tenantId);
    const plan = SAAS_PLANS[sub.planCode] || SAAS_PLANS.FREE;

    return {
      subscription: sub,
      plan,
      usage: {
        billsUsed: sub.billsThisMonth,
        billsLimit: plan.maxBillsPerMonth,
        billsPercentage: Math.round((sub.billsThisMonth / plan.maxBillsPerMonth) * 100),
        productsUsed: sub.productsCount,
        productsLimit: plan.maxProducts,
      },
    };
  }

  static async verifyEntitlement(tenantId: string, feature: 'CREATE_BILL' | 'CREATE_PRODUCT' | 'SEND_SMS') {
    const status = await this.getSubscriptionStatus(tenantId);
    const { plan, subscription, usage } = status;

    if (subscription.status !== 'ACTIVE') {
      throw new ForbiddenError('Your shop subscription is suspended or expired. Please renew.', 'SUBSCRIPTION_EXPIRED');
    }

    if (feature === 'CREATE_BILL' && usage.billsUsed >= plan.maxBillsPerMonth) {
      throw new ForbiddenError(
        `Monthly billing quota reached (${plan.maxBillsPerMonth} bills). Please upgrade to PRO plan.`,
        'BILL_QUOTA_EXCEEDED'
      );
    }

    if (feature === 'CREATE_PRODUCT' && usage.productsUsed >= plan.maxProducts) {
      throw new ForbiddenError(
        `Product catalog limit reached (${plan.maxProducts} items). Please upgrade your plan.`,
        'PRODUCT_QUOTA_EXCEEDED'
      );
    }

    if (feature === 'SEND_SMS' && !plan.includesSms) {
      throw new ForbiddenError('SMS billing notifications are not included in Free plan. Upgrade to PRO.', 'SMS_NOT_INCLUDED');
    }

    return true;
  }

  static async upgradeSubscription(tenantId: string, planCode: string) {
    if (!SAAS_PLANS[planCode]) {
      throw new AppError(`Invalid SaaS plan code "${planCode}".`, 400, 'INVALID_PLAN');
    }

    const sub = this.getTenantSubscription(tenantId);
    sub.planCode = planCode;
    sub.status = 'ACTIVE';
    sub.currentPeriodStart = new Date();
    sub.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.getSubscriptionStatus(tenantId);
  }
}
