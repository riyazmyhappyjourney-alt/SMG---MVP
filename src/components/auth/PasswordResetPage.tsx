import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, ShieldCheck, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface PasswordResetPageProps {
  onBackToHome: () => void;
}

export const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onBackToHome }) => {
  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [verifying, setVerifying] = useState<boolean>(true);
  const [tokenValid, setTokenValid] = useState<boolean>(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const parseAndVerify = async () => {
      try {
        const hashStr = window.location.hash || '';
        const queryStr = hashStr.includes('?') ? hashStr.split('?')[1] : window.location.search.replace(/^\?/, '');
        const params = new URLSearchParams(queryStr);
        const parsedToken = params.get('token');
        const parsedEmail = params.get('email');

        if (!parsedToken || parsedToken.trim().length === 0) {
          if (isMounted) {
            setTokenError('Password reset link is invalid or missing a security token.');
            setVerifying(false);
            setTokenValid(false);
          }
          return;
        }

        setToken(parsedToken.trim());
        if (parsedEmail) setEmail(parsedEmail.trim());

        // Pre-verify token with backend
        const res = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(parsedToken.trim())}`);
        const data = await res.json().catch(() => ({}));

        if (!isMounted) return;

        if (res.ok && data.valid) {
          setTokenValid(true);
          if (data.email) setEmail(data.email);
        } else {
          setTokenValid(false);
          setTokenError(data.error || 'Password reset link is invalid, expired, or has already been used.');
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValid(false);
          setTokenError(err?.message || 'Unable to verify password reset token.');
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    };

    parseAndVerify();
    return () => { isMounted = false; };
  }, []);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (newPassword.length < 8) {
      setSubmitError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please re-enter your new password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password reset failed. The link may have expired or been consumed.');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top back bar navigating to public homepage */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#244B8F] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Homepage</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="SellMyGhar"
              className="h-12 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
            Password Recovery
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Secure single-use token verification (15-minute validity)
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          {/* STATE 1: VERIFYING TOKEN */}
          {verifying && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#244B8F] animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Validating security token...</p>
            </div>
          )}

          {/* STATE 2: TOKEN INVALID / EXPIRED / MISSING */}
          {!verifying && !tokenValid && !submitSuccess && (
            <div className="py-4 space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Montserrat']">
                  Invalid or Expired Link
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {tokenError || 'This password reset link is invalid, has expired after 15 minutes, or has already been consumed.'}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="w-full py-3 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: SUCCESSFUL RESET (NO AUTO-LOGIN) */}
          {!verifying && submitSuccess && (
            <div className="py-4 space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Montserrat']">
                  Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Your credentials have been securely updated. Prior active sessions have been invalidated.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="w-full py-3 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: TOKEN VALID - RENDER RESET FORM */}
          {!verifying && tokenValid && !submitSuccess && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span className="leading-relaxed">{submitError}</span>
                </div>
              )}

              {email && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  Account: <strong className="text-slate-800">{email}</strong>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50/70 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-[#244B8F] hover:bg-[#1B396E] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="text-xs font-semibold text-slate-500 hover:text-[#244B8F] hover:underline cursor-pointer"
                >
                  &larr; Return to Homepage
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security Assurance Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-400 inline-flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Single-use token verification • 15-minute expiry strictly enforced</span>
          </p>
        </div>
      </div>
    </div>
  );
};
