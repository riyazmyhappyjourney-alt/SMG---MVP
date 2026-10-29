import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { WhySellMyGharSection } from './WhySellMyGharSection';
import { PopularSocietiesSection } from './PopularSocietiesSection';
import { CustomerReviewsSection } from './CustomerReviewsSection';
import { FaqSection } from './FaqSection';
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
      if (h === '#/how-it-works' || h === '#how-it-works') {
        const el = document.getElementById('how-it-works');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#/why-sellmyghar' || h === '#why-sellmyghar') {
        const el = document.getElementById('why-sellmyghar');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#/popular-societies' || h === '#popular-societies') {
        const el = document.getElementById('popular-societies');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#/faqs' || h === '#faqs') {
        const el = document.getElementById('faqs');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else if (h === '#/valuation' || h === '#valuation') {
        const el = document.getElementById('hero-valuation-card');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'BUY') {
      setIsBuyerModalOpen(true);
    } else if (tab === 'SELL') {
      const el = document.getElementById('hero-valuation-card');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'ABOUT') {
      const el = document.getElementById('why-sellmyghar');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) {
        onNavigateToContact();
      } else {
        window.location.href = 'tel:+918217873708';
      }
    }
  };

  const handlePostProperty = () => {
    trackEvent('SELLER_FUNNEL_START', { source: 'homepage_valuation_card' });
    const el = document.getElementById('hero-valuation-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-white selection:bg-[#0073E6] selection:text-white font-['Montserrat'] text-[#172033] pb-0">
      
      {/* 1. Clean Responsive Header (Matching Reference Wireframe) */}
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

      <main className="flex-1 w-full max-w-full">
        
        {/* 2. Hero Section: "Sell Your Flat in 45 Days" + Interactive 3-Step Valuation Card + Trust Stats Bar */}
        <Hero
          onSellClick={handlePostProperty}
          onExploreClick={() => redirectToBuyMyGhar()}
        />

        {/* 3. Sell Your Flat in 4 Simple Steps (Clean 4-Card Step Flow) */}
        <HowItWorks onPostProperty={handlePostProperty} />

        {/* 4. Why SellMyGhar (4 Clean Value Points + Family Living Photography & Testimonial) */}
        <WhySellMyGharSection />

        {/* 5. Popular Apartment Communities in Bengaluru (6 Clean Society Cards) */}
        <PopularSocietiesSection
          onSelectSociety={(socName) => {
            const el = document.getElementById('hero-valuation-card');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* 6. What Our Customers Say (Authentic Non-AI Homeowner Feedback) */}
        <CustomerReviewsSection />

        {/* 7. Frequently Asked Questions (Clean 2-Column Accordion) */}
        <FaqSection />

        {/* 8. Ready to Sell Your Flat in 45 Days? (High-Converting CTA Banner) */}
        <CtaBanner />

      </main>

      {/* 9. DPDP-Compliant Footer with RERA Registration & Disclaimers */}
      <Footer
        onNavClick={handleTabClick}
        onConsentPortalOpen={onConsentPortalOpen}
      />

      {/* Buyer Search Popup Modal */}
      <BuyerSearchPopupModal
        isOpen={isBuyerModalOpen}
        onClose={() => setIsBuyerModalOpen(false)}
        onBrowseListings={() => {
          redirectToBuyMyGhar();
        }}
      />

      {/* Saved Favorites Modal */}
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
