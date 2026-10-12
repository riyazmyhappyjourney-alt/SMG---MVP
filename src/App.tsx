import React, { useState, useEffect, useCallback } from 'react';
import { HomePage } from './components/home/HomePage';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { ConsentPortal } from './components/compliance/ConsentPortal';
import { SellerFunnel } from './components/seller/SellerFunnel';
import { StaffLogin } from './components/auth/StaffLogin';
import { ContactPage } from './components/contact/ContactPage';
import { PropertyDetailPage } from './components/property/PropertyDetailPage';
import { LocalityDetailPage } from './components/locality/LocalityDetailPage';
import { AuthPage } from './components/auth/AuthPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { ArrowLeft, Shield } from 'lucide-react';
import { UserAuthProfile } from './types/user';
import { getBrowserSupabase } from './lib/supabase';

import { TermsPage } from './components/legal/TermsPage';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { CookiePolicyPage } from './components/legal/CookiePolicyPage';
import { CareersPage } from './components/company/CareersPage';

export type AppRoute = 
  | 'HOME' 
  | 'CRM' 
  | 'CONSENT' 
  | 'SELLER_ASSISTED' 
  | 'LOGIN' 
  | 'CONTACT'
  | 'DASHBOARD'
  | 'PROPERTY_DETAIL'
  | 'LOCALITY_DETAIL'
  | 'AUTH_CALLBACK'
  | 'TERMS'
  | 'PRIVACY_POLICY'
  | 'COOKIE_POLICY'
  | 'CAREERS';

export const parseLocalitySlug = (path: string, hash: string): string | null => {
  const pathMatch = path.match(/^\/sell-flat-in-([a-zA-Z0-9-]+)-bangalore/i);
  if (pathMatch) return pathMatch[1].toLowerCase();
  
  const pathLocMatch = path.match(/^\/locality\/([a-zA-Z0-9-]+)/i);
  if (pathLocMatch) return pathLocMatch[1].toLowerCase();

  const hashMatch = hash.match(/^#\/sell-flat-in-([a-zA-Z0-9-]+)-bangalore/i);
  if (hashMatch) return hashMatch[1].toLowerCase();

  const hashLocMatch = hash.match(/^#\/locality\/([a-zA-Z0-9-]+)/i);
  if (hashLocMatch) return hashLocMatch[1].toLowerCase();

  return null;
};

export function resolveRoute(path: string, hash: string, host: string): AppRoute {
  const localitySlug = parseLocalitySlug(path, hash);

  // 1. Explicit application hash routes take highest precedence over stale callback or subpath paths
  if (host.startsWith('crm.') || hash === '#/crm' || path === '/crm') return 'CRM';
  if (hash === '#/dashboard' || hash === '#/seller-dashboard' || path === '/dashboard' || path === '/seller-dashboard') return 'DASHBOARD';
  if (hash === '#/login' || hash === '#/register' || path === '/login' || path === '/register') return 'LOGIN';
  if (hash === '#/consent' || path === '/consent') return 'CONSENT';
  if (hash === '#/seller-assisted' || path === '/seller-assisted' || hash === '#/post-property' || path === '/post-property') return 'SELLER_ASSISTED';
  if (hash.startsWith('#/property/')) return 'PROPERTY_DETAIL';
  if (path.startsWith('/property/')) return 'PROPERTY_DETAIL';

  // 2. OAuth Callback route: ONLY when not overridden by an explicit application route
  if (path === '/auth/callback' || path.startsWith('/auth/callback') || hash === '#/auth/callback' || hash.startsWith('#/auth/callback')) {
    return 'AUTH_CALLBACK';
  }

  // 3. Legal and Company routes
  if (hash === '#/terms' || path === '/terms') return 'TERMS';
  if (hash === '#/privacy-policy' || path === '/privacy-policy') return 'PRIVACY_POLICY';
  if (hash === '#/cookie-policy' || path === '/cookie-policy') return 'COOKIE_POLICY';
  if (hash === '#/careers' || path === '/careers') return 'CAREERS';

  // 4. SEO Locality and Contact pages
  if (hash === '#/contact' || path === '/contact') return 'CONTACT';
  if (localitySlug) return 'LOCALITY_DETAIL';

  return 'HOME';
}

export default function App() {
  const getInitialPropertyId = (): string | null => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/property/')) {
      return path.replace('/property/', '').split('/')[0] || null;
    }
    if (hash.startsWith('#/property/')) {
      return hash.replace('#/property/', '').split('?')[0] || null;
    }
    return null;
  };

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(getInitialPropertyId);
  const [selectedLocalitySlug, setSelectedLocalitySlug] = useState<string | null>(() => {
    return parseLocalitySlug(window.location.pathname, window.location.hash);
  });

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    return resolveRoute(window.location.pathname, window.location.hash, window.location.hostname);
  });

  const [activeUser, setActiveUser] = useState<UserAuthProfile | null>(null);
  const [loginReturnRoute, setLoginReturnRoute] = useState<AppRoute>('HOME');

  // Persistent Login Check: On page load, verify session cookie via /api/auth/me and restore logged-in nav state
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setActiveUser(data.user);
            return;
          }
        }
        if (isMounted) {
          setActiveUser(null);
        }
      } catch {
        if (isMounted) {
          setActiveUser(null);
        }
      }
    };
    restoreSession();
    return () => { isMounted = false; };
  }, []);

  // Staff internal session (Strictly accessible ONLY via custom link e.g. #/crm or crm.domain)
  const [staffSession, setStaffSession] = useState<{ token?: string; user: any } | null>(() => {
    try {
      const stored = sessionStorage.getItem('sellmyghar_staff_session');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse failure
    }
    return null;
  });

  // Sync routing on hash and popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      const host = window.location.hostname;

      const propId = path.startsWith('/property/')
        ? path.replace('/property/', '').split('/')[0]
        : hash.startsWith('#/property/')
        ? hash.replace('#/property/', '').split('?')[0]
        : null;
      if (propId) setSelectedPropertyId(propId);

      const localitySlug = parseLocalitySlug(path, hash);
      if (localitySlug) setSelectedLocalitySlug(localitySlug);

      setCurrentRoute(resolveRoute(path, hash, host));
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: AppRoute, propId?: string) => {
    // If leaving /auth/callback, ensure pathname is cleanly reset to /
    if (window.location.pathname.startsWith('/auth/callback')) {
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, '/');
      }
    }
    setCurrentRoute(route);
    if (route === 'CRM') {
      window.location.hash = '/crm';
    } else if (route === 'DASHBOARD') {
      window.location.hash = '/dashboard';
    } else if (route === 'LOGIN') {
      window.location.hash = '/login';
    } else if (route === 'CONSENT') {
      window.location.hash = '/consent';
    } else if (route === 'SELLER_ASSISTED') {
      window.location.hash = '/seller-assisted';
    } else if (route === 'PROPERTY_DETAIL') {
      const id = propId || selectedPropertyId;
      if (id) {
        setSelectedPropertyId(id);
        window.history.pushState({}, '', `/property/${id}`);
      }
    } else if (route === 'CONTACT') {
      window.location.hash = '/contact';
    } else if (route === 'TERMS') {
      window.location.hash = '/terms';
    } else if (route === 'PRIVACY_POLICY') {
      window.location.hash = '/privacy-policy';
    } else if (route === 'COOKIE_POLICY') {
      window.location.hash = '/cookie-policy';
    } else if (route === 'CAREERS') {
      window.location.hash = '/careers';
    } else if (route === 'AUTH_CALLBACK') {
      window.location.hash = '/auth/callback';
    } else {
      window.location.hash = '';
      if (window.location.pathname.startsWith('/property/') || window.location.pathname.startsWith('/sell-flat-in-')) {
        window.history.pushState({}, '', '/');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLocality = (slug: string) => {
    setSelectedLocalitySlug(slug);
    setCurrentRoute('LOCALITY_DETAIL');
    window.history.pushState({}, '', `/sell-flat-in-${slug}-bangalore`);
    window.location.hash = `/sell-flat-in-${slug}-bangalore`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToProperty = (id: string) => {
    setSelectedPropertyId(id);
    setCurrentRoute('PROPERTY_DETAIL');
    window.history.pushState({}, '', `/property/${id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStaffLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    sessionStorage.removeItem('sellmyghar_staff_session');
    setStaffSession(null);
    navigateTo('HOME');
  };

  const handleUserLogout = async () => {
    try {
      const supabase = await getBrowserSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore Supabase signout error
    }
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    setActiveUser(null);
    navigateTo('HOME');
  };

  const navigateToLogin = (fromRoute?: AppRoute) => {
    const origin = fromRoute || (currentRoute !== 'LOGIN' ? currentRoute : 'HOME');
    setLoginReturnRoute(origin);
    navigateTo('LOGIN');
  };

  const handleAuthSuccess = useCallback((user: UserAuthProfile) => {
    setActiveUser(user);
    const dest = loginReturnRoute && loginReturnRoute !== 'LOGIN' ? loginReturnRoute : 'HOME';
    navigateTo(dest);
  }, [loginReturnRoute]);

  const handleAuthError = useCallback(() => {
    navigateTo('LOGIN');
  }, []);

  // Dedicated OAuth Callback Route
  if (currentRoute === 'AUTH_CALLBACK') {
    return (
      <AuthCallback
        onSuccess={handleAuthSuccess}
        onError={handleAuthError}
      />
    );
  }

  // Dedicated Locality SEO Route (/sell-flat-in-:locality-bangalore)
  if (currentRoute === 'LOCALITY_DETAIL') {
    return (
      <LocalityDetailPage
        localitySlug={selectedLocalitySlug || 'hebbal'}
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToLocality={(slug) => navigateToLocality(slug)}
        onStartSelling={() => navigateTo('SELLER_ASSISTED')}
        onContactDesk={() => navigateTo('CONTACT')}
      />
    );
  }

  // Dedicated Property Detail Route (/property/:id or #/property/:id)
  if (currentRoute === 'PROPERTY_DETAIL') {
    return (
      <PropertyDetailPage
        propertyId={selectedPropertyId || ''}
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToProperty={(id) => navigateToProperty(id)}
        onNavigateToLocality={(slug) => navigateToLocality(slug)}
      />
    );
  }

  // Dedicated Seller Dashboard (Matching 99acres-style management portal)
  if (currentRoute === 'DASHBOARD') {
    return (
      <SellerDashboard
        user={activeUser}
        onPostPropertyClick={() => navigateTo('SELLER_ASSISTED')}
        onBackToHome={() => navigateTo('HOME')}
        onLogout={handleUserLogout}
      />
    );
  }

  // Dedicated Login / Register Page (Matching user reference design)
  if (currentRoute === 'LOGIN') {
    return (
      <AuthPage
        initialMode="SIGNIN"
        onBackToHome={() => {
          const dest = loginReturnRoute && loginReturnRoute !== 'LOGIN' ? loginReturnRoute : 'HOME';
          navigateTo(dest);
        }}
        onSuccess={(user) => {
          setActiveUser(user);
          const dest = loginReturnRoute && loginReturnRoute !== 'LOGIN' ? loginReturnRoute : 'HOME';
          navigateTo(dest);
        }}
      />
    );
  }

  // Dedicated Contact Us Page
  if (currentRoute === 'CONTACT') {
    return (
      <ContactPage
        onNavigate={navigateTo}
        onSignInClick={() => navigateToLogin('CONTACT')}
        onConsentPortalOpen={() => navigateTo('CONSENT')}
      />
    );
  }

  // Dedicated Terms of Service Page
  if (currentRoute === 'TERMS') {
    return (
      <TermsPage
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToContact={() => navigateTo('CONTACT')}
        onNavigateToSellerAssisted={() => navigateTo('SELLER_ASSISTED')}
        onSignInClick={() => navigateToLogin('TERMS')}
      />
    );
  }

  // Dedicated Privacy Policy Page (DPDP Act 2023 Compliant)
  if (currentRoute === 'PRIVACY_POLICY') {
    return (
      <PrivacyPolicyPage
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToContact={() => navigateTo('CONTACT')}
        onNavigateToSellerAssisted={() => navigateTo('SELLER_ASSISTED')}
        onSignInClick={() => navigateToLogin('PRIVACY_POLICY')}
      />
    );
  }

  // Dedicated Cookie Policy Page
  if (currentRoute === 'COOKIE_POLICY') {
    return (
      <CookiePolicyPage
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToContact={() => navigateTo('CONTACT')}
        onNavigateToSellerAssisted={() => navigateTo('SELLER_ASSISTED')}
        onSignInClick={() => navigateToLogin('COOKIE_POLICY')}
      />
    );
  }

  // Dedicated Careers with Us Page
  if (currentRoute === 'CAREERS') {
    return (
      <CareersPage
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToContact={() => navigateTo('CONTACT')}
        onNavigateToSellerAssisted={() => navigateTo('SELLER_ASSISTED')}
        onSignInClick={() => navigateToLogin('CAREERS')}
      />
    );
  }

  // Hidden CRM route: ONLY accessible via direct link (#/crm or crm.* domain).
  // Zero clues or buttons exist anywhere in public UI.
  if (currentRoute === 'CRM') {
    if (!staffSession) {
      return (
        <StaffLogin
          onSuccess={(session) => {
            setStaffSession(session);
            navigateTo('CRM');
          }}
          onBackToHome={() => navigateTo('HOME')}
        />
      );
    }

    return (
      <CrmDashboard
        staffUser={staffSession.user}
        onLogout={handleStaffLogout}
        onExit={() => navigateTo('HOME')}
      />
    );
  }

  // If on Statutory Consent Management Portal
  if (currentRoute === 'CONSENT') {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat']">
        <div className="bg-[#172033] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">DPDP Statutory Consent Management</span>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('HOME')}
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Homepage</span>
          </button>
        </div>
        <ConsentPortal />
      </div>
    );
  }

  // If on Seller Assisted Multi-Step Funnel
  if (currentRoute === 'SELLER_ASSISTED') {
    return (
      <SellerFunnel
        onBackToHome={() => navigateTo('HOME')}
        onViewDashboard={() => navigateTo('DASHBOARD')}
      />
    );
  }

  // Default: Public Homepage
  return (
    <HomePage
      activeUser={activeUser}
      onNavigateToSellerAssisted={() => navigateTo('SELLER_ASSISTED')}
      onNavigateToContact={() => navigateTo('CONTACT')}
      onNavigateToLogin={() => navigateToLogin('HOME')}
      onNavigateToDashboard={() => {
        if (activeUser) {
          navigateTo('DASHBOARD');
        } else {
          setLoginReturnRoute('DASHBOARD');
          navigateTo('LOGIN');
        }
      }}
      onConsentPortalOpen={() => navigateTo('CONSENT')}
      onNavigateToLocality={(slug) => navigateToLocality(slug)}
    />
  );
}
