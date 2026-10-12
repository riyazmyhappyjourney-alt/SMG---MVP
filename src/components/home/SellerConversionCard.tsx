import React from 'react';
import { ArrowRight, PhoneCall, ShieldCheck, CheckCircle2, Lock, Building } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

interface SellerConversionCardProps {
  onStartSelling: () => void;
  onContactDesk: () => void;
}

export const SellerConversionCard: React.FC<SellerConversionCardProps> = ({
  onStartSelling,
  onContactDesk,
}) => {
  const handlePrimaryClick = () => {
    trackEvent('SELLER_CONVERSION_CARD_CLICK', { action: 'START_SELLING' });
    onStartSelling();
  };

  const handleSecondaryClick = () => {
    trackEvent('SELLER_CONVERSION_CARD_CLICK', { action: 'SPEAK_TO_TEAM' });
    onContactDesk();
  };

  return (
    <section className="py-14 sm:py-20 bg-[#F4F6F9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-r from-[#172033] via-[#1E2E4B] to-[#244B8F] rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
          
          {/* Subtle Ambient Background Accent */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none" />

          <div className="max-w-3xl relative z-10 space-y-6">
            
            {/* Eyebrow */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-white/10 text-xs font-bold uppercase tracking-wider text-amber-200 border border-white/15">
              <ShieldCheck className="w-4 h-4 text-[#B68A4A]" />
              <span>Transparent Bengaluru Residential Resale</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Your Bengaluru Flat Deserves a Clear Selling Plan.
            </h2>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-normal max-w-2xl">
              Avoid endless broker phone spam, speculative low-ball offers, and document confusion. SellMyGhar pairs dedicated homeowner representation with verified Kaveri 2.0 title diligence and qualified direct buyers across Bengaluru’s key apartment corridors.
            </p>

            {/* Core Trust Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-200">
              <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2.5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Upfront Listing Fee</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2.5 border border-white/10">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Confidential Phone Protection</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 rounded-lg p-2.5 border border-white/10">
                <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Screened Apartment Buyers</span>
              </div>
            </div>

            {/* Dual CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                type="button"
                onClick={handlePrimaryClick}
                className="relative px-7 py-4 rounded-xl bg-white hover:bg-slate-100 text-[#172033] font-extrabold text-sm shadow-lg transition-all cursor-pointer inline-flex items-center justify-center space-x-2 group"
              >
                <span className="absolute -top-2.5 -right-2 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white rounded-full shadow-xs">
                  FREE ONBOARDING
                </span>
                <span>Start Selling My Flat</span>
                <ArrowRight className="w-4 h-4 text-[#244B8F] group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={handleSecondaryClick}
                className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
              >
                <PhoneCall className="w-4 h-4 text-slate-300" />
                <span>Speak to Our Team</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              No long-term exclusivity lock-in. Real estate advisory governed by Karnataka RERA and DPDP Act compliance standards.
            </p>

          </div>

        </div>

      </div>
    </section>
  );
};
