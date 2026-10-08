import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, X, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStaffAuthenticated: (token: string, staffUser: any) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onStaffAuthenticated,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid credentials. Only authorized SellMyGhar staff can access internal portals.');
      }

      setSuccessInfo('Staff authentication successful. Redirecting to secure operational workspace...');
      setTimeout(() => {
        onStaffAuthenticated(data.token, data.user);
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-200">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 text-[#244B8F] mb-3">
          <div className="p-2 bg-[#244B8F]/10 rounded-lg">
            <Lock className="w-5 h-5 text-[#244B8F]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#172033] font-['Montserrat']">
              Staff & Advisory Login
            </h3>
            <p className="text-[11px] text-slate-500 font-['Poppins']">
              Internal Verification & CRM Operations
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-['Poppins'] mb-5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
          This portal is restricted to SellMyGhar verification agents, transaction managers, and authorized personnel. Public visitors can register properties or enquire above.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successInfo && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successInfo}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Montserrat']">
              Official Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="staff@sellmyghar.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#244B8F]/30 focus:border-[#244B8F] text-slate-800 font-['Poppins']"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Montserrat']">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-[#244B8F]/30 focus:border-[#244B8F] text-slate-800 font-['Poppins']"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Demo authorized staff login: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">staff@sellmyghar.in</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Staff@2026</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-[#244B8F] hover:bg-[#1B3A70] text-white font-bold text-xs transition-colors cursor-pointer font-['Montserrat'] flex items-center justify-center space-x-2 disabled:opacity-60 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Operation Desk</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
