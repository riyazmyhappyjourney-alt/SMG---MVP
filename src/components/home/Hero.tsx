import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowRight, 
  Building2, 
  MapPin, 
  ChevronLeft, 
  ChevronRight,
  Search,
  ChevronDown
} from 'lucide-react';
import { searchSocieties, SocietyItem } from '../../data/bengaluruData';
import { trackEvent } from '../../utils/analytics';

interface HeroProps {
  onSellClick: () => void;
  onExploreClick: () => void;
  onUnderstandProcessClick?: () => void;
}

interface HeroSlideItem {
  id?: string;
  url: string;
  alt: string;
  tag?: string;
}

// High-fidelity Bengaluru apartment township backdrops
const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    url: '/images/sample-hero-banner-1920x800.png',
    alt: 'SellMyGhar Verified Bengaluru Residential Resale Platform 1920x800 Banner',
    tag: 'Verified Platform',
  },
  {
    url: '/images/luxury-apartment-township-sunset.webp',
    alt: 'Luxury Apartment Township at Sunset in Bengaluru',
    tag: 'Township Exterior',
  },
  {
    url: '/images/brigade-granada-clubhouse.webp',
    alt: 'Premium Society Clubhouse and Township Amenities in Bengaluru',
    tag: 'Society Amenities',
  },
  {
    url: '/images/bengaluru-night-apartments.webp',
    alt: 'Modern Residential Community in Bengaluru Tech Corridor',
    tag: 'Residential Community',
  },
];

// 11 Key Bengaluru residential resale micro-markets for continuous rolling ticker
const LOCALITIES = [
  'Hebbal',
  'Thanisandra',
  'Yelahanka',
  'Jakkur',
  'Hennur',
  'Whitefield',
  'Sarjapur Road',
  'Bellandur',
  'HSR Layout',
  'JP Nagar',
  'Indiranagar',
];

export const Hero: React.FC<HeroProps> = ({ 
  onSellClick, 
  onExploreClick,
  onUnderstandProcessClick 
}) => {
  const [slides, setSlides] = useState<HeroSlideItem[]>(DEFAULT_HERO_SLIDES);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active locality index for robust, non-breaking vertical rolling ticker
  const [activeLocalityIndex, setActiveLocalityIndex] = useState(0);

  // Dynamic CMS Slides Fetching
  useEffect(() => {
    let isMounted = true;
    const fetchCmsSlides = async () => {
      try {
        const res = await fetch('/api/cms/hero-slides');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.slides) && data.slides.length > 0) {
            const activeOnly = data.slides
              .filter((s: any) => s.is_active)
              .map((s: any) => ({
                id: s.id,
                url: s.image_url,
                alt: s.alt_text || s.title || 'Bengaluru Residential Resale Apartment',
                tag: s.title || 'Featured Corridor',
              }));

            if (activeOnly.length > 0) {
              setSlides(activeOnly);
            }
          }
        }
      } catch {
        // Retain default slides if backend CMS is offline
      }
    };

    fetchCmsSlides();
    return () => { isMounted = false; };
  }, []);

  const slideCount = slides.length;

  const handlePrevSlide = useCallback(() => {
    setActiveSlide((prev) => (prev - 1 + slideCount) % slideCount);
    trackEvent('HERO_SLIDE_CHANGE', { action: 'PREV' });
  }, [slideCount]);

  const handleNextSlide = useCallback(() => {
    setActiveSlide((prev) => (prev + 1) % slideCount);
    trackEvent('HERO_SLIDE_CHANGE', { action: 'NEXT' });
  }, [slideCount]);

  const handleSelectSlide = (idx: number) => {
    setActiveSlide(idx);
    trackEvent('HERO_SLIDE_CHANGE', { action: 'SELECT_INDEX', index: idx });
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'ArrowRight') {
        handleNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevSlide, handleNextSlide]);

  // Auto-advancement timer for hero slides (every 6 seconds, paused on hover)
  useEffect(() => {
    if (isPaused || slideCount <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slideCount);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, slideCount]);

  // Robust, self-contained timer for locality vertical rolling ticker (advances every 2.4s)
  useEffect(() => {
    const ticker = setInterval(() => {
      setActiveLocalityIndex((prev) => (prev + 1) % LOCALITIES.length);
    }, 2400);

    return () => clearInterval(ticker);
  }, []);

  // Marketplace Card Tab & Form State
  const [activeTab, setActiveTab] = useState<'SELL' | 'BUY' | 'RENT'>('SELL');
  const [societyQuery, setSocietyQuery] = useState('');
  const [bhk, setBhk] = useState('3 BHK');
  const [suggestions, setSuggestions] = useState<SocietyItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSocietyInput = (text: string) => {
    setSocietyQuery(text);
    if (text.trim().length >= 2) {
      const results = searchSocieties(text).slice(0, 6);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSociety = (item: SocietyItem) => {
    setSocietyQuery(`${item.name} (${item.locality})`);
    setShowSuggestions(false);
  };

  const handleSubmitSellerIntake = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('HERO_CTA_PRIMARY_CLICK', { society: societyQuery, bhk });
    onSellClick();
  };

  const handleTabChange = (tab: 'SELL' | 'BUY' | 'RENT') => {
    setActiveTab(tab);
    if (tab === 'BUY') {
      onExploreClick();
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden font-['Poppins',sans-serif] bg-slate-950 focus:outline-none"
      tabIndex={0}
      aria-label="SellMyGhar Homepage Hero Banner"
    >
      
      {/* 1. Background Carousel Layer */}
      <div className="absolute inset-0 w-full h-full">
        {slides.map((slide, idx) => (
          <img
            key={`${slide.url}-${idx}`}
            src={slide.url}
            alt={slide.alt}
            className={`absolute inset-0 w-full h-full object-cover object-[center_35%] lg:object-[65%_30%] transition-opacity duration-1000 ease-in-out ${
              idx === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            loading={idx === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
      </div>

      {/* 2. Semi-Transparent Backdrop Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/40 pointer-events-none" />

      {/* 3. Left & Right Navigation Controls */}
      {slideCount > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNextSlide}
            aria-label="Next Slide"
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-950/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-lg hover:scale-105"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 4. Slide Indicator Dots */}
      {slideCount > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === activeSlide
                  ? 'w-6 bg-white shadow-xs'
                  : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}

      {/* 5. Main Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-14 sm:pb-18">
        
        {/* HERO HEADLINE & TAGLINE SECTION */}
        <div className="max-w-3xl space-y-3.5 text-left">
          
          {/* Eyebrow */}
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="w-6 h-0.5 bg-[#244B8F] rounded-full" />
            <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-blue-200">
              BENGALURU RESIDENTIAL RESALE
            </span>
          </div>

          {/* Core USP Headline: "Sell your flat in 45 days." */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              Sell your flat in 45 days.
            </h1>
          </div>

          {/* Credible, commercially grounded supporting copy */}
          <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] max-w-2xl">
            A structured resale process with Kaveri 2.0 deed benchmarking, legal title diligence, and pre-screened buyers across Bengaluru apartment corridors.
          </p>

          {/* Action CTAs */}
          <div className="pt-1.5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                trackEvent('HERO_CTA_PRIMARY_CLICK', { action: 'SELL_MY_FLAT' });
                onSellClick();
              }}
              className="px-6 py-3 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer inline-flex items-center space-x-2 group"
            >
              <span>Sell My Flat</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={onExploreClick}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium border border-white/20 backdrop-blur-xs transition-all cursor-pointer inline-flex items-center space-x-1.5"
            >
              <span>Browse Verified Flats</span>
            </button>
          </div>

          {/* Robust, Clean Rolling Locality Animation */}
          <div className="pt-2 flex items-center space-x-2 text-xs sm:text-sm text-slate-200">
            <div className="flex items-center space-x-1.5 font-medium text-slate-300 drop-shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Active buyer demand in:</span>
            </div>

            {/* Robust Vertical Capsule: Exact 28px height, overflow hidden, vertical clip */}
            <div className="relative inline-flex h-7 overflow-hidden rounded-md bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-xs px-2.5 items-center">
              <div 
                className="transition-transform duration-500 ease-out flex flex-col will-change-transform"
                style={{ transform: `translateY(-${activeLocalityIndex * 28}px)` }}
              >
                {LOCALITIES.map((loc, idx) => (
                  <div
                    key={`${loc}-${idx}`}
                    className="h-7 flex items-center text-white font-bold text-xs tracking-wide select-none whitespace-nowrap leading-none"
                  >
                    {loc}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 6. REDESIGNED PROPERTY POSTING CARD (99acres inspired marketplace design) */}
        <div className="mt-8 sm:mt-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-w-4xl">
            
            {/* Top Marketplace Tab Bar */}
            <div className="px-5 sm:px-6 pt-3.5 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-5 text-xs font-semibold">
                
                {/* Sell Flat Tab (Active) */}
                <button
                  type="button"
                  onClick={() => handleTabChange('SELL')}
                  className={`pb-2 relative font-bold transition-colors cursor-pointer ${
                    activeTab === 'SELL' ? 'text-[#244B8F]' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Sell Flat</span>
                  {activeTab === 'SELL' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#244B8F] rounded-full" />
                  )}
                </button>

                {/* Buy Resale Tab */}
                <button
                  type="button"
                  onClick={() => handleTabChange('BUY')}
                  className={`pb-2 relative transition-colors cursor-pointer ${
                    activeTab === 'BUY' ? 'text-[#244B8F] font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Buy Resale</span>
                  {activeTab === 'BUY' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#244B8F] rounded-full" />
                  )}
                </button>

                {/* Rent Tab */}
                <button
                  type="button"
                  onClick={() => handleTabChange('RENT')}
                  className={`pb-2 relative transition-colors cursor-pointer ${
                    activeTab === 'RENT' ? 'text-[#244B8F] font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>Rent</span>
                </button>

                {/* Vertical Divider */}
                <span className="h-3.5 w-px bg-slate-200 self-center hidden sm:block" />

                {/* Post Property FREE badge */}
                <div className="flex items-center space-x-1.5 hidden sm:flex">
                  <span className="text-slate-700 text-xs font-bold">Post Property</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-emerald-600 text-white rounded">
                    FREE
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-medium hidden md:block">
                Assisted Bengaluru Residential Resale
              </div>
            </div>

            {/* Input Row: Compact Marketplace Controls */}
            <div className="p-4 sm:p-5 space-y-3.5">
              <form onSubmit={handleSubmitSellerIntake} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
                
                {/* 1. BHK / Configuration Dropdown (3 cols) */}
                <div className="md:col-span-3 relative">
                  <div className="relative">
                    <select
                      value={bhk}
                      onChange={(e) => setBhk(e.target.value)}
                      className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] transition-all cursor-pointer appearance-none"
                    >
                      <option value="1 BHK">1 BHK Apartment</option>
                      <option value="2 BHK">2 BHK Apartment</option>
                      <option value="2.5 BHK">2.5 BHK Apartment</option>
                      <option value="3 BHK">3 BHK Apartment</option>
                      <option value="3.5 BHK">3.5 BHK Apartment</option>
                      <option value="4 BHK+">4 BHK+ Penthouse</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* 2. Society Autocomplete Search (6 cols) */}
                <div className="md:col-span-6 relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={societyQuery}
                      onChange={(e) => handleSocietyInput(e.target.value)}
                      placeholder='Search society (e.g. Prestige Shantiniketan, Sobha Dream Acres...)'
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] transition-all shadow-2xs"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-56 overflow-y-auto py-1">
                      {suggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSociety(item)}
                          className="px-3.5 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500">{item.locality} • {item.builder}</p>
                          </div>
                          <span className="text-[10px] text-[#244B8F] font-bold">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Primary Action Button (3 cols) */}
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 group"
                  >
                    <span>Get 45-Day Plan</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

              </form>

              {/* Bottom Quick Row: Popular Societies Pills */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-semibold text-[11px]">Popular Societies:</span>
                  {[
                    'Prestige Shantiniketan',
                    'Sobha Dream Acres',
                    'Brigade Gateway',
                    'Godrej Woodsman',
                  ].map((soc) => (
                    <button
                      key={soc}
                      type="button"
                      onClick={() => {
                        setSocietyQuery(soc);
                        setShowSuggestions(false);
                      }}
                      className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 hover:text-[#244B8F] rounded-md text-[11px] font-medium transition-colors cursor-pointer border border-slate-200/60"
                    >
                      {soc}
                    </button>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={onExploreClick}
                    className="inline-flex items-center text-[11px] font-bold text-[#244B8F] hover:underline cursor-pointer group"
                  >
                    <span>Looking to buy instead? Browse verified homes</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
