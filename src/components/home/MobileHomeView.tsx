import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  ChevronDown,
  ArrowRight,
  Building2,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { getFavoritePropertyIds, toggleFavoriteProperty } from '../../utils/favoritesStore';
import { trackEvent } from '../../utils/analytics';
import { useListings } from '../../utils/listingsHook';
import { PropertyCard } from '../common/PropertyCard';
import { TrustedPartnersMarquee } from './TrustedPartnersMarquee';
import { HowItWorks } from './HowItWorks';
import { redirectToBuyMyGhar, getBuyMyGharExploreUrl } from '../../utils/domainConfig';

interface MobileHomeViewProps {
  onSellClick: () => void;
  onExploreClick: () => void;
  onSelectLocality: (locality: string) => void;
  onSearchQuery: (query: string) => void;
  onOpenSaved: () => void;
  onSelectProperty?: (projectName: string, locality: string, bhkType: string) => void;
  onOpenBuyerModal: () => void;
}

const HERO_SLIDES = [
  {
    url: '/images/bengaluru-mobile-hero-portrait.jpg',
    alt: 'Bengaluru Residential Resale Apartment Towers at Night',
  },
  {
    url: '/images/luxury-apartment-township-sunset.webp',
    alt: 'Luxury Apartment Township at Sunset in Bengaluru',
  },
  {
    url: '/images/bengaluru-night-apartments.webp',
    alt: 'Modern Residential Community in Bengaluru',
  },
  {
    url: '/images/brigade-granada-clubhouse.webp',
    alt: 'Premium Society Clubhouse in Bengaluru',
  },
  {
    url: '/images/brigade-granada-hero.webp',
    alt: 'Bengaluru Residential Towers',
  },
];

const LOCALITY_PILLS = [
  'Whitefield',
  'Yelahanka',
  'Hebbal',
  'Thanisandra',
  'Hennur',
  'Sarjapur Road',
  'Bellandur',
];

const SEARCH_SOCIETY_PLACEHOLDERS = [
  'Prestige Shantiniketan',
  'Sobha Dream Acres',
  'Brigade Gateway',
  'Godrej Woodsman',
  'Total Environment Windmills',
  'Salarpuria Sattva Magnificence',
  'Assetz Marq',
  'Purva Palm Beach',
  'Phoenix One Bangalore West',
  'Bhartiya City Nikoo Homes',
];

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  onSellClick,
  onExploreClick,
  onSelectLocality,
  onSearchQuery,
  onOpenSaved,
  onSelectProperty,
  onOpenBuyerModal,
}) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'sell' | 'post'>('sell');
  const [selectedBhk, setSelectedBhk] = useState('3 BHK');
  const [searchInput, setSearchInput] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(getFavoritePropertyIds()));
  const { properties } = useListings();

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const minSwipeDistance = 40;

  useEffect(() => {
    const handleFavUpdate = (e: any) => {
      setFavorites(new Set(e.detail?.ids || getFavoritePropertyIds()));
    };
    window.addEventListener('smg:favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('smg:favorites-updated', handleFavUpdate);
  }, []);

  // Snappy auto-advance hero slides (3.5s) if user is not swiping
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Animated rolling placeholder for society search
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % SEARCH_SOCIETY_PLACEHOLDERS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  // Touch swipe gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance) {
      // Swiped left -> advance to next slide
      handleNextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> return to previous slide
      handlePrevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInput.trim()) {
      onSearchQuery(searchInput.trim());
    }
    // Redirect / explore on BuyMyGhar
    redirectToBuyMyGhar();
  };

  const handleLocalityClick = (loc: string) => {
    trackEvent('LOCALITY_CARD_CLICK', { locality: loc });
    onSelectLocality(loc);
    redirectToBuyMyGhar(loc);
  };

  return (
    <div className="md:hidden w-full max-w-full overflow-x-hidden font-['Montserrat',sans-serif] text-[#172033] bg-white pb-0">
      
      {/* =========================================================================
          1. HERO SECTION (Landscape Banner with touch swiping & bottom-anchored text)
         ========================================================================= */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-[225px] sm:h-[245px] overflow-hidden bg-slate-950 select-none touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {/* Background Image Carousel Layer (Snappy 300ms transition) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          {HERO_SLIDES.map((slide, idx) => (
            <img
              key={slide.url}
              src={slide.url}
              alt={slide.alt}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-300 ease-in-out ${
                idx === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
          ))}

          {/* Contrast Gradient Overlays for readable text over architectural imagery */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
        </div>

        {/* Stable Hero Content Overlay - Permanently anchored to bottom edge above the card */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-5 pb-5 pt-8 flex flex-col justify-end text-left pointer-events-none">
          {/* Top Eyebrow / Kicker */}
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="w-4 h-[1.5px] bg-white/80" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-white/90">
              BENGALURU RESIDENTIAL RESALE
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            Sell your flat in 45 days.
          </h1>

          {/* Subtitle */}
          <p className="text-[11px] text-white/80 font-normal leading-tight mt-1 line-clamp-2 max-w-[280px]">
            Verified registry pricing and pre-qualified buyers across Bengaluru.
          </p>
        </div>
      </div>

      {/* =========================================================================
          Seller Resale Flat Card (Matching Reference Image with Existing Brand Colors)
         ========================================================================= */}
      <div className="mx-4 -mt-3.5 bg-white rounded-2xl shadow-xl p-3.5 sm:p-4 border border-slate-100 relative z-20">
        
        {/* Row 1: Sell Flat Tab & Post Property FREE Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('sell')}
              className={`flex items-center space-x-1.5 pb-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'sell'
                  ? 'border-[#0073E6] text-[#0073E6] -mb-[10px]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#0073E6]" />
              <span>Sell Flat</span>
            </button>

            <span className="text-slate-200">|</span>

            <button
              type="button"
              onClick={() => {
                setActiveTab('post');
                onSellClick();
              }}
              className="flex items-center space-x-1.5 pb-1 text-xs font-bold text-slate-700 hover:text-[#0073E6] cursor-pointer"
            >
              <span>Post Property</span>
              <span className="bg-[#059669] text-white text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs">
                FREE
              </span>
            </button>
          </div>
        </div>

        {/* Row 2: Compact BHK Dropdown & Search Society Input with Rolling Placeholder */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center gap-2">
            {/* Compact BHK Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedBhk}
                onChange={(e) => setSelectedBhk(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-2.5 pr-6 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0073E6] cursor-pointer shadow-2xs w-[84px]"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="2.5 BHK">2.5 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="3.5 BHK">3.5 BHK</option>
                <option value="4 BHK+">4 BHK+</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Society Search Input with Rolling Placeholder Animation and MaxLength */}
            <div className="flex-1 relative flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-2xs focus-within:border-[#0073E6] focus-within:ring-1 focus-within:ring-[#0073E6]">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1.5" />
              <input
                type="text"
                value={searchInput}
                maxLength={60}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder={SEARCH_SOCIETY_PLACEHOLDERS[placeholderIdx]}
                className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 text-xs ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Primary CTA Button: Sell Your Flat Now FREE → with Light Sweep Shimmer Animation */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 1.03 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={() => {
              trackEvent('HERO_CTA_PRIMARY_CLICK', { bhk: selectedBhk, query: searchInput });
              if (searchInput.trim()) {
                onSearchQuery(searchInput.trim());
              }
              onSellClick();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] active:bg-[#004c99] text-white text-xs sm:text-sm font-bold shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-colors relative overflow-hidden group/btn"
          >
            {/* Ambient light sweep shimmer animation */}
            <span className="animate-btn-light-sweep" aria-hidden="true" />
            <span className="relative z-10">Sell Your Flat Now</span>
            <span className="relative z-10 bg-[#059669] text-white text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs">
              FREE
            </span>
            <ArrowRight className="w-4 h-4 ml-0.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 animate-arrow-nudge relative z-10" />
          </motion.button>
        </div>

        {/* Buyer Link */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 text-left">
          <button
            type="button"
            onClick={() => redirectToBuyMyGhar()}
            className="text-[11px] font-bold text-[#0073E6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Looking to buy instead? Browse verified homes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. TRUSTED CHANNEL PARTNER MARQUEE (Zero blank gap)
         ========================================================================= */}
      <div className="mt-4">
        <TrustedPartnersMarquee />
      </div>

      {/* =========================================================================
          3. HOW IT WORKS (Seller Journey 3-Step Sequence)
         ========================================================================= */}
      <div className="mt-2">
        <HowItWorks onPostProperty={onSellClick} isMobileOnly className="py-2" />
      </div>

      {/* =========================================================================
          4. EXPLORE BY LOCALITY (With redirection to BuyMyGhar.in)
         ========================================================================= */}
      <div className="mt-4 px-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight text-left font-['Montserrat']">
            Explore by Locality
          </h2>
          <button
            type="button"
            onClick={() => redirectToBuyMyGhar()}
            className="text-xs font-bold text-[#0073E6] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>BuyMyGhar.in</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Scrollable Locality Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-0.5 w-full">
          {LOCALITY_PILLS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => handleLocalityClick(loc)}
              className="bg-white rounded-full border border-blue-200 shadow-xs px-3.5 py-1.5 text-xs font-semibold text-slate-800 flex items-center gap-1.5 shrink-0 hover:border-[#0073E6] hover:text-[#0073E6] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#0073E6] shrink-0" />
              <span>{loc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          5. LISTED PROPERTY CARDS (Exact Same Card Design as Desktop with
             proper 16:10 aspect ratio, full badges, specs, and animations)
         ========================================================================= */}
      <div className="mt-5 px-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight text-left">
              Verified Resale Properties
            </h2>
            <p className="text-[11px] text-slate-500 font-['Poppins']">
              Title-checked gated communities in Bengaluru
            </p>
          </div>
          <button
            type="button"
            onClick={() => redirectToBuyMyGhar()}
            className="text-xs font-bold text-[#0073E6] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vertical Stack of Canonical Property Cards (Exact same as Desktop) */}
        <div className="grid grid-cols-1 gap-4.5 pt-1">
          {properties.slice(0, 6).map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              variant="grid"
              isFavorite={favorites.has(prop.id)}
              onToggleFavorite={(id) => {
                toggleFavoriteProperty(id);
                setFavorites(new Set(getFavoritePropertyIds()));
              }}
              onSelectProperty={onSelectProperty}
            />
          ))}
        </div>

        {/* View All Properties on BuyMyGhar CTA Button */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => redirectToBuyMyGhar()}
            className="w-full py-3 px-5 rounded-xl bg-[#172033] hover:bg-[#0073E6] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
          >
            <span>Explore All 200+ Properties on BuyMyGhar.in</span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

    </div>
  );
};
