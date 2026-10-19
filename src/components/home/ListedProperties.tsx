import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Compass,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Heart,
  PhoneCall
} from 'lucide-react';
import { motion } from 'motion/react';
import { getFavoritePropertyIds, toggleFavoriteProperty } from '../../utils/favoritesStore';
import { PropertyCardSkeleton } from '../common/PropertyCardSkeleton';
import { PropertyCard, PropertyCardData } from '../common/PropertyCard';
import { useListings } from '../../utils/listingsHook';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

export type PropertyItem = PropertyCardData;

// Resilient onError fallback handler to eliminate broken image icons
export const handleListingImageError = (e: React.SyntheticEvent<HTMLImageElement>, id: string) => {
  const target = e.target as HTMLImageElement;
  if (!target.dataset.hasFallback) {
    target.dataset.hasFallback = 'true';
    target.src = getDistinctCommunityPhoto(id, 800);
  }
};
// onError={(e) => { handleListingImageError(e, item.id); }}

interface ListedPropertiesProps {
  onSelectProperty: (projectName: string, locality: string, bhkType: any) => void;
  searchQuery?: string;
  externalLocality?: string;
}

export const ListedProperties: React.FC<ListedPropertiesProps> = ({ 
  onSelectProperty,
  searchQuery,
  externalLocality,
}) => {
  const { properties, loading } = useListings();
  const [bhkFilter, setBhkFilter] = useState<string>('ALL');
  const [localityFilter, setLocalityFilter] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(getFavoritePropertyIds()));

  useEffect(() => {
    if (externalLocality) {
      setLocalityFilter(externalLocality);
    }
  }, [externalLocality]);

  useEffect(() => {
    const handleFavUpdated = (e: any) => {
      setFavorites(new Set(e.detail?.ids || getFavoritePropertyIds()));
    };
    window.addEventListener('smg:favorites-updated', handleFavUpdated);
    return () => window.removeEventListener('smg:favorites-updated', handleFavUpdated);
  }, []);

  const handleToggleFavorite = (id: string) => {
    toggleFavoriteProperty(id);
    setFavorites(new Set(getFavoritePropertyIds()));
  };

  const formatPriceLakhsOrCrores = (priceInr: number) => {
    if (priceInr >= 10000000) {
      return `₹${(priceInr / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(priceInr / 100000).toFixed(1)} Lakhs`;
  };

  const CORRIDOR_MAP: Record<string, string[]> = {
    'bengaluru east': ['whitefield', 'sarjapur', 'bellandur', 'marathahalli', 'varthur', 'kadugodi', 'brookefield', 'indiranagar', 'east'],
    'bengaluru north': ['hebbal', 'thanisandra', 'yelahanka', 'jakkur', 'hennur', 'sahakarnagar', 'north'],
    'bengaluru south': ['jp nagar', 'hsr', 'electronic city', 'bannerghatta', 'btm', 'kanakapura', 'south'],
  };

  const filteredProperties = properties.filter((p) => {
    if (bhkFilter !== 'ALL' && p.bhkType !== bhkFilter) return false;
    
    if (localityFilter !== 'ALL' && localityFilter.toLowerCase() !== 'all bengaluru') {
      const locKey = localityFilter.toLowerCase().trim();
      const corridorKeywords = CORRIDOR_MAP[locKey];

      if (corridorKeywords) {
        const pLoc = (p.localityName || '').toLowerCase();
        const pProj = (p.projectName || '').toLowerCase();
        const matchesCorridor = corridorKeywords.some(kw => pLoc.includes(kw) || pProj.includes(kw));
        if (!matchesCorridor) return false;
      } else {
        const pLoc = (p.localityName || '').toLowerCase();
        const pProj = (p.projectName || '').toLowerCase();
        if (!pLoc.includes(locKey) && !pProj.includes(locKey)) return false;
      }
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match = p.projectName.toLowerCase().includes(q) ||
                    p.localityName.toLowerCase().includes(q) ||
                    p.bhkType.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const handleCardClick = (e: React.MouseEvent, propertyId: string) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    const url = `/property/${propertyId}`;
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <section id="listings" className="py-16 sm:py-24 bg-[#F4F6F9] border-t border-slate-200/80 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-10 text-left">
          <div className="flex items-center space-x-2 mb-2">
            <span className="w-6 h-0.5 bg-[#0073E6] rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#0073E6]">
              Curated Resale
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
            Recommended Properties
          </h2>
          <p className="mt-2 text-sm text-slate-500 font-normal leading-relaxed max-w-2xl font-['Poppins']">
            Pre-screened title deeds, verified registration pricing benchmarks, and escorted walkthroughs across Bengaluru's high-demand residential corridors. Zero duplicate broker listings
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* BHK Filter */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs font-['Montserrat'] font-semibold">
            <span className="text-slate-400 mr-1 text-xs font-normal">BHK:</span>
            {['ALL', '1BHK', '2BHK', '2.5BHK', '3BHK', '3.5BHK', '4BHK+'].map((bhk) => (
              <button
                key={bhk}
                type="button"
                onClick={() => setBhkFilter(bhk)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                  bhkFilter === bhk
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {bhk === 'ALL' ? 'All BHKs' : bhk}
              </button>
            ))}
          </div>

          {/* Locality Quick Selector */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 text-xs font-['Poppins']">
            <span className="text-slate-400 mr-1 text-xs">Locality:</span>
            {['ALL', 'Whitefield', 'Panathur', 'Sarjapur', 'Hosur'].map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocalityFilter(loc)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium ${
                  localityFilter === loc
                    ? 'bg-[#172033] text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-50'
                }`}
              >
                {loc === 'ALL' ? 'All Bengaluru' : loc}
              </button>
            ))}
          </div>

        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <PropertyCardSkeleton count={6} />
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700 font-['Montserrat']">No properties found with this filter</p>
            <p className="text-xs text-slate-500 font-['Poppins'] mt-1">Try resetting the BHK or Locality filters above.</p>
            <button
              type="button"
              onClick={() => { setBhkFilter('ALL'); setLocalityFilter('ALL'); }}
              className="mt-4 px-4 py-2 bg-[#0073E6] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                variant="grid"
                isFavorite={favorites.has(property.id)}
                onToggleFavorite={handleToggleFavorite}
                onSelectProperty={onSelectProperty}
              />
            ))}
          </div>
        )}

        {/* Bottom Centered "View All Properties →" Pill Button (Matching Reference) */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => {
              setBhkFilter('ALL');
              setLocalityFilter('ALL');
              const el = document.getElementById('listings');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="inline-flex items-center space-x-2 px-8 py-3 rounded-full bg-[#172033] hover:bg-[#0073E6] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <span>View All Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};
