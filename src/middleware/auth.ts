import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/app-error.js';
import { AuthUser } from '../shared/types/express.js';
import { Role } from '@prisma/client';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token missing or invalid format', 'MISSING_TOKEN');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired authentication token', 'EXPIRED_TOKEN');
  }
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('User authentication required', 'UNAUTHENTICATED');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Action restricted. Required role: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
        'ROLE_NOT_PERMITTED'
      );
    }

    next();
  };
}
