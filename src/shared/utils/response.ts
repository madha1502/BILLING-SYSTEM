import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
  details?: any;
}

export function sendSuccess<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  code: string = 'ERROR',
  details: any = null
) {
  const payload: ApiResponse = {
    success: false,
    code,
    message,
    details,
  };
  return res.status(statusCode).json(payload);
}
