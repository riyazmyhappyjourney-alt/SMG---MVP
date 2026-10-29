import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  User, 
  LayoutDashboard, 
  Menu, 
  X, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { UserAuthProfile } from '../../types/user';

interface HeaderProps {
  user?: UserAuthProfile | null;
  onPostPropertyClick?: () => void;
  onLoginClick?: () => void;
  onDashboardClick?: () => void;
  onTabClick?: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
  onFavoritesClick?: () => void;
  onSearchQuery?: (query: string) => void;
  onSelectLocality?: (locality: string) => void;
  onSelectBhk?: (bhk: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLoginClick,
  onDashboardClick,
  onPostPropertyClick,
  onTabClick
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToValuation = () => {
    setMobileMenuOpen(false);
    const el = document.getElementById('hero-valuation-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0073E6] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center">
                SellMyGhar<span className="text-[#0073E6]">.in</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block leading-none">
                Bengaluru Apartment Resale
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Matching Image 1 Wireframe) */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => scrollToSection('why-sellmyghar')}
              className="hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              Why SellMyGhar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('popular-societies')}
              className="hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              Popular Societies
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('reviews')}
              className="hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              What Owners Say
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faqs')}
              className="hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              FAQs
            </button>
          </nav>

          {/* Right Action Desk & Valuation Button */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Direct Phone Call Pill */}
            <a
              href="tel:+918217873708"
              className="flex items-center space-x-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-[#0073E6] border border-sky-100 rounded-xl text-xs font-bold transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>+91 8217873708</span>
            </a>

            {/* User Profile / Login */}
            {user ? (
              <button
                type="button"
                onClick={onDashboardClick}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-[#0073E6]" />
                <span className="truncate max-w-[120px]">{user.displayName || 'Dashboard'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Owner Login
              </button>
            )}

            {/* Primary Action Button: Get Free Valuation */}
            <button
              type="button"
              onClick={scrollToValuation}
              className="px-4 py-2.5 bg-[#0073E6] hover:bg-[#005BB5] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Get Free Valuation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center space-x-2">
            <a
              href="tel:+918217873708"
              className="p-2 bg-sky-50 text-[#0073E6] rounded-xl"
              aria-label="Call RM Desk"
            >
              <Phone className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-5 space-y-4 shadow-xl">
          <div className="flex flex-col space-y-3 text-sm font-bold text-slate-800">
            <button
              type="button"
              onClick={() => scrollToSection('why-sellmyghar')}
              className="text-left py-2 hover:text-[#0073E6]"
            >
              Why SellMyGhar
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('popular-societies')}
              className="text-left py-2 hover:text-[#0073E6]"
            >
              Popular Societies
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 hover:text-[#0073E6]"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('reviews')}
              className="text-left py-2 hover:text-[#0073E6]"
            >
              What Owners Say
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faqs')}
              className="text-left py-2 hover:text-[#0073E6]"
            >
              FAQs
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2.5">
            <button
              type="button"
              onClick={scrollToValuation}
              className="w-full py-3 bg-[#0073E6] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md"
            >
              <span>Get Free Valuation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onDashboardClick) onDashboardClick();
                }}
                className="w-full py-2.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold text-center"
              >
                Go to Owner Dashboard
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onLoginClick) onLoginClick();
                }}
                className="w-full py-2.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold text-center"
              >
                Owner Login
              </button>
            )}

            <a
              href="tel:+918217873708"
              className="w-full py-2.5 text-center text-xs font-bold text-[#0073E6] flex items-center justify-center space-x-1.5"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Direct Desk: +91 8217873708</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
