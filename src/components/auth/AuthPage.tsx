import React, { useState } from 'react';
import { ArrowLeft, Phone, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { UserAuthProfile } from '../../types/user';
import { safeFetchJson } from '../../utils/safeApi';
import { getBrowserSupabase } from '../../lib/supabase';

interface AuthPageProps {
  initialMode?: 'SIGNIN' | 'SIGNUP';
  onSuccess: (user: UserAuthProfile) => void;
  onBackToHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'SIGNUP',
  onSuccess,
  onBackToHome,
}) => {
  const [mode, setMode] = useState<'SIGNIN' | 'SIGNUP'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'OTP' | 'PASSWORD'>('OTP');

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Email / Password state (No repeat password field, per modern UX pattern)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetchJson<{ success: boolean; cooldownSeconds?: number; error?: string; message?: string }>('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Failed to send OTP verification code.');
      }
      setOtpSent(true);
      setOtpCode('');
      setOtpCooldown(response.data.cooldownSeconds || 60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      const response = await safeFetchJson<{ success: boolean; user: any }>('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: cleanPhone, 
          otp: otpCode.trim(), 
          name: name.trim(),
          email: email.trim().toLowerCase()
        }),
      });

      if (!response.ok || !response.data?.success || !response.data?.user) {
        throw new Error(response.error || 'OTP verification failed.');
      }

      const userData = response.data.user;
      // Authoritative session is maintained via HTTP-only cookie
      const userProfile: UserAuthProfile = {
        id: userData.id,
        name: userData.name,
        email: userData.email || '',
        phone: userData.phone,
        provider: 'phone',
        token: '', // Never expose or persist raw JWT in browser storage
        createdAt: userData.createdAt || new Date().toISOString(),
      };
      setLoading(false);
      onSuccess(userProfile);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'OTP verification failed. Please try again.');
    }
  };

  // Handle Email / Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await safeFetchJson('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (!response.ok) {
        throw new Error(response.error || 'Customer password login is unavailable.');
      }
    } catch (err: any) {
      setError(err.message || 'Password authentication is unavailable for customer accounts. Please authenticate via Mobile OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign-in
  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = await getBrowserSupabase();
      if (!supabase) {
        throw new Error('Google Sign-In is not configured in this environment (missing Supabase configuration).');
      }

      // Enforce local callback path /auth/callback
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

  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Montserrat']">
      
      {/* Container: Replicating Reference Design (Left Image with Bold Overlay Text + Right Clean Form) */}
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 relative">
        
        {/* Back to Home Button */}
        <button
          type="button"
          onClick={onBackToHome}
          className="absolute top-4 left-4 z-20 md:hidden bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* LEFT COLUMN: Architectural Imagery with "Find a place you'll love" text (Matching Reference Image) */}
        <div className="relative min-h-[260px] md:min-h-[580px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=85"
            alt="Beautiful Home"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

          {/* Top subtle brand pill */}
          <div className="relative z-10 hidden md:block">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center text-xs font-bold text-white bg-white/20 backdrop-blur-md px-3.5 py-1.5 rounded-full hover:bg-white/30 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Back to SellMyGhar</span>
            </button>
          </div>

          {/* Bottom Bold Caption (Exact as reference) */}
          <div className="relative z-10 space-y-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
              Find a place<br />you’ll love
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 font-medium pt-1">
              Bengaluru's verified residential resale advisory.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Clean, Modern Sign Up / Sign In Form */}
        <div className="p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {mode === 'SIGNUP' ? 'Sign up' : 'Sign in'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'SIGNUP' 
                ? 'Create your SellMyGhar account to list flats or connect with verified buyers.' 
                : 'Welcome back! Sign in to manage your property listings.'}
            </p>
          </div>

          {/* Auth Method Selector: Simple Phone OTP (Default) or Email */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('OTP');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                authMethod === 'OTP'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('PASSWORD');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                authMethod === 'PASSWORD'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* METHOD 1: SIMPLE PHONE OTP (Zero Password Friction) */}
          {authMethod === 'OTP' ? (
            !otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Temporary Technical Issue Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>SMS OTP Delivery Notice</span>
                  </div>
                  <p className="leading-relaxed">
                    We are currently facing technical issues. Please use Google Sign in.
                  </p>
                </div>
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
                        placeholder="e.g. Riyaz Ahmed"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email Address (To Receive Welcome & Verification Updates)
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white transition-all"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-xs font-bold text-slate-500 font-mono">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">We will send a 6-digit verification code</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full py-3.5 px-4 bg-[#FF5A5F] hover:bg-[#E04B50] disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send OTP Code</span>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Code sent to <strong>+91 {phone.slice(-10)}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="font-bold text-[#244B8F] hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-widest text-xl font-mono py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length < 4}
                  className="w-full py-3.5 px-4 bg-[#FF5A5F] hover:bg-[#E04B50] disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
                </button>
              </form>
            )
          ) : (
            /* METHOD 2: EMAIL & PASSWORD (NO REPEAT PASSWORD FIELD) */
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === 'SIGNUP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-[#FF5A5F] hover:bg-[#E04B50] disabled:bg-slate-300 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{mode === 'SIGNUP' ? 'Sign up' : 'Sign in'}</span>}
              </button>
            </form>
          )}

          {/* Toggle between Sign Up and Sign In */}
          <div className="mt-5 text-center text-xs text-slate-600">
            {mode === 'SIGNUP' ? (
              <span>
                Already got an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGNIN');
                    setError(null);
                  }}
                  className="font-bold text-[#FF5A5F] hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </span>
            ) : (
              <span>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('SIGNUP');
                    setError(null);
                  }}
                  className="font-bold text-[#FF5A5F] hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </span>
            )}
          </div>

          {/* Legal Compliance Notice (Settlin / 99acres pattern) */}
          <p className="mt-4 text-[11px] text-slate-500 text-center leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="#/terms" className="text-[#244B8F] hover:underline font-semibold">Terms of Service</a>
            {' '}and{' '}
            <a href="#/privacy-policy" className="text-[#244B8F] hover:underline font-semibold">Privacy Policy</a>
          </p>

          {/* Social Sign-In Divider & Icons (Exact as reference design) */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Or sign in with
            </p>
            <div className="flex items-center justify-center space-x-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-xs flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                title="Continue with Google"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
