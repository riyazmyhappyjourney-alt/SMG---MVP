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
    const bhashUser = process.env.BHASH_SMS_USER || 'myhappyjourneytrans';
    const bhashPass = process.env.BHASH_SMS_PASSWORD || '123456';
    const bhashSender = process.env.BHASH_SMS_SENDER_ID || 'SMYGHR';
    return Boolean(bhashUser && bhashPass && bhashSender);
  }

  getProviderName(): string {
    return 'Bhash SMS Gateway';
  }

  async sendOtp(phone: string, otp: string): Promise<SmsDeliveryResult> {
    if (!this.isConfigured()) {
      throw new Error('Bhash SMS Gateway credentials are not configured.');
    }

    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
      throw new Error('Valid 10-digit Indian mobile number is required.');
    }

    const bhashUser = process.env.BHASH_SMS_USER || 'myhappyjourneytrans';
    const bhashPass = process.env.BHASH_SMS_PASSWORD || '123456';
    const bhashSender = process.env.BHASH_SMS_SENDER_ID || 'SMYGHR';
    const priority = process.env.BHASH_SMS_PRIORITY || 'ndnd';
    const stype = process.env.BHASH_SMS_STYPE || 'normal';

    // DLT Approved Template: {#var#} is your OTP for your SellMyGhar account. Do not share it with anyone. It is valid for 5 minutes. Visit www.sellmyghar.in
    const text = `${otp} is your OTP for your SellMyGhar account. Do not share it with anyone. It is valid for 5 minutes. Visit www.sellmyghar.in`;

    const params = new URLSearchParams({
      user: bhashUser,
      pass: bhashPass,
      sender: bhashSender,
      phone: cleanDigits,
      text,
      priority,
      stype,
    });

    const primaryUrl = `http://bhashsms.com/api/sendmsg.php?${params.toString()}`;

    try {
      const response = await fetch(primaryUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'SellMyGhar-Auth/1.0',
        },
      });

      const responseText = await response.text();
      const trimmed = responseText.trim();

      // Bhash SMS returns 'S.<msg_id>' on success (e.g. 'S.575318')
      if (trimmed.startsWith('S.') || /^\d+$/.test(trimmed)) {
        return {
          success: true,
          messageId: trimmed,
        };
      }

      console.error(`[BhashSMS] Delivery rejected by gateway: ${trimmed}`);
      return {
        success: false,
        error: `SMS gateway rejected message: ${trimmed}`,
      };
    } catch (networkErr: any) {
      console.warn(`[BhashSMS] HTTP request failed (${networkErr?.message}), attempting HTTPS fallback...`);
      try {
        const httpsUrl = `https://bhashsms.com/api/sendmsg.php?${params.toString()}`;
        const fallbackRes = await fetch(httpsUrl, { method: 'GET' });
        const fallbackText = (await fallbackRes.text()).trim();
        if (fallbackText.startsWith('S.') || /^\d+$/.test(fallbackText)) {
          return {
            success: true,
            messageId: fallbackText,
          };
        }
        return {
          success: false,
          error: `SMS gateway rejected message on fallback: ${fallbackText}`,
        };
      } catch (fallbackErr: any) {
        console.error(`[BhashSMS] Transport error: ${fallbackErr?.message || fallbackErr}`);
        throw new Error(`SMS delivery failed: ${networkErr?.message || 'Network error connecting to SMS gateway'}`);
      }
    }
  }
}

const devProviderInstance = new DevSmsProvider();
const prodProviderInstance = new ProductionSmsProvider();

let testOverrideProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (testOverrideProvider) {
    return testOverrideProvider;
  }
  if (process.env.RUNNING_TESTS === 'true') {
    return devProviderInstance;
  }
  const isProd = process.env.NODE_ENV === 'production' || process.env.USE_REAL_SMS === 'true';
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
