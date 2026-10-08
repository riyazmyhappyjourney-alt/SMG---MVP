import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Building2, 
  MapPin
} from 'lucide-react';
import { searchSocieties, SocietyItem } from '../../data/bengaluruData';

interface HeroProps {
  onSellClick: () => void;
  onExploreClick: () => void;
}

// Curated sliding carousel of flat interiors and building exteriors
const HERO_SLIDES = [
  {
    url: '/images/luxury-apartment-township-sunset.webp',
    alt: 'Luxury Apartment Township at Sunset in Bengaluru',
    tag: 'Township Exterior',
  },
  {
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
    alt: 'Modern Spacious Living Room Flat Interior',
    tag: 'Flat Interior',
  },
  {
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80',
    alt: 'High-Rise Balcony with Panoramic Bengaluru Views',
    tag: 'Balcony & Views',
  },
  {
    url: '/images/brigade-granada-clubhouse.webp',
    alt: 'Premium Society Clubhouse and Pool Amenities',
    tag: 'Society Amenities',
  },
  {
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80',
    alt: 'Contemporary Apartment Dining and Lounge Space',
    tag: 'Premium Living',
  },
];

// 7 Key Bengaluru residential resale micro-markets
const LOCALITIES = [
  'Whitefield',
  'HSR Layout',
  'Sarjapur Road',
  'Bellandur',
  'Hebbal',
  'JP Nagar',
  'Indiranagar',
];

// Duplicated sequence so sequence A connects seamlessly to sequence B (50% / -252px reset)
const DUPLICATED_LOCALITIES = [...LOCALITIES, ...LOCALITIES];

export const Hero: React.FC<HeroProps> = ({ onSellClick, onExploreClick }) => {
  // Sliding Carousel State: Auto-advances every 4.5 seconds with smooth crossfade
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Seller Intake Form State
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
    onSellClick();
  };

  return (
    <div className="relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] bg-slate-950">
      
      {/* Sliding/Auto-Rotating Image Carousel: Flat Interiors, Balconies, Society Amenities & Exteriors */}
      <div className="absolute inset-0 w-full h-full">
        {HERO_SLIDES.map((slide, idx) => (
          <img
            key={slide.url}
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

      {/* Lightened Semi-Transparent Overlay: Building & interiors read clearly while headline stays crisp */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/20 to-slate-950/35 pointer-events-none" />

      {/* Carousel Slide Indicators */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
        <span className="text-[10px] font-semibold text-slate-200 mr-1 hidden sm:inline">
          {HERO_SLIDES[activeSlide].tag}
        </span>
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              i === activeSlide ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      {/* Main Content Wrapper: Contains Hero Headline & Intake Form over the continuous backdrop */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16">
        
        {/* 1. HERO HEADLINE & LIVE CORRIDOR ROLLING TICKER */}
        <div className="max-w-3xl space-y-4 text-left">
          
          {/* Minimal Brand Line Kicker */}
          <div className="flex items-center space-x-2.5 text-slate-300">
            <span className="w-8 h-0.5 bg-[#244B8F] rounded-full" />
            <span className="text-[11px] sm:text-xs font-extrabold tracking-widest uppercase text-slate-200 drop-shadow-sm">
              BENGALURU'S DEDICATED APARTMENT RESALE PLATFORM
            </span>
          </div>

          {/* Main Headline: Clean text directly over image without background box */}
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              Sell Your House in 45 Days
              <sup className="text-xs sm:text-sm font-normal text-slate-300/80 align-super ml-1 select-none">
                **
              </sup>
            </h1>
            <p className="text-[11px] text-slate-300 font-medium tracking-wide mt-1.5 drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
              **Timeline depends on property, pricing, and market conditions
            </p>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] max-w-2xl">
            Direct connection with 340+ verified tech corridor buyers. Zero broker spam, 100% legal title diligence.
          </p>

          {/* Continuous Up-rolling Locality Animation */}
          <div className="pt-1 flex flex-wrap items-center gap-2.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
            <div className="flex items-center space-x-1.5 text-slate-200 font-semibold drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)]">
              <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Active buyers & advisory in:</span>
            </div>

            {/* Exact-Height Viewport Capsule */}
            <div className="relative inline-block h-9 overflow-hidden rounded-xl bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-sm align-middle px-3.5">
              <div className="animate-vertical-locality-roll">
                {DUPLICATED_LOCALITIES.map((loc, idx) => (
                  <div
                    key={`${loc}-${idx}`}
                    className="h-9 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm tracking-wide select-none whitespace-nowrap"
                  >
                    {loc}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 2. FLOATING SELLER INTAKE CARD (Surrounded by the continuous sunset background) */}
        <div className="mt-8 sm:mt-10">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden">
            
            {/* Card Top Header: 100% Focused on Attracting Sellers to List Property */}
            <div className="bg-slate-50 px-4 sm:px-8 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#244B8F]" />
                <span className="text-xs sm:text-sm font-extrabold text-[#172033] tracking-tight">
                  Homeowner Intake & Resale Matching
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-600 text-white rounded-md">
                  100% FREE
                </span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Zero Broker Spam • Verified Direct Buyers • RERA Compliant
              </p>
            </div>

            {/* Main Intake Form for Sellers */}
            <div className="p-4 sm:p-7 space-y-4">
              <form onSubmit={handleSubmitSellerIntake} className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
                
                {/* 1. Society Autocomplete Search (Spacious 7 cols) */}
                <div className="md:col-span-7 relative">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Enter Your Society or Apartment Name in Bengaluru
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={societyQuery}
                      onChange={(e) => handleSocietyInput(e.target.value)}
                      placeholder="e.g. Prestige Shantiniketan, Sobha Dream Acres, Brigade Gateway..."
                      className="w-full pl-3.5 pr-8 py-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] transition-all shadow-2xs"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-4 pointer-events-none" />
                  </div>

                  {/* Autocomplete Dropdown List */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-56 overflow-y-auto py-1">
                      {suggestions.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectSociety(item)}
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-[11px] text-slate-500">{item.locality} • {item.builder}</p>
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold">Select</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. BHK Configuration (2 cols) - Updated with 2 BHK, 2.5 BHK, 3 BHK, 3.5 BHK */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    BHK Config
                  </label>
                  <select
                    value={bhk}
                    onChange={(e) => setBhk(e.target.value)}
                    className="w-full px-3 py-3.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] shadow-2xs cursor-pointer"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="2.5 BHK">2.5 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="3.5 BHK">3.5 BHK</option>
                    <option value="4 BHK+">4 BHK+</option>
                  </select>
                </div>

                {/* 3. Action Button for Sellers (3 cols) */}
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 bg-[#244B8F] hover:bg-[#1B3A70] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 group"
                  >
                    <span>Post Flat & Get Buyers</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </form>

              {/* Bottom Row: Popular Communities & Buyer Link */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 text-xs text-slate-600">
                
                {/* Popular Societies Looking for Sellers */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400 font-bold text-[11px]">High Buyer Demand:</span>
                  {[
                    'Prestige Shantiniketan',
                    'Sobha Dream Acres',
                    'Brigade Gateway',
                    'Salarpuria Greenage',
                  ].map((soc) => (
                    <button
                      key={soc}
                      type="button"
                      onClick={() => {
                        setSocietyQuery(soc);
                        setShowSuggestions(false);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#244B8F] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200/60"
                    >
                      {soc}
                    </button>
                  ))}
                </div>

                {/* Looking to buy link */}
                <div className="pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={onExploreClick}
                    className="inline-flex items-center text-xs font-bold text-[#244B8F] hover:underline cursor-pointer group"
                  >
                    <span>Looking to buy instead? Browse verified homes</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
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
