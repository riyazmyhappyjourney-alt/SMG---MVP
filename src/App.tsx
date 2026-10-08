import React, { useState, useEffect } from 'react';
import { HomePage } from './components/home/HomePage';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { ConsentPortal } from './components/compliance/ConsentPortal';
import { SellerFunnel } from './components/seller/SellerFunnel';
import { StaffLogin } from './components/auth/StaffLogin';
import { ContactPage } from './components/contact/ContactPage';
import { PropertyDetailPage } from './components/property/PropertyDetailPage';
import { AuthPage } from './components/auth/AuthPage';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { ArrowLeft, Shield } from 'lucide-react';
import { UserAuthProfile } from './types/user';

export type AppRoute = 
  | 'HOME' 
  | 'CRM' 
  | 'CONSENT' 
  | 'SELLER_ASSISTED' 
  | 'LOGIN' 
  | 'CONTACT'
  | 'DASHBOARD'
  | 'PROPERTY_DETAIL';

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

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    const host = window.location.hostname;

    // Direct custom domain access e.g. crm.sellmyghar.in or #/crm
    if (host.startsWith('crm.') || hash === '#/crm' || path === '/crm') return 'CRM';
    if (hash === '#/dashboard' || hash === '#/seller-dashboard' || path === '/dashboard' || path === '/seller-dashboard') return 'DASHBOARD';
    if (hash === '#/login' || hash === '#/register' || path === '/login' || path === '/register') return 'LOGIN';
    if (hash === '#/consent' || path === '/consent') return 'CONSENT';
    if (hash === '#/seller-assisted' || path === '/seller-assisted' || hash === '#/post-property' || path === '/post-property') return 'SELLER_ASSISTED';
    if (path.startsWith('/property/') || hash.startsWith('#/property/')) return 'PROPERTY_DETAIL';
    if (hash === '#/contact' || path === '/contact') return 'CONTACT';
    return 'HOME';
  });

  const [activeUser, setActiveUser] = useState<UserAuthProfile | null>(null);

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

      if (host.startsWith('crm.') || hash === '#/crm') {
        setCurrentRoute('CRM');
      } else if (hash === '#/dashboard' || hash === '#/seller-dashboard') {
        setCurrentRoute('DASHBOARD');
      } else if (hash === '#/login' || hash === '#/register') {
        setCurrentRoute('LOGIN');
      } else if (hash === '#/consent') {
        setCurrentRoute('CONSENT');
      } else if (hash === '#/seller-assisted' || hash === '#/post-property') {
        setCurrentRoute('SELLER_ASSISTED');
      } else if (path.startsWith('/property/')) {
        const propId = path.replace('/property/', '').split('/')[0];
        setSelectedPropertyId(propId);
        setCurrentRoute('PROPERTY_DETAIL');
      } else if (hash.startsWith('#/property/')) {
        const propId = hash.replace('#/property/', '').split('?')[0];
        setSelectedPropertyId(propId);
        setCurrentRoute('PROPERTY_DETAIL');
      } else if (hash === '#/contact') {
        setCurrentRoute('CONTACT');
      } else if (hash === '' || hash === '#/' || hash === '#') {
        if (!window.location.pathname.startsWith('/property/')) {
          setCurrentRoute('HOME');
        }
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: AppRoute, propId?: string) => {
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
    } else {
      window.location.hash = '';
      if (window.location.pathname.startsWith('/property/')) {
        window.history.pushState({}, '', '/');
      }
    }
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    setActiveUser(null);
    navigateTo('HOME');
  };

  // Dedicated Property Detail Route (/property/:id or #/property/:id)
  if (currentRoute === 'PROPERTY_DETAIL') {
    return (
      <PropertyDetailPage
        propertyId={selectedPropertyId || ''}
        onBackToHome={() => navigateTo('HOME')}
        onNavigateToProperty={(id) => navigateToProperty(id)}
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
        onBackToHome={() => navigateTo('HOME')}
        onSuccess={(user) => {
          setActiveUser(user);
          navigateTo('DASHBOARD');
        }}
      />
    );
  }

  // Dedicated Contact Us Page
  if (currentRoute === 'CONTACT') {
    return (
      <ContactPage
        onNavigate={navigateTo}
        onSignInClick={() => navigateTo('LOGIN')}
        onConsentPortalOpen={() => navigateTo('CONSENT')}
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
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat']">
        <div className="bg-[#172033] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
          <span className="font-semibold text-slate-200">Seller Onboarding Assistance</span>
          <button
            type="button"
            onClick={() => navigateTo('HOME')}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </button>
        </div>
        <SellerFunnel />
      </div>
    );
  }

  // Default: Public Homepage
  return (
    <HomePage
      activeUser={activeUser}
      onNavigateToSellerAssisted={() => navigateTo('SELLER_ASSISTED')}
      onNavigateToContact={() => navigateTo('CONTACT')}
      onNavigateToLogin={() => navigateTo('LOGIN')}
      onNavigateToDashboard={() => navigateTo('DASHBOARD')}
      onConsentPortalOpen={() => navigateTo('CONSENT')}
    />
  );
}
