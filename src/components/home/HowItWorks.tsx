import React from 'react';
import { ArrowRight } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

interface HowItWorksProps {
  onPostProperty: () => void;
  className?: string;
  isMobileOnly?: boolean;
}

/**
 * 2D Flat Vector Illustration for Step 1:
 * Modern apartment building with location pin and floating property listing sheet.
 */
const Step1Illustration: React.FC = () => (
  <svg
    viewBox="0 0 360 210"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-48 object-contain"
    aria-label="Apartment building with property listing sheet"
  >
    {/* Ground Baseline */}
    <path d="M20 185H340" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Stylized Landscaping Bushes */}
    <ellipse cx="60" cy="180" rx="16" ry="10" fill="#059669" />
    <ellipse cx="78" cy="178" rx="18" ry="12" fill="#10B981" />
    <ellipse cx="180" cy="180" rx="20" ry="12" fill="#059669" />
    <ellipse cx="198" cy="178" rx="16" ry="10" fill="#10B981" />

    {/* Apartment Building Shadow */}
    <rect x="75" y="45" width="115" height="138" rx="4" fill="#E2E8F0" opacity="0.5" />

    {/* Main Building Body */}
    <rect x="70" y="40" width="115" height="142" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    {/* Roof Trim */}
    <rect x="68" y="36" width="119" height="7" rx="2" fill="#244B8F" />

    {/* Side Facade Column */}
    <rect x="70" y="43" width="34" height="139" fill="#F1F5F9" />

    {/* Window Columns (Left Facade) */}
    <rect x="77" y="52" width="18" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="77" y="84" width="18" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="77" y="116" width="18" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="77" y="148" width="18" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />

    {/* Center & Right Windows with Glass Balconies */}
    {/* Floor 4 */}
    <rect x="114" y="52" width="26" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="148" y="52" width="26" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="110" y="65" width="68" height="11" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" fillOpacity="0.8" />
    <line x1="126" y1="65" x2="126" y2="76" stroke="#93C5FD" strokeWidth="1.5" />
    <line x1="144" y1="65" x2="144" y2="76" stroke="#93C5FD" strokeWidth="1.5" />
    <line x1="162" y1="65" x2="162" y2="76" stroke="#93C5FD" strokeWidth="1.5" />

    {/* Floor 3 */}
    <rect x="114" y="84" width="26" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="148" y="84" width="26" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="110" y="97" width="68" height="11" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" fillOpacity="0.8" />
    <line x1="126" y1="97" x2="126" y2="108" stroke="#93C5FD" strokeWidth="1.5" />
    <line x1="144" y1="97" x2="144" y2="108" stroke="#93C5FD" strokeWidth="1.5" />
    <line x1="162" y1="97" x2="162" y2="108" stroke="#93C5FD" strokeWidth="1.5" />

    {/* Floor 2 */}
    <rect x="114" y="116" width="26" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="148" y="116" width="26" height="22" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="110" y="129" width="68" height="11" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" fillOpacity="0.8" />
    <line x1="126" y1="129" x2="126" y2="140" stroke="#93C5FD" strokeWidth="1.5" />
    <line x1="144" y1="129" x2="144" y2="140" stroke="#93C5FD" strokeWidth="1.5" />
    <line x1="162" y1="129" x2="162" y2="140" stroke="#93C5FD" strokeWidth="1.5" />

    {/* Floor 1 Entrance */}
    <rect x="114" y="148" width="60" height="34" rx="2" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
    <rect x="134" y="156" width="20" height="26" fill="#244B8F" rx="1" />

    {/* Location Pin */}
    <g transform="translate(195, 32)">
      <path
        d="M16 0C7.16 0 0 7.16 0 16C0 27 16 42 16 42C16 42 32 27 32 16C32 7.16 24.84 0 16 0Z"
        fill="#0073E6"
      />
      <circle cx="16" cy="15" r="6" fill="#FFFFFF" />
    </g>

    {/* Floating Property Listing Sheet */}
    <g transform="translate(205, 88)">
      {/* Sheet Drop Shadow */}
      <rect x="2" y="4" width="94" height="92" rx="8" fill="#CBD5E1" opacity="0.35" />
      {/* Sheet Body */}
      <rect x="0" y="0" width="94" height="92" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />
      
      {/* House Icon Badge */}
      <rect x="36" y="10" width="22" height="22" rx="4" fill="#EFF6FF" stroke="#0073E6" strokeWidth="1.5" />
      <path d="M47 14L41 19V27H53V19L47 14Z" fill="#0073E6" />
      <rect x="45.5" y="21" width="3" height="6" fill="#FFFFFF" />

      {/* Listing Form Text Placeholders */}
      <rect x="14" y="40" width="66" height="4" rx="2" fill="#64748B" />
      <rect x="14" y="49" width="48" height="3" rx="1.5" fill="#94A3B8" />
      <rect x="14" y="57" width="56" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="14" y="65" width="62" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="14" y="73" width="38" height="3" rx="1.5" fill="#CBD5E1" />
    </g>
  </svg>
);

/**
 * 2D Flat Vector Illustration for Step 2:
 * Apartment building under inspection with prominent magnifying glass and buyer checklist.
 */
const Step2Illustration: React.FC = () => (
  <svg
    viewBox="0 0 360 210"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-48 object-contain"
    aria-label="Apartment building with buyer inspection checklist"
  >
    {/* Ground Baseline */}
    <path d="M20 185H340" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Landscaping Bushes */}
    <ellipse cx="65" cy="180" rx="18" ry="11" fill="#059669" />
    <ellipse cx="85" cy="178" rx="20" ry="12" fill="#10B981" />
    <ellipse cx="185" cy="180" rx="18" ry="11" fill="#059669" />

    {/* Apartment Building */}
    <rect x="80" y="38" width="105" height="144" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
    {/* Roof Trim */}
    <rect x="78" y="34" width="109" height="7" rx="2" fill="#244B8F" />

    {/* Windows Grid */}
    <rect x="90" y="50" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="114" y="50" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="138" y="50" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />

    <rect x="90" y="78" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="114" y="78" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="138" y="78" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />

    <rect x="90" y="106" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="114" y="106" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="138" y="106" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />

    <rect x="90" y="134" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="114" y="134" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />
    <rect x="138" y="134" width="18" height="20" rx="2" fill="#93C5FD" stroke="#60A5FA" strokeWidth="1.5" />

    {/* Balconies */}
    <rect x="88" y="64" width="70" height="8" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1" fillOpacity="0.8" />
    <rect x="88" y="92" width="70" height="8" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1" fillOpacity="0.8" />
    <rect x="88" y="120" width="70" height="8" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1" fillOpacity="0.8" />
    <rect x="88" y="148" width="70" height="8" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1" fillOpacity="0.8" />

    {/* Prominent Blue Magnifying Glass */}
    <g transform="translate(142, 58)">
      {/* Magnifying Glass Lens Outer Rim */}
      <circle cx="36" cy="36" r="34" stroke="#0073E6" strokeWidth="6" fill="#EFF6FF" fillOpacity="0.35" />
      {/* Lens Reflection Highlight */}
      <path
        d="M20 18C28 12 44 12 52 18"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Inner Lens Magnified View */}
      <rect x="22" y="24" width="14" height="16" rx="2" fill="#60A5FA" stroke="#244B8F" strokeWidth="1.5" />
      <rect x="40" y="24" width="14" height="16" rx="2" fill="#60A5FA" stroke="#244B8F" strokeWidth="1.5" />
      <rect x="20" y="36" width="36" height="6" rx="1.5" fill="#BFDBFE" stroke="#244B8F" strokeWidth="1" />
      
      {/* Sturdy Handle */}
      <path
        d="M62 62L86 86"
        stroke="#244B8F"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M64 64L84 84"
        stroke="#0073E6"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>

    {/* Floating Buyer Inspection Checklist */}
    <g transform="translate(230, 85)">
      {/* Shadow */}
      <rect x="2" y="4" width="86" height="95" rx="8" fill="#CBD5E1" opacity="0.35" />
      {/* Sheet Body */}
      <rect x="0" y="0" width="86" height="95" rx="8" fill="#FFFFFF" stroke="#93C5FD" strokeWidth="2" />

      {/* Item 1 Checkbox */}
      <rect x="12" y="18" width="16" height="16" rx="4" fill="#0073E6" />
      <path d="M16 26L19 29L24 22" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="36" y="22" width="38" height="4" rx="2" fill="#475569" />
      <rect x="36" y="29" width="26" height="3" rx="1.5" fill="#94A3B8" />

      {/* Item 2 Checkbox */}
      <rect x="12" y="44" width="16" height="16" rx="4" fill="#0073E6" />
      <path d="M16 52L19 55L24 48" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="36" y="48" width="40" height="4" rx="2" fill="#475569" />
      <rect x="36" y="55" width="22" height="3" rx="1.5" fill="#94A3B8" />

      {/* Item 3 Checkbox */}
      <rect x="12" y="70" width="16" height="16" rx="4" fill="#0073E6" />
      <path d="M16 78L19 81L24 74" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="36" y="74" width="36" height="4" rx="2" fill="#475569" />
      <rect x="36" y="81" width="28" height="3" rx="1.5" fill="#94A3B8" />
    </g>
  </svg>
);

/**
 * 2D Flat Vector Illustration for Step 3:
 * Property keys with house keychain, documentation sheet with signature, and desk plant.
 */
const Step3Illustration: React.FC = () => (
  <svg
    viewBox="0 0 360 210"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full max-h-48 object-contain"
    aria-label="Property keys and signed sale agreement documentation"
  >
    {/* Desk Surface Horizon */}
    <path d="M30 185H330" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Potted Plant (Top Right) */}
    <g transform="translate(262, 50)">
      {/* Lush Green Leaves */}
      <path d="M18 36C8 28 4 12 18 0C32 12 28 28 18 36Z" fill="#059669" />
      <path d="M18 36C12 24 20 8 36 6C38 22 28 32 18 36Z" fill="#10B981" />
      <path d="M18 36C24 24 16 8 0 6C-2 22 8 32 18 36Z" fill="#10B981" />
      {/* Plant Pot */}
      <path d="M10 36H26L23 54H13L10 36Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="8" y="34" width="20" height="4" rx="1" fill="#E2E8F0" />
    </g>

    {/* Signed Agreement Document Sheet */}
    <g transform="translate(160, 72) rotate(4)">
      {/* Paper Drop Shadow */}
      <rect x="2" y="3" width="96" height="114" rx="6" fill="#CBD5E1" opacity="0.4" />
      {/* Paper Sheet */}
      <rect x="0" y="0" width="96" height="114" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />

      {/* Document Header lines */}
      <rect x="14" y="16" width="46" height="5" rx="2" fill="#0073E6" />
      <rect x="14" y="27" width="68" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="14" y="35" width="64" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="14" y="43" width="68" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="14" y="51" width="54" height="3" rx="1.5" fill="#CBD5E1" />
      <rect x="14" y="59" width="60" height="3" rx="1.5" fill="#CBD5E1" />

      {/* Signature Line & Blue Signature */}
      <line x1="14" y1="92" x2="68" y2="92" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 2" />
      <path
        d="M18 88C22 84 24 89 28 85C32 82 34 88 40 84C44 82 48 87 56 83"
        stroke="#0073E6"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </g>

    {/* Classic Fountain Pen Angled over Document */}
    <g transform="translate(230, 135) rotate(-35)">
      {/* Pen Body */}
      <rect x="0" y="0" width="8" height="48" rx="2" fill="#172033" />
      <rect x="0" y="36" width="8" height="5" fill="#244B8F" />
      <rect x="1" y="2" width="2" height="42" fill="#FFFFFF" opacity="0.3" />
      {/* Pen Nib (Gold) */}
      <path d="M0 48L4 58L8 48H0Z" fill="#F59E0B" stroke="#D97706" strokeWidth="0.5" />
      <line x1="4" y1="48" x2="4" y2="55" stroke="#78350F" strokeWidth="0.8" />
    </g>

    {/* House Keychain & Real Estate Keys */}
    <g transform="translate(58, 86)">
      {/* Key Ring */}
      <circle cx="44" cy="42" r="14" stroke="#94A3B8" strokeWidth="3" fill="none" />

      {/* Blue House-Shaped Keychain Pendant */}
      <g transform="translate(42, 42)">
        <path
          d="M16 6L32 18V40H0V18L16 6Z"
          fill="#0073E6"
          stroke="#244B8F"
          strokeWidth="2"
        />
        {/* Keychain Hole */}
        <circle cx="16" cy="11" r="3" fill="#FFFFFF" />
        {/* House Cutout Window */}
        <rect x="11" y="22" width="10" height="10" rx="2" fill="#FFFFFF" />
      </g>

      {/* Silver Metallic Key 1 */}
      <g transform="translate(32, 48) rotate(-40)">
        <circle cx="10" cy="10" r="8" stroke="#94A3B8" strokeWidth="2.5" fill="#F1F5F9" />
        <circle cx="10" cy="10" r="3.5" fill="#64748B" />
        {/* Shaft */}
        <rect x="18" y="8" width="34" height="4" rx="1" fill="#94A3B8" />
        {/* Teeth */}
        <rect x="38" y="12" width="4" height="6" rx="0.5" fill="#94A3B8" />
        <rect x="46" y="12" width="4" height="4" rx="0.5" fill="#94A3B8" />
      </g>

      {/* Silver Metallic Key 2 */}
      <g transform="translate(30, 56) rotate(-25)">
        <circle cx="10" cy="10" r="7" stroke="#CBD5E1" strokeWidth="2.5" fill="#FFFFFF" />
        <circle cx="10" cy="10" r="3" fill="#94A3B8" />
        <rect x="17" y="8.5" width="28" height="3.5" rx="1" fill="#CBD5E1" />
        <rect x="34" y="12" width="3.5" height="5" rx="0.5" fill="#CBD5E1" />
        <rect x="40" y="12" width="3.5" height="3" rx="0.5" fill="#CBD5E1" />
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
      stepNumber: 1,
      timeline: 'A few minutes',
      title: 'List your property',
      description: 'Share your flat details, specifications and expected price.',
      Illustration: Step1Illustration,
    },
    {
      stepNumber: 2,
      timeline: 'As enquiries arrive',
      title: 'Connect with buyers',
      description: 'Review genuine enquiries and discuss offers with interested buyers.',
      Illustration: Step2Illustration,
    },
    {
      stepNumber: 3,
      timeline: 'At your pace',
      title: 'Complete your sale',
      description: 'Move through due diligence, documentation and registration with clarity.',
      Illustration: Step3Illustration,
    },
  ];

  return (
    <section
      id="how-it-works"
      className={`font-['Montserrat'] ${isMobileOnly ? 'px-4 py-6' : 'px-4 sm:px-6 lg:px-8 py-10 sm:py-14 max-w-7xl mx-auto'} ${className}`}
    >
      {/* Section Header */}
      <div className="mb-6 sm:mb-10 text-left">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200/80 mb-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-[#0073E6] uppercase tracking-wider">
            Seller Journey
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight">
          How it works
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-slate-500 font-['Poppins'] font-normal mt-1 sm:mt-1.5 max-w-2xl">
          A clear, guided journey to sell your Bengaluru home.
        </p>
      </div>

      {/* 3 Equal-width Cards (Desktop: 3 Columns, Mobile: Responsive Stack) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {steps.map((step) => {
          const IllustrationComponent = step.Illustration;
          return (
            <div
              key={step.stepNumber}
              className="bg-white rounded-2xl lg:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between"
            >
              <div>
                {/* 1. Large Visual Area at the Top */}
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-xl sm:rounded-2xl h-44 sm:h-48 lg:h-52 w-full flex items-center justify-center p-3 sm:p-4 overflow-hidden relative select-none">
                  <IllustrationComponent />
                </div>

                {/* 2. Numbered Step Indicator & Timeline Label */}
                <div className="flex items-center justify-between mt-5 mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0073E6] text-white flex items-center justify-center font-bold text-xs sm:text-sm font-mono shadow-xs shrink-0">
                    {step.stepNumber}
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0073E6] font-semibold text-[11px] sm:text-xs tracking-tight">
                    {step.timeline}
                  </span>
                </div>

                {/* 3. Clear Heading */}
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#172033] tracking-tight">
                  {step.title}
                </h3>

                {/* 4. Concise Description */}
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-['Poppins'] mt-1.5 font-normal">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Retained 'Post Your Property' CTA with Green 'FREE' Label */}
      <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center">
        <button
          type="button"
          onClick={() => {
            trackEvent('HOW_IT_WORKS_CTA_CLICK', { source: isMobileOnly ? 'mobile_how_it_works' : 'how_it_works_section' });
            onPostProperty();
          }}
          className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] active:bg-[#004c99] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.99]"
        >
          <span>Post Your Property</span>
          <span className="bg-[#059669] text-white text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded shadow-xs">
            FREE
          </span>
          <ArrowRight className="w-4 h-4 ml-0.5" />
        </button>
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Zero upfront fee • Verified buyers • Guided transaction support
        </p>
      </div>
    </section>
  );
};
