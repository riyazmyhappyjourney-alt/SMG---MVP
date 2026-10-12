import React, { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UserAuthProfile } from '../../types/user';
import { getBrowserSupabase } from '../../lib/supabase';
import { safeFetchJson } from '../../utils/safeApi';

interface AuthCallbackProps {
  onSuccess: (user: UserAuthProfile) => void;
  onError: () => void;
}

// Module-level in-flight promise registry to guarantee that concurrent mounts
// (e.g. React 18 Strict Mode or rapid re-renders) execute at most one authorization exchange.
let inFlightExchange: Promise<UserAuthProfile> | null = null;
let lastProcessedKey: string | null = null;
let lastProcessedUser: UserAuthProfile | null = null;

export function resetOAuthExchangeStateForTesting(): void {
  inFlightExchange = null;
  lastProcessedKey = null;
  lastProcessedUser = null;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Keep callback references stable across renders to avoid effect re-triggering
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  useEffect(() => {
    let isCancelled = false;

    async function processAuthExchange(): Promise<void> {
      try {
        // 1. Check for provider error parameters in URL (e.g. user cancelled or access denied)
        const urlParams = new URLSearchParams(window.location.search);
        const urlError = urlParams.get('error');
        const urlErrorDesc = urlParams.get('error_description');

        if (urlError) {
          throw new Error(urlErrorDesc || urlError || 'Authentication was declined or cancelled.');
        }

        const code = urlParams.get('code');
        const attemptKey = code
          ? `code:${code}`
          : `session:${window.location.search || window.location.hash || 'active'}`;

        // 2. If this authorization attempt was already completed, use cached result
        if (lastProcessedKey === attemptKey && lastProcessedUser) {
          if (!isCancelled) {
            setStatus('SUCCESS');
            if (window.history.replaceState) {
              window.history.replaceState({}, document.title, '/#/dashboard');
            }
            onSuccessRef.current(lastProcessedUser);
          }
          return;
        }

        // 3. Deduplicate in-flight exchange (handles React Strict Mode remounts)
        let user: UserAuthProfile;
        if (inFlightExchange) {
          user = await inFlightExchange;
        } else {
          inFlightExchange = (async (): Promise<UserAuthProfile> => {
            // A. Initialize Supabase browser client
            const supabase = await getBrowserSupabase();
            if (!supabase) {
              throw new Error('Supabase client is not configured.');
            }

            // B. Handle PKCE code exchange or retrieve established session
            let session = null;
            if (code) {
              const { data: exchangeData, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
              if (exchangeErr) {
                console.warn('[AuthCallback] Code exchange fallback notice:', exchangeErr.message);
              } else {
                session = exchangeData.session;
              }
            }

            // If exchangeCodeForSession didn't resolve it, check existing session (via detectSessionInUrl)
            if (!session) {
              const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
              if (sessionErr) {
                throw sessionErr;
              }
              session = sessionData.session;
            }

            // Handle case where session is still processing
            if (!session) {
              await new Promise((r) => setTimeout(r, 600));
              const { data: retryData } = await supabase.auth.getSession();
              session = retryData.session;
            }

            if (!session || !session.access_token) {
              throw new Error('Failed to retrieve authentication token from Google provider.');
            }

            // C. Secure server-side session exchange
            const exchangeResponse = await safeFetchJson<{
              success: boolean;
              authenticated: boolean;
              user: UserAuthProfile;
              error?: string;
              message?: string;
            }>('/api/auth/google/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ accessToken: session.access_token }),
            });

            if (!exchangeResponse.ok || !exchangeResponse.data?.success) {
              const errMsg = exchangeResponse.data?.message || exchangeResponse.error || 'Server session exchange failed.';
              throw new Error(errMsg);
            }

            const exchangedUser = exchangeResponse.data.user;
            lastProcessedKey = attemptKey;
            lastProcessedUser = exchangedUser;
            return exchangedUser;
          })();

          try {
            user = await inFlightExchange;
          } catch (err) {
            inFlightExchange = null;
            throw err;
          } finally {
            inFlightExchange = null;
          }
        }

        if (isCancelled) return;

        setStatus('SUCCESS');

        // Clean up URL parameters and leave /auth/callback completely
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, '/#/dashboard');
        }

        // Hand off to application router
        onSuccessRef.current(user);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('[AuthCallback] Error:', err);
        setStatus('ERROR');
        setErrorMessage(err.message || 'An unexpected error occurred during Google sign-in.');
      }
    }

    processAuthExchange();

    return () => {
      isCancelled = true;
    };
  }, []); // Strictly empty dependency array ensures execution at most once per mount

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4 font-['Montserrat']">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 text-center">
        {status === 'LOADING' && (
          <div className="py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-[#244B8F] mb-2">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Completing Sign-In</h2>
            <p className="text-xs text-slate-500">
              Verifying your credentials and establishing a secure session...
            </p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign-In Verified</h2>
            <p className="text-xs text-slate-500">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-rose-50 text-rose-600 mb-2">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Sign-In Failed</h2>
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl border border-rose-200/60 text-left">
              {errorMessage}
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => {
                  if (window.history.replaceState) {
                    window.history.replaceState({}, document.title, '/#/login');
                  }
                  onErrorRef.current();
                }}
                className="w-full inline-flex items-center justify-center space-x-2 py-3 px-4 bg-[#244B8F] hover:bg-[#1C3B70] text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign-In</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
