import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { Role } from '@prisma/client';

const signupSchema = z.object({
  shopName: z.string().min(2, 'Shop name must be at least 2 characters'),
  localName: z.string().optional(),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be a valid 10-digit Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  address: z.string().optional(),
  gstin: z.string().optional(),
});

const loginSchema = z.object({
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be a valid 10-digit Indian phone number'),
  password: z.string().min(1, 'Password is required'),
});

const employeeSchema = z.object({
  name: z.string().min(2, 'Employee name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be a valid 10-digit Indian phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(Role).refine((r) => r !== Role.OWNER, { message: 'Cannot assign OWNER role to employee' }),
});

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = signupSchema.parse(req.body);
      const result = await AuthService.signup(validated);
      return sendSuccess(res, result, 'Shop registered successfully!', 201);
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);
      return sendSuccess(res, result, 'Logged in successfully!');
    } catch (err) {
      next(err);
    }
  }

  static async createEmployee(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId!;
      const validated = employeeSchema.parse(req.body);
      const result = await AuthService.createEmployee(tenantId, validated);
      return sendSuccess(res, result, 'Employee account created successfully!', 201);
    } catch (err) {
      next(err);
    }
  }

  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const tenantId = req.user!.tenantId;
      const result = await AuthService.getMe(userId, tenantId);
      return sendSuccess(res, result, 'User profile fetched successfully');
    } catch (err) {
      next(err);
    }
  }
}
