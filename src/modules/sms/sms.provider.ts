export interface SendSmsPayload {
  to: string; // Indian 10-digit phone number
  message: string;
  templateId?: string;
}

export interface SendSmsResult {
  success: boolean;
  provider: string;
  messageId?: string;
  error?: string;
}

export interface ISmsProvider {
  name: string;
  sendSms(payload: SendSmsPayload): Promise<SendSmsResult>;
}

export class MockSmsProvider implements ISmsProvider {
  name = 'MOCK_SMS_GATEWAY';

  async sendSms(payload: SendSmsPayload): Promise<SendSmsResult> {
    console.log(`📱 [MOCK SMS SENT] To: ${payload.to} | Msg: "${payload.message}"`);
    return {
      success: true,
      provider: this.name,
      messageId: `msg-${Date.now()}`,
    };
  }
}

export class IndianSmsGatewayProvider implements ISmsProvider {
  name = 'INDIAN_SMS_GATEWAY';

  async sendSms(payload: SendSmsPayload): Promise<SendSmsResult> {
    // Production integration hook for Fast2SMS / TextLocal / DLT registered templates
    console.log(`📡 [INDIAN SMS GATEWAY] Dispatching to ${payload.to}...`);
    return {
      success: true,
      provider: this.name,
      messageId: `isms-${Date.now()}`,
    };
  }
}
