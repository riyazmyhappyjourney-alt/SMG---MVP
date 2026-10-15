import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { TrustedPartnersMarquee } from './TrustedPartnersMarquee';
import { HoldingCostCalculator } from './HoldingCostCalculator';
import { ListedProperties } from './ListedProperties';
import { Footer } from './Footer';
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
  const [isBuyerModalOpen, setIsBuyerModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  // Automatic scroll on anchor hash
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#/holding-calculator' || h === '#holding-calculator' || h === '#calculator' || h === '#/calculator') {
        setTimeout(() => {
          const el = document.getElementById('holding-calculator') || document.getElementById('calculator');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      } else if (h === '#/listings' || h === '#listings') {
        setTimeout(() => {
          const el = document.getElementById('listings');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const scrollToListings = () => {
    const el = document.getElementById('listings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToCalculator = () => {
    const el = document.getElementById('holding-calculator') || document.getElementById('calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'BUY') {
      setIsBuyerModalOpen(true);
    } else if (tab === 'SELL') {
      if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
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
    if (onNavigateToSellerAssisted) {
      onNavigateToSellerAssisted();
    }
  };

  const handleStartSelling = (prefillLocality?: string) => {
    trackEvent('SELLER_FUNNEL_START', { source: 'homepage', locality: prefillLocality || 'DIRECT' });
    if (onNavigateToSellerAssisted) {
      onNavigateToSellerAssisted(prefillLocality);
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');

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
        onSearchQuery={(q) => {
          setSearchQuery(q);
          scrollToListings();
        }}
        onSelectLocality={(loc) => {
          setSelectedLocality(loc);
          scrollToListings();
        }}
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
            searchQuery={searchQuery}
            externalLocality={selectedLocality}
          />
        </div>

      </main>

      {/* 6. DPDP-Compliant Footer with Relocated FAQ Accordion & Legal Links */}
      <Footer
        onNavClick={handleTabClick}
        onConsentPortalOpen={onConsentPortalOpen}
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
