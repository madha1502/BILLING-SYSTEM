import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError, ConflictError, UnauthorizedError, NotFoundError } from '../../shared/errors/app-error.js';
import { Role, TenantStatus } from '@prisma/client';
import { AuthUser } from '../../shared/types/express.js';

// InMemory/Mock Store fallback for development testing when DB is initializing
export interface SignupInput {
  shopName: string;
  localName?: string;
  ownerName: string;
  phone: string;
  password: string;
  address?: string;
  gstin?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface CreateEmployeeInput {
  name: string;
  phone: string;
  password: string;
  role: Role;
}

// In-Memory Database store for dev execution fallback when DB connection is pending
const memoryTenants = new Map<string, any>();
const memoryUsers = new Map<string, any>();

// Seed default tenant in memory for instant API verification
const demoTenantId = 'tenant-demo-101';
const demoUserId = 'user-owner-101';
const demoPasswordHash = bcrypt.hashSync('Kirana123!', 10);

memoryTenants.set(demoTenantId, {
  id: demoTenantId,
  name: 'Vinisha Nellai Stores Kangeyam',
  localName: 'வினிஷா நெல்லை ஸ்டோர்ஸ் காங்கேயம்',
  phone: '9876543210',
  address: 'Main Road, Kangeyam, Tiruppur Dist, Tamil Nadu 638701',
  gstin: '33AAAAA0000A1Z5',
  currency: 'INR',
  status: 'ACTIVE',
  invoicePrefix: 'VNS',
  invoiceCounter: 105,
});

memoryUsers.set('9876543210', {
  id: demoUserId,
  tenantId: demoTenantId,
  name: 'Murugan (Owner)',
  phone: '9876543210',
  passwordHash: demoPasswordHash,
  role: 'OWNER',
  active: true,
});

export class AuthService {
  static generateToken(user: { id: string; tenantId: string; name: string; phone: string; role: Role }): string {
    const payload: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      phone: user.phone,
      role: user.role,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '30d' });
  }

  static async signup(input: SignupInput) {
    if (memoryUsers.has(input.phone)) {
      throw new ConflictError('A store or user with this phone number is already registered.', 'PHONE_ALREADY_EXISTS');
    }

    const tenantId = `tenant-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    const passwordHash = await bcrypt.hash(input.password, 10);

    const tenant = {
      id: tenantId,
      name: input.shopName,
      localName: input.localName || null,
      phone: input.phone,
      address: input.address || null,
      gstin: input.gstin || null,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      invoicePrefix: 'INV',
      invoiceCounter: 1,
      createdAt: new Date(),
    };

    const user = {
      id: userId,
      tenantId,
      name: input.ownerName,
      phone: input.phone,
      passwordHash,
      role: Role.OWNER,
      active: true,
      createdAt: new Date(),
    };

    memoryTenants.set(tenantId, tenant);
    memoryUsers.set(input.phone, user);

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      tenant,
    };
  }

  static async login(input: LoginInput) {
    const user = memoryUsers.get(input.phone);
    if (!user || !user.active) {
      throw new UnauthorizedError('Invalid phone number or password.', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid phone number or password.', 'INVALID_CREDENTIALS');
    }

    const tenant = memoryTenants.get(user.tenantId);
    if (!tenant) {
      throw new NotFoundError('Associated shop profile not found.', 'TENANT_NOT_FOUND');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
      tenant,
    };
  }

  static async createEmployee(tenantId: string, input: CreateEmployeeInput) {
    if (memoryUsers.has(input.phone)) {
      throw new ConflictError('An employee with this phone number already exists.', 'PHONE_ALREADY_EXISTS');
    }

    const userId = `emp-${Date.now()}`;
    const passwordHash = await bcrypt.hash(input.password, 10);

    const employee = {
      id: userId,
      tenantId,
      name: input.name,
      phone: input.phone,
      passwordHash,
      role: input.role,
      active: true,
      createdAt: new Date(),
    };

    memoryUsers.set(input.phone, employee);

    return {
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      tenantId: employee.tenantId,
    };
  }

  static async getMe(userId: string, tenantId: string) {
    const tenant = memoryTenants.get(tenantId);
    let matchedUser = null;

    for (const u of memoryUsers.values()) {
      if (u.id === userId) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser || !tenant) {
      throw new NotFoundError('User or shop profile not found.', 'NOT_FOUND');
    }

    return {
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        phone: matchedUser.phone,
        role: matchedUser.role,
      },
      tenant,
    };
  }
}
