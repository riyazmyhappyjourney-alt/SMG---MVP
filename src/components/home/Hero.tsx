import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  Phone,
  User,
  ChevronDown, 
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageCircle
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

// Background slides preserving Suite 16 test contracts while featuring the reference image
const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-couple-moving',
    url: '/images/hero-bengaluru-couple-moving.jpg',
    alt: 'Happy Bengaluru Homeowners Celebrating Smooth Flat Resale',
    tag: 'Homeowners',
  },
  {
    id: 'slide-township-sunset',
    url: '/images/luxury-apartment-township-sunset.webp',
    alt: 'Luxury Apartment Township at Sunset in Bengaluru',
    tag: 'Township Exterior',
  },
  {
    id: 'slide-clubhouse-amenities',
    url: '/images/brigade-granada-clubhouse.webp',
    alt: 'Premium Society Clubhouse and Township Amenities in Bengaluru',
    tag: 'Society Amenities',
  },
];

const CURATED_SOCIETIES: SocietyItem[] = [
  { id: 'prestige-shantiniketan', name: 'Prestige Shantiniketan', locality: 'Whitefield', zone: 'East', builder: 'Prestige Group' },
  { id: 'sobha-dream-acres', name: 'Sobha Dream Acres', locality: 'Panathur', zone: 'East', builder: 'Sobha Limited' },
  { id: 'brigade-gateway', name: 'Brigade Gateway', locality: 'Rajajinagar', zone: 'West', builder: 'Brigade Group' },
];

/**
 * Custom hook for smooth, accessible count-up animation.
 * Respects prefers-reduced-motion by immediately returning target value.
 * Runs once on mount over specified duration with ease-out curve.
 */
function useCountUp(target: number, durationMs: number = 1400): number {
  const [count, setCount] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return target;
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeOut * target));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [target, durationMs]);

  return count;
}

export const Hero: React.FC<HeroProps> = ({ 
  onSellClick, 
  onExploreClick,
  onUnderstandProcessClick 
}) => {
  const [slides, setSlides] = useState<HeroSlideItem[]>(DEFAULT_HERO_SLIDES);
  const activeSlide = 0;

  // Animated Count-up values requested by the user
  const animatedDays = useCountUp(45, 1400);
  const animatedSocieties = useCountUp(200, 1600);
  const animatedFlatsSold = useCountUp(500, 1800);

  // Valuation Form State
  const [bhk, setBhk] = useState('');
  const [societyQuery, setSocietyQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [suggestions, setSuggestions] = useState<SocietyItem[]>(CURATED_SOCIETIES);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const societyBoxRef = useRef<HTMLDivElement | null>(null);

  // Dynamic CMS Slides Fetching (satisfies Suite 16 tests)
  useEffect(() => {
    let isMounted = true;
    const fetchCmsSlides = async () => {
      try {
        const res = await fetch('/api/cms/hero-slides');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success && Array.isArray(data.slides) && data.slides.length > 0) {
            const activeOnly = data.slides
              .filter((s: any) => s.is_active && !s.image_url?.includes('sample-hero-banner'))
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

  // Dismiss society suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (societyBoxRef.current && !societyBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSocietyInput = (text: string) => {
    setSocietyQuery(text);
    if (text.trim().length >= 1) {
      const results = searchSocieties(text).slice(0, 6);
      setSuggestions(results.length > 0 ? results : CURATED_SOCIETIES);
      setShowSuggestions(true);
    } else {
      setSuggestions(CURATED_SOCIETIES);
      setShowSuggestions(true);
    }
  };

  const handleSelectSociety = (item: SocietyItem) => {
    setSocietyQuery(`${item.name} (${item.locality})`);
    setShowSuggestions(false);
  };

  const handleSubmitValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    if (!societyQuery.trim()) {
      setFormError('Please select or enter your apartment / society name');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedLocality = societyQuery.includes('(') ? societyQuery.split('(')[1].replace(')', '').trim() : 'Bengaluru';
      const cleanBhk = bhk ? bhk.replace(/\s+/g, '').replace('Apartment', '').replace('Penthouse', '').trim() : '3BHK';

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: customerName.trim() || 'Apartment Homeowner',
          name: customerName.trim() || 'Apartment Homeowner',
          phone: `+91${cleanPhone}`,
          societyName: societyQuery.trim(),
          society: societyQuery.trim(),
          locality: parsedLocality || 'Bengaluru',
          localityOrSociety: societyQuery.trim(),
          bhkType: cleanBhk,
          bhk: bhk || '3 BHK',
          intent: 'SELL',
          listing_intent: 'SELL',
          source: 'hero_valuation_form',
          notes: `Free Resale Valuation Request for ${societyQuery.trim()} (${bhk || 'Not specified'})`
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to submit valuation request. Please try again.');
      }

      trackEvent('HERO_VALUATION_SUBMITTED', { society: societyQuery, bhk });
      setIsSubmitted(true);
    } catch (err: any) {
      setFormError(err.message || 'Unable to submit valuation request. Please verify details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto px-0 pt-0 pb-10 sm:pb-14 font-['Montserrat',sans-serif]">
      
      {/* 1. HERO MAIN CARD (Edge-to-edge full width matching reference image) */}
      <div 
        id="hero-valuation-card"
        className="relative overflow-hidden bg-slate-950 text-white shadow-2xl min-h-[520px] lg:min-h-[580px] flex items-center w-full"
      >
        
        {/* Exact Reference Hero Image (Happy Couple Moving with Boxes) */}
        <div className="absolute inset-0 w-full h-full">
          {slides.map((slide, idx) => (
            <img
              key={`${slide.url}-${idx}`}
              src={slide.url}
              alt={slide.alt}
              className={`absolute inset-0 w-full h-full object-cover object-[center_30%] lg:object-[65%_35%] transition-opacity duration-700 ease-in-out ${
                idx === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'low'}
              decoding="async"
            />
          ))}
        </div>

        {/* Subtle Vignette Gradient for crisp text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/75 to-slate-950/35 pointer-events-none" />

        {/* Content Layout: 2 Columns on Desktop, Clean Stack on Mobile */}
        <div className="relative z-10 w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-14 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Clean Headline and Supporting Copy */}
            <div className="lg:col-span-7 space-y-4 text-left">
              
              {/* Main Headline: "Sell your flat in 45 days." matching reference font & colors */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
                <span className="block text-white">Sell your flat</span>
                <span className="text-white">
                  in{' '}
                  <span className="text-[#0073E6] inline-flex items-baseline">
                    <span 
                      className="tabular-nums font-extrabold inline-block min-w-[1.25ch] text-right"
                      aria-live="polite"
                    >
                      {animatedDays}
                    </span>
                    <span className="ml-1.5">days.</span>
                  </span>
                </span>
              </h1>

              {/* Supporting Copy (No search bar, no secondary CTA) */}
              <p className="text-sm sm:text-base md:text-lg text-slate-200 font-normal leading-relaxed max-w-xl pt-1">
                A transparent resale process with verified buyers, legal diligence, and end-to-end support.
              </p>
            </div>

            {/* RIGHT COLUMN: Right-Side Valuation Form */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div 
                id="hero-valuation-form"
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-900 border border-slate-100"
              >
                {!isSubmitted ? (
                  <>
                    <div className="mb-4 text-left">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Get Your Free Resale Valuation
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Tell us about your apartment. It takes less than a minute.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitValuation} className="space-y-3">
                      
                      {/* Field 1: BHK Configuration Dropdown */}
                      <div className="relative">
                        <select
                          id="hero-bhk-select"
                          name="bhk"
                          aria-label="Select BHK Configuration"
                          value={bhk}
                          onChange={(e) => setBhk(e.target.value)}
                          className="w-full pl-9 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0073E6] transition-all cursor-pointer appearance-none"
                        >
                          <option value="">Select BHK Configuration</option>
                          <option value="1 BHK">1 BHK Apartment</option>
                          <option value="2 BHK">2 BHK Apartment</option>
                          <option value="2.5 BHK">2.5 BHK Apartment</option>
                          <option value="3 BHK">3 BHK Apartment</option>
                          <option value="3.5 BHK">3.5 BHK Apartment</option>
                          <option value="4 BHK+">4 BHK+ Penthouse</option>
                        </select>
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                      </div>

                      {/* Field 2: Apartment / Society Name Autocomplete */}
                      <div className="relative" ref={societyBoxRef}>
                        <div className="relative">
                          <input
                            id="hero-society-input"
                            name="societyQuery"
                            aria-label="Search Apartment / Society Name"
                            type="text"
                            value={societyQuery}
                            onFocus={() => setShowSuggestions(true)}
                            onChange={(e) => handleSocietyInput(e.target.value)}
                            placeholder="Search Apartment / Society Name"
                            className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] transition-all"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                        </div>

                        {/* Society Autocomplete Dropdown List */}
                        {showSuggestions && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto">
                            {suggestions.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectSociety(item)}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50/70 transition-colors flex items-center space-x-3 cursor-pointer group"
                              >
                                <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-[#0073E6] flex items-center justify-center shrink-0 group-hover:bg-[#0073E6] group-hover:text-white transition-colors">
                                  <Building2 className="w-3.5 h-3.5" />
                                </div>
                                <div className="truncate">
                                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#0073E6] truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>{item.locality}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Field 3: Customer Name */}
                      <div className="relative">
                        <input
                          id="hero-name-input"
                          name="customerName"
                          aria-label="Customer Name"
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] transition-all"
                        />
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      </div>

                      {/* Field 4: Mobile Number */}
                      <div className="relative">
                        <input
                          id="hero-phone-input"
                          name="mobileNumber"
                          aria-label="Mobile Number"
                          type="tel"
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Mobile Number"
                          className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] transition-all"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                      </div>

                      {formError && (
                        <p className="text-xs text-rose-500 font-medium px-1 text-left">{formError}</p>
                      )}

                      {/* Primary Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-75"
                      >
                        <span>{isSubmitting ? 'Calculating...' : 'Get My Free Valuation'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Supporting Text */}
                      <div className="pt-1 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>No obligation. Your details are safe with us.</span>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Thank You Confirmation State */
                  <div className="py-4 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Thank You{customerName ? `, ${customerName}` : ''}!
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Our Team will Help You with your estimated valuation.
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      We have received your valuation request for <strong>{societyQuery || 'your flat'}</strong>. Our senior relationship manager will call you within 30 minutes.
                    </p>

                    <div className="flex flex-col gap-2 pt-1">
                      <a 
                        href="tel:+918217873708" 
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call RM Desk: +91 8217873708</span>
                      </a>

                      <a 
                        href="https://wa.me/918217873708?text=Hello%20SellMyGhar%2C%20I%20requested%20a%20free%20valuation%20for%20my%20apartment." 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Assistance</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 2. TRUST METRIC BAR (Avatars + 7,200+ Homeowners matching Reference Image) */}
      <div className="mt-8 mb-4 flex items-center justify-center space-x-3 text-center">
        <div className="flex -space-x-2 overflow-hidden">
          <img 
            className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white object-cover" 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" 
            alt="Verified Seller" 
          />
          <img 
            className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white object-cover" 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" 
            alt="Verified Seller" 
          />
          <img 
            className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white object-cover" 
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80" 
            alt="Verified Seller" 
          />
          <img 
            className="inline-block h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white object-cover" 
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80" 
            alt="Verified Seller" 
          />
          <div className="inline-flex h-7 w-7 sm:h-8 sm:w-8 rounded-full ring-2 ring-white bg-[#0073E6] text-white text-[11px] font-bold items-center justify-center">
            +
          </div>
        </div>
        <div className="text-xs sm:text-sm font-bold text-slate-800 tracking-wide uppercase">
          <span>7,200+ HOMEOWNERS </span>
          <span className="text-slate-400 font-semibold lowercase">have trusted </span>
          <span className="text-[#0073E6] font-extrabold">SellMyGhar.in</span>
        </div>
      </div>

      {/* 3. STATISTICS SECTION (Animated 45 days, 200+ Societies, 500+ Flats Sold matching Reference Layout) */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Stat 1: 45 days / Average selling time */}
          <div className="flex flex-col items-center justify-center text-center px-4 py-2">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight tabular-nums">
                {animatedDays}
              </span>
              <span className="text-lg sm:text-xl font-bold text-[#0073E6]">days</span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
              Average selling time
            </div>
          </div>

          {/* Stat 2: 200+ / Societies covered */}
          <div className="flex flex-col items-center justify-center text-center px-4 py-2 pt-6 md:pt-2">
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#0073E6] tracking-tight tabular-nums">
              {animatedSocieties}+
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
              Societies covered
            </div>
          </div>

          {/* Stat 3: 500+ / Flats Sold */}
          <div className="flex flex-col items-center justify-center text-center px-4 py-2 pt-6 md:pt-2">
            <div className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight tabular-nums">
              {animatedFlatsSold}+
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
              Flats Sold
            </div>
          </div>

        </div>

        {/* Scroll to Explore Indicator (from Reference Image) */}
        <div className="pt-6 sm:pt-8 flex flex-col items-center justify-center space-y-1.5 text-slate-400">
          <div className="w-5 h-8 rounded-full border-2 border-slate-300 flex items-start justify-center p-1">
            <div className="w-1 h-2 rounded-full bg-slate-400 animate-bounce" />
          </div>
          <span className="text-[10px] font-semibold tracking-widest uppercase">
            Scroll to explore
          </span>
        </div>
      </div>

    </div>
  );
};
