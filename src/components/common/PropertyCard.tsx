import React from 'react';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Compass,
  Building2,
  CheckCircle2,
  Heart,
  ArrowUpRight,
  PhoneCall
} from 'lucide-react';
import { motion } from 'motion/react';
import { AdaptivePropertyImage } from './AdaptivePropertyImage';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

export interface PropertyCardData {
  id: string;
  projectName: string;
  localityName: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft?: number;
  floorBand?: string;
  facing?: string;
  bathroomsCount?: number;
  carParksCount?: number;
  askingPriceInr: number;
  pricePerSqft: number;
  image: string;
  verificationBadge?: string;
}

export interface PropertyCardProps {
  property: PropertyCardData;
  variant?: 'carousel' | 'grid';
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
  onSelectProperty?: (projectName: string, locality: string, bhkType: string) => void;
}

export function formatPriceLakhsOrCrores(priceInr: number): string {
  if (priceInr >= 10000000) {
    return `₹${(priceInr / 10000000).toFixed(2)} Cr`;
  }
  return `₹${(priceInr / 100000).toFixed(1)} Lakhs`;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  variant = 'grid',
  isFavorite = false,
  onToggleFavorite,
  onClick,
  onSelectProperty,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(property.id);
    } else {
      window.location.href = `/property/${property.id}`;
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(property.id);
    }
  };

  const isVerified = Boolean(
    property.verificationBadge &&
    ['VERIFIED', 'DOCS_CHECKED', 'INSPECTED', 'LEVEL_2_DOCS_REVIEWED', 'LEVEL_3_PHYSICALLY_INSPECTED'].includes(
      property.verificationBadge.toUpperCase()
    )
  );

  // 1. Carousel Mode (Curated Gated Communities on Mobile)
  if (variant === 'carousel') {
    return (
      <div
        onClick={handleClick}
        className="w-[280px] shrink-0 snap-start bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-md hover:shadow-lg flex flex-col cursor-pointer transition-all active:scale-[0.99] font-['Montserrat',sans-serif]"
      >
        {/* Image with Badges & Dual Price Overlay */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <AdaptivePropertyImage
            src={property.image}
            alt={property.projectName}
            aspectRatioClass="h-44 w-full"
            fallbackKey={property.id || property.projectName}
            showFullscreenButton={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.hasFallback) {
                target.dataset.hasFallback = 'true';
                target.src = getDistinctCommunityPhoto(property.id || property.projectName, 800);
              }
            }}
          />

          {/* Top-Left Verified Badge - Strictly shown ONLY if verification is approved */}
          {isVerified && (
            <div className="absolute top-2.5 left-2.5 z-10 bg-[#0073E6]/95 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
              <span>SellMyGhar Verified</span>
            </div>
          )}

          {/* Top-Right Heart Button */}
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label="Save Property"
            className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-slate-900/40 backdrop-blur-xs text-white flex items-center justify-center hover:bg-slate-900/60 active:scale-90 transition-all cursor-pointer"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
          </button>

          {/* Bottom Dual Price Overlay Capsule */}
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center space-x-1.5">
            <span className="bg-white/95 text-slate-900 text-xs font-black px-2.5 py-1 rounded-md shadow-sm">
              {formatPriceLakhsOrCrores(property.askingPriceInr)}
            </span>
            <span className="text-white font-bold text-xs drop-shadow-md">&gt;</span>
            <span className="bg-white/95 text-slate-800 text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">
              ₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-3.5 text-left flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight leading-snug">
              {property.projectName}
            </h3>
            <div className="flex items-center text-xs text-slate-500 mt-1 font-['Poppins']">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
              <span>{property.localityName}</span>
            </div>
          </div>

          {/* Specs Row */}
          <div className="flex items-center justify-between text-xs text-slate-600 mt-3 pt-2.5 border-t border-slate-100 font-['Poppins'] font-medium">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4 text-slate-400 shrink-0" />
              {property.bhkType}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4 text-slate-400 shrink-0" />
              {property.bathroomsCount || 2} Bath
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Maximize2 className="w-4 h-4 text-slate-400 shrink-0" />
              {property.superBuiltUpSqft.toLocaleString('en-IN')} sq.ft
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Full Grid Mode (Main Property Grid in ListedProperties)
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      onClick={handleClick}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer font-['Montserrat',sans-serif]"
    >
      {/* Photo & Badges */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <AdaptivePropertyImage
          src={property.image}
          alt={property.projectName}
          aspectRatioClass="aspect-[16/10]"
          objectFit="cover"
          fallbackKey={property.id || property.projectName}
          showFullscreenButton={false}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.hasFallback) {
              target.dataset.hasFallback = 'true';
              target.src = getDistinctCommunityPhoto(property.id || property.projectName, 800);
            }
          }}
        />

        {/* Top-Left: "SellMyGhar Verified" Rounded Pill Badge - Strictly shown ONLY if verification is approved */}
        {isVerified && (
          <div className="absolute top-3 left-3 z-20">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#0073E6]/95 backdrop-blur-xs text-white text-[11px] font-bold tracking-wide shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>SellMyGhar Verified</span>
            </span>
          </div>
        )}

        {/* Top-Right: BHK Pill Badge + Heart Favorite Button */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-20">
          <span className="px-2.5 py-1 rounded-md bg-[#172033]/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
            {property.bhkType}
          </span>
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all shadow-xs cursor-pointer"
            aria-label="Save to favorites"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
          </button>
        </div>

        {/* Bottom Image Overlay Strip: Price on Left, Price/Sq.ft on Right */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-8 pb-3 px-4 flex items-baseline justify-between text-white z-10">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {formatPriceLakhsOrCrores(property.askingPriceInr)}
          </span>
          <span className="text-xs text-slate-300 font-['Poppins']">
            ₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft
          </span>
        </div>
      </div>

      {/* Property Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 text-left">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#172033] group-hover:text-[#0073E6] transition-colors leading-snug">
            {property.projectName}
          </h3>
          <p className="text-xs text-slate-500 font-['Poppins'] flex items-center mt-1">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
            <span>{property.localityName}</span>
          </p>
        </div>

        <div className="border-t border-slate-100" />

        {/* 3 Specifications Tiles */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
            <Maximize2 className="w-5 h-5 text-[#0073E6] mb-1" />
            <span className="text-xs font-bold text-slate-800 leading-tight">
              {property.superBuiltUpSqft.toLocaleString('en-IN')} sq.ft
            </span>
            <span className="text-[10px] text-slate-400 font-['Poppins'] mt-0.5">SBUA Area</span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
            <Compass className="w-5 h-5 text-[#0073E6] mb-1" />
            <span className="text-xs font-bold text-slate-800 uppercase leading-tight">
              {property.facing || 'EAST'}
            </span>
            <span className="text-[10px] text-slate-400 font-['Poppins'] mt-0.5">Facing</span>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
            <Building2 className="w-5 h-5 text-[#0073E6] mb-1" />
            <span className="text-xs font-bold text-slate-800 leading-tight truncate w-full">
              {property.floorBand || 'Floor 8 of 8'}
            </span>
            <span className="text-[10px] text-slate-400 font-['Poppins'] mt-0.5">Floor</span>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Action Buttons: View Property ↗ & Quick Call */}
        <div className="flex items-center space-x-2.5 pt-0.5">
          <motion.button
            type="button"
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 1.05 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex-1 py-2.5 px-3 bg-[#0073E6] hover:bg-[#005BB5] active:bg-[#004c99] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer relative overflow-hidden group/btn"
          >
            {/* Ambient light sweep shimmer animation (runs on mobile & desktop) */}
            <span className="animate-btn-light-sweep" aria-hidden="true" />
            <span className="relative z-10">View Property</span>
            <ArrowUpRight className="w-3.5 h-3.5 relative z-10 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 animate-arrow-nudge" />
          </motion.button>

          {onSelectProperty && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProperty(property.projectName, property.localityName, property.bhkType);
              }}
              className="py-2.5 px-3 bg-slate-100 hover:bg-blue-50/90 border border-slate-200/80 hover:border-blue-300 text-slate-800 hover:text-[#0073E6] font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
              title="Quick Call Enquiry"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
              <span>Quick Call</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
