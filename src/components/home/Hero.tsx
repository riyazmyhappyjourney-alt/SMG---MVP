import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  Star,
  BadgePercent
} from 'lucide-react';
import { HeroValuationForm } from './HeroValuationForm';

interface HeroProps {
  onSellClick?: () => void;
  onExploreClick?: () => void;
  onUnderstandProcessClick?: () => void;
}

interface HeroSlideItem {
  id?: string;
  url: string;
  alt: string;
}

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 'slide-township-sunset',
    url: '/images/luxury-apartment-township-sunset.webp',
    alt: 'Luxury Apartment Township at Sunset in Bengaluru',
  },
  {
    id: 'slide-clubhouse-amenities',
    url: '/images/brigade-granada-clubhouse.webp',
    alt: 'Premium Society Clubhouse and Township Amenities in Bengaluru',
  },
  {
    id: 'slide-night-community',
    url: '/images/bengaluru-night-apartments.webp',
    alt: 'Modern Residential Community in Bengaluru Tech Corridor',
  },
];

export const Hero: React.FC<HeroProps> = () => {
  const [slides, setSlides] = useState<HeroSlideItem[]>(DEFAULT_HERO_SLIDES);
  const [activeSlide, setActiveSlide] = useState(0);

  // Dynamic CMS Slides Fetching with sample-hero-banner filter
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

  // Gentle background slide cross-fade
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative bg-slate-900 overflow-hidden">
      
      {/* Background Photography Backdrop with Eager Preload */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, idx) => (
          <div
            key={slide.id || idx}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              activeSlide === idx ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.url}
              alt={slide.alt}
              className="w-full h-full object-cover object-center"
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'low'}
            />
          </div>
        ))}
        {/* Soft, professional gradient overlays for maximum text legibility and clean contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
      </div>

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Subhead & Value Pillars */}
          <div className="lg:col-span-7 text-white space-y-6 sm:space-y-8">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs font-extrabold uppercase tracking-widest text-sky-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Bengaluru Apartment Resale</span>
            </div>

            {/* Main Headline (User requested: "sell your Flat in 45 days in home Page") */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Sell Your Flat in <span className="text-[#38BDF8]">45 Days</span> with Complete Confidence
              </h1>
              <p className="text-sm sm:text-lg text-slate-200/90 leading-relaxed max-w-xl font-normal pt-2">
                Get the right price, verified buyers, and end-to-end legal diligence support for a smooth, hassle-free resale experience. Zero broker spam calls.
              </p>
            </div>

            {/* 3 Value Pillars (from Image 1 Wireframe) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
                  <BadgePercent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Accurate Market Valuation</h4>
                  <p className="text-[10px] text-slate-300">Registry benchmarked</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Verified Buyers</h4>
                  <p className="text-[10px] text-slate-300">Pre-screened & funded</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 flex items-center space-x-3 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">End-to-End Assistance</h4>
                  <p className="text-[10px] text-slate-300">Sub-Registrar closing</p>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column: Interactive 3-Step Valuation Card */}
          <div className="lg:col-span-5" id="hero-valuation-card">
            <HeroValuationForm />
          </div>

        </div>

      </div>

      {/* Trust Stats Banner (Directly below Hero - Matching Image 1 Reference) */}
      <div className="relative z-10 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* Stat 1 */}
            <div className="flex items-center space-x-4 pt-4 sm:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0073E6] flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">5,000+</div>
                <div className="text-xs text-slate-500 font-medium">Happy Sellers in Bengaluru</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center space-x-4 pt-4 sm:pt-0 lg:pl-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">200+</div>
                <div className="text-xs text-slate-500 font-medium">Apartment Communities</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center space-x-4 pt-4 sm:pt-0 lg:pl-8">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">4.8 / 5</div>
                <div className="text-xs text-slate-500 font-medium">Verified Customer Rating</div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center space-x-4 pt-4 sm:pt-0 lg:pl-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">100%</div>
                <div className="text-xs text-slate-500 font-medium">Transparent Resale Process</div>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
};
