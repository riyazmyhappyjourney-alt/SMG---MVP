import React, { useState } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { TrustedPartnersMarquee } from './TrustedPartnersMarquee';
import { HoldingCostCalculator } from './HoldingCostCalculator';
import { ListedProperties } from './ListedProperties';
import { Footer } from './Footer';
import { SellFlatPopupModal } from './SellFlatPopupModal';
import { BuyerSearchPopupModal } from './BuyerSearchPopupModal';
import { FavoritesModal } from './FavoritesModal';
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
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

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
      setIsBuyerModalOpen(true);
    } else if (tab === 'SELL') {
      setIsSellModalOpen(true);
    } else if (tab === 'ABOUT') {
      scrollToCalculator();
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) {
        onNavigateToContact();
      }
    }
  };

  const handlePostProperty = () => {
    trackEvent('SELLER_FUNNEL_START', { source: 'header_post_property' });
    setIsSellModalOpen(true);
  };

  const handleStartSelling = (prefillLocality?: string) => {
    trackEvent('SELLER_FUNNEL_START', { source: 'homepage', locality: prefillLocality || 'DIRECT' });
    setIsSellModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#244B8F] selection:text-white font-['Montserrat'] text-[#172033]">
      
      {/* 1. Sticky Responsive Header */}
      <Header
        user={activeUser}
        onPostPropertyClick={handlePostProperty}
        onLoginClick={() => {
          if (onNavigateToLogin) onNavigateToLogin();
        }}
        onDashboardClick={() => {
          if (onNavigateToDashboard) onNavigateToDashboard();
        }}
        onTabClick={handleTabClick}
        onFavoritesClick={() => setIsFavoritesModalOpen(true)}
      />

      <main className="flex-1">
        
        {/* 2. Hero Section: 45-day Proposition, Controlled Rolling Ticker, 99acres Inspired Quick Action Card */}
        <Hero
          onSellClick={() => setIsSellModalOpen(true)}
          onExploreClick={scrollToListings}
          onUnderstandProcessClick={scrollToCalculator}
        />

        {/* 3. Trusted Partners Dynamic Marquee */}
        <TrustedPartnersMarquee />

        {/* 4. Financial Cost of an Unsold Flat Calculator */}
        <HoldingCostCalculator onExploreSellingOptions={() => setIsSellModalOpen(true)} />

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

      {/* Interactive Modal Popups for Header Actions (No Full-Page Disruption) */}
      <SellFlatPopupModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onOpenFullWizard={() => {
          if (onNavigateToSellerAssisted) {
            onNavigateToSellerAssisted();
          }
        }}
      />

      <BuyerSearchPopupModal
        isOpen={isBuyerModalOpen}
        onClose={() => setIsBuyerModalOpen(false)}
        onBrowseListings={() => {
          scrollToListings();
        }}
      />

      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
      />
    </div>
  );
};
