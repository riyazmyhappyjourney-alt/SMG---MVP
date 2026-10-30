import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { CustomerReviewsSection } from './CustomerReviewsSection';
import { CtaBanner } from './CtaBanner';
import { Footer } from './Footer';
import { BuyerSearchPopupModal } from './BuyerSearchPopupModal';
import { FavoritesModal } from './FavoritesModal';
import { MobileBottomNav } from '../common/MobileBottomNav';
import { UserAuthProfile } from '../../types/user';
import { trackEvent } from '../../utils/analytics';
import { redirectToBuyMyGhar } from '../../utils/domainConfig';

interface HomePageProps {
  activeUser?: UserAuthProfile | null;
  onNavigateToSellerAssisted?: (localityPrefill?: string) => void;
  onNavigateToContact?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToFaq?: () => void;
  onNavigateToLogin?: (fromRoute?: any) => void;
  onNavigateToDashboard?: () => void;
  onConsentPortalOpen?: () => void;
  onNavigateToLocality?: (slug: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  activeUser,
  onNavigateToSellerAssisted,
  onNavigateToContact,
  onNavigateToAbout,
  onNavigateToFaq,
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
      if (!activeUser) {
        if (onNavigateToLogin) onNavigateToLogin('SELLER_ASSISTED');
        return;
      }
      if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
    } else if (tab === 'ABOUT') {
      if (onNavigateToAbout) {
        onNavigateToAbout();
      } else {
        window.location.hash = '#/about';
      }
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) {
        onNavigateToContact();
      }
    }
  };

  const handlePostProperty = () => {
    trackEvent('SELLER_FUNNEL_START', { source: 'header_post_property' });
    if (!activeUser) {
      if (onNavigateToLogin) onNavigateToLogin('SELLER_ASSISTED');
      return;
    }
    if (onNavigateToSellerAssisted) {
      onNavigateToSellerAssisted();
    }
  };

  const handleStartSelling = (prefillLocality?: string) => {
    trackEvent('SELLER_FUNNEL_START', { source: 'homepage', locality: prefillLocality || 'DIRECT' });
    if (!activeUser) {
      if (onNavigateToLogin) onNavigateToLogin('SELLER_ASSISTED');
      return;
    }
    if (onNavigateToSellerAssisted) {
      onNavigateToSellerAssisted(prefillLocality);
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#F4F6F9] selection:bg-[#0073E6] selection:text-white font-['Montserrat'] text-[#172033] pb-0">
      
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
        {/* Responsive Hero Section matching user wireframe reference */}
        <Hero
          onSellClick={() => handleStartSelling()}
          onExploreClick={() => redirectToBuyMyGhar()}
          onUnderstandProcessClick={scrollToCalculator}
        />

        {/* 2. "How It Works" 4-Step Milestone Journey */}
        <div id="how-it-works" className="bg-white border-y border-slate-200/60 my-6 sm:my-8 py-2 sm:py-4">
          <HowItWorks onPostProperty={handlePostProperty} />
        </div>

        {/* 3. Verified Customer Reviews & Testimonials with Animations */}
        <CustomerReviewsSection />

        {/* 4. Panoramic CTA Banner matching approved reference image */}
        <CtaBanner />

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



      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab="HOME"
        user={activeUser}
        onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateExplore={() => redirectToBuyMyGhar()}
        onOpenSaved={() => setIsFavoritesModalOpen(true)}
        onNavigateActivity={() => {
          handlePostProperty();
        }}
        onNavigateProfile={() => {
          if (activeUser && onNavigateToDashboard) {
            onNavigateToDashboard();
          } else if (onNavigateToLogin) {
            onNavigateToLogin();
          }
        }}
      />
    </div>
  );
};

