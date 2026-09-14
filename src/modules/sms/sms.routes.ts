import { Router } from 'express';
import { SmsController } from './sms.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { enforceTenantIsolation } from '../../middleware/tenant.js';

const router = Router();

router.use(authenticate, enforceTenantIsolation);

router.post('/send', SmsController.sendBillSms);
router.get('/logs', SmsController.listLogs);

export const smsRouter = router;
