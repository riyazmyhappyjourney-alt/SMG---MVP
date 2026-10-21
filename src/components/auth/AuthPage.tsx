import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { UserAuthProfile } from '../../types/user';
import { safeFetchJson } from '../../utils/safeApi';
import { getBrowserSupabase } from '../../lib/supabase';
import { Logo } from '../brand/Logo';

interface AuthPageProps {
  initialMode?: 'SIGNIN' | 'SIGNUP';
  intent?: 'POST_PROPERTY' | 'GENERAL';
  onSuccess: (user: UserAuthProfile) => void;
  onBackToHome: () => void;
  showSplashOnInit?: boolean;
}

type AuthStep = 'WELCOME' | 'PHONE' | 'OTP';

/**
 * Screen A: Branded Splash / Loading Screen
 * Minimal full-screen brand screen with solid Trust Blue (#244B8F),
 * centered SellMyGhar logo in white, and subtle loading indicator.
 */
export const BrandedSplashScreen: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[#244B8F] flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center max-w-xs text-center space-y-6">
        {/* Centered White SellMyGhar logo and brand mark */}
        <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg p-3">
          <img
            src="/logo.svg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
            alt="SellMyGhar"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white font-['Montserrat']">
            SellMyGhar<span className="text-[#0073E6]">.in</span>
          </h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Bengaluru's Verified Resale Advisory
          </p>
        </div>
        {/* Minimal loading pulse indicator */}
        <div className="flex items-center space-x-2 pt-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        {message && (
          <p className="text-xs text-blue-100/90 font-medium tracking-wide">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'SIGNIN',
  intent = 'GENERAL',
  onSuccess,
  onBackToHome,
  showSplashOnInit = false,
}) => {
  const [step, setStep] = useState<AuthStep>('WELCOME');
  const [mode, setMode] = useState<'SIGNIN' | 'SIGNUP'>(initialMode);
  const [isSplash, setIsSplash] = useState(showSplashOnInit);

  const isPostProperty = intent === 'POST_PROPERTY';

  // Ensure intended destination is preserved across page refreshes and Google OAuth round-trips
  useEffect(() => {
    if (isPostProperty) {
      try {
        sessionStorage.setItem('sellmyghar_auth_redirect', 'SELLER_ASSISTED');
      } catch {}
    }
  }, [isPostProperty]);

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpChannel, setOtpChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');

  // User profile fields (for signup mode)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for 6 OTP input boxes
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  // If showSplashOnInit was true, dismiss splash after initial paint
  useEffect(() => {
    if (showSplashOnInit) {
      const timer = setTimeout(() => setIsSplash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [showSplashOnInit]);

  // OTP resend cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpCooldown]);

  // Focus phone input when transitioning to PHONE step
  useEffect(() => {
    if (step === 'PHONE') {
      setTimeout(() => phoneInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Focus first OTP input when transitioning to OTP step
  useEffect(() => {
    if (step === 'OTP') {
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const cleanPhone = phone.replace(/\D/g, '').slice(-10);
  const otpCode = otpDigits.join('');

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent, requestedChannel?: 'WHATSAPP' | 'SMS') => {
    if (e) e.preventDefault();
    setError(null);

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetchJson<{
        success: boolean;
        cooldownSeconds?: number;
        channel?: 'WHATSAPP' | 'SMS';
        devOtp?: string;
        error?: string;
        message?: string;
      }>('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          channel: requestedChannel || 'AUTO',
        }),
      });

      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Failed to send OTP verification code.');
      }

      setStep('OTP');
      setOtpChannel(response.data.channel || 'WHATSAPP');
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCooldown(response.data.cooldownSeconds || 60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async (channel?: 'WHATSAPP' | 'SMS') => {
    if (otpCooldown > 0 || loading) return;
    await handleSendOtp(undefined, channel);
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetchJson<{ success: boolean; user: any }>('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: cleanPhone, 
          otp: otpCode, 
          name: name.trim(),
          email: email.trim().toLowerCase(),
          marketingConsent,
        }),
      });

      if (!response.ok || !response.data?.success || !response.data?.user) {
        throw new Error(response.error || 'OTP verification failed. Please check the code.');
      }

      const userData = response.data.user;
      const userProfile: UserAuthProfile = {
        id: userData.id,
        name: userData.name || (name.trim() || 'SellMyGhar User'),
        email: userData.email || email.trim() || '',
        phone: userData.phone || cleanPhone,
        provider: 'phone',
        token: '',
        createdAt: userData.createdAt || new Date().toISOString(),
      };
      setLoading(false);
      onSuccess(userProfile);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Invalid or expired OTP code. Please try again.');
    }
  };

  // OTP Box Key Handlers
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = '';
        setOtpDigits(updated);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] || '';
    }
    setOtpDigits(updated);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Google OAuth Handler
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = await getBrowserSupabase();
      if (!supabase) {
        throw new Error('Google Sign-In is not configured in this environment (missing Supabase configuration).');
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In initialization failed.');
      setLoading(false);
    }
  };

  // Screen A: Initial Splash state
  if (isSplash) {
    return <BrandedSplashScreen message="Initializing secure authentication..." />;
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-0 sm:p-4 md:p-6 font-['Montserrat']">
      
      {/* Centered Mobile Card Wrapper */}
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl sm:border sm:border-slate-200/80 overflow-hidden min-h-screen sm:min-h-[580px] flex flex-col relative">

        {/* SCREEN B: Mobile Login Welcome Screen */}
        {step === 'WELCOME' && (
          <div className="flex-1 flex flex-col">
            
            {/* Top Architectural Hero Imagery */}
            <div className="relative h-64 sm:h-60 w-full overflow-hidden bg-slate-900 select-none">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
                alt="Modern Bengaluru Home"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/25" />

              {/* Floating Back to Home button */}
              <button
                type="button"
                onClick={onBackToHome}
                aria-label="Back to home"
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom White Card Sheet */}
            <div className="relative -mt-6 rounded-t-3xl bg-white px-6 pt-6 pb-8 flex-1 flex flex-col justify-between">
              <div>
                {/* Brand Logo & Wordmark */}
                <div className="flex justify-center mb-4">
                  <Logo height={42} />
                </div>

                {/* Headings */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-[#172033] tracking-tight">
                    {isPostProperty
                      ? mode === 'SIGNUP'
                        ? 'Create an Account to Post Your Property'
                        : 'Login to Post Your Property'
                      : mode === 'SIGNUP'
                      ? 'Create an Account'
                      : 'Welcome to SellMyGhar.in'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed">
                    {isPostProperty
                      ? 'Authentication is required to submit and manage your property on SellMyGhar.in.'
                      : 'Your trusted starting point for buying or selling a home in Bengaluru.'}
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {/* Primary CTA: Continue with Phone Number */}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep('PHONE');
                    }}
                    className="w-full py-3.5 px-4 bg-[#172033] hover:bg-slate-800 active:bg-black text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2.5"
                  >
                    <Phone className="w-4 h-4 text-white" />
                    <span>Continue with Phone Number</span>
                  </button>

                  {/* Secondary Action: Continue with Google */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-[#172033] text-sm font-bold rounded-xl border border-slate-200 shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2.5"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#0073E6]" />
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.33 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.57H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.43l4.03-3.14z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.57l4.03 3.14c.95-2.83 3.6-4.96 6.72-4.96z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Legal compliance notice */}
                <p className="text-[11px] text-slate-500 text-center leading-relaxed mt-5">
                  By continuing, you agree to our{' '}
                  <a href="#/terms" className="text-[#0073E6] hover:underline font-semibold">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#/privacy-policy" className="text-[#0073E6] hover:underline font-semibold">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>

              {/* Bottom Toggle between Sign In and Sign Up */}
              <div className="border-t border-slate-100 pt-4 mt-6 text-center text-xs text-slate-600">
                {mode === 'SIGNIN' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('SIGNUP');
                        setError(null);
                      }}
                      className="font-bold text-[#0073E6] hover:underline cursor-pointer ml-1"
                    >
                      {isPostProperty ? 'Sign up to Post Property' : 'Sign up'}
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('SIGNIN');
                        setError(null);
                      }}
                      className="font-bold text-[#0073E6] hover:underline cursor-pointer ml-1"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SCREEN C: Phone Number Entry Screen */}
        {step === 'PHONE' && (
          <div className="flex-1 flex flex-col justify-between p-6">
            
            {/* Top Navigation Bar */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('WELCOME');
                  }}
                  aria-label="Back to welcome screen"
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {mode === 'SIGNUP' ? 'New Account' : 'Phone Sign In'}
                </span>
                <div className="w-9" />
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-2xl font-black text-[#172033] tracking-tight">
                {isPostProperty
                  ? mode === 'SIGNUP'
                    ? 'Register to Post Your Property'
                    : 'Login to Post Your Property'
                  : mode === 'SIGNUP'
                  ? 'Sign Up with Phone'
                  : 'Login with Phone Number'}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1.5">
                {isPostProperty
                  ? 'Enter your mobile number to receive a 6-digit OTP and continue to the property wizard.'
                  : "We'll send a 6-digit verification code to your phone number."}
              </p>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              {/* Phone Entry Form */}
              <form onSubmit={handleSendOtp} id="phone-auth-form" className="mt-6 space-y-4">
                {mode === 'SIGNUP' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address (Optional)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. rahul@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:bg-white transition-all"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-[#0073E6] focus-within:bg-white focus-within:border-transparent transition-all">
                    {/* Country Code Chip (+91 for India) */}
                    <div className="flex items-center space-x-1.5 px-3.5 py-3 bg-slate-100 border-r border-slate-200 text-slate-800 font-bold text-sm select-none">
                      <span className="text-base leading-none">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    {/* Numeric Input */}
                    <input
                      ref={phoneInputRef}
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="98765 43210"
                      className="w-full px-3.5 py-3 text-base font-semibold font-mono text-slate-900 bg-transparent placeholder-slate-400 focus:outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">Enter 10-digit mobile number</p>
                </div>
              </form>
            </div>

            {/* Bottom CTA */}
            <div className="pt-6">
              <button
                type="submit"
                form="phone-auth-form"
                disabled={loading || cleanPhone.length < 10}
                className="w-full py-3.5 px-4 bg-[#0073E6] hover:bg-[#0060c2] active:bg-[#004c99] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Zero spam guarantee. Your details are secured with 256-bit encryption.
              </p>
            </div>

          </div>
        )}

        {/* SCREEN D: OTP Verification Screen */}
        {step === 'OTP' && (
          <div className="flex-1 flex flex-col justify-between p-6">
            
            {/* Top Navigation Bar */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('PHONE');
                  }}
                  aria-label="Back to phone entry"
                  className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verification
                </span>
                <div className="w-9" />
              </div>

              {/* Title & Phone Display with Edit */}
              <h1 className="text-2xl font-black text-[#172033] tracking-tight">
                Verify Phone Number
              </h1>
              <div className="flex items-center text-xs text-slate-500 font-medium mt-1.5 flex-wrap gap-1">
                <span>
                  Code sent via <strong className="text-slate-800">{otpChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}</strong> to{' '}
                  <strong className="text-slate-800">+91 {cleanPhone}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep('PHONE');
                  }}
                  className="font-bold text-[#0073E6] hover:underline cursor-pointer ml-1"
                >
                  Change
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              {/* 6-Digit OTP Boxed Input */}
              <form onSubmit={handleVerifyOtp} id="otp-auth-form" className="my-8">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                  Enter 6-Digit Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-xs mx-auto">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className={`w-full aspect-square text-center text-2xl font-mono font-black rounded-xl border bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-[#0073E6] focus:bg-white transition-all ${
                        digit ? 'border-slate-400 bg-white' : 'border-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </form>

              {/* Resend Countdown / Link */}
              <div className="text-center text-xs text-slate-500 space-y-2">
                {otpCooldown > 0 ? (
                  <span>
                    Resend code in <strong className="font-mono text-slate-800 font-bold">{otpCooldown}s</strong>
                  </span>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
                    <span>Didn't receive code?</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleResendOtp('WHATSAPP')}
                        disabled={loading}
                        className="font-bold text-[#0073E6] hover:underline cursor-pointer"
                      >
                        Resend on WhatsApp
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => handleResendOtp('SMS')}
                        disabled={loading}
                        className="font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                      >
                        Send via SMS
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom CTA */}
            <div className="pt-4">
              {/* Optional Unbundled Marketing Checkbox (DPDP Act Compliance) */}
              <div className="flex items-start space-x-2.5 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                <input
                  id="marketing-consent-cb"
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0073E6] focus:ring-[#0073E6] cursor-pointer"
                />
                <label htmlFor="marketing-consent-cb" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  (Optional) Receive property recommendations, valuation insights, and updates on WhatsApp.
                </label>
              </div>

              <button
                type="submit"
                form="otp-auth-form"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3.5 px-4 bg-[#0073E6] hover:bg-[#0060c2] active:bg-[#004c99] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Verify & Continue</span>
                )}
              </button>

              {/* Legal Notice */}
              <p className="text-[11px] text-slate-500 text-center leading-relaxed mt-2.5">
                By verifying, you agree to our{' '}
                <a href="#/terms" target="_blank" rel="noopener noreferrer" className="text-[#0073E6] hover:underline font-semibold">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#0073E6] hover:underline font-semibold">
                  Privacy Policy
                </a>
                .
              </p>

              <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Protected by SellMyGhar 256-bit secure session</span>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
