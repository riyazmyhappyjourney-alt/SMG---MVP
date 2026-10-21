import { getValidatedConfig, ConfigurationError } from '../config/env';

/**
 * SellMyGhar SMS Delivery Provider Abstraction
 * 
 * SMS Fallback Policy:
 * 1. Primary OTP Delivery: AiSensy WhatsApp Business API (Campaign: SMG_OTP_Auth).
 * 2. SMS Fallback Gateway: Bhash SMS will be integrated only after Indian DLT sender ID
 *    and template approvals are completed.
 * 3. Until DLT approval is active: Unconfigured SMS provider never returns fabricated
 *    success responses. If WhatsApp fails and SMS is unconfigured, it fails safely
 *    and transparently directs the user to retry via WhatsApp.
 * 4. Dev / Test: In-memory logging & testing hooks.
 */

export interface SmsDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  sendOtp(phone: string, otp: string): Promise<SmsDeliveryResult>;
  isConfigured(): boolean;
  getProviderName(): string;
}

class DevSmsProvider implements SmsProvider {
  private devOtps = new Map<string, { otp: string; timestamp: number }>();

  isConfigured(): boolean {
    return true;
  }

  getProviderName(): string {
    return 'Dev In-Memory SMS Provider';
  }

  async sendOtp(phone: string, otp: string): Promise<SmsDeliveryResult> {
    this.devOtps.set(phone, { otp, timestamp: Date.now() });
    const isDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_FALLBACKS === 'true';
    if (isDev) {
      console.info(`[SellMyGhar Dev SMS] Sent OTP to ${phone.slice(0, 3)}****${phone.slice(-4)} (Server Log Only)`);
    }
    return { success: true, messageId: `dev-msg-${Date.now()}` };
  }

  recordOtp(phone: string, otp: string): void {
    this.devOtps.set(phone, { otp, timestamp: Date.now() });
  }

  getDevOtp(phone: string): string | undefined {
    return this.devOtps.get(phone)?.otp;
  }

  clear(): void {
    this.devOtps.clear();
  }
}

class ProductionSmsProvider implements SmsProvider {
  isConfigured(): boolean {
    // Bhash SMS Gateway configuration check (requires approved DLT registration)
    const bhashUser = process.env.BHASH_SMS_USER;
    const bhashPass = process.env.BHASH_SMS_PASSWORD;
    const bhashSender = process.env.BHASH_SMS_SENDER_ID;
    const bhashTemplate = process.env.BHASH_SMS_DLT_TEMPLATE_ID;
    return Boolean(bhashUser && bhashPass && bhashSender && bhashTemplate);
  }

  getProviderName(): string {
    return this.isConfigured()
      ? 'Bhash SMS Gateway'
      : 'Bhash SMS Gateway (Pending DLT Template Approval)';
  }

  async sendOtp(phone: string, _otp: string): Promise<SmsDeliveryResult> {
    if (!this.isConfigured()) {
      const config = getValidatedConfig();
      if (!config.allowSandbox) {
        throw new ConfigurationError(
          'BHASH_SMS_DLT_TEMPLATE_ID',
          'SMS fallback gateway is pending Indian DLT template registration. Primary OTP delivery is available via WhatsApp.'
        );
      }
      throw new Error(
        'SMS gateway is pending Indian DLT template registration. Primary OTP delivery is available via WhatsApp.'
      );
    }

    // Future Bhash integration dispatch point:
    // Once DLT sender ID and templates are approved, execute HTTPS request to Bhash API.
    throw new Error('Bhash SMS gateway integration is deferred pending DLT approval.');
  }
}

const devProviderInstance = new DevSmsProvider();
const prodProviderInstance = new ProductionSmsProvider();

let testOverrideProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (testOverrideProvider) {
    return testOverrideProvider;
  }
  const isProd = process.env.NODE_ENV === 'production';
  return isProd ? prodProviderInstance : devProviderInstance;
}

export function setTestSmsProvider(provider: SmsProvider | null): void {
  testOverrideProvider = provider;
}

export function recordDevOtp(phone: string, otp: string): void {
  devProviderInstance.recordOtp(phone, otp);
}

export function getLastDevOtp(phone: string): string | undefined {
  return devProviderInstance.getDevOtp(phone);
}

export function clearDevOtps(): void {
  devProviderInstance.clear();
}
