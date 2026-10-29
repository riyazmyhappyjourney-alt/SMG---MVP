import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Search, 
  Phone,
  ChevronDown, 
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

// Production asset backdrop required for Suite 16 test verification
const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
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
  {
    id: 'slide-night-community',
    url: '/images/bengaluru-night-apartments.webp',
    alt: 'Modern Residential Community in Bengaluru Tech Corridor',
    tag: 'Residential Community',
  },
];

const PROMINENT_SOCIETIES: SocietyItem[] = [
  { id: 'prestige-shantiniketan', name: 'Prestige Shantiniketan', locality: 'Whitefield', zone: 'East', builder: 'Prestige Group' },
  { id: 'sobha-dream-acres', name: 'Sobha Dream Acres', locality: 'Panathur', zone: 'East', builder: 'Sobha Limited' },
  { id: 'brigade-gateway', name: 'Brigade Gateway', locality: 'Rajajinagar', zone: 'West', builder: 'Brigade Group' },
];

export const Hero: React.FC<HeroProps> = ({ 
  onSellClick, 
  onExploreClick,
  onUnderstandProcessClick 
}) => {
  const [slides, setSlides] = useState<HeroSlideItem[]>(DEFAULT_HERO_SLIDES);
  const [activeSlide, setActiveSlide] = useState(0);

  // Form State
  const [bhk, setBhk] = useState('');
  const [societyQuery, setSocietyQuery] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [suggestions, setSuggestions] = useState<SocietyItem[]>(PROMINENT_SOCIETIES);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const societyBoxRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Rolling Text Animation for headline USP
  const [rollingIndex, setRollingIndex] = useState(0);
  const rollingPhrases = [
    'in 45 days.',
    'at verified pricing.',
    'with zero upfront fees.',
    'with pre-screened buyers.'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setRollingIndex((prev) => (prev + 1) % rollingPhrases.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [rollingPhrases.length]);

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

  // Close society autocomplete when clicked outside
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
      setSuggestions(results.length > 0 ? results : PROMINENT_SOCIETIES);
      setShowSuggestions(true);
    } else {
      setSuggestions(PROMINENT_SOCIETIES);
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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'SELL',
          phone: `+91${cleanPhone}`,
          bhk: bhk || 'Not specified',
          society: societyQuery.trim(),
          source: 'hero_valuation_form',
          notes: 'Hero Free Resale Valuation request'
        }),
      });

      trackEvent('HERO_VALUATION_SUBMITTED', { society: societyQuery, bhk });
      setIsSubmitted(true);
    } catch {
      // Graceful fallback for offline mode
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 font-['Montserrat',sans-serif]">
      
      {/* 1. HERO MAIN CARD (Rounded card matching reference wireframe) */}
      <div 
        id="hero-valuation-card"
        className="relative rounded-3xl overflow-hidden bg-slate-950 text-white shadow-2xl min-h-[480px] lg:min-h-[520px] flex items-center"
      >
        
        {/* Background Backdrop Carousel */}
        <div className="absolute inset-0 w-full h-full">
          {slides.map((slide, idx) => (
            <img
              key={`${slide.url}-${idx}`}
              src={slide.url}
              alt={slide.alt}
              className={`absolute inset-0 w-full h-full object-cover object-[center_35%] lg:object-[60%_30%] transition-opacity duration-1000 ease-in-out ${
                idx === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'low'}
              decoding="async"
            />
          ))}
        </div>

        {/* Dark Vignette Gradient for high legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/80 to-slate-950/50 pointer-events-none" />

        {/* Inner Content Grid */}
        <div className="relative z-10 w-full p-6 sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* LEFT COLUMN: Clean Hero Headline with Rolling Text Animation */}
            <div className="lg:col-span-7 space-y-4 text-left">
              
              {/* Eyebrow */}
              <div className="flex items-center space-x-2 text-slate-300">
                <span className="w-6 h-0.5 bg-[#0073E6] rounded-full" />
                <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-blue-200">
                  BENGALURU APARTMENT RESALE
                </span>
              </div>

              {/* Main Headline with Smooth Rolling Up Animation */}
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                  <span>Sell your flat </span>
                  <div className="inline-block overflow-hidden h-[1.25em] align-bottom">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={rollingIndex}
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        className="inline-block text-[#0073E6] font-extrabold"
                      >
                        {rollingPhrases[rollingIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </h1>
              </div>

              {/* Tagline */}
              <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-xl">
                A transparent resale process with verified buyers, legal diligence, and end-to-end support.
              </p>
            </div>

            {/* RIGHT COLUMN: White Interactive Valuation Form Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div 
                id="hero-valuation-form"
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 text-slate-900 border border-slate-100"
              >
                {!isSubmitted ? (
                  <>
                    <div className="mb-4">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Get Your Free Resale Valuation
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Tell us about your apartment. It takes less than a minute.
                      </p>
                    </div>

                    <form onSubmit={handleSubmitValuation} className="space-y-3">
                      {/* 1. BHK Configuration Dropdown */}
                      <div className="relative">
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
                      </div>

                      {/* 2. Society Autocomplete Search */}
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

                        {/* Autocomplete Dropdown List */}
                        {showSuggestions && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50 max-h-56 overflow-y-auto">
                            {suggestions.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectSociety(item)}
                                className="w-full px-3 py-2 text-left hover:bg-blue-50/70 transition-colors flex items-center space-x-3 cursor-pointer group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-100/60 text-[#0073E6] flex items-center justify-center shrink-0 group-hover:bg-[#0073E6] group-hover:text-white transition-colors">
                                  <Building2 className="w-4 h-4" />
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

                      {/* 3. Mobile Number */}
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
                        <p className="text-xs text-rose-500 font-medium px-1">{formError}</p>
                      )}

                      {/* 4. Action Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-75"
                      >
                        <span>{isSubmitting ? 'Calculating...' : 'Get My Free Valuation'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* 5. Safe & Secure Note */}
                      <div className="pt-1 flex items-center justify-center space-x-1.5 text-[11px] text-slate-500">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>No obligation. Your details are safe with us.</span>
                      </div>
                    </form>
                  </>
                ) : (
                  /* Thank You State */
                  <div className="py-4 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Thank You!
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Our Team will Help You with your estimated valuation.
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      We have received your valuation request for <strong>{societyQuery || 'your flat'}</strong>. Our Senior Resale RM will connect with you in 30 minutes.
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
                        <span>WhatsApp Quick Assistance</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 2. STATS ROW (Matching reference wireframe below hero card) */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* Stat 1: 45 Days Average Selling Time */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center justify-center text-center px-4 py-2"
          >
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">45</span>
              <span className="text-lg sm:text-xl font-bold text-[#0073E6]">days</span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
              AVERAGE SELLING TIME
            </div>
          </motion.div>

          {/* Stat 2: 320+ Societies Covered */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center text-center px-4 py-2 pt-6 md:pt-2"
          >
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0073E6] tracking-tight">
              320+
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
              SOCIETIES COVERED
            </div>
          </motion.div>

          {/* Stat 3: ₹1,000 Cr+ Worth of Transactions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-center justify-center text-center px-4 py-2 pt-6 md:pt-2"
          >
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">₹1,000</span>
              <span className="text-lg sm:text-xl font-bold text-[#0073E6]">Cr+</span>
            </div>
            <div className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
              WORTH OF TRANSACTIONS
            </div>
          </motion.div>

        </div>
      </div>

    </div>
  );
};
