import React, { useState, useEffect } from 'react';
import { BANGALORE_LOCALITIES_SEO, getLocalityBySlug, LocalitySeoProfile } from '../../data/localitySeoData';
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Home,
  HelpCircle,
  ExternalLink,
  PhoneCall
} from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

interface LocalityDetailPageProps {
  localitySlug: string;
  onBackToHome: () => void;
  onNavigateToLocality: (slug: string) => void;
  onStartSelling: (localityName: string) => void;
  onContactDesk?: () => void;
}

export const LocalityDetailPage: React.FC<LocalityDetailPageProps> = ({
  localitySlug,
  onBackToHome,
  onNavigateToLocality,
  onStartSelling,
  onContactDesk,
}) => {
  const profile: LocalitySeoProfile = getLocalityBySlug(localitySlug) || BANGALORE_LOCALITIES_SEO[0];

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = `Sell Flat in ${profile.name}, Bangalore | Resale Assistance & Buyers | SellMyGhar`;
    trackEvent('LOCALITY_PAGE_VIEW', { locality: profile.slug, name: profile.name });
  }, [profile]);

  const relatedLocalities = BANGALORE_LOCALITIES_SEO
    .filter((loc) => loc.slug !== profile.slug)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F4F6F9] font-['Montserrat'] text-[#172033] flex flex-col selection:bg-[#0073E6] selection:text-white">
      
      {/* 1. Header / Breadcrumbs */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          <nav className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center hover:text-[#0073E6] font-medium transition-colors cursor-pointer shrink-0"
            >
              <Home className="w-3.5 h-3.5 mr-1" />
              <span>Home</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="shrink-0 text-slate-500 font-medium">Bengaluru Resale</span>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-[#172033] shrink-0">Sell Flat in {profile.name}</span>
          </nav>

          <button
            type="button"
            onClick={() => onStartSelling(profile.name)}
            className="px-3.5 py-1.5 rounded-lg bg-[#0073E6] text-white text-xs font-bold hover:bg-[#005BB5] transition-colors cursor-pointer shrink-0 hidden sm:inline-flex items-center space-x-1.5"
          >
            <span>List My Flat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Hero Section for Locality */}
      <section className="bg-gradient-to-b from-[#172033] via-[#1E2E4B] to-[#0073E6] text-white py-14 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-3xl space-y-4">
            
            {/* Locality & Zone Eyebrow */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-blue-200 text-xs font-bold uppercase tracking-wider border border-white/15">
                {profile.zone}
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-slate-300">
                <MapPin className="w-3.5 h-3.5 mr-1 text-blue-300" />
                {profile.corridorHighlight}
              </span>
            </div>

            {/* Custom Targeted H1 */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Sell Your Flat in {profile.name}, Bengaluru With a Clear Plan.
            </h1>

            {/* Supporting Copy */}
            <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed max-w-2xl">
              Get guided seller assistance, understand title documentation requirements, and connect with verified buyers looking for ready apartments in {profile.name}.
            </p>

            {/* Dual CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  trackEvent('SELLER_FUNNEL_START', { source: 'locality_hero', locality: profile.name });
                  onStartSelling(profile.name);
                }}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#172033] font-bold text-sm shadow-md transition-all cursor-pointer inline-flex items-center justify-center space-x-2 group"
              >
                <span>Start Selling My Flat in {profile.name}</span>
                <ArrowRight className="w-4 h-4 text-[#0073E6] group-hover:translate-x-1 transition-transform" />
              </button>

              {onContactDesk && (
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('SELLER_CONSULTATION_CLICK', { locality: profile.name });
                    onContactDesk();
                  }}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
                >
                  <PhoneCall className="w-4 h-4 text-slate-300" />
                  <span>Speak to {profile.name} Desk</span>
                </button>
              )}
            </div>

            {/* Trust Points */}
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Broker Spam</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sub-Registrar Title Verification</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Gated Society Focus</span>
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* 3. Micro-Market Resale Intelligence Metrics */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Indicative Resale Band
            </span>
            <div className="text-lg font-extrabold text-[#172033]">
              {profile.indicativePriceBand}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Based on recent 2 & 3 BHK transaction filings
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Corridor Benchmark Rate
            </span>
            <div className="text-lg font-extrabold text-[#0073E6]">
              {profile.indicativeRatePerSqft}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Super built-up rate for A-Khata societies
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Dominant Configurations
            </span>
            <div className="text-sm font-extrabold text-[#172033] line-clamp-2">
              {profile.predominantConfigurations}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Highest liquidity segment in {profile.name}
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Documentation Benchmark
            </span>
            <div className="text-sm font-extrabold text-emerald-700">
              Sub-Registrar & A-Khata Ready
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Direct sub-registrar online clearance
            </p>
          </div>

        </div>
      </section>

      {/* 4. In-Depth Resale Dynamics & Societies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Dynamics & Buyer Profile (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-xl font-extrabold text-[#172033] tracking-tight">
                Resale Market Dynamics in {profile.name}
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {profile.resaleDynamics}
              </p>

              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Key Buyer Demand Drivers
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                  {profile.buyerDemandDrivers.map((driver, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0073E6] shrink-0 mt-0.5" />
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Connectivity & Arteries
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.keyConnectivity.map((conn) => (
                    <span
                      key={conn}
                      className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200/60"
                    >
                      {conn}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Prominent Gated Societies in this Micro-Market */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-extrabold text-[#172033] tracking-tight flex items-center justify-between">
                <span>Prominent Apartment Communities in {profile.name}</span>
                <Building2 className="w-4 h-4 text-slate-400" />
              </h2>
              
              <p className="text-xs text-slate-600">
                Buyers actively query SellMyGhar for resale availability across these established societies:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {profile.popularSocieties.map((soc) => (
                  <div
                    key={soc}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-slate-800">{soc}</span>
                    <button
                      type="button"
                      onClick={() => onStartSelling(profile.name)}
                      className="text-[11px] font-bold text-[#0073E6] hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Have a flat?
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Karnataka Legal Diligence Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center space-x-2 text-[#0073E6]">
                <FileText className="w-5 h-5 text-[#0073E6]" />
                <h3 className="text-base font-extrabold text-[#172033] tracking-tight">
                  Seller Documentation Checklist
                </h3>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Karnataka registration protocol requires complete title scrutiny. SellMyGhar verifies these documents for seamless buyer closing:
              </p>

              <div className="space-y-3 text-xs">
                
                <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Form 15 Encumbrance Certificate (EC)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5">
                    15–30 year nil-encumbrance certificate generated directly via the Karnataka Department of Stamps and Registration portal.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>BBMP / BDA A-Khata Certificate & Extract</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5">
                    Updated e-Aasthi electronic Khata extract along with latest financial year property tax paid receipt.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Registered Parent Title Deeds</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5">
                    Original Sale Deed, Builder-Buyer Agreement, Possession Letter, and Sanctioned Building Plan approval.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Society NOC & Occupancy Certificate</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5">
                    Association No-Objection Certificate confirming zero maintenance dues and original project Occupancy Certificate (OC).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Bank Loan Closure / Outstanding Letter</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-5">
                    If property has an active home loan, foreclosing bank statement and list of documents held for buyer loan clearance.
                  </p>
                </div>

              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onStartSelling(profile.name)}
                  className="w-full py-3 px-4 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-all cursor-pointer text-center block"
                >
                  Need Document Diligence? Onboard Your Flat
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* 5. Frequently Asked Questions Accordion */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 text-[#0073E6]">
            <HelpCircle className="w-5 h-5 text-[#0073E6]" />
            <h2 className="text-xl font-extrabold text-[#172033] tracking-tight">
              Selling Your Flat in {profile.name}: Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {profile.localFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-900 hover:text-[#0073E6] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#0073E6] shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Explore Related Bengaluru Localities */}
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-[#172033] tracking-tight">
            Explore Other Bengaluru Resale Corridors
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedLocalities.map((rel) => (
              <button
                key={rel.slug}
                type="button"
                onClick={() => onNavigateToLocality(rel.slug)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#172033] group-hover:text-[#0073E6] transition-colors">
                    {rel.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0073E6]" />
                </div>
                <span className="text-[10px] text-slate-400 block mb-1">
                  {rel.zone}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {rel.indicativePriceBand}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 7. Bottom Seller Conversion Card for Locality */}
        <div className="bg-gradient-to-r from-[#172033] via-[#1E2E4B] to-[#0073E6] rounded-2xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              DEDICATED RESALE DESK
            </span>
            <h3 className="text-2xl font-extrabold tracking-tight">
              Ready to Sell Your Flat in {profile.name}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              List your apartment directly on SellMyGhar. Get verified valuation guidance, zero broker calls, and screened buyers ready for site visits.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onStartSelling(profile.name)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-[#172033] font-bold text-sm shadow-md transition-all cursor-pointer text-center"
            >
              Start Assisted Selling
            </button>
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer text-center"
            >
              Back to Homepage
            </button>
          </div>
        </div>

      </section>

      {/* Footer minimal back link */}
      <footer className="mt-auto py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <p>© 2026 SellMyGhar.in • Bengaluru Residential Resale Platform</p>
      </footer>

    </div>
  );
};
