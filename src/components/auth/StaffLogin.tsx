import React, { useState } from 'react';
import { Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';

interface StaffLoginProps {
  onSuccess: (session: { user: any; token?: string }) => void;
  onBackToHome?: () => void;
}

export const StaffLogin: React.FC<StaffLoginProps> = ({ onSuccess, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
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

      // Store user profile in session storage for UI display (HTTP-only cookie holds authoritative session)
      sessionStorage.setItem(
        'sellmyghar_staff_session',
        JSON.stringify({ user: data.user, loggedAt: new Date().toISOString() })
      );

      // Transition app to CRM route
      onSuccess({ user: data.user });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#244B8F]/10 text-[#244B8F] mb-3">
            <Lock className="w-6 h-6 text-[#244B8F]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Staff Operations Portal
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Restricted authentication for Bengaluru verification & CRM desk
          </p>
        </div>

        {/* Minimal Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200/80">
          
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Quick Fill Credentials Banner for Dev Testing */}
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-slate-700">
              <div className="font-semibold text-[#244B8F] mb-1.5 flex items-center justify-between">
                <span>Default Portal Credentials</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-normal">Internal Desk</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Staff: <strong className="text-slate-800">staff@sellmyghar.in</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('staff@sellmyghar.in');
                      setPassword('StaffBootstrapPassword#2026!');
                    }}
                    className="text-[#244B8F] hover:underline font-sans text-[11px] font-semibold cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Admin: <strong className="text-slate-800">admin@sellmyghar.in</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@sellmyghar.in');
                      setPassword('AdminBootstrapPassword#2026!');
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
              <label htmlFor="staff-password" className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
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
