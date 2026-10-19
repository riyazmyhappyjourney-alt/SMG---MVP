import React, { useState, useEffect } from 'react';
import { X, Heart, MapPin, Trash2, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFavoritePropertyIds, toggleFavoriteProperty, clearAllFavorites } from '../../utils/favoritesStore';
import { FALLBACK_PROPERTY_IMAGE } from '../../utils/propertyImages';
import { redirectToBuyMyGhar } from '../../utils/domainConfig';

interface PropertyItem {
  id: string;
  projectName: string;
  localityName: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft: number;
  askingPriceInr: number;
  pricePerSqft: number;
  image: string;
}

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty?: (id: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  onSelectProperty,
}) => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync favorites
  useEffect(() => {
    if (!isOpen) return;

    const ids = getFavoritePropertyIds();
    setFavoriteIds(ids);

    async function loadProperties() {
      setLoading(true);
      try {
        const res = await fetch('/api/listings');
        if (res.ok) {
          const data = await res.json();
          if (data.listings && Array.isArray(data.listings)) {
            setProperties(data.listings);
          }
        }
      } catch (err) {
        console.error('Failed to load listings for favorites:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, [isOpen]);

  const handleRemove = (id: string) => {
    toggleFavoriteProperty(id);
    setFavoriteIds((prev) => prev.filter((x) => x !== id));
  };

  const handleClearAll = () => {
    clearAllFavorites();
    setFavoriteIds([]);
  };

  const formatPriceLakhsOrCrores = (priceInr: number) => {
    if (priceInr >= 10000000) {
      return `₹${(priceInr / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(priceInr / 100000).toFixed(1)} Lakhs`;
  };

  if (!isOpen) return null;

  const favoriteListings = properties.filter((p) => favoriteIds.includes(p.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center p-0 sm:p-4 bg-[#F4F6F9] sm:bg-slate-900/60 sm:backdrop-blur-sm overflow-hidden font-['Montserrat']">
        {/* Desktop Backdrop Click dismiss */}
        <div className="hidden sm:block fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200 overflow-hidden flex flex-col text-left my-0 sm:my-8"
        >
          {/* Header (Full-width sticky on mobile with Back button) */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-[#244B8F] text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="p-1 sm:hidden rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer mr-0.5"
                aria-label="Back to page"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold leading-tight">My Saved Properties</h3>
                <p className="text-[11px] sm:text-xs text-blue-100 font-['Poppins']">
                  {favoriteIds.length} {favoriteIds.length === 1 ? 'flat' : 'flats'} saved
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {favoriteIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-blue-100 hover:text-white underline cursor-pointer px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Full Screen Scrollable Body on Mobile */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 bg-[#F4F6F9] sm:bg-white space-y-3 pb-24 sm:pb-6">
            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-[#0073E6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-semibold">Loading saved properties...</span>
              </div>
            ) : favoriteListings.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-4 my-auto">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                  <Heart className="w-8 h-8 fill-rose-100 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900">No Saved Properties Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-['Poppins'] leading-relaxed">
                    Click the heart icon on any property card to save it here for quick access, comparison, and scheduling site visits.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    redirectToBuyMyGhar();
                  }}
                  className="mt-2 px-6 py-3 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-all cursor-pointer shadow-md inline-flex items-center space-x-1.5 active:scale-98"
                >
                  <span>Explore Properties on BuyMyGhar.in</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteListings.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-[#0073E6]/40 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start sm:items-center space-x-3 w-full sm:w-auto">
                      <div className="w-20 h-20 sm:w-20 sm:h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                        <img
                          src={prop.image || FALLBACK_PROPERTY_IMAGE}
                          alt={prop.projectName}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_PROPERTY_IMAGE;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="sm:hidden absolute top-1 left-1 px-1.5 py-0.2 rounded bg-slate-900/80 text-white text-[9px] font-bold">
                          {prop.bhkType}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-blue-50 text-[#0073E6] text-[10px] font-black uppercase tracking-wider mb-1">
                          {prop.bhkType}
                        </div>
                        <h4 className="text-sm font-bold text-[#172033] group-hover:text-[#0073E6] transition-colors truncate">
                          {prop.projectName}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5 font-['Poppins'] truncate">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                          <span className="truncate">{prop.localityName}</span>
                          <span className="mx-1 text-slate-300">•</span>
                          <span className="shrink-0">{prop.superBuiltUpSqft} sqft</span>
                        </p>
                        <div className="sm:hidden mt-1 flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-[#172033]">
                            {formatPriceLakhsOrCrores(prop.askingPriceInr)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-['Poppins']">
                            ₹{prop.pricePerSqft.toLocaleString('en-IN')}/sqft
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-3 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100">
                      <div className="hidden sm:block text-right">
                        <span className="text-sm font-extrabold text-[#172033] block">
                          {formatPriceLakhsOrCrores(prop.askingPriceInr)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-['Poppins']">
                          ₹{prop.pricePerSqft.toLocaleString('en-IN')}/sqft
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                        <a
                          href={`/property/${prop.id}`}
                          onClick={() => {
                            if (onSelectProperty) onSelectProperty(prop.id);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-98"
                        >
                          <span>View Property</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRemove(prop.id)}
                          className="p-2.5 sm:p-2 rounded-xl border border-slate-200 sm:border-transparent text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove from favorites"
                          aria-label="Remove from favorites"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Direct CTA to BuyMyGhar */}
                <div className="pt-3 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      redirectToBuyMyGhar();
                    }}
                    className="w-full py-3 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[#0073E6] text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer active:scale-98"
                  >
                    <span>Browse 200+ Verified Flats on BuyMyGhar.in</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
