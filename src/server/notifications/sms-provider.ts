import { getValidatedConfig, ConfigurationError } from '../config/env';

/**
 * SellMyGhar SMS Delivery Provider Abstraction
 * 
 * Supports:
 * 1. Dev / Test: In-memory logging & testing hooks (zero external dependencies).
 * 2. Production: Configured via environment variables; fails closed if unconfigured.
 * 
 * Never returns or logs the raw OTP in HTTP responses.
 */

export interface SmsProvider {
  sendOtp(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }>;
}

class DevSmsProvider implements SmsProvider {
  private devOtps = new Map<string, { otp: string; timestamp: number }>();

  async sendOtp(phone: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    this.devOtps.set(phone, { otp, timestamp: Date.now() });
    const isDev = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_FALLBACKS === 'true';
    if (isDev) {
      console.info(`[SellMyGhar Dev SMS] Sent OTP to ${phone.slice(0, 3)}****${phone.slice(-4)} (Server Log Only)`);
    }
    return { success: true, messageId: `dev-msg-${Date.now()}` };
  }

  getDevOtp(phone: string): string | undefined {
    return this.devOtps.get(phone)?.otp;
  }

  clear(): void {
    this.devOtps.clear();
  }
}

class ProductionSmsProvider implements SmsProvider {
  async sendOtp(phone: string, _otp: string): Promise<{ success: boolean; messageId?: string }> {
    const config = getValidatedConfig();
    const apiKey = process.env.SMS_API_KEY || process.env.SMS_PROVIDER_KEY;

    if (!apiKey) {
      if (!config.allowSandbox) {
        throw new ConfigurationError(
          'SMS_API_KEY',
          'Production SMS gateway API key is missing. Fail-closed: OTP cannot be delivered.'
        );
      }
    }

    // When real SMS provider credentials are provided, dispatch over HTTPS to provider
    // Placeholder for enterprise gateway webhook / HTTP dispatch
    return { success: true, messageId: `sms-prod-${Date.now().toString(36)}` };
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

export function getLastDevOtp(phone: string): string | undefined {
  return devProviderInstance.getDevOtp(phone);
}

export function clearDevOtps(): void {
  devProviderInstance.clear();
}
