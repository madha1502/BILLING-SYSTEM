import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../shared/errors/app-error.js';

export function enforceTenantIsolation(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || !req.user.tenantId) {
    throw new ForbiddenError('Tenant context is missing for this request', 'MISSING_TENANT_CONTEXT');
  }

  // If client passes an explicit X-Tenant-ID header, verify it matches authenticated token tenantId
  const headerTenantId = req.headers['x-tenant-id'] as string;
  if (headerTenantId && headerTenantId !== req.user.tenantId) {
    throw new ForbiddenError('Cross-tenant data access attempt detected and blocked', 'TENANT_MISMATCH_ATTEMPT');
  }

  // Attach authoritative tenant ID
  req.tenantId = req.user.tenantId;
  next();
}
