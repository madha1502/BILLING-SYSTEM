import { ISmsProvider, MockSmsProvider, IndianSmsGatewayProvider } from './sms.provider.js';

const memorySmsLogs = new Map<string, any[]>();

export class SmsService {
  private static provider: ISmsProvider = new MockSmsProvider();

  static setProvider(newProvider: ISmsProvider) {
    this.provider = newProvider;
  }

  static getTenantLogs(tenantId: string) {
    if (!memorySmsLogs.has(tenantId)) {
      memorySmsLogs.set(tenantId, []);
    }
    return memorySmsLogs.get(tenantId)!;
  }

  static async sendBillSms(
    tenantId: string,
    customerPhone: string,
    shopName: string,
    billNumber: string,
    totalAmount: number
  ) {
    const message = `Thank you for shopping at ${shopName}! Your Bill ${billNumber} total is ₹${totalAmount}. Have a great day!`;

    const result = await this.provider.sendSms({
      to: customerPhone,
      message,
    });

    const logEntry = {
      id: `sms-${Date.now()}`,
      tenantId,
      customerPhone,
      message,
      provider: result.provider,
      status: result.success ? 'SENT' : 'FAILED',
      sentAt: result.success ? new Date() : null,
      createdAt: new Date(),
    };

    const logs = this.getTenantLogs(tenantId);
    logs.unshift(logEntry);

    return logEntry;
  }

  static async listSmsLogs(tenantId: string) {
    return this.getTenantLogs(tenantId);
  }
}
