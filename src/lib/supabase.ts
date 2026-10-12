import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;
let initPromise: Promise<SupabaseClient | null> | null = null;

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
