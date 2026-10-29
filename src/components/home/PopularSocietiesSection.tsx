import React from 'react';
import { Building2, MapPin, ArrowRight } from 'lucide-react';

interface PopularSocietiesSectionProps {
  onSelectSociety?: (societyName: string) => void;
}

export const PopularSocietiesSection: React.FC<PopularSocietiesSectionProps> = ({
  onSelectSociety
}) => {
  const societies = [
    {
      name: 'Prestige Shantiniketan',
      locality: 'Whitefield',
      zone: 'East Bengaluru',
      units: '3,000+ Units',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Sobha Dream Acres',
      locality: 'Panathur / Balagere',
      zone: 'East Bengaluru',
      units: '6,000+ Units',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Brigade Gateway',
      locality: 'Rajajinagar',
      zone: 'West Bengaluru',
      units: '1,200+ Units',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Godrej Woodsman',
      locality: 'Thanisandra / Hebbal',
      zone: 'North Bengaluru',
      units: '900+ Units',
      image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Sobha City',
      locality: 'Thanisandra',
      zone: 'North Bengaluru',
      units: '2,000+ Units',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80'
    },
    {
      name: 'Prestige Lakeside Habitat',
      locality: 'Varthur',
      zone: 'East Bengaluru',
      units: '3,400+ Units',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const handleCardClick = (socName: string) => {
    if (onSelectSociety) {
      onSelectSociety(socName);
    } else {
      // Smooth scroll to top form and prefill
      const el = document.getElementById('hero-valuation-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="popular-societies" className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center space-x-2 text-[#0073E6] font-extrabold text-xs tracking-widest uppercase mb-2">
              <span className="w-6 h-0.5 bg-[#0073E6]"></span>
              <span>Popular Communities</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Popular Apartment Communities in Bengaluru
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Active verified resale inventory and verified buyer waitlists across prime townships.
            </p>
          </div>

          <a
            href="#hero-valuation-card"
            className="mt-4 sm:mt-0 inline-flex items-center space-x-1.5 text-xs font-bold text-[#0073E6] hover:text-[#005BB5] group"
          >
            <span>Get Valuation for Your Society</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* 6 Society Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {societies.map((soc, idx) => (
            <div
              key={idx}
              onClick={() => handleCardClick(soc.name)}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-[#0073E6]/40 transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative h-28 sm:h-32 overflow-hidden bg-slate-100">
                <img
                  src={soc.image}
                  alt={soc.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                <span className="absolute bottom-2 left-2 text-[10px] font-semibold text-white/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                  {soc.units}
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors line-clamp-1">
                    {soc.name}
                  </h3>
                  <div className="flex items-center space-x-1 text-[11px] text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{soc.locality}</span>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-[#0073E6]">
                  <span>Free Valuation</span>
                  <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
