import React, { useState, useEffect } from 'react';
import { X, Heart, Building2, MapPin, Trash2, ArrowRight, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getFavoritePropertyIds, toggleFavoriteProperty, clearAllFavorites } from '../../utils/favoritesStore';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-['Montserrat']">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-left my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#172033] text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">My Saved Properties</h3>
                <p className="text-xs text-slate-300">
                  {favoriteIds.length} {favoriteIds.length === 1 ? 'property' : 'properties'} saved for comparison
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {favoriteIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs text-slate-300 hover:text-rose-400 underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-8 h-8 border-2 border-[#244B8F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs font-semibold">Loading saved properties...</span>
              </div>
            ) : favoriteListings.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Saved Properties Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-['Poppins']">
                  Click the heart icon on any property card to save it here for quick access and comparison.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 px-5 py-2 rounded-xl bg-[#244B8F] text-white text-xs font-bold hover:bg-[#1B396E] transition-colors cursor-pointer"
                >
                  Explore Bengaluru Flats
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {favoriteListings.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-[#244B8F]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={prop.image}
                          alt={prop.projectName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div>
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#244B8F] text-[10px] font-black uppercase tracking-wider">
                          {prop.bhkType}
                        </span>
                        <h4 className="text-sm font-bold text-[#172033] mt-0.5 group-hover:text-[#244B8F] transition-colors">
                          {prop.projectName}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5 font-['Poppins']">
                          <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                          <span>{prop.localityName}</span>
                          <span className="mx-1.5 text-slate-300">•</span>
                          <span>{prop.superBuiltUpSqft} sqft</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-sm font-extrabold text-[#172033] block">
                          {formatPriceLakhsOrCrores(prop.askingPriceInr)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-['Poppins']">
                          ₹{prop.pricePerSqft.toLocaleString('en-IN')}/sqft
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={`/property/${prop.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            if (onSelectProperty) onSelectProperty(prop.id);
                            onClose();
                          }}
                          className="px-3.5 py-2 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-colors inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <span>View Property</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleRemove(prop.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Remove from favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
