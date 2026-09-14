import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string;
    }
  }
}
