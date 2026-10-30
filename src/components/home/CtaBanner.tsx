import React from 'react';
import { ArrowRight, Lock } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

export const CtaBanner: React.FC = () => {
  const scrollToForm = () => {
    trackEvent('CTA_BANNER_CLICK', { source: 'panoramic_cta_banner' });
    const el = document.getElementById('hero-valuation-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 text-white min-h-[160px] sm:min-h-[190px] flex items-center shadow-2xl border border-slate-800">
          
          {/* Panoramic Skyline Backdrop matching reference image */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/images/luxury-apartment-township-sunset.webp"
              alt="Bengaluru Skyline at Sunset"
              className="w-full h-full object-cover object-[center_60%] opacity-40"
              loading="lazy"
              decoding="async"
            />
            {/* Vignette gradient overlay for high contrast text */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/70" />
          </div>

          {/* Banner Content Layout */}
          <div className="relative z-10 w-full px-6 py-6 sm:px-10 sm:py-8 lg:px-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left Content */}
            <div className="space-y-1.5 max-w-2xl text-left">
              <div className="flex items-center space-x-2 text-[#0073E6] font-extrabold text-[11px] sm:text-xs tracking-wider uppercase">
                <span className="w-4 h-0.5 bg-[#0073E6]"></span>
                <span>READY TO SELL?</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Get Your Free Resale Valuation Today
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-300 font-normal leading-relaxed">
                Take the first step towards a faster, safer and more profitable sale.
              </p>
            </div>

            {/* Right Action Button & Security Badge */}
            <div className="flex flex-col sm:items-start lg:items-end shrink-0 space-y-2">
              <button
                type="button"
                onClick={scrollToForm}
                className="py-3 px-6 sm:py-3.5 sm:px-7 bg-[#0073E6] hover:bg-[#005BB5] active:bg-[#004c99] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xl shadow-blue-500/25 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <span>Get My Free Valuation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center space-x-1.5 text-[11px] text-slate-300 font-medium">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>No obligation. Bengaluru resale specialists.</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
