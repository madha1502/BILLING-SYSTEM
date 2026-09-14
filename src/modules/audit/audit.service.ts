const memoryAuditLogs = new Map<string, any[]>();

export interface CreateAuditLogInput {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
}

export class AuditService {
  static getTenantLogs(tenantId: string) {
    if (!memoryAuditLogs.has(tenantId)) {
      memoryAuditLogs.set(tenantId, []);
    }
    return memoryAuditLogs.get(tenantId)!;
  }

  static async log(input: CreateAuditLogInput) {
    const logEntry = {
      id: `audit-${Date.now()}`,
      tenantId: input.tenantId,
      userId: input.userId || null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId || null,
      metadata: input.metadata || null,
      ipAddress: input.ipAddress || '127.0.0.1',
      createdAt: new Date(),
    };

    const logs = this.getTenantLogs(input.tenantId);
    logs.unshift(logEntry);
    return logEntry;
  }

  static async listLogs(tenantId: string) {
    return this.getTenantLogs(tenantId);
  }
}
