import React, { useState } from 'react';
import { BANGALORE_LOCALITIES_SEO, LocalitySeoProfile } from '../../data/localitySeoData';
import { MapPin, ArrowRight, Building, CheckCircle2, Compass } from 'lucide-react';
import { trackEvent } from '../../utils/analytics';

interface BengaluruLocalitiesSectionProps {
  onSelectLocality: (slug: string) => void;
  onStartSelling?: (localityName: string) => void;
}

export const BengaluruLocalitiesSection: React.FC<BengaluruLocalitiesSectionProps> = ({
  onSelectLocality,
  onStartSelling,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  const zones = ['ALL', 'North Bengaluru', 'East Bengaluru', 'South Bengaluru', 'Central Bengaluru'];

  const filteredLocalities = selectedZone === 'ALL'
    ? BANGALORE_LOCALITIES_SEO
    : BANGALORE_LOCALITIES_SEO.filter(loc => loc.zone === selectedZone);

  const handleCardClick = (locality: LocalitySeoProfile) => {
    trackEvent('LOCALITY_CARD_CLICK', {
      slug: locality.slug,
      name: locality.name,
      zone: locality.zone,
    });
    onSelectLocality(locality.slug);
  };

  return (
    <section id="bengaluru-localities" className="py-16 bg-[#F4F6F9] border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200/60 text-xs font-bold text-[#244B8F] uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5" />
            <span>Bengaluru Residential Resale Micro-Markets</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
            Key Bengaluru Resale Hubs We Specialize In
          </h2>
          
          <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Direct homeowner representation across 11 high-liquidity apartment corridors. Clear documentation diligence, realistic registered deed valuation benchmarks, and pre-screened buyers.
          </p>
        </div>

        {/* Zone Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setSelectedZone(z)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedZone === z
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {z === 'ALL' ? 'All Micro-Markets (11)' : z}
            </button>
          ))}
        </div>

        {/* 11 Localities Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocalities.map((loc) => (
            <div
              key={loc.slug}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group overflow-hidden"
            >
              {/* Card Header & Badges */}
              <div className="p-5 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {loc.zone}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Resale Hub</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#172033] group-hover:text-[#244B8F] transition-colors flex items-center justify-between">
                    <span>{loc.name}</span>
                    <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#244B8F] transition-colors" />
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {loc.corridorHighlight}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {loc.summary}
                </p>
              </div>

              {/* Pricing & Societies Metrics */}
              <div className="p-5 bg-slate-50/60 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 py-1">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Resale Range
                    </span>
                    <span className="font-bold text-slate-900">
                      {loc.indicativePriceBand}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Corridor Avg
                    </span>
                    <span className="font-semibold text-slate-700">
                      {loc.indicativeRatePerSqft}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                    Key Communities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {loc.popularSocieties.slice(0, 3).map((soc) => (
                      <span
                        key={soc}
                        className="inline-flex items-center text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-medium truncate max-w-[200px]"
                      >
                        <Building className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                        <span className="truncate">{soc}</span>
                      </span>
                    ))}
                    {loc.popularSocieties.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">
                        +{loc.popularSocieties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCardClick(loc)}
                  className="text-xs font-bold text-[#244B8F] hover:text-[#1B396E] inline-flex items-center space-x-1.5 cursor-pointer group/link"
                >
                  <span>Explore {loc.name} Resale</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                </button>

                {onStartSelling && (
                  <button
                    type="button"
                    onClick={() => {
                      trackEvent('SELLER_FUNNEL_START', { source: 'locality_grid', locality: loc.name });
                      onStartSelling(loc.name);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-[#244B8F] text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    List Here
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Assurance Note */}
        <div className="mt-10 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#244B8F] shrink-0" />
            <span>
              <strong>Sub-Registrar Compliance:</strong> All locality listings are verified against Karnataka Sub-Registrar encumbrance guidelines before active buyer matching.
            </span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0">
            Updated for Bengaluru Municipal Boundaries
          </span>
        </div>

      </div>
    </section>
  );
};
