import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  ArrowRight,
  Heart,
  PhoneCall
} from 'lucide-react';
import { motion } from 'motion/react';
import { getFavoritePropertyIds, toggleFavoriteProperty } from '../../utils/favoritesStore';

interface PropertyItem {
  id: string;
  projectName: string;
  localityName: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft: number;
  floorBand: string;
  facing: string;
  bathroomsCount: number;
  carParksCount: number;
  askingPriceInr: number;
  pricePerSqft: number;
  image: string;
  verificationBadge: 'DOCS CHECKED' | 'INSPECTED' | 'OWNER VERIFIED';
}

interface ListedPropertiesProps {
  onSelectProperty: (projectName: string, locality: string, bhkType: any) => void;
}

export const ListedProperties: React.FC<ListedPropertiesProps> = ({ onSelectProperty }) => {
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bhkFilter, setBhkFilter] = useState<string>('ALL');
  const [localityFilter, setLocalityFilter] = useState<string>('ALL');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(getFavoritePropertyIds()));

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch('/api/listings');
        if (res.ok) {
          const data = await res.json();
          if (data.listings && data.listings.length > 0) {
            setProperties(data.listings);
          }
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();

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

  const filteredProperties = properties.filter((p) => {
    if (bhkFilter !== 'ALL' && p.bhkType !== bhkFilter) return false;
    if (localityFilter !== 'ALL' && !p.localityName.toLowerCase().includes(localityFilter.toLowerCase())) return false;
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
            <span className="w-6 h-0.5 bg-[#244B8F] rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#244B8F]">
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
                    ? 'bg-[#244B8F] text-white shadow-xs'
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
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-96 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-700 font-['Montserrat']">No properties found with this filter</p>
            <p className="text-xs text-slate-500 font-['Poppins'] mt-1">Try resetting the BHK or Locality filters above.</p>
            <button
              type="button"
              onClick={() => { setBhkFilter('ALL'); setLocalityFilter('ALL'); }}
              className="mt-4 px-4 py-2 bg-[#244B8F] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProperties.map((property) => (
              <motion.div
                key={property.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => handleCardClick(e, property.id)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
              >
                
                {/* Photo & Badges Exactly Matching Reference Design */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={property.image}
                    alt={property.projectName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Badge bottom-left: "For Sale" (Pill badge like reference) */}
                  <div className="absolute bottom-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-[#244B8F] text-white text-[11px] font-bold shadow-md tracking-wide">
                      For Sale
                    </span>
                  </div>

                  {/* Favorite Heart Button top-right (matching reference) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(property.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all shadow-xs cursor-pointer"
                    aria-label="Save to favorites"
                  >
                    <Heart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                  </button>


                </div>

                {/* Property Content Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5 text-left">
                  
                  <div>
                    <h3 className="text-base font-bold text-[#172033] font-['Montserrat'] group-hover:text-[#244B8F] transition-colors leading-snug">
                      {property.projectName}
                    </h3>
                    <p className="text-xs text-slate-500 font-['Poppins'] flex items-center mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span>{property.localityName}, Bengaluru</span>
                    </p>
                  </div>

                  {/* Features Row Matching Reference Image: 3 Beds | 3 Baths | 1,550 sqft */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-3 border-t border-slate-100 font-['Poppins']">
                    <div className="flex items-center space-x-1.5">
                      <Bed className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{property.bhkType.replace('BHK', '')} Beds</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Bath className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{property.bathroomsCount || 2} Baths</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Maximize2 className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-700">{property.superBuiltUpSqft.toLocaleString('en-IN')} sqft</span>
                    </div>
                  </div>

                  {/* Bottom Row Matching Reference: Bold Price on Left, "View Property →" Pill Button on Right */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
                        {formatPriceLakhsOrCrores(property.askingPriceInr)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-['Poppins']">
                        ₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProperty(property.projectName, property.localityName, property.bhkType);
                        }}
                        className="p-2 rounded-full border border-slate-200 hover:border-[#244B8F] text-slate-600 hover:text-[#244B8F] transition-colors cursor-pointer"
                        title="Quick Call Enquiry"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={`/property/${property.id}`}
                        target={isMobile ? '_self' : '_blank'}
                        rel={isMobile ? undefined : 'noopener noreferrer'}
                        className="px-4 py-2 rounded-full border border-slate-300 hover:border-[#244B8F] hover:bg-[#244B8F] hover:text-white text-xs font-semibold text-slate-700 transition-all flex items-center space-x-1 cursor-pointer group/btn"
                      >
                        <span>View Property</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                </div>

              </motion.div>
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
            className="inline-flex items-center space-x-2 px-8 py-3 rounded-full bg-[#172033] hover:bg-[#244B8F] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <span>View All Properties</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
};
