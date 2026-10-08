import React from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { TrustedPartnersMarquee } from './TrustedPartnersMarquee';
import { VirtualTourSection } from './VirtualTourSection';
import { ListedProperties } from './ListedProperties';
import { Footer } from './Footer';
import { ArrowRight, ShieldCheck, Building2, PhoneCall } from 'lucide-react';
import { UserAuthProfile } from '../../types/user';

interface HomePageProps {
  activeUser?: UserAuthProfile | null;
  onNavigateToPostProperty?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToDashboard?: () => void;
  onConsentPortalOpen?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activeUser,
  onNavigateToPostProperty,
  onNavigateToContact,
  onNavigateToLogin,
  onNavigateToDashboard,
  onConsentPortalOpen,
}) => {
  const scrollToListings = () => {
    const el = document.getElementById('listings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'BUY') {
      scrollToListings();
    } else if (tab === 'SELL') {
      if (onNavigateToPostProperty) {
        onNavigateToPostProperty();
      }
    } else if (tab === 'ABOUT') {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) {
        onNavigateToContact();
      }
    }
  };

  const handleSelectPropertyForEnquiry = (
    _projectName: string,
    _locality: string,
    _bhkType: any
  ) => {
    if (onNavigateToContact) {
      onNavigateToContact();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#244B8F] selection:text-white font-['Montserrat']">
      {/* 1. Sticky Responsive Header */}
      <Header
        user={activeUser}
        onPostPropertyClick={() => {
          if (onNavigateToPostProperty) onNavigateToPostProperty();
        }}
        onLoginClick={() => {
          if (onNavigateToLogin) onNavigateToLogin();
        }}
        onDashboardClick={() => {
          if (onNavigateToDashboard) onNavigateToDashboard();
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <Hero
          onSellClick={() => {
            if (onNavigateToPostProperty) onNavigateToPostProperty();
          }}
          onExploreClick={scrollToListings}
        />

        {/* 3. Sliding Animation Loop of Trusted Channel Partners (Sobha, Prestige, Brigade, etc.) */}
        <TrustedPartnersMarquee />

        {/* 3b. 360° Virtual Tour Showcase */}
        <VirtualTourSection onExploreListings={scrollToListings} />

        {/* 4. Streamlined Post Property Callout Banner */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="bg-gradient-to-r from-[#172033] via-[#1E2E4B] to-[#244B8F] rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="max-w-2xl relative z-10 space-y-3">
              <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-amber-200">
                <ShieldCheck className="w-4 h-4 text-[#B68A4A]" />
                <span>Dedicated Bengaluru Resale Platform</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Have a Flat to Sell in Bengaluru?
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
                Post your property in 6 easy steps with live locality suggestions, automated readiness scoring, and zero broker spam.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToPostProperty) onNavigateToPostProperty();
                  }}
                  className="relative inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-bold text-[#172033] bg-white hover:bg-slate-100 shadow-md transition-all cursor-pointer group"
                >
                  <span className="absolute -top-2.5 -right-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white rounded-full shadow-md border-2 border-white">
                    FREE
                  </span>
                  <Building2 className="w-4 h-4 mr-2 text-[#244B8F]" />
                  <span>Launch Post Property Wizard</span>
                  <ArrowRight className="w-4 h-4 ml-2 text-[#244B8F] group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToContact) onNavigateToContact();
                  }}
                  className="inline-flex items-center text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer py-2"
                >
                  <PhoneCall className="w-4 h-4 mr-1.5 text-slate-400" />
                  <span>Or contact our advisor desk directly</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Listed Properties Grid */}
        <ListedProperties onSelectProperty={handleSelectPropertyForEnquiry} />
      </main>

      {/* 6. DPDP-Compliant Footer */}
      <Footer
        onNavClick={handleTabClick}
        onConsentPortalOpen={onConsentPortalOpen}
      />
    </div>
  );
};

