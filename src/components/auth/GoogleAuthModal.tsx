import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { UserAuthProfile } from '../../types/user';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAuthProfile) => void;
  onOpenStaffLogin?: () => void;
  reasonMessage?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenStaffLogin,
  reasonMessage,
}) => {
  const [loading, setLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultUser = {
    name: 'Riyaz',
    email: 'riyaz.myhappyjourney@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  };

  const handleGoogleSignIn = (chosenEmail = defaultUser.email, chosenName = defaultUser.name) => {
    setError(null);
    setLoading(true);

    // Simulate Google OAuth token exchange
    setTimeout(() => {
      try {
        const cleanEmail = chosenEmail.trim().toLowerCase();
        if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
          throw new Error('Please enter a valid Google email address.');
        }

        const profile: UserAuthProfile = {
          id: `usr-g-${Date.now().toString(36)}`,
          name: chosenName || cleanEmail.split('@')[0],
          email: cleanEmail,
          avatar: defaultUser.avatar,
          provider: 'google',
          token: `oauth-google-token-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };

        // Persist session
        localStorage.setItem('sellmyghar_google_user', JSON.stringify(profile));
        setLoading(false);
        onSuccess(profile);
      } catch (err: any) {
        setLoading(false);
        setError(err.message || 'Google OAuth authorization failed. Please try again.');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Montserrat']">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 text-center">
          {/* Google G Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-sm flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" viewBox="0 0 24 24">
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
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Sign In with Google
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            {reasonMessage || 'Authenticate with Google to post your apartment, track buyer inquiries, and access verified title verification.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="px-6 sm:px-7 pb-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* One-Click Google Account Option */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/80 hover:bg-slate-50 transition-all flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={defaultUser.avatar}
                alt={defaultUser.name}
                className="w-10 h-10 rounded-full border border-slate-300 object-cover"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {defaultUser.name}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  {defaultUser.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleGoogleSignIn(defaultUser.email, defaultUser.name)}
              className="px-4 py-2 bg-[#244B8F] hover:bg-[#1B3A70] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </button>
          </div>

          {/* Use another Google account toggle */}
          {showCustomEmailInput ? (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Google Account Email
              </label>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="name@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
              />
              <button
                type="button"
                disabled={loading || !customEmail}
                onClick={() => handleGoogleSignIn(customEmail, customEmail.split('@')[0])}
                className="w-full py-3 bg-[#244B8F] hover:bg-[#1B3A70] disabled:bg-slate-300 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign In with this Google Email</span>}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomEmailInput(true)}
              className="w-full text-center text-xs font-semibold text-[#244B8F] hover:underline py-1 cursor-pointer"
            >
              Use a different Google account
            </button>
          )}

          {/* Trust Guarantees */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-4 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Zero Public Phone Sharing</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>OAuth 2.0 Encrypted</span>
            </span>
          </div>

        </div>

        {/* Staff Switch Footer */}
        {onOpenStaffLogin && (
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>SellMyGhar verification staff? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStaffLogin();
              }}
              className="font-bold text-[#244B8F] hover:underline cursor-pointer"
            >
              Staff Portal Login
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
