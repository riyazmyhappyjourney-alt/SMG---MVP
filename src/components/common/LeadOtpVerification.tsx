import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { safeFetch } from '../../utils/safeApi';

export interface LeadOtpState {
  isOtpStepOpen: boolean;
  otpPhone: string;
  otpCode: string;
  otpSending: boolean;
  otpVerifying: boolean;
  otpError: string | null;
  resendTimer: number;
  devHint: string | null;
}

export function useLeadOtp() {
  const [isOtpStepOpen, setIsOtpStepOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => {
      setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  const sendOtp = async (cleanPhone10: string): Promise<{ ok: boolean; error?: string }> => {
    const digits = cleanPhone10.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(digits)) {
      const msg = 'Please enter a valid 10-digit Indian mobile number.';
      setOtpError(msg);
      return { ok: false, error: msg };
    }

    setOtpSending(true);
    setOtpError(null);
    try {
      const res = await safeFetch('/api/leads/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, channel: 'AUTO' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const msg = data?.error || data?.message || 'Unable to send OTP. Please try again.';
        setOtpError(msg);
        return { ok: false, error: msg };
      }

      setOtpPhone(digits);
      setOtpCode('');
      setIsOtpStepOpen(true);
      setResendTimer(Number(data.cooldownSeconds) || 60);
      setDevHint(data.devOtp ? String(data.devOtp) : null);
      return { ok: true };
    } catch {
      const msg = 'Network error sending OTP. Please check your connection.';
      setOtpError(msg);
      return { ok: false, error: msg };
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async (cleanPhone10: string, name?: string): Promise<string | null> => {
    const digits = cleanPhone10.replace(/\D/g, '').slice(-10);
    const trimmedCode = otpCode.replace(/\D/g, '').trim();
    if (!/^\d{4,6}$/.test(trimmedCode)) {
      setOtpError('Please enter the 6-digit verification code sent to your mobile.');
      return null;
    }

    setOtpVerifying(true);
    setOtpError(null);
    try {
      const res = await safeFetch('/api/leads/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits, otp: trimmedCode, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.leadOtpToken) {
        setOtpError(data?.error || data?.message || 'Invalid or expired OTP. Please try again.');
        return null;
      }

      setIsOtpStepOpen(false);
      setOtpCode('');
      setDevHint(null);
      return String(data.leadOtpToken);
    } catch {
      setOtpError('Network error verifying OTP. Please try again.');
      return null;
    } finally {
      setOtpVerifying(false);
    }
  };

  const cancelOtp = () => {
    setIsOtpStepOpen(false);
    setOtpCode('');
    setOtpError(null);
    setDevHint(null);
  };

  return {
    isOtpStepOpen,
    otpPhone,
    otpCode,
    otpSending,
    otpVerifying,
    otpError,
    resendTimer,
    devHint,
    setOtpCode,
    setOtpError,
    sendOtp,
    verifyOtp,
    cancelOtp,
  };
}

interface LeadOtpInlineStepProps {
  phoneDigits: string;
  otpCode: string;
  onChangeOtpCode: (val: string) => void;
  otpSending: boolean;
  otpVerifying: boolean;
  isSubmitting: boolean;
  otpError: string | null;
  resendTimer: number;
  devHint?: string | null;
  onResend: () => void;
  onCancel: () => void;
  submitLabel?: string;
}

export const LeadOtpInlineStep: React.FC<LeadOtpInlineStepProps> = ({
  phoneDigits,
  otpCode,
  onChangeOtpCode,
  otpSending,
  otpVerifying,
  isSubmitting,
  otpError,
  resendTimer,
  devHint,
  onResend,
  onCancel,
  submitLabel = 'Verify OTP & Submit',
}) => {
  const cleanDigits = phoneDigits.replace(/\D/g, '').slice(-10);
  const formatted = cleanDigits.length === 10
    ? `+91 ${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`
    : `+91 ${cleanDigits}`;
  const busy = otpVerifying || isSubmitting;

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-blue-200 space-y-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#0073E6] shrink-0" />
          <span className="text-xs font-bold text-slate-900">Mobile OTP Verification</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-[#0073E6] hover:underline cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-3 h-3" />
          <span>Edit Number</span>
        </button>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        Enter the 6-digit OTP sent to <strong className="text-slate-900 tabular-nums">{formatted}</strong> to confirm your request.
      </p>

      {devHint && (
        <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-semibold">
          Dev Test OTP: <span className="font-mono tracking-widest">{devHint}</span>
        </div>
      )}

      <div>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={otpCode}
          onChange={(e) => onChangeOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="Enter 6-digit OTP"
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold tracking-[0.28em] text-center text-slate-900 placeholder:tracking-normal placeholder:font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6]"
        />
      </div>

      {otpError && (
        <p className="text-xs text-rose-600 font-medium">{otpError}</p>
      )}

      <button
        type="submit"
        disabled={busy || otpCode.trim().length < 4}
        className="w-full py-3 px-4 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{otpVerifying ? 'Verifying OTP...' : 'Submitting...'}</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>{submitLabel}</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
        <span>Didn&apos;t receive code?</span>
        <button
          type="button"
          onClick={onResend}
          disabled={otpSending || resendTimer > 0 || busy}
          className="inline-flex items-center space-x-1 font-bold text-[#0073E6] hover:underline cursor-pointer disabled:text-slate-400 disabled:no-underline"
        >
          <RefreshCw className={`w-3 h-3 ${otpSending ? 'animate-spin' : ''}`} />
          <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}</span>
        </button>
      </div>
    </div>
  );
};
