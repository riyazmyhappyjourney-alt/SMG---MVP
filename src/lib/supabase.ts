import { createClient, SupabaseClient, SupportedStorage } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

function getCookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname.endsWith('sellmyghar.in')) {
    return '; domain=.sellmyghar.in';
  }
  return '';
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days = 7): void {
  if (typeof document === 'undefined') return;
  const domainPart = getCookieDomain();
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const securePart = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/${domainPart}${securePart}; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const domainPart = getCookieDomain();
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}; SameSite=Lax`;
}

export const hybridCookieStorage: SupportedStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const localVal = window.localStorage.getItem(key);
      if (localVal) return localVal;
    } catch {}
    return getCookie(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {}
    try {
      setCookie(key, value);
    } catch {}
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {}
    try {
      deleteCookie(key);
    } catch {}
  },
};

/**
 * Initializes and retrieves the browser-side Supabase client.
 * Configured strictly with public anon credentials and PKCE auth flow.
 */
export async function getBrowserSupabase(): Promise<SupabaseClient | null> {
  if (clientInstance) return clientInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

    // Graceful fallback to server public config if not injected into Vite environment
    if (!supabaseUrl || !supabaseAnonKey) {
      try {
        const res = await fetch('/api/auth/public-config');
        if (res.ok) {
          const cfg = await res.json();
          supabaseUrl = supabaseUrl || cfg.supabaseUrl;
          supabaseAnonKey = supabaseAnonKey || cfg.supabaseAnonKey;
        }
      } catch {
        // Network/server unavailable
      }
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return null;
    }

    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        storage: hybridCookieStorage,
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    return clientInstance;
  })();

  return initPromise;
}

/**
 * Synchronous client accessor for components where client is already initialized.
 */
export function getBrowserSupabaseSync(): SupabaseClient | null {
  return clientInstance;
}
