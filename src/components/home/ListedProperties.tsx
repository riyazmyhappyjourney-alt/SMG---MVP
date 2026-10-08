import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  BedDouble, 
  Maximize, 
  Compass, 
  ShieldCheck, 
  ArrowUpRight,
  Filter,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

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
  }, []);

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

  return (
    <section id="listings" className="py-16 sm:py-24 bg-[#F4F6F9] border-t border-slate-200/80 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 bg-[#244B8F]/10 text-[#244B8F] px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase font-['Montserrat'] mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Public Verified Inventory</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
              Featured Resale Apartments
            </h2>
            <p className="mt-2 text-sm text-slate-600 font-['Poppins']">
              Every home is verified for A-Khata, title ownership, and physical inspection. Unit numbers remain confidential until private viewing.
            </p>
          </div>

          {/* Verification Legend */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-['Poppins']">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
              <CheckCircle2 className="w-3 h-3 mr-1" /> DOCS CHECKED
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 font-semibold text-[11px]">
              <ShieldCheck className="w-3 h-3 mr-1" /> OWNER VERIFIED
            </span>
          </div>
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
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-slate-200" />
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
              <div
                key={property.id}
                className="bg-white rounded-md overflow-hidden border border-slate-200 hover:border-[#244B8F] transition-all flex flex-col group"
              >
                
                {/* Photo & Badges */}
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={property.image}
                    alt={property.projectName}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Top Badge: Verification Tier */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-['Montserrat'] ${
                      property.verificationBadge === 'DOCS CHECKED'
                        ? 'bg-emerald-700 text-white'
                        : property.verificationBadge === 'INSPECTED'
                        ? 'bg-[#B68A4A] text-white'
                        : 'bg-[#244B8F] text-white'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {property.verificationBadge}
                    </span>
                  </div>

                  {/* Top Right: BHK Badge */}
                  <div className="absolute top-3 right-3 bg-[#172033] text-white px-2 py-0.5 rounded text-xs font-bold font-['Montserrat']">
                    {property.bhkType}
                  </div>

                  {/* Bottom Asking Price Bar (Solid Bar, No Gradient) */}
                  <div className="absolute inset-x-0 bottom-0 bg-[#172033]/90 px-3 py-2 text-white flex items-center justify-between">
                    <span className="text-lg font-black font-['Montserrat']">
                      {formatPriceLakhsOrCrores(property.askingPriceInr)}
                    </span>
                    <span className="text-xs text-slate-300 font-['Poppins']">
                      ₹{property.pricePerSqft.toLocaleString()}/sq.ft
                    </span>
                  </div>

                </div>

                {/* Property Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  
                  <div>
                    <h3 className="text-base font-bold text-[#172033] font-['Montserrat'] group-hover:text-[#244B8F] transition-colors">
                      {property.projectName}
                    </h3>
                    <p className="text-xs text-slate-500 font-['Poppins'] flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                      <span>{property.localityName}</span>
                    </p>
                  </div>

                  {/* Attributes Grid */}
                  <div className="grid grid-cols-3 gap-1.5 py-2.5 border-y border-slate-100 text-xs font-['Poppins'] text-slate-600">
                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-[#F4F6F9] text-center">
                      <Maximize className="w-3.5 h-3.5 text-[#244B8F] mb-0.5" />
                      <span className="font-semibold text-slate-800 text-[11px]">{property.superBuiltUpSqft} sq.ft</span>
                      <span className="text-[10px] text-slate-400">SBUA Area</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-[#F4F6F9] text-center">
                      <Compass className="w-3.5 h-3.5 text-[#244B8F] mb-0.5" />
                      <span className="font-semibold text-slate-800 text-[11px]">{property.facing}</span>
                      <span className="text-[10px] text-slate-400">Facing</span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-1.5 rounded bg-[#F4F6F9] text-center">
                      <BedDouble className="w-3.5 h-3.5 text-[#244B8F] mb-0.5" />
                      <span className="font-semibold text-slate-800 text-[11px]">{property.floorBand}</span>
                      <span className="text-[10px] text-slate-400">Floor</span>
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={`/property/${property.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 px-3 rounded text-xs font-bold text-white bg-[#244B8F] hover:bg-[#1E2E4B] transition-colors font-['Montserrat'] flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <span>View Property</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectProperty(property.projectName, property.localityName, property.bhkType);
                      }}
                      className="py-2.5 px-3 rounded text-xs font-semibold text-[#172033] bg-slate-100 hover:bg-slate-200 transition-colors font-['Montserrat'] flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                      title="Quick Enquiry"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#244B8F]" />
                      <span>Quick Enquiry</span>
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};
