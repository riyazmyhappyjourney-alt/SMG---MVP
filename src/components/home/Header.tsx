import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import { Menu, X, User, LayoutDashboard } from 'lucide-react';
import { UserAuthProfile } from '../../types/user';

interface HeaderProps {
  user?: UserAuthProfile | null;
  onPostPropertyClick: () => void;
  onLoginClick: () => void;
  onDashboardClick?: () => void;
  onTabClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onPostPropertyClick,
  onLoginClick,
  onDashboardClick,
  onTabClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    setMobileMenuOpen(false);
    onTabClick(tab);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-xs font-['Montserrat']">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo */}
          <div className="flex items-center">
            <a href="#" className="flex items-center space-x-2 focus:outline-hidden">
              <Logo height={40} />
            </a>
          </div>

          {/* Desktop Navigation Tabs (Targeted to Owners & Buyers) */}
          <nav className="hidden lg:flex items-center space-x-7 text-xs sm:text-sm font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => handleNav('SELL')}
              className="text-[#244B8F] hover:text-[#1B3A70] transition-colors cursor-pointer py-1 font-bold flex items-center space-x-1"
            >
              <span>For Owners</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-blue-100 text-[#244B8F] rounded-full font-extrabold uppercase">
                Sell Flat
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('BUY')}
              className="hover:text-[#244B8F] transition-colors cursor-pointer py-1"
            >
              For Buyers
            </button>
            <button
              type="button"
              onClick={() => handleNav('ABOUT')}
              className="hover:text-[#244B8F] transition-colors cursor-pointer py-1"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => handleNav('CONTACT')}
              className="hover:text-[#244B8F] transition-colors cursor-pointer py-1"
            >
              Contact
            </button>
          </nav>

          {/* Right Header Actions (Exact 99acres Style: Post property FREE + Dashboard / Login) */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-4">
            
            {/* Post property FREE button (Authentic real-estate style) */}
            <button
              type="button"
              onClick={onPostPropertyClick}
              className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
            >
              <span>Post property</span>
              <span className="ml-2 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white rounded">
                FREE
              </span>
            </button>

            {/* If user logged in, show Dashboard Button, else Login / Register */}
            {user ? (
              <button
                type="button"
                onClick={onDashboardClick}
                className="inline-flex items-center space-x-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#244B8F] rounded-lg text-xs font-bold border border-blue-200 transition-colors cursor-pointer shadow-2xs"
              >
                <LayoutDashboard className="w-4 h-4 text-[#244B8F]" />
                <span>My Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#244B8F] transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>Login / Register</span>
              </button>
            )}
          </div>

          {/* Mobile Right Bar (< 768px) */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              type="button"
              onClick={onPostPropertyClick}
              className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold text-slate-900 bg-white border border-slate-300 shadow-xs"
            >
              <span>Post</span>
              <span className="ml-1 px-1 py-0.2 text-[8px] font-black bg-emerald-600 text-white rounded">
                FREE
              </span>
            </button>
            
            {user && onDashboardClick && (
              <button
                type="button"
                onClick={onDashboardClick}
                className="p-1.5 rounded-md bg-blue-50 text-[#244B8F] border border-blue-200 text-xs font-bold"
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-700 hover:text-slate-900 focus:outline-hidden"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            <button
              type="button"
              onClick={() => handleNav('SELL')}
              className="text-left py-2 px-3 text-[#244B8F] bg-blue-50 rounded-md font-bold flex items-center justify-between"
            >
              <span>For Owners (Sell Flat)</span>
              <span className="text-[10px] bg-[#244B8F] text-white px-2 py-0.5 rounded font-black">
                FREE LISTING
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleNav('BUY')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-md"
            >
              For Buyers
            </button>
            <button
              type="button"
              onClick={() => handleNav('ABOUT')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-md"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => handleNav('CONTACT')}
              className="text-left py-2 px-3 hover:bg-slate-50 rounded-md"
            >
              Contact
            </button>
            
            {user && onDashboardClick ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onDashboardClick();
                }}
                className="text-left py-2 px-3 text-[#244B8F] font-bold flex items-center space-x-2 border-t border-slate-100 pt-3"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>My Seller Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="text-left py-2 px-3 text-slate-700 font-bold flex items-center space-x-2 border-t border-slate-100 pt-3"
              >
                <User className="w-4 h-4" />
                <span>Login / Register</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

