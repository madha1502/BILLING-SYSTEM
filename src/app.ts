import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';
import { salesRouter } from './modules/sales/sales.routes.js';
import { expensesRouter } from './modules/expenses/expenses.routes.js';
import { reportsRouter } from './modules/reports/reports.routes.js';
import { smsRouter } from './modules/sms/sms.routes.js';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes.js';
import { syncRouter } from './modules/sync/sync.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import { NotFoundError } from './shared/errors/app-error.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter for API endpoints
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests from this IP. Please try again later.',
  },
});
app.use('/api', limiter);

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    app: 'KiranaPro SaaS API',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Mount Module Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/sales', salesRouter);
app.use('/api/v1/expenses', expensesRouter);
app.use('/api/v1/reports', reportsRouter);
app.use('/api/v1/sms', smsRouter);
app.use('/api/v1/subscriptions', subscriptionsRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/admin', adminRouter);

// 404 Handler
app.use('*', (_req, _res, next) => {
  next(new NotFoundError('API endpoint not found'));
});

// Global Error Handler
app.use(errorHandler);

export default app;
