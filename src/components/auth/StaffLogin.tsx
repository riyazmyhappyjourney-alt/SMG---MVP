import React, { useState, useEffect } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface StaffLoginProps {
  onSuccess: (session: { user: any; token?: string }) => void;
  onBackToHome?: () => void;
  initialMode?: 'LOGIN' | 'FORGOT' | 'RESET';
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onSuccess, onBackToHome, initialMode = 'LOGIN' }) => {
  const [mode, setMode] = useState<'LOGIN' | 'FORGOT' | 'RESET'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check URL hash/query for reset token on mount
  useEffect(() => {
    try {
      const hashStr = window.location.hash || '';
      const queryStr = hashStr.includes('?') ? hashStr.split('?')[1] : window.location.search.replace(/^\?/, '');
      const params = new URLSearchParams(queryStr);
      const token = params.get('token');
      const emailParam = params.get('email');

      if (token) {
        setResetToken(token);
        if (emailParam) setEmail(emailParam);
        setMode('RESET');
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials. Only authorized SellMyGhar staff can access the operational portal.');
      }

      sessionStorage.setItem(
        'sellmyghar_staff_session',
        JSON.stringify({ user: data.user, token: data.token, loggedAt: new Date().toISOString() })
      );

      onSuccess({ user: data.user, token: data.token });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Forgot Password Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to process reset request. Please try again.');
      }

      setSuccessMessage(data.message || 'If an account exists with that email address, password reset instructions have been dispatched.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch password reset link.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Reset Password Confirmation
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!resetToken) {
      setErrorMessage('Missing password reset token. Please request a new link from the forgot password page.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password. Reset link may have expired.');
      }

      setSuccessMessage(data.message || 'Password has been updated successfully! You can now log in.');
      setTimeout(() => {
        setMode('LOGIN');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Password update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Montserrat']">
      
      {/* Top back bar if navigation provided */}
      {onBackToHome && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#244B8F] transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            <span>Return to Public Homepage</span>
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand & Security Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="SellMyGhar"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            {mode === 'LOGIN' && 'Staff Operations Portal'}
            {mode === 'FORGOT' && 'Reset Staff Password'}
            {mode === 'RESET' && 'Set New Password'}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {mode === 'LOGIN' && 'Restricted authentication for Bengaluru verification & CRM desk'}
            {mode === 'FORGOT' && 'Enter your registered staff email to receive a secure reset link'}
            {mode === 'RESET' && 'Choose a strong, compliant password for your staff account'}
          </p>
        </div>

        {/* Minimal Auth Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="flex-1 leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* VIEW 1: STAFF LOGIN */}
          {mode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Quick Fill Credentials Banner for Dev Testing */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-slate-700">
                <div className="font-semibold text-[#244B8F] mb-1.5 flex items-center justify-between">
                  <span>Default Portal Credentials</span>
                  <span className="text-[10px] bg-blue-100 text-[#244B8F] px-1.5 py-0.5 rounded font-mono font-bold">STAFF</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Email: <strong className="text-slate-800">admin@sellmyghar.in</strong></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Password: <strong className="text-slate-800">[REDACTED_BOOTSTRAP_PASSWORD]</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@sellmyghar.in');
                        setPassword('[REDACTED_BOOTSTRAP_PASSWORD]');
                      }}
                      className="text-[#244B8F] hover:underline font-sans text-[11px] font-semibold cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="staff-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Staff Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="staff-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@sellmyghar.in"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="staff-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-[#244B8F] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="staff-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center px-4 py-3.5 rounded-lg text-sm font-bold text-white bg-[#244B8F] hover:bg-[#1B396E] disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Authenticate & Enter /crm</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW 2: FORGOT PASSWORD REQUEST */}
          {mode === 'FORGOT' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Registered Staff Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@sellmyghar.in"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 rounded-lg text-sm font-bold text-white bg-[#244B8F] hover:bg-[#1B396E] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send Password Reset Link</span>}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-[#244B8F] hover:underline cursor-pointer"
                >
                  &larr; Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: SET NEW PASSWORD */}
          {mode === 'RESET' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="new-password"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full py-3 rounded-lg text-sm font-bold text-white bg-[#244B8F] hover:bg-[#1B396E] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password & Proceed</span>}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-[#244B8F] hover:underline cursor-pointer"
                >
                  &larr; Return to Sign In
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security Assurance Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted internal endpoint • Activity audited under DPDP rules</span>
          </p>
        </div>

      </div>
    </div>
  );
};
