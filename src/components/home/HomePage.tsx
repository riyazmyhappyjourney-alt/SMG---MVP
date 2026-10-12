import React from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { TrustedPartnersMarquee } from './TrustedPartnersMarquee';
import { HoldingCostCalculator } from './HoldingCostCalculator';
import { ListedProperties } from './ListedProperties';
import { Footer } from './Footer';
import { UserAuthProfile } from '../../types/user';
import { trackEvent } from '../../utils/analytics';

interface HomePageProps {
  activeUser?: UserAuthProfile | null;
  onNavigateToSellerAssisted?: (localityPrefill?: string) => void;
  onNavigateToContact?: () => void;
  onNavigateToLogin?: () => void;
  onNavigateToDashboard?: () => void;
  onConsentPortalOpen?: () => void;
  onNavigateToLocality?: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activeUser,
  onNavigateToSellerAssisted,
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

  const scrollToCalculator = () => {
    const el = document.getElementById('calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'BUY') {
      scrollToListings();
    } else if (tab === 'SELL') {
      if (onNavigateToSellerAssisted) {
        onNavigateToSellerAssisted();
      }
    } else if (tab === 'ABOUT') {
      scrollToCalculator();
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) {
        onNavigateToContact();
      }
    }
  };

  const handleStartSelling = (prefillLocality?: string) => {
    trackEvent('SELLER_FUNNEL_START', { source: 'homepage', locality: prefillLocality || 'DIRECT' });
    if (onNavigateToSellerAssisted) {
      onNavigateToSellerAssisted(prefillLocality);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#244B8F] selection:text-white font-['Montserrat'] text-[#172033]">
      
      {/* 1. Sticky Responsive Header */}
      <Header
        user={activeUser}
        onPostPropertyClick={() => handleStartSelling()}
        onLoginClick={() => {
          if (onNavigateToLogin) onNavigateToLogin();
        }}
        onDashboardClick={() => {
          if (onNavigateToDashboard) onNavigateToDashboard();
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1">
        
        {/* 2. Hero Section: 45-day Proposition, Controlled Rolling Ticker, 99acres Inspired Quick Action Card */}
        <Hero
          onSellClick={() => handleStartSelling()}
          onExploreClick={scrollToListings}
          onUnderstandProcessClick={scrollToCalculator}
        />

        {/* 3. Trusted Partners Dynamic Marquee */}
        <TrustedPartnersMarquee />

        {/* 4. Financial Cost of an Unsold Flat Calculator */}
        <HoldingCostCalculator onExploreSellingOptions={() => handleStartSelling()} />

        {/* 5. Verified Resale Inventory */}
        <div id="listings">
          <ListedProperties
            onSelectProperty={(_proj, _loc, _bhk) => {
              if (onNavigateToContact) onNavigateToContact();
            }}
          />
        </div>

      </main>

      {/* 6. DPDP-Compliant Footer with Relocated FAQ Accordion & Legal Links */}
      <Footer
        onNavClick={handleTabClick}
        onConsentPortalOpen={onConsentPortalOpen}
      />
    </div>
  );
};
