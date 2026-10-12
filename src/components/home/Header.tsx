import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../brand/Logo';
import { 
  Menu, 
  X, 
  User, 
  LayoutDashboard, 
  Home, 
  ChevronDown, 
  Search, 
  MapPin, 
  Crosshair, 
  Mic, 
  Building2, 
  Layers, 
  ShieldCheck, 
  CheckCircle2, 
  BookOpen, 
  Sparkles,
  ArrowRight
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
  onOpenGuide?: (guideId: string) => void;
  onSearchQuery?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onPostPropertyClick,
  onLoginClick,
  onDashboardClick,
  onTabClick,
  onSelectLocality,
  onSelectBhk,
  onOpenGuide,
  onSearchQuery,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'SELL' | 'BUY' | 'ABOUT' | 'CONTACT' | 'GUIDE'>('SELL');
  const [hoveredTab, setHoveredTab] = useState<'SELL' | 'BUY' | 'ABOUT' | 'CONTACT' | 'GUIDE' | null>(null);
  
  // Housing.com inspired Mega-Menu open state
  const [openMegaMenu, setOpenMegaMenu] = useState<'BUY' | 'SELL' | 'GUIDE' | null>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 99acres inspired Scrolled Sticky Compact Header state
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrolledQuery, setScrolledQuery] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('Bengaluru East');
  const [isCorridorDropdownOpen, setIsCorridorDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show compact sticky search header when scrolled past the hero banner
      const scrollThreshold = 360;
      setIsScrolled(window.scrollY > scrollThreshold);
      if (window.scrollY > scrollThreshold) {
        setOpenMegaMenu(null);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setOpenMegaMenu(null);
    onTabClick(tab);
  };

  const handleMouseEnterTab = (tabKey: 'BUY' | 'SELL' | 'GUIDE' | 'ABOUT' | 'CONTACT') => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setHoveredTab(tabKey);
    if (tabKey === 'BUY' || tabKey === 'SELL' || tabKey === 'GUIDE') {
      setOpenMegaMenu(tabKey);
    } else {
      setOpenMegaMenu(null);
    }
  };

  const handleMouseLeaveNav = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setHoveredTab(null);
      setOpenMegaMenu(null);
    }, 200);
  };

  const handleScrolledSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchQuery) {
      onSearchQuery(scrolledQuery);
    }
    const el = document.getElementById('listings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* =========================================================================
          1. PRIMARY HEADER (Sticky Top Header with Housing.com Mega-Menu)
         ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-md border-b border-slate-200/90 shadow-xs font-['Montserrat']">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Brand Logo */}
            <div className="flex items-center">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('SELL');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center space-x-2 focus:outline-hidden"
              >
                <Logo height={40} />
              </a>
            </div>

            {/* Desktop Navigation Tabs with Interactive Mega-Menu (Apartments & Flats Only) */}
            <nav 
              onMouseLeave={handleMouseLeaveNav}
              className="hidden lg:flex items-center space-x-7 text-xs sm:text-sm font-semibold text-slate-700 relative"
            >
              {/* 1. For Buyers (with Housing.com style mega-menu dropdown) */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnterTab('BUY')}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenMegaMenu(openMegaMenu === 'BUY' ? null : 'BUY');
                    onTabClick('BUY');
                  }}
                  className={`relative py-2.5 px-1 transition-colors cursor-pointer flex items-center space-x-1 ${
                    openMegaMenu === 'BUY' || activeTab === 'BUY' ? 'text-[#244B8F] font-bold' : 'text-slate-600 hover:text-[#244B8F]'
                  }`}
                >
                  <span>For Buyers</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMegaMenu === 'BUY' ? 'rotate-180 text-[#244B8F]' : 'text-slate-400'}`} />
                  
                  {(openMegaMenu === 'BUY' || activeTab === 'BUY') && (
                    <motion.div
                      layoutId="headerNavIndicator"
                      className="absolute bottom-0 inset-x-0 mx-auto h-[2.5px] rounded-full bg-[#244B8F]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </button>
              </div>

              {/* 2. For Owners (Sell Flat with mega-menu) */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnterTab('SELL')}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenMegaMenu(openMegaMenu === 'SELL' ? null : 'SELL');
                    onTabClick('SELL');
                  }}
                  className={`relative py-2.5 px-1 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    openMegaMenu === 'SELL' || activeTab === 'SELL' ? 'text-[#244B8F] font-bold' : 'text-slate-600 hover:text-[#244B8F]'
                  }`}
                >
                  <span>For Owners</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 text-[#244B8F] rounded-full font-extrabold uppercase tracking-wider">
                    Sell Flat
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMegaMenu === 'SELL' ? 'rotate-180 text-[#244B8F]' : 'text-slate-400'}`} />

                  {(openMegaMenu === 'SELL' || activeTab === 'SELL') && (
                    <motion.div
                      layoutId="headerNavIndicator"
                      className="absolute bottom-0 inset-x-0 mx-auto h-[2.5px] rounded-full bg-[#244B8F]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </button>
              </div>

              {/* 3. News & Guide (Requested by user) */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnterTab('GUIDE')}
              >
                <button
                  type="button"
                  onClick={() => setOpenMegaMenu(openMegaMenu === 'GUIDE' ? null : 'GUIDE')}
                  className={`relative py-2.5 px-1 transition-colors cursor-pointer flex items-center space-x-1 ${
                    openMegaMenu === 'GUIDE' || activeTab === 'GUIDE' ? 'text-[#244B8F] font-bold' : 'text-slate-600 hover:text-[#244B8F]'
                  }`}
                >
                  <span>News & Guide</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMegaMenu === 'GUIDE' ? 'rotate-180 text-[#244B8F]' : 'text-slate-400'}`} />

                  {openMegaMenu === 'GUIDE' && (
                    <motion.div
                      layoutId="headerNavIndicator"
                      className="absolute bottom-0 inset-x-0 mx-auto h-[2.5px] rounded-full bg-[#244B8F]"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </button>
              </div>

              {/* 4. About */}
              <button
                type="button"
                onClick={() => handleNav('ABOUT')}
                onMouseEnter={() => handleMouseEnterTab('ABOUT')}
                className="relative py-2.5 px-1 transition-colors cursor-pointer text-slate-600 hover:text-[#244B8F]"
              >
                <span>About</span>
              </button>

              {/* 5. Contact */}
              <button
                type="button"
                onClick={() => handleNav('CONTACT')}
                onMouseEnter={() => handleMouseEnterTab('CONTACT')}
                className="relative py-2.5 px-1 transition-colors cursor-pointer text-slate-600 hover:text-[#244B8F]"
              >
                <span>Contact</span>
              </button>
            </nav>

            {/* Right Header Actions */}
            <div className="hidden md:flex items-center space-x-3 sm:space-x-4">
              
              {/* Post property FREE button with Home icon */}
              <button
                type="button"
                onClick={onPostPropertyClick}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
              >
                <Home className="w-3.5 h-3.5 mr-1.5 text-[#244B8F] group-hover:scale-110 transition-transform" />
                <span>Post property</span>
                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white rounded">
                  FREE
                </span>
              </button>

              {/* Dashboard / Login */}
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

            {/* Mobile Hamburger Toggle */}
            <div className="flex md:hidden items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-slate-700 hover:text-slate-900 focus:outline-hidden cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* =====================================================================
            HOUSING.COM STYLE MEGA-MENU DROPDOWN (Strictly Apartments & Flats)
           ===================================================================== */}
        <AnimatePresence>
          {openMegaMenu && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onMouseEnter={() => {
                if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
              }}
              onMouseLeave={handleMouseLeaveNav}
              className="absolute left-0 right-0 top-full bg-white border-b border-slate-200/90 shadow-2xl z-50 text-left font-['Montserrat']"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
                
                {/* FOR BUYERS MEGA MENU */}
                {openMegaMenu === 'BUY' && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    
                    {/* Column 1: Property Type (Apartments & Flats ONLY, as requested) */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Property Type (Bengaluru)
                      </div>
                      <div className="space-y-2">
                        {[
                          { title: 'Gated Society Flats', sub: 'Verified gated communities', icon: Building2 },
                          { title: 'High-Rise Apartments', sub: '10+ floor residential towers', icon: Layers },
                          { title: 'Township Resale Flats', sub: 'Self-contained communities', icon: ShieldCheck },
                          { title: 'Luxury Penthouses', sub: 'Top-floor panoramic homes', icon: Sparkles },
                        ].map((item, i) => {
                          const Icon = item.icon;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setOpenMegaMenu(null);
                                onTabClick('BUY');
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-start space-x-3 group cursor-pointer"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#244B8F] flex items-center justify-center shrink-0 group-hover:bg-[#244B8F] group-hover:text-white transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-800 group-hover:text-[#244B8F] transition-colors">
                                  {item.title}
                                </div>
                                <div className="text-[10px] text-slate-400 font-['Poppins']">
                                  {item.sub}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column 2: Popular Bengaluru Corridors */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Popular Bengaluru Areas
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                        {[
                          'Whitefield',
                          'Sarjapur Road',
                          'Hebbal',
                          'Thanisandra',
                          'Bellandur (ORR)',
                          'HSR Layout',
                          'Indiranagar',
                          'JP Nagar',
                          'Yelahanka',
                          'Hennur Road'
                        ].map((area, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setOpenMegaMenu(null);
                              if (onSelectLocality) onSelectLocality(area);
                              const el = document.getElementById('listings');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="text-left py-1.5 px-2 rounded-lg hover:bg-blue-50 hover:text-[#244B8F] text-slate-700 transition-colors cursor-pointer text-xs"
                          >
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Search by BHK */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                        Search by BHK
                      </div>
                      <div className="space-y-1.5 text-xs font-medium">
                        {[
                          { bhk: '1BHK', label: '1 BHK Flats for Sale' },
                          { bhk: '2BHK', label: '2 BHK Flats for Sale' },
                          { bhk: '2.5BHK', label: '2.5 BHK Flats for Sale' },
                          { bhk: '3BHK', label: '3 BHK Flats for Sale' },
                          { bhk: '4BHK+', label: '4 BHK+ Luxury Flats' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setOpenMegaMenu(null);
                              if (onSelectBhk) onSelectBhk(item.bhk);
                              const el = document.getElementById('listings');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full text-left py-1.5 px-2.5 rounded-lg hover:bg-blue-50 hover:text-[#244B8F] text-slate-700 transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{item.label}</span>
                            <ArrowRight className="w-3 h-3 text-slate-300" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Column 4: Popular Searches */}
                    <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                        Curated Resale
                      </div>
                      <div className="space-y-2 text-xs">
                        {[
                          'Kaveri 2.0 Benchmarked Flats',
                          'Direct Owner Resale (Zero Brokerage)',
                          'Ready-to-Move Gated Flats',
                          'OC & CC Verified Resale',
                          'Near Tech Parks (ORR / Whitefield)'
                        ].map((search, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setOpenMegaMenu(null);
                              const el = document.getElementById('listings');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="w-full text-left py-1 px-1.5 text-slate-600 hover:text-[#244B8F] transition-colors cursor-pointer flex items-center space-x-1.5 font-medium"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]" />
                            <span>{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* FOR OWNERS MEGA MENU */}
                {openMegaMenu === 'SELL' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
                      <h4 className="text-sm font-bold text-[#244B8F]">Sell Your Flat in 45 Days</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-['Poppins']">
                        Assisted residential resale with Kaveri 2.0 deed benchmarking and pre-screened buyers across Bengaluru.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMegaMenu(null);
                          onTabClick('SELL');
                        }}
                        className="mt-2 px-4 py-2 bg-[#244B8F] text-white text-xs font-bold rounded-lg hover:bg-[#1B396E] transition-colors cursor-pointer inline-flex items-center space-x-1"
                      >
                        <span>Start Selling</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-sm font-bold text-slate-800">Free Kaveri 2.0 Valuation</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-['Poppins']">
                        Get authentic government deed transaction benchmarks for your exact society and floor.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMegaMenu(null);
                          onTabClick('SELL');
                        }}
                        className="text-xs font-bold text-[#244B8F] hover:underline"
                      >
                        Request Society Valuation →
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="text-sm font-bold text-slate-800">Holding Cost Calculator</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-['Poppins']">
                        Calculate how much you lose monthly in maintenance and foregone rent while your flat sits unsold.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMegaMenu(null);
                          const el = document.getElementById('calculator');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-bold text-[#244B8F] hover:underline"
                      >
                        Open Holding Calculator →
                      </button>
                    </div>
                  </div>
                )}

                {/* NEWS & GUIDE MEGA MENU */}
                {openMegaMenu === 'GUIDE' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMegaMenu(null);
                        if (onOpenGuide) onOpenGuide('kaveri-2-benchmarking');
                      }}
                      className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#244B8F] hover:bg-blue-50/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#244B8F] uppercase mb-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Kaveri 2.0 Guide</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#244B8F] transition-colors">
                        Bengaluru Guidance Value & Registry Guide 2026
                      </h4>
                      <p className="text-xs text-slate-500 font-['Poppins'] mt-1 line-clamp-2">
                        How Karnataka stamps and registration benchmarks guidance values by flat SBUA and floor.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMegaMenu(null);
                        if (onOpenGuide) onOpenGuide('title-diligence-checklist');
                      }}
                      className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#244B8F] hover:bg-blue-50/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-emerald-700 uppercase mb-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Legal Due Diligence</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#244B8F] transition-colors">
                        30-Year Parent Title & EC Form 15 Checklist
                      </h4>
                      <p className="text-xs text-slate-500 font-['Poppins'] mt-1 line-clamp-2">
                        Essential statutory documents required before selling or buying a Bengaluru apartment.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenMegaMenu(null);
                        if (onOpenGuide) onOpenGuide('holding-cost-guide');
                      }}
                      className="text-left p-4 rounded-xl border border-slate-200 hover:border-[#244B8F] hover:bg-blue-50/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center space-x-1.5 text-[11px] font-bold text-amber-700 uppercase mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Financial Insight</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#244B8F] transition-colors">
                        Real Holding Cost of an Unsold Apartment
                      </h4>
                      <p className="text-xs text-slate-500 font-['Poppins'] mt-1 line-clamp-2">
                        Calculate maintenance and foregone rental drain when waiting on traditional brokers.
                      </p>
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                For Buyers (Verified Flats)
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenGuide) onOpenGuide('kaveri-2-benchmarking');
                }}
                className="text-left py-2 px-3 hover:bg-slate-50 rounded-md flex items-center justify-between"
              >
                <span>News & Guide</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  Kaveri 2.0
                </span>
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

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPostPropertyClick();
                }}
                className="text-left py-2 px-3 text-[#172033] bg-slate-100 hover:bg-slate-200 rounded-md font-bold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Home className="w-4 h-4 text-[#244B8F]" />
                  <span>Post property</span>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-black">
                  FREE
                </span>
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

      {/* =========================================================================
          2. SCROLLED STICKY HEADER (99acres Inspired Design from Image 1)
             Slides down smoothly with animation when user scrolls past hero!
         ========================================================================= */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed top-0 inset-x-0 z-50 bg-[#244B8F] text-white shadow-xl border-b border-blue-900/40 font-['Montserrat']"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-6">
                
                {/* Brand Logo & Corridor Picker on Left */}
                <div className="flex items-center space-x-3 shrink-0">
                  <a 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center space-x-1.5 focus:outline-hidden"
                  >
                    <span className="text-lg font-black tracking-tight text-white flex items-center space-x-1">
                      <span>SellMyGhar</span>
                      <span className="text-blue-300 font-normal text-xs">.in</span>
                    </span>
                  </a>

                  {/* Corridor Selector (99acres style "Buy in Bangalore East ⌵") */}
                  <div className="relative hidden md:block">
                    <button
                      type="button"
                      onClick={() => setIsCorridorDropdownOpen(!isCorridorDropdownOpen)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Buy in {selectedCorridor}</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {isCorridorDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs">
                        {[
                          'Bengaluru East',
                          'Bengaluru South',
                          'Bengaluru North',
                          'Central Bengaluru',
                          'All Bengaluru Corridors'
                        ].map((corr, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedCorridor(corr);
                              setIsCorridorDropdownOpen(false);
                              if (onSelectLocality && corr !== 'All Bengaluru Corridors') {
                                onSelectLocality(corr.replace('Bengaluru ', ''));
                              }
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-blue-50 hover:text-[#244B8F] font-medium"
                          >
                            Buy in {corr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Center Compact Search Bar (Exact 99acres style) */}
                <form 
                  onSubmit={handleScrolledSearch}
                  className="flex-1 max-w-2xl bg-white rounded-lg shadow-inner overflow-hidden flex items-center text-xs p-1"
                >
                  {/* Mode Picker */}
                  <div className="hidden sm:flex items-center px-2.5 py-1 text-slate-700 font-bold border-r border-slate-200 shrink-0 space-x-1">
                    <span>Buy</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>

                  {/* Text Input */}
                  <div className="flex-1 px-2.5 flex items-center">
                    <input
                      type="text"
                      value={scrolledQuery}
                      onChange={(e) => setScrolledQuery(e.target.value)}
                      placeholder="Enter Locality / Project / Society / Landmark"
                      className="w-full bg-transparent text-slate-800 placeholder-slate-400 text-xs focus:outline-hidden font-medium"
                    />
                  </div>

                  {/* Actions inside search bar */}
                  <div className="flex items-center space-x-1 shrink-0 text-slate-400 pr-1">
                    <button
                      type="button"
                      title="Current Location"
                      onClick={() => {
                        setScrolledQuery('Whitefield');
                      }}
                      className="p-1.5 hover:text-[#244B8F] transition-colors cursor-pointer hidden sm:block"
                    >
                      <Crosshair className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      type="submit"
                      className="p-2 rounded-md bg-[#244B8F] hover:bg-[#1B3A70] text-white transition-colors cursor-pointer"
                      title="Search"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>

                {/* Right Side Buttons in Scrolled Header */}
                <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                  <button
                    type="button"
                    onClick={onPostPropertyClick}
                    className="inline-flex items-center px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-xs transition-all cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 mr-1 text-[#244B8F]" />
                    <span className="hidden sm:inline">Post property</span>
                    <span className="sm:hidden">Post</span>
                    <span className="ml-1.5 px-1 py-0.2 text-[9px] font-black uppercase bg-emerald-600 text-white rounded">
                      FREE
                    </span>
                  </button>

                  {user ? (
                    <button
                      type="button"
                      onClick={onDashboardClick}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Dashboard"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="Login"
                    >
                      <User className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
