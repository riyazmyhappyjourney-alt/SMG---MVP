import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

interface HowItWorksProps {
  onPostProperty: () => void;
  className?: string;
  isMobileOnly?: boolean;
}

/**
 * 2D Flat Vector Illustration for Step 1: Share Your Property Details
 * Modern high-rise apartment building with floating property details sheet and pin.
 */
const Step1Illustration: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-40 object-contain transition-transform duration-300 group-hover:scale-105"
    aria-label="Share property details illustration"
  >
    {/* Ground Baseline */}
    <path d="M15 160H305" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Bushes */}
    <ellipse cx="50" cy="156" rx="14" ry="9" fill="#059669" />
    <ellipse cx="66" cy="154" rx="16" ry="10" fill="#10B981" />
    <ellipse cx="160" cy="156" rx="16" ry="10" fill="#059669" />

    {/* Building Body */}
    <rect x="60" y="30" width="95" height="128" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    <rect x="58" y="26" width="99" height="6" rx="2" fill="#244B8F" />
    <rect x="60" y="32" width="28" height="126" fill="#F1F5F9" />

    {/* Window Grid */}
    {[42, 68, 94, 120].map((y) => (
      <g key={y}>
        <rect x="66" y={y} width="16" height="18" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
        <rect x="96" y={y} width="22" height="18" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
        <rect x="124" y={y} width="22" height="18" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
      </g>
    ))}

    {/* Location Pin */}
    <g transform="translate(165, 24)">
      <path d="M14 0C6.27 0 0 6.27 0 14C0 23.5 14 36 14 36C14 36 28 23.5 28 14C28 6.27 21.73 0 14 0Z" fill="#0073E6" />
      <circle cx="14" cy="13" r="5" fill="#FFFFFF" />
    </g>

    {/* Floating Property Spec Sheet */}
    <g transform="translate(175, 72)">
      <rect x="2" y="3" width="80" height="78" rx="6" fill="#CBD5E1" opacity="0.4" />
      <rect x="0" y="0" width="80" height="78" rx="6" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
      <rect x="12" y="12" width="20" height="18" rx="3" fill="#EFF6FF" stroke="#0073E6" strokeWidth="1.5" />
      <path d="M22 15L16 20V27H28V20L22 15Z" fill="#0073E6" />
      <rect x="12" y="36" width="56" height="4" rx="2" fill="#64748B" />
      <rect x="12" y="44" width="42" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="12" y="52" width="48" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="12" y="60" width="34" height="3" rx="1.5" fill="#CBD5E1" />
    </g>
  </svg>
);

/**
 * 2D Flat Vector Illustration for Step 2: Get Resale Valuation
 * Bengaluru high-rise towers with registry benchmark price chart curve and valuation badge.
 */
const Step2Illustration: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-40 object-contain transition-transform duration-300 group-hover:scale-105"
    aria-label="Get resale valuation illustration"
  >
    <path d="M15 160H305" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Skyline Background Towers */}
    <rect x="40" y="50" width="55" height="108" rx="3" fill="#E2E8F0" />
    <rect x="105" y="32" width="65" height="126" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    <rect x="103" y="28" width="69" height="5" rx="2" fill="#244B8F" />

    {/* Tower Windows */}
    {[42, 66, 90, 114, 138].map((y) => (
      <g key={y}>
        <rect x="115" y={y} width="18" height="14" rx="1.5" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
        <rect x="141" y={y} width="18" height="14" rx="1.5" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
      </g>
    ))}

    {/* Upward Valuation Graph Card */}
    <g transform="translate(180, 45)">
      <rect x="2" y="3" width="95" height="100" rx="8" fill="#CBD5E1" opacity="0.35" />
      <rect x="0" y="0" width="95" height="100" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />

      {/* Grid lines */}
      <line x1="12" y1="25" x2="84" y2="25" stroke="#F1F5F9" strokeWidth="1" />
      <line x1="12" y1="48" x2="84" y2="48" stroke="#F1F5F9" strokeWidth="1" />
      <line x1="12" y1="70" x2="84" y2="70" stroke="#F1F5F9" strokeWidth="1" />

      {/* Upward Curve (Registry trend) */}
      <path
        d="M16 75C32 68 45 52 60 42C72 34 80 20 84 18"
        stroke="#0073E6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Target Data Point */}
      <circle cx="84" cy="18" r="4.5" fill="#F97316" stroke="#FFFFFF" strokeWidth="2" />

      {/* Valuation Pill */}
      <rect x="12" y="80" width="72" height="14" rx="4" fill="#EFF6FF" stroke="#0073E6" strokeWidth="1" />
      <text x="48" y="90" textAnchor="middle" fill="#0073E6" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
        ₹ MARKET FAIR
      </text>
    </g>
  </svg>
);

/**
 * 2D Flat Vector Illustration for Step 3: Connect with Verified Buyers
 * Residential towers with verified buyer badge and shielded verification seal.
 */
const Step3Illustration: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-40 object-contain transition-transform duration-300 group-hover:scale-105"
    aria-label="Connect with verified buyers illustration"
  >
    <path d="M15 160H305" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Residential Community Towers */}
    <rect x="45" y="44" width="70" height="114" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    <rect x="43" y="40" width="74" height="5" rx="2" fill="#244B8F" />

    {[54, 78, 102, 126].map((y) => (
      <g key={y}>
        <rect x="54" y={y} width="14" height="14" rx="1.5" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
        <rect x="74" y={y} width="14" height="14" rx="1.5" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
        <rect x="94" y={y} width="14" height="14" rx="1.5" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1" />
      </g>
    ))}

    {/* Connecting Bridge / Beam */}
    <path d="M120 95H170" stroke="#0073E6" strokeWidth="2" strokeDasharray="3 3" />

    {/* Verified Buyer Card */}
    <g transform="translate(175, 40)">
      <rect x="2" y="3" width="105" height="106" rx="8" fill="#CBD5E1" opacity="0.35" />
      <rect x="0" y="0" width="105" height="106" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />

      {/* Buyer Avatar Circle */}
      <circle cx="52" cy="34" r="18" fill="#EFF6FF" stroke="#0073E6" strokeWidth="1.5" />
      <path d="M52 24C48 24 45 27 45 31C45 35 48 38 52 38C56 38 59 35 59 31C59 27 56 24 52 24Z" fill="#0073E6" />
      <path d="M38 48C38 43 44 41 52 41C60 41 66 43 66 48V50H38V48Z" fill="#0073E6" />

      {/* Verified Shield Badge */}
      <g transform="translate(58, 38)">
        <circle cx="8" cy="8" r="8" fill="#059669" />
        <path d="M5 8L7.5 10.5L11.5 5.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <rect x="18" y="66" width="70" height="4" rx="2" fill="#64748B" />
      <rect x="24" y="74" width="56" height="3" rx="1.5" fill="#94A3B8" />

      {/* Tag */}
      <rect x="16" y="84" width="74" height="13" rx="3" fill="#ECFDF5" stroke="#059669" strokeWidth="1" />
      <text x="53" y="93" textAnchor="middle" fill="#059669" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
        PRE-FUNDED BUYER
      </text>
    </g>
  </svg>
);

/**
 * 2D Flat Vector Illustration for Step 4: Complete the Sale
 * Legal deed agreement, sub-registrar closing, keys and final milestone checkmark.
 */
const Step4Illustration: React.FC = () => (
  <svg
    viewBox="0 0 320 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-40 object-contain transition-transform duration-300 group-hover:scale-105"
    aria-label="Complete the sale illustration"
  >
    <path d="M15 160H305" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Sub-Registrar Sale Deed */}
    <g transform="translate(65, 30)">
      <rect x="2" y="3" width="95" height="120" rx="6" fill="#CBD5E1" opacity="0.35" />
      <rect x="0" y="0" width="95" height="120" rx="6" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />

      <rect x="12" y="14" width="45" height="5" rx="2" fill="#0073E6" />
      <rect x="12" y="25" width="70" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="12" y="33" width="65" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="12" y="41" width="68" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="12" y="49" width="55" height="3" rx="1.5" fill="#CBD5E1" />

      {/* Official Sub-Registrar Stamp / Seal */}
      <circle cx="32" cy="78" r="14" fill="#EFF6FF" stroke="#0073E6" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="32" cy="78" r="10" stroke="#0073E6" strokeWidth="1" />
      <text x="32" y="81" textAnchor="middle" fill="#0073E6" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
        VERIFIED
      </text>

      {/* Signature */}
      <path d="M54 84C58 80 60 85 64 81C68 78 72 83 78 80" stroke="#0073E6" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="88" x2="82" y2="88" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
    </g>

    {/* Apartment Keychain & Keys */}
    <g transform="translate(180, 50)">
      {/* Key Ring */}
      <circle cx="36" cy="36" r="13" stroke="#94A3B8" strokeWidth="2.5" fill="none" />

      {/* House-Shaped Keychain Pendant */}
      <g transform="translate(32, 34)">
        <path d="M14 4L28 15V34H0V15L14 4Z" fill="#0073E6" stroke="#244B8F" strokeWidth="1.5" />
        <circle cx="14" cy="9" r="2.5" fill="#FFFFFF" />
        <rect x="10" y="18" width="8" height="8" rx="1.5" fill="#FFFFFF" />
      </g>

      {/* Metallic Key */}
      <g transform="translate(26, 44) rotate(-35)">
        <circle cx="8" cy="8" r="7" stroke="#94A3B8" strokeWidth="2" fill="#F1F5F9" />
        <rect x="15" y="6" width="30" height="4" rx="1" fill="#94A3B8" />
        <rect x="33" y="10" width="3.5" height="5" rx="0.5" fill="#94A3B8" />
        <rect x="40" y="10" width="3.5" height="3" rx="0.5" fill="#94A3B8" />
      </g>

      {/* Milestone Complete Badge */}
      <g transform="translate(28, 92)">
        <rect x="0" y="0" width="64" height="18" rx="9" fill="#059669" />
        <circle cx="10" cy="9" r="6" fill="#FFFFFF" />
        <path d="M7 9L9 11L13 7" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="36" y="12" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
          SOLD 100%
        </text>
      </g>
    </g>
  </svg>
);

export const HowItWorks: React.FC<HowItWorksProps> = ({
  onPostProperty,
  className = '',
  isMobileOnly = false,
}) => {
  const steps = [
    {
      stepNumber: '01',
      timeline: 'Takes 60 seconds',
      title: 'Share Your Property Details',
      description: 'Enter your flat configuration, society name, and ownership details in a quick confidential form.',
      Illustration: Step1Illustration,
    },
    {
      stepNumber: '02',
      timeline: 'Within 2 hours',
      title: 'Get Resale Valuation',
      description: 'Receive an accurate, registry-benchmarked market valuation calculated from real recent transactions.',
      Illustration: Step2Illustration,
    },
    {
      stepNumber: '03',
      timeline: 'Pre-screened buyers',
      title: 'Connect with verified Buyers',
      description: 'We connect you directly with pre-screened, funded buyers. No endless cold calls or broker spam.',
      Illustration: Step3Illustration,
    },
    {
      stepNumber: '04',
      timeline: 'Closing Day',
      title: 'Complete the Sale',
      description: 'End-to-end legal verification, agreement drafting, and sub-registrar closing assistance.',
      Illustration: Step4Illustration,
    },
  ];

  const scrollToHeroValuation = () => {
    trackEvent('HOW_IT_WORKS_CTA_CLICK', { source: isMobileOnly ? 'mobile_how_it_works' : 'how_it_works_section' });
    const el = document.getElementById('hero-valuation-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onPostProperty();
    }
  };

  return (
    <section
      id="how-it-works"
      className={`font-['Montserrat'] ${isMobileOnly ? 'px-4 py-6' : 'px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-7xl mx-auto'} ${className}`}
    >
      {/* Section Header */}
      <div className="mb-8 sm:mb-12 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 mb-2.5">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0073E6] uppercase tracking-wider">
            Clear 4-Step Resale Process
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight">
          How It Works
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-slate-500 font-['Poppins'] font-normal mt-1.5 leading-relaxed">
          From registry valuation to closing at the sub-registrar office, we manage your resale with zero stress.
        </p>
      </div>

      {/* 4 Equal-width Cards with Milestone Timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 relative">
        {steps.map((step, idx) => {
          const IllustrationComponent = step.Illustration;
          return (
            <div
              key={step.stepNumber}
              className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-[#0073E6]/40 transition-all duration-300 flex flex-col justify-between relative"
            >
              <div>
                {/* 1. Large Visual Area at the Top */}
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl h-40 w-full flex items-center justify-center p-3 overflow-hidden relative select-none">
                  <IllustrationComponent />
                </div>

                {/* 2. Numbered Step Indicator & Timeline Label */}
                <div className="flex items-center justify-between mt-4 mb-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#0073E6] text-white flex items-center justify-center font-bold text-xs font-mono shadow-xs shrink-0 group-hover:scale-110 transition-transform">
                    {step.stepNumber}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0073E6] font-semibold text-[10px] sm:text-[11px] tracking-tight">
                    {step.timeline}
                  </span>
                </div>

                {/* 3. Clear Heading */}
                <h3 className="text-sm sm:text-base font-bold text-[#172033] tracking-tight group-hover:text-[#0073E6] transition-colors">
                  {step.title}
                </h3>

                {/* 4. Concise Description */}
                <p className="text-xs text-slate-500 leading-relaxed font-['Poppins'] mt-1 font-normal">
                  {step.description}
                </p>
              </div>

              {/* Step completion pill */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 shrink-0" />
                <span>Milestone {step.stepNumber}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Retained CTA: "Get My Flat Valuation" with same style green FREE icon */}
      <div className="mt-10 sm:mt-12 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={scrollToHeroValuation}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] active:bg-[#004c99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99] group"
        >
          <span>Get My Flat Valuation</span>
          <span className="bg-[#059669] text-white text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs">
            FREE
          </span>
          <ArrowRight className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Zero upfront fee • Registry-benchmarked price • Verified buyers only
        </p>
      </div>
    </section>
  );
};
