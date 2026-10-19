import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

export interface ViewerPhoto {
  id?: string;
  url: string;
  title?: string;
  caption?: string;
}

interface FullImageViewerModalProps {
  photos: ViewerPhoto[];
  activeIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  propertyTitle?: string;
}

export const FullImageViewerModal: React.FC<FullImageViewerModalProps> = ({
  photos,
  activeIndex,
  isOpen,
  onClose,
  onIndexChange,
  propertyTitle,
}) => {
  const currentPhoto = photos[activeIndex] || photos[0];

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    onIndexChange(activeIndex === 0 ? photos.length - 1 : activeIndex - 1);
  }, [activeIndex, photos.length, onIndexChange]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    onIndexChange(activeIndex === photos.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, photos.length, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Prevent body scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !currentPhoto) return null;

  const displayTitle = currentPhoto.title || currentPhoto.caption || (propertyTitle ? `${propertyTitle} - Photo ${activeIndex + 1}` : `Photo ${activeIndex + 1}`);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md font-['Montserrat'] select-none animate-fade-in"
      onClick={onClose}
    >
      {/* Top Header Controls Bar */}
      <div 
        className="px-4 py-3 sm:px-6 flex items-center justify-between text-white border-b border-white/10 bg-slate-950/60 z-30 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0073E6] text-white flex items-center justify-center shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate font-['Montserrat']">
              {displayTitle}
            </h3>
            {propertyTitle && (
              <p className="text-[11px] text-slate-400 truncate font-['Poppins']">
                {propertyTitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 shrink-0 ml-4">
          <span className="text-xs font-mono font-bold bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
            {activeIndex + 1} / {photos.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close viewer (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="relative flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient blurred backdrop layer of the same image */}
        <img
          src={currentPhoto.url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-120 opacity-30 pointer-events-none select-none"
        />

        {/* Crisp foreground image */}
        <div className="relative z-10 max-w-full max-h-[82vh] flex items-center justify-center">
          <img
            key={activeIndex}
            src={currentPhoto.url}
            alt={displayTitle}
            className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl transition-all"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = 'true';
                target.src = getDistinctCommunityPhoto(currentPhoto.id || propertyTitle || 'detail', 1600);
              }
            }}
          />
        </div>

        {/* Left Arrow Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer shadow-2xl hover:scale-105"
            title="Previous (Left Arrow)"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Right Arrow Button */}
        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 sm:p-4 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all cursor-pointer shadow-2xl hover:scale-105"
            title="Next (Right Arrow)"
            aria-label="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {photos.length > 1 && (
        <div 
          className="px-4 py-3 bg-slate-950/80 border-t border-white/10 z-30 shrink-0 overflow-x-auto flex items-center justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((p, idx) => (
            <button
              key={p.id || idx}
              type="button"
              onClick={() => onIndexChange(idx)}
              className={`relative w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                idx === activeIndex
                  ? 'border-[#0073E6] ring-2 ring-blue-400 scale-105'
                  : 'border-white/20 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={p.url}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
