import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X, 
  User, 
  LayoutDashboard, 
  Phone,
  ArrowRight,
  ChevronDown,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAuthProfile } from '../../types/user';

interface HeaderProps {
  user?: UserAuthProfile | null;
  onPostPropertyClick: () => void;
  onLoginClick: () => void;
  onDashboardClick?: () => void;
  onTabClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
  onSelectLocality?: (locality: string) => void;
  onSelectBhk?: (bhk: string) => void;
  onSearchQuery?: (query: string) => void;
  onFavoritesClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onPostPropertyClick,
  onLoginClick,
  onDashboardClick,
  onTabClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToHeroValuation = () => {
    const el = document.getElementById('hero-valuation-card') || document.getElementById('hero-valuation-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const firstInput = el.querySelector('input, select') as HTMLElement;
      if (firstInput) setTimeout(() => firstInput.focus(), 350);
    } else {
      onPostPropertyClick();
    }
  };

  const handleNavClick = (target: string) => {
    setMobileMenuOpen(false);
    if (target === 'buyers') {
      const el = document.getElementById('listings');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.hash = '#listings';
    } else if (target === 'owners') {
      scrollToHeroValuation();
    } else if (target === 'societies') {
      const el = document.getElementById('popular-societies') || document.getElementById('listings');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.hash = '#listings';
    } else if (target === 'how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.hash = '#how-it-works';
    } else if (target === 'faqs') {
      const el = document.getElementById('faqs') || document.getElementById('faq');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.location.hash = '#/faqs';
    } else if (target === 'about') {
      onTabClick('ABOUT');
    } else if (target === 'contact') {
      onTabClick('CONTACT');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs font-['Montserrat',sans-serif] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Brand Logo & Bengaluru Subtitle (Matching Reference Image) */}
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className="flex items-center space-x-2.5 focus:outline-hidden group"
            title="SellMyGhar.in - Home"
          >
            {/* Dual-color House Icon: Blue Roof & Orange Facade */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 sm:w-9 sm:h-9" viewBox="0 0 36 36" fill="none">
                {/* Roof in Blue */}
                <path d="M18 3L4 14H8V30H28V14H32L18 3Z" fill="#0073E6"/>
                {/* Facade cutout in Amber/Orange */}
                <path d="M14 18H22V30H14V18Z" fill="#F97316"/>
                <path d="M18 10L10 16.5V28H14V17H22V28H26V16.5L18 10Z" fill="#FFFFFF"/>
                <path d="M16 20H20V30H16V20Z" fill="#F97316"/>
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline">
                <span className="text-slate-900 font-extrabold text-xl sm:text-2xl tracking-tight">SellMyGhar</span>
                <span className="text-[#0073E6] font-extrabold text-lg sm:text-xl">.in</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 tracking-wide">
                Bengaluru Apartment Resale
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links (Matching Reference Image) */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs sm:text-sm font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => handleNavClick('buyers')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>For Buyers</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('owners')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer flex items-center space-x-1"
            >
              <span>For Owners</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('societies')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              Popular Societies
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('how-it-works')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              How It Works
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('faqs')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              FAQs
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('about')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              About Us
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="py-2 hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              Contact Us
            </button>
          </nav>

          {/* Right Action Items: Phone & Primary Button */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            
            {/* Phone Number */}
            <a 
              href="tel:+918217873708" 
              className="hidden md:inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-800 hover:text-[#0073E6] transition-colors"
              title="Call SellMyGhar RM Desk"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0073E6]">
                <Phone className="w-3.5 h-3.5 fill-current" />
              </div>
              <span>+91 90360 12345</span>
            </a>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={scrollToHeroValuation}
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0073E6] hover:bg-[#005BB5] shadow-xs hover:shadow-md transition-all cursor-pointer group"
            >
              <span>Get Free Valuation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* User Profile / Dashboard / Login */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 text-xs"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900">{user.name || 'User'}</p>
                        <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      </div>

                      {onDashboardClick && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onDashboardClick();
                          }}
                          className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center space-x-2 cursor-pointer font-medium"
                        >
                          <LayoutDashboard className="w-4 h-4 text-blue-600" />
                          <span>Dashboard</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          window.location.href = '/api/auth/logout';
                        }}
                        className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center space-x-2 cursor-pointer font-medium"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="hidden md:inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3"
          >
            <div className="grid grid-cols-1 gap-1 text-sm font-semibold text-slate-800">
              <button
                type="button"
                onClick={() => handleNavClick('buyers')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                For Buyers
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('owners')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                For Owners
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('societies')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Popular Societies
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('how-it-works')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                How It Works
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('faqs')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                FAQs
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('about')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                About Us
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('contact')}
                className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Contact Us
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  scrollToHeroValuation();
                }}
                className="w-full py-3 rounded-xl bg-[#0073E6] text-white font-bold text-center text-sm shadow-sm"
              >
                Get Free Valuation →
              </button>

              <a 
                href="tel:+918217873708" 
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold text-center text-xs flex items-center justify-center space-x-2"
              >
                <Phone className="w-3.5 h-3.5 text-[#0073E6]" />
                <span>Call RM Desk: +91 90360 12345</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
