import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Heart,
  Crown,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAuthProfile } from '../../types/user';
import { getFavoritePropertyIds } from '../../utils/favoritesStore';

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
  onSelectLocality,
  onSelectBhk,
  onSearchQuery,
  onFavoritesClick,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL' | 'ABOUT' | 'CONTACT'>('BUY');
  const [hoveredTab, setHoveredTab] = useState<'BUY' | 'SELL' | 'ABOUT' | 'CONTACT' | null>(null);
  
  // Buyer mega-menu internal tab: Buy vs Rent
  const [buyerMode, setBuyerMode] = useState<'BUY' | 'RENT'>('BUY');

  // Housing.com inspired Mega-Menu open state
  const [openMegaMenu, setOpenMegaMenu] = useState<'BUY' | 'SELL' | null>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Favorites count from client store
  const [favoritesCount, setFavoritesCount] = useState<number>(0);

  useEffect(() => {
    setFavoritesCount(getFavoritePropertyIds().length);
    const handleFavUpdate = (e: any) => {
      setFavoritesCount((e.detail?.ids || getFavoritePropertyIds()).length);
    };
    window.addEventListener('smg:favorites-updated', handleFavUpdate);
    return () => window.removeEventListener('smg:favorites-updated', handleFavUpdate);
  }, []);

  // 99acres inspired Scrolled Sticky Compact Header state
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrolledQuery, setScrolledQuery] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('Bengaluru East');
  const [isCorridorDropdownOpen, setIsCorridorDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
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

  const handleBrandHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab('BUY');
    onTabClick('BUY');
    if (window.location.hash) {
      window.location.hash = '';
    }
    if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/#')) {
      window.location.href = '/';
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleMouseEnterTab = (tabKey: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setHoveredTab(tabKey);
    if (tabKey === 'BUY' || tabKey === 'SELL') {
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
          1. PRIMARY HEADER (Royal Blue Design matching Reference Header)
         ========================================================================= */}
      <header className="relative z-40 bg-[#244B8F] text-white border-b border-blue-900/60 shadow-md font-['Montserrat']">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            
            {/* Brand Title (Text-only as requested, reliable home link) */}
            <div className="flex items-center">
              <a 
                href="/" 
                onClick={handleBrandHomeClick}
                className="flex items-baseline space-x-0.5 focus:outline-hidden group cursor-pointer"
                title="SellMyGhar.in - Home"
              >
                <span className="text-white font-extrabold text-xl sm:text-2xl tracking-tight flex items-baseline group-hover:opacity-95 transition-opacity">
                  <span>SellMyGhar</span>
                  <span className="text-white/75 font-semibold text-xs sm:text-sm ml-0.5">.in</span>
                </span>
              </a>
            </div>

            {/* Desktop Navigation Tabs: 1- For Buyers comes FIRST! */}
            <nav 
              onMouseLeave={handleMouseLeaveNav}
              className="hidden lg:flex items-center space-x-7 text-xs sm:text-sm font-semibold text-white/90 relative"
            >
              {/* TAB 1: For Buyers (FIRST as requested!) */}
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
                  className={`relative py-2.5 px-1.5 transition-colors cursor-pointer flex items-center space-x-1 ${
                    openMegaMenu === 'BUY' || activeTab === 'BUY' ? 'text-white font-bold' : 'text-white/85 hover:text-white'
                  }`}
                >
                  <span>For Buyers</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMegaMenu === 'BUY' ? 'rotate-180 text-white' : 'text-white/70'}`} />
                  
                  {/* Interactive animated horizontal line indicator */}
                  {(hoveredTab === 'BUY' || (hoveredTab === null && activeTab === 'BUY')) && (
                    <motion.div
                      layoutId="headerNavInteractiveLine"
                      className="absolute bottom-0 inset-x-0 h-[3px] rounded-full bg-white shadow-xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* TAB 2: For Owners (Sell Flat) */}
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
                  className={`relative py-2.5 px-1.5 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                    openMegaMenu === 'SELL' || activeTab === 'SELL' ? 'text-white font-bold' : 'text-white/85 hover:text-white'
                  }`}
                >
                  <span>For Owners</span>
                  <span className="px-1.5 py-0.5 text-[9px] bg-white/20 text-white rounded-full font-extrabold uppercase tracking-wider">
                    Sell Flat
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openMegaMenu === 'SELL' ? 'rotate-180 text-white' : 'text-white/70'}`} />

                  {/* Interactive animated horizontal line indicator */}
                  {(hoveredTab === 'SELL' || (hoveredTab === null && activeTab === 'SELL')) && (
                    <motion.div
                      layoutId="headerNavInteractiveLine"
                      className="absolute bottom-0 inset-x-0 h-[3px] rounded-full bg-white shadow-xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* TAB 3: About Us (with animated horizontal line indicator) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnterTab('ABOUT')}
              >
                <button
                  type="button"
                  onClick={() => handleNav('ABOUT')}
                  className={`relative py-2.5 px-1.5 transition-colors cursor-pointer ${
                    activeTab === 'ABOUT' ? 'text-white font-bold' : 'text-white/85 hover:text-white'
                  }`}
                >
                  <span>About Us</span>

                  {/* Interactive animated horizontal line indicator */}
                  {(hoveredTab === 'ABOUT' || (hoveredTab === null && activeTab === 'ABOUT')) && (
                    <motion.div
                      layoutId="headerNavInteractiveLine"
                      className="absolute bottom-0 inset-x-0 h-[3px] rounded-full bg-white shadow-xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </div>

              {/* TAB 4: Contact Us (with animated horizontal line indicator) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnterTab('CONTACT')}
              >
                <button
                  type="button"
                  onClick={() => handleNav('CONTACT')}
                  className={`relative py-2.5 px-1.5 transition-colors cursor-pointer ${
                    activeTab === 'CONTACT' ? 'text-white font-bold' : 'text-white/85 hover:text-white'
                  }`}
                >
                  <span>Contact Us</span>

                  {/* Interactive animated horizontal line indicator */}
                  {(hoveredTab === 'CONTACT' || (hoveredTab === null && activeTab === 'CONTACT')) && (
                    <motion.div
                      layoutId="headerNavInteractiveLine"
                      className="absolute bottom-0 inset-x-0 h-[3px] rounded-full bg-white shadow-xs"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              </div>
            </nav>

            {/* Right Header Actions */}
            <div className="hidden md:flex items-center space-x-3 sm:space-x-4">
              
              {/* Client Saved / Favorite Properties Button */}
              <button
                type="button"
                onClick={onFavoritesClick}
                className="relative p-2 rounded-full text-white hover:text-rose-200 hover:bg-white/10 transition-colors cursor-pointer"
                title="View Saved Favorites"
                aria-label="View Saved Properties"
              >
                <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* Post property FREE button with Home icon (Crisp white pill with subtle attention pulse) */}
              <button
                type="button"
                onClick={onPostPropertyClick}
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group animate-post-property-attention relative"
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
                  className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold border border-white/20 transition-colors cursor-pointer shadow-xs"
                >
                  <LayoutDashboard className="w-4 h-4 text-white" />
                  <span>My Dashboard</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-white hover:text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-colors cursor-pointer"
                >
                  <User className="w-4 h-4 text-white/80" />
                  <span>Login / Register</span>
                </button>
              )}
            </div>

            {/* Mobile Hamburger Toggle & Favorite Badge */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                type="button"
                onClick={onFavoritesClick}
                className="p-1.5 text-white relative"
                aria-label="View Favorites"
              >
                <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-white hover:text-white/80 focus:outline-hidden cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* =====================================================================
            MEGA-MENU DROPDOWN: Strictly Apartments & Flats with BUY & RENT Options
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
                
                {/* FOR BUYERS MEGA MENU (With Buy & Rent Options) */}
                {openMegaMenu === 'BUY' && (
                  <div className="space-y-5">
                    {/* Mode Selector: Buy Flats vs Rent Flats */}
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <button
                        type="button"
                        onClick={() => setBuyerMode('BUY')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          buyerMode === 'BUY'
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Buy Flats (Resale)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuyerMode('RENT')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          buyerMode === 'RENT'
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Rent Flats (Rental Inventory)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      {/* Column 1: Property Type (Apartments & Flats ONLY; ShieldCheck for Gated, Crown for Penthouse) */}
                      <div className="space-y-3">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                          {buyerMode === 'BUY' ? 'Property Types for Sale' : 'Rental Property Types'}
                        </div>
                        <div className="space-y-2">
                          {[
                            { title: 'Gated Society Flats', sub: 'Verified gated communities', icon: ShieldCheck },
                            { title: 'High-Rise Apartments', sub: '10+ floor residential towers', icon: Layers },
                            { title: 'Township Flats', sub: 'Self-contained communities', icon: Building2 },
                            { title: 'Luxury Penthouses', sub: 'Top-floor panoramic homes', icon: Crown },
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
                          Popular Bengaluru Corridors
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
                          {buyerMode === 'BUY' ? 'Search by BHK (Sale)' : 'Search by BHK (Rent)'}
                        </div>
                        <div className="space-y-1.5 text-xs font-medium">
                          {[
                            { bhk: '1BHK', label: buyerMode === 'BUY' ? '1 BHK Flats for Sale' : '1 BHK Flats for Rent' },
                            { bhk: '2BHK', label: buyerMode === 'BUY' ? '2 BHK Flats for Sale' : '2 BHK Flats for Rent' },
                            { bhk: '2.5BHK', label: buyerMode === 'BUY' ? '2.5 BHK Flats for Sale' : '2.5 BHK Flats for Rent' },
                            { bhk: '3BHK', label: buyerMode === 'BUY' ? '3 BHK Flats for Sale' : '3 BHK Flats for Rent' },
                            { bhk: '4BHK+', label: buyerMode === 'BUY' ? '4 BHK+ Luxury Flats' : '4 BHK+ Luxury Rentals' },
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

                      {/* Column 4: Curated Listings */}
                      <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                          {buyerMode === 'BUY' ? 'Curated Resale Inventory' : 'Curated Rental Options'}
                        </div>
                        <div className="space-y-2 text-xs">
                          {(buyerMode === 'BUY' ? [
                            'Registered Deed Benchmarked Flats',
                            'Direct Owner Verified Resales',
                            'Ready-to-Move Gated Flats',
                            'OC & CC Verified Resale',
                            'Near Tech Parks (ORR / Whitefield)'
                          ] : [
                            'Gated Community Rentals',
                            'Fully Furnished Rental Flats',
                            'Near Metro & Tech Corridors',
                            'Family Gated Communities',
                            'Direct Owner Lease Agreements'
                          ]).map((search, i) => (
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
                  </div>
                )}

                {/* FOR OWNERS MEGA MENU */}
                {openMegaMenu === 'SELL' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2">
                      <h4 className="text-sm font-bold text-[#244B8F]">Sell Your Flat in 45 Days</h4>
                      <p className="text-xs text-slate-600 leading-relaxed font-['Poppins']">
                        Assisted residential resale with official deed valuation benchmarks and verified buyers across Bengaluru.
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
                      <h4 className="text-sm font-bold text-slate-800">Free Deed Benchmark Valuation</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-['Poppins']">
                        Get authentic government deed transaction benchmarks for your exact society and floor level.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMegaMenu(null);
                          onTabClick('SELL');
                        }}
                        className="text-xs font-bold text-[#244B8F] hover:underline cursor-pointer"
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
                          const el = document.getElementById('holding-calculator') || document.getElementById('calculator');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            window.location.hash = '#/holding-calculator';
                          }
                        }}
                        className="text-xs font-bold text-[#244B8F] hover:underline cursor-pointer"
                      >
                        Open Holding Calculator →
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =========================================================================
            MOBILE MENU DRAWER
           ========================================================================= */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 font-['Montserrat']"
            >
              <div className="space-y-1 font-semibold text-sm">
                <button
                  type="button"
                  onClick={() => handleNav('BUY')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
                >
                  For Buyers
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('SELL')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center justify-between"
                >
                  <span>For Owners</span>
                  <span className="text-[10px] font-bold bg-blue-100 text-[#244B8F] px-2 py-0.5 rounded-full">
                    Sell Flat
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('ABOUT')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
                >
                  About Us
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('CONTACT')}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800"
                >
                  Contact Us
                </button>
                {onFavoritesClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onFavoritesClick();
                    }}
                    className="w-full text-left py-2 px-3 rounded-lg hover:bg-slate-50 text-slate-800 flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <span>My Saved Properties</span>
                    </span>
                    <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      {favoritesCount}
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onPostPropertyClick();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#244B8F] text-white text-xs font-bold flex items-center justify-center space-x-1.5"
                >
                  <Home className="w-4 h-4" />
                  <span>Post Property FREE</span>
                </button>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onDashboardClick) onDashboardClick();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold"
                  >
                    My Dashboard
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLoginClick();
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold"
                  >
                    Login / Register
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* =========================================================================
          2. SCROLLED STICKY HEADER (Reference Image 1: 99acres Royal Blue Compact)
         ========================================================================= */}
      <AnimatePresence>
        {isScrolled && (
          <motion.div
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 inset-x-0 z-50 bg-[#244B8F] text-white shadow-xl border-b border-blue-900/60 font-['Montserrat']"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
              
              {/* Logo & Locality Dropdown */}
              <div className="flex items-center space-x-4 shrink-0">
                <a 
                  href="/" 
                  onClick={handleBrandHomeClick}
                  className="text-white font-extrabold text-base sm:text-lg tracking-tight hover:opacity-90 transition-opacity flex items-baseline cursor-pointer"
                  title="SellMyGhar.in - Home"
                >
                  <span>SellMyGhar</span>
                  <span className="text-white/70 font-semibold text-xs ml-0.5">.in</span>
                </a>

                {/* Corridor Selector Pill */}
                <div className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setIsCorridorDropdownOpen(!isCorridorDropdownOpen)}
                    className="text-xs font-semibold text-white/90 hover:text-white flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <span>Buy in {selectedCorridor}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCorridorDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCorridorDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-48 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs">
                      {['Bengaluru East', 'Bengaluru North', 'Bengaluru South', 'All Bengaluru'].map((corridor) => (
                        <button
                          key={corridor}
                          type="button"
                          onClick={() => {
                            setSelectedCorridor(corridor);
                            setIsCorridorDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-blue-50 hover:text-[#244B8F] font-medium"
                        >
                          Buy in {corridor}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Central Search Bar */}
              <form 
                onSubmit={handleScrolledSearch}
                className="flex-1 max-w-xl hidden sm:flex items-center bg-white rounded-lg shadow-inner overflow-hidden pl-2 pr-1 py-1 text-slate-800"
              >
                <span className="text-xs font-bold text-slate-600 px-2 border-r border-slate-200 flex items-center gap-1 shrink-0">
                  <span>Buy</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>

                <input
                  type="text"
                  value={scrolledQuery}
                  onChange={(e) => setScrolledQuery(e.target.value)}
                  placeholder="Whitefield"
                  className="w-full px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden font-medium"
                />

                <button
                  type="button"
                  onClick={() => setScrolledQuery('Whitefield, Bengaluru')}
                  title="Detect GPS Location"
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>

                <button
                  type="submit"
                  className="p-1.5 bg-[#244B8F] hover:bg-[#1B396E] text-white rounded-md transition-colors ml-1 cursor-pointer shrink-0"
                  aria-label="Submit search"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Right Action Buttons */}
              <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
                {/* Client Saved Favorites */}
                <button
                  type="button"
                  onClick={onFavoritesClick}
                  className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors relative cursor-pointer"
                  title="Saved Properties"
                >
                  <Heart className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-rose-400 text-rose-400' : 'text-white'}`} />
                  {favoritesCount > 0 && (
                    <span className="absolute 0 top-0.5 right-0.5 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                {/* Post Property FREE Button */}
                <button
                  type="button"
                  onClick={onPostPropertyClick}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 shadow-md transition-all cursor-pointer animate-post-property-attention"
                >
                  <Home className="w-3.5 h-3.5 mr-1 text-[#244B8F]" />
                  <span>Post property</span>
                  <span className="ml-1.5 px-1 py-0.2 text-[8px] font-black uppercase bg-emerald-600 text-white rounded">
                    FREE
                  </span>
                </button>

                {/* Account / User Menu */}
                {user ? (
                  <button
                    type="button"
                    onClick={onDashboardClick}
                    className="w-8 h-8 rounded-full border border-white/30 bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
                    title="My Dashboard"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className="w-8 h-8 rounded-full border border-white/30 bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all cursor-pointer"
                    title="Sign In"
                  >
                    <User className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
