import React, { useState, useEffect } from 'react';
import { Home, Compass, Heart, Plus, User } from 'lucide-react';
import { getFavoritePropertyIds } from '../../utils/favoritesStore';
import { UserAuthProfile } from '../../types/user';

export type BottomNavTab = 'HOME' | 'EXPLORE' | 'SAVED' | 'ACTIVITY' | 'PROFILE';

interface MobileBottomNavProps {
  currentTab?: BottomNavTab;
  user?: UserAuthProfile | null;
  onNavigateHome: () => void;
  onNavigateExplore: () => void;
  onOpenSaved: () => void;
  onNavigateActivity: () => void;
  onNavigateProfile: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab = 'HOME',
  user,
  onNavigateHome,
  onNavigateExplore,
  onOpenSaved,
  onNavigateActivity,
  onNavigateProfile,
}) => {
  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  useEffect(() => {
    setFavoritesCount(getFavoritePropertyIds().length);
    const handleFavUpdate = (e: any) => {
      setFavoritesCount((e.detail?.ids || getFavoritePropertyIds()).length);
    };
    window.addEventListener('smg:favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('smg:favorites-updated', handleFavUpdate);
  }, []);

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 w-full max-w-full z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),8px)] overflow-visible"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto items-center px-1 relative overflow-visible">
        {/* 1. Home */}
        <button
          type="button"
          onClick={onNavigateHome}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer select-none ${
            currentTab === 'HOME' ? 'text-[#0073E6]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Home"
        >
          <Home className={`w-5 h-5 transition-transform ${currentTab === 'HOME' ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'HOME' ? 'font-bold text-[#0073E6]' : 'font-medium'}`}>
            Home
          </span>
        </button>

        {/* 2. Explore / Search */}
        <button
          type="button"
          onClick={onNavigateExplore}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer select-none ${
            currentTab === 'EXPLORE' ? 'text-[#0073E6]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Explore Properties"
        >
          <Compass className={`w-5 h-5 transition-transform ${currentTab === 'EXPLORE' ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'EXPLORE' ? 'font-bold text-[#0073E6]' : 'font-medium'}`}>
            Explore
          </span>
        </button>

        {/* 3. Center Raised Floating + Action Button (Seller Post Property) */}
        <div className="relative flex flex-col items-center justify-center overflow-visible">
          <button
            type="button"
            onClick={onNavigateActivity}
            className="w-[52px] h-[52px] -translate-y-4 rounded-full bg-[#0073E6] hover:bg-[#005BB5] text-white shadow-xl border-4 border-white flex items-center justify-center cursor-pointer active:scale-95 transition-all z-10 shrink-0"
            aria-label="Post Property"
            title="Post Property"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* 4. Saved / Shortlist */}
        <button
          type="button"
          onClick={onOpenSaved}
          className={`relative flex flex-col items-center justify-center py-1 transition-colors cursor-pointer select-none ${
            currentTab === 'SAVED' ? 'text-[#0073E6]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Saved Properties"
        >
          <div className="relative">
            <Heart className={`w-5 h-5 transition-transform ${currentTab === 'SAVED' ? 'scale-105 fill-[#0073E6] stroke-[2.2]' : 'stroke-[1.8]'}`} />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center leading-none">
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'SAVED' ? 'font-bold text-[#0073E6]' : 'font-medium'}`}>
            Saved
          </span>
        </button>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={onNavigateProfile}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer select-none ${
            currentTab === 'PROFILE' ? 'text-[#0073E6]' : 'text-slate-500 hover:text-slate-800'
          }`}
          aria-label="Profile & Account"
        >
          <div className="relative">
            <User className={`w-5 h-5 transition-transform ${currentTab === 'PROFILE' ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'}`} />
            {user && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
            )}
          </div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${currentTab === 'PROFILE' ? 'font-bold text-[#0073E6]' : 'font-medium'}`}>
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
