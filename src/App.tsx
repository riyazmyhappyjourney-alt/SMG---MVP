import React, { useState, useEffect } from 'react';
import { HomePage } from './components/home/HomePage';
import { CrmDashboard } from './components/crm/CrmDashboard';
import { ConsentPortal } from './components/compliance/ConsentPortal';
import { SellerFunnel } from './components/seller/SellerFunnel';
import { StaffLogin } from './components/auth/StaffLogin';
import { ContactPage } from './components/contact/ContactPage';
import { PostPropertyWizard } from './components/post-property/PostPropertyWizard';
import { AuthPage } from './components/auth/AuthPage';
import { SellerDashboard } from './components/seller/SellerDashboard';
import { ArrowLeft, Shield, LogOut, User } from 'lucide-react';
import { UserAuthProfile } from './types/user';

export type AppRoute = 
  | 'HOME' 
  | 'CRM' 
  | 'CONSENT' 
  | 'SELLER_ASSISTED' 
  | 'LOGIN' 
  | 'POST_PROPERTY' 
  | 'CONTACT'
  | 'DASHBOARD';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;
    const host = window.location.hostname;

    // Direct custom domain access e.g. crm.sellmyghar.in or #/crm
    if (host.startsWith('crm.') || hash === '#/crm' || path === '/crm') return 'CRM';
    if (hash === '#/dashboard' || hash === '#/seller-dashboard' || path === '/dashboard' || path === '/seller-dashboard') return 'DASHBOARD';
    if (hash === '#/login' || hash === '#/register' || path === '/login' || path === '/register') return 'LOGIN';
    if (hash === '#/consent' || path === '/consent') return 'CONSENT';
    if (hash === '#/seller-assisted' || path === '/seller-assisted') return 'SELLER_ASSISTED';
    if (hash === '#/post-property' || path === '/post-property') return 'POST_PROPERTY';
    if (hash === '#/contact' || path === '/contact') return 'CONTACT';
    return 'HOME';
  });

  const [activeUser, setActiveUser] = useState<UserAuthProfile | null>(() => {
    try {
      const stored = localStorage.getItem('sellmyghar_google_user');
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return null;
  });

  // Persistent Login Check: On page load, verify 30-day session cookie and restore logged-in nav state
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.authenticated && data.user) {
            setActiveUser(data.user);
            localStorage.setItem('sellmyghar_google_user', JSON.stringify(data.user));
          }
        }
      } catch (err) {
        // Fallback to client state
      }
    };
    restoreSession();
    return () => { isMounted = false; };
  }, []);

  // Staff internal session (Strictly accessible ONLY via custom link e.g. #/crm or crm.domain)
  const [staffSession, setStaffSession] = useState<{ token: string; user: any } | null>(() => {
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

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const host = window.location.hostname;

      if (host.startsWith('crm.') || hash === '#/crm') {
        setCurrentRoute('CRM');
      } else if (hash === '#/dashboard' || hash === '#/seller-dashboard') {
        setCurrentRoute('DASHBOARD');
      } else if (hash === '#/login' || hash === '#/register') {
        setCurrentRoute('LOGIN');
      } else if (hash === '#/consent') {
        setCurrentRoute('CONSENT');
      } else if (hash === '#/seller-assisted') {
        setCurrentRoute('SELLER_ASSISTED');
      } else if (hash === '#/post-property') {
        setCurrentRoute('POST_PROPERTY');
      } else if (hash === '#/contact') {
        setCurrentRoute('CONTACT');
      } else if (hash === '' || hash === '#/' || hash === '#') {
        setCurrentRoute('HOME');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: AppRoute) => {
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
    } else if (route === 'POST_PROPERTY') {
      window.location.hash = '/post-property';
    } else if (route === 'CONTACT') {
      window.location.hash = '/contact';
    } else {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStaffLogout = () => {
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
    localStorage.removeItem('sellmyghar_google_user');
    setActiveUser(null);
    navigateTo('HOME');
  };

  // Dedicated Seller Dashboard (Matching 99acres-style management portal)
  if (currentRoute === 'DASHBOARD') {
    return (
      <SellerDashboard
        user={activeUser}
        onPostPropertyClick={() => navigateTo('POST_PROPERTY')}
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

  // Dedicated Post Property 6-Step Wizard
  if (currentRoute === 'POST_PROPERTY') {
    return (
      <PostPropertyWizard
        user={activeUser}
        onBackToHome={() => navigateTo('HOME')}
        onSuccessRedirect={(_propId, _refId) => {
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
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat']">
        {/* Discrete Staff Bar */}
        <div className="bg-[#172033] text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#B68A4A]">SellMyGhar</span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-slate-200">Internal Desk</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded">
              <User className="w-3.5 h-3.5 text-[#B68A4A]" />
              <span className="font-medium">{staffSession.user?.name || staffSession.user?.email || 'Staff'}</span>
            </div>

            <button
              type="button"
              onClick={handleStaffLogout}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Sign out of staff session"
            >
              <LogOut className="w-3 h-3" />
              <span>Log Out</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('HOME')}
              className="inline-flex items-center space-x-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>

        <CrmDashboard />
      </div>
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
      onNavigateToPostProperty={() => navigateTo('POST_PROPERTY')}
      onNavigateToContact={() => navigateTo('CONTACT')}
      onNavigateToLogin={() => navigateTo('LOGIN')}
      onNavigateToDashboard={() => navigateTo('DASHBOARD')}
      onConsentPortalOpen={() => navigateTo('CONSENT')}
    />
  );
}
