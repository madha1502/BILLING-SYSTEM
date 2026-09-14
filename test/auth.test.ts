import { describe, it, expect } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

describe('KiranaPro Auth & Multi-Tenant Isolation Engine', () => {
  it('should register a new store owner and return JWT token + tenant profile', async () => {
    const signupData = {
      shopName: 'Annapoorna General Stores',
      localName: 'அன்னபூர்ணா ஜெனரல் ஸ்டோர்ஸ்',
      ownerName: 'Subramanian',
      phone: '9123456789',
      password: 'SecurePassword123!',
      address: '74 Market Street, Tiruchirappalli',
      gstin: '33BBBBB1111B1Z2',
    };

    const res = await AuthService.signup(signupData);

    expect(res.token).toBeDefined();
    expect(res.user.name).toBe('Subramanian');
    expect(res.user.role).toBe(Role.OWNER);
    expect(res.tenant.name).toBe('Annapoorna General Stores');

    // Decode JWT token and check claims
    const decoded: any = jwt.verify(res.token, env.JWT_SECRET);
    expect(decoded.phone).toBe('9123456789');
    expect(decoded.role).toBe(Role.OWNER);
    expect(decoded.tenantId).toBe(res.tenant.id);
  });

  it('should authenticate demo user and grant access', async () => {
    const loginResult = await AuthService.login({
      phone: '9876543210',
      password: 'Kirana123!',
    });

    expect(loginResult.token).toBeDefined();
    expect(loginResult.user.name).toBe('Murugan (Owner)');
    expect(loginResult.tenant.name).toBe('Vinisha Nellai Stores Kangeyam');
  });

  it('should allow store owner to create employee accounts with CASHIER role', async () => {
    const loginResult = await AuthService.login({
      phone: '9876543210',
      password: 'Kirana123!',
    });

    const emp = await AuthService.createEmployee(loginResult.tenant.id, {
      name: 'Kannan (Staff)',
      phone: '9988776655',
      password: 'CashierPass123!',
      role: Role.CASHIER,
    });

    expect(emp.name).toBe('Kannan (Staff)');
    expect(emp.role).toBe(Role.CASHIER);
    expect(emp.tenantId).toBe(loginResult.tenant.id);
  });

  it('should reject login with wrong password', async () => {
    await expect(
      AuthService.login({
        phone: '9876543210',
        password: 'WrongPassword!',
      })
    ).rejects.toThrow('Invalid phone number or password.');
  });
});
