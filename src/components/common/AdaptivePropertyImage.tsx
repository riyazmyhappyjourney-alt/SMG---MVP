import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { getDistinctCommunityPhoto, FALLBACK_PROPERTY_IMAGE } from '../../utils/propertyImages';

interface AdaptivePropertyImageProps {
  src: string;
  alt: string;
  aspectRatioClass?: string;
  className?: string;
  fallbackKey?: string;
  title?: string;
  onFullscreenClick?: () => void;
  showFullscreenButton?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  objectFit?: 'cover' | 'contain';
}

export const AdaptivePropertyImage: React.FC<AdaptivePropertyImageProps> = ({
  src,
  alt,
  aspectRatioClass = 'aspect-[16/10]',
  className = '',
  fallbackKey,
  title,
  onFullscreenClick,
  showFullscreenButton = true,
  onError,
  objectFit = 'cover',
}) => {
  const [hasError, setHasError] = useState(false);
  const fallbackUrl = getDistinctCommunityPhoto(fallbackKey || alt || 'property', 1200);
  const finalSrc = hasError ? FALLBACK_PROPERTY_IMAGE : (src || fallbackUrl);

  return (
    <div className={`relative ${aspectRatioClass} w-full overflow-hidden bg-slate-950 group ${className}`}>
      {/* Blurred background backdrop layer (eliminates ugly black bars for 9:16 portrait or irregular ratios) */}
      <img
        src={finalSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover blur-lg scale-115 opacity-40 select-none pointer-events-none"
      />

      {/* Subtle darkening tint overlay */}
      <div className="absolute inset-0 bg-slate-950/25 pointer-events-none" />

      {/* Crisp foreground image centered with object-contain */}
      <img
        src={finalSrc}
        alt={alt}
        onError={(e) => {
          setHasError(true);
          if (onError) onError(e);
        }}
        className={`relative z-10 w-full h-full ${objectFit === 'cover' ? 'object-cover' : 'object-contain'} mx-auto transition-transform duration-500 ease-out group-hover:scale-105`}
      />

      {/* Expand Fullscreen Button */}
      {showFullscreenButton && onFullscreenClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFullscreenClick();
          }}
          className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/60 hover:bg-black/85 text-white/90 hover:text-white backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-105"
          title="View Fullscreen"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      )}

      {/* Title / Caption Strip if present */}
      {title && (
        <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3 text-white text-xs font-['Poppins'] font-medium flex items-center justify-between">
          <span className="truncate pr-2">{title}</span>
        </div>
      )}
    </div>
  );
};
