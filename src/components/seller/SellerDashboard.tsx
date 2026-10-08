import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Eye,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Plus,
  Search,
  RefreshCw,
  Phone,
  LogOut,
  Check,
  X,
  Share2,
  Camera,
  TrendingUp,
  Award,
  Calendar,
  Users,
  Key,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { UserAuthProfile } from '../../types/user';
import {
  SellerPropertyItem,
  DocumentTypeKey,
  PropertyStageEnum
} from '../../types/seller';

interface SellerDashboardProps {
  user: UserAuthProfile | null;
  onPostPropertyClick: () => void;
  onBackToHome: () => void;
  onLogout: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  user,
  onPostPropertyClick,
  onBackToHome,
  onLogout,
}) => {
  // State
  const [properties, setProperties] = useState<SellerPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [intentFilter, setIntentFilter] = useState<'ALL' | 'SELL' | 'RENT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVIEW' | 'VERIFIED' | 'SOLD'>('ALL');
  const [bhkFilter, setBhkFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_DESC' | 'PRICE_ASC' | 'MOST_VIEWS'>('NEWEST');

  // Active view tab (Sidebar navigation)
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'VAULT' | 'TIMELINE' | 'VISITS' | 'DEMAND'>('LISTINGS');

  // Modals
  const [selectedPropertyForDocs, setSelectedPropertyForDocs] = useState<SellerPropertyItem | null>(null);
  const [selectedPropertyForTimeline, setSelectedPropertyForTimeline] = useState<SellerPropertyItem | null>(null);

  // Document upload form inside modal
  const [uploadDocType, setUploadDocType] = useState<DocumentTypeKey>('TITLE_DEED');
  const [uploadFileName, setUploadFileName] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  // Quick Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch properties from backend
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const phoneParam = user?.name?.match(/\d{10}/)?.[0] || '';
      const url = phoneParam ? `/api/properties?phone=${phoneParam}` : '/api/properties';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load properties');
      }
      setProperties(data.properties || []);
    } catch (err: any) {
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [user]);

  // Handle Document Upload simulation
  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyForDocs || !uploadFileName) return;

    setIsUploadingDoc(true);
    try {
      const res = await fetch(`/api/properties/${selectedPropertyForDocs.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: uploadDocType,
          fileName: uploadFileName,
          fileSize: '3.1 MB'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadSuccessMessage(data.message);
      // Optimistic update
      setProperties(prev => prev.map(p => {
        if (p.id === selectedPropertyForDocs.id) {
          return {
            ...p,
            documents: {
              ...p.documents,
              [uploadDocType]: {
                ...p.documents[uploadDocType],
                status: 'IN_REVIEW',
                fileName: uploadFileName,
                uploadedAt: 'Just now',
                legalReviewNote: 'Uploaded by owner. Assigned to SellMyGhar legal diligence desk.'
              }
            }
          };
        }
        return p;
      }));
      setUploadFileName('');
      setTimeout(() => setUploadSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Could not upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Filtered & Sorted Properties
  const filteredProperties = useMemo(() => {
    return properties
      .filter(p => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            p.societyName.toLowerCase().includes(q) ||
            p.locality.toLowerCase().includes(q) ||
            p.referenceId.toLowerCase().includes(q) ||
            p.bhkType.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Intent Filter (SELL vs RENT) reading directly from listing_intent / intent
        const itemIntent = p.listing_intent || p.intent;
        if (intentFilter === 'SELL' && itemIntent !== 'SELL') return false;
        if (intentFilter === 'RENT' && itemIntent !== 'RENT') return false;

        // Status Filter
        if (statusFilter === 'ACTIVE' && p.status !== 'LISTED') return false;
        if (statusFilter === 'REVIEW' && p.status !== 'IN_VERIFICATION' && p.status !== 'DOCS_REQUESTED') return false;
        if (statusFilter === 'VERIFIED' && p.status !== 'VERIFIED') return false;
        if (statusFilter === 'SOLD' && p.status !== 'SOLD') return false;

        // BHK Filter
        if (bhkFilter !== 'ALL' && !p.bhkType.includes(bhkFilter)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_DESC') {
          const priceA = (a.listing_intent || a.intent) === 'SELL' ? (a.askingPriceInr || 0) : (a.monthlyRentInr || 0);
          const priceB = (b.listing_intent || b.intent) === 'SELL' ? (b.askingPriceInr || 0) : (b.monthlyRentInr || 0);
          return priceB - priceA;
        }
        if (sortBy === 'PRICE_ASC') {
          const priceA = (a.listing_intent || a.intent) === 'SELL' ? (a.askingPriceInr || 0) : (a.monthlyRentInr || 0);
          const priceB = (b.listing_intent || b.intent) === 'SELL' ? (b.askingPriceInr || 0) : (b.monthlyRentInr || 0);
          return priceA - priceB;
        }
        if (sortBy === 'MOST_VIEWS') return b.viewsCount - a.viewsCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [properties, searchQuery, intentFilter, statusFilter, bhkFilter, sortBy]);

  // Global KPI Counters reading directly from listing_intent / intent
  const kpiStats = useMemo(() => {
    const saleCount = properties.filter(p => (p.listing_intent || p.intent) === 'SELL').length;
    const rentCount = properties.filter(p => (p.listing_intent || p.intent) === 'RENT').length;
    const activeCount = properties.filter(p => p.status === 'LISTED').length;
    const reviewCount = properties.filter(p => p.status === 'IN_VERIFICATION' || p.status === 'DOCS_REQUESTED' || p.status === 'NEW').length;
    const totalViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const totalSiteVisits = properties.reduce((acc, p) => acc + (p.siteVisits?.length || 0), 0);

    // Document compliance count
    let totalDocs = 0;
    let verifiedDocs = 0;
    properties.forEach(p => {
      if (p.documents) {
        Object.values(p.documents).forEach(d => {
          totalDocs++;
          if (d.status === 'VERIFIED') verifiedDocs++;
        });
      }
    });

    return {
      saleCount,
      rentCount,
      activeCount,
      reviewCount,
      totalViews,
      totalSiteVisits,
      verifiedDocs,
      totalDocs
    };
  }, [properties]);

  // Helper formatting for currency
  const formatInr = (amount?: number) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Authoritative 6 Core Operational CRM Milestones
  const amazonMilestones = [
    { key: 'NEW', label: 'New Lead', shortDesc: 'Intake Registered' },
    { key: 'CONTACTED', label: 'Contacted', shortDesc: 'RM Assigned' },
    { key: 'FOLLOW_UP', label: 'Follow Up', shortDesc: 'Diligence in Progress' },
    { key: 'SITE_VISIT', label: 'Site Visit', shortDesc: 'Property Tour' },
    { key: 'NEGOTIATION', label: 'Negotiation', shortDesc: 'Commercial Review' },
    { key: 'CONVERTED', label: 'Converted', shortDesc: 'Deal Finalized' },
  ];

  const getAmazonMilestoneIndex = (property: SellerPropertyItem) => {
    if (property.progressTracker && typeof property.progressTracker.activeIndex === 'number') {
      return property.progressTracker.activeIndex;
    }
    const stage = property.crm_status || property.status;
    switch (stage) {
      case 'NEW': return 0;
      case 'CONTACTED': return 1;
      case 'FOLLOW_UP': return 2;
      case 'SITE_VISIT': return 3;
      case 'NEGOTIATION': return 4;
      case 'CONVERTED': return 5;
      case 'LOST': return -1;
      case 'DOCS_REQUESTED':
      case 'IN_VERIFICATION': return 2;
      case 'VERIFIED':
      case 'LISTED': return 3;
      case 'SOLD': return 5;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVBAR (Exact 99acres style blue bar + branding + customer service) */}
      <header className="bg-[#244B8F] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Logo & Portal Name */}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onBackToHome}
                className="flex items-center space-x-2 text-white hover:opacity-90 transition-opacity cursor-pointer focus:outline-none"
              >
                <div className="bg-white p-1 rounded-md">
                  <Building2 className="w-6 h-6 text-[#244B8F]" />
                </div>
                <div className="text-left">
                  <span className="text-lg font-black tracking-tight block leading-tight">
                    SellMy<span className="text-emerald-400">Ghar</span>
                  </span>
                  <span className="text-[10px] tracking-widest uppercase font-extrabold text-blue-200 block -mt-0.5">
                    Owner Portal • Resale & Rentals
                  </span>
                </div>
              </button>
            </div>

            {/* Middle: Support & RM helpline (Hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-6 text-xs text-blue-100">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Live Status: <strong>Amazon-Style Milestone Tracking Active</strong></span>
              </div>
              <div className="flex items-center space-x-2 border-l border-blue-400/40 pl-6">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Dedicated RM Desk: <strong className="text-white">+91 98450 12345</strong></span>
              </div>
            </div>

            {/* Right: Actions & User Capsule */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* Post Property FREE Button */}
              <button
                type="button"
                onClick={onPostPropertyClick}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post Flat / Rent</span>
                <span className="bg-white/20 px-1 py-0.2 rounded text-[9px] uppercase tracking-wider">FREE</span>
              </button>

              {/* User Dropdown / Profile Badge */}
              <div className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 transition-colors">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <p className="font-bold text-white truncate max-w-[120px]">
                    {user?.name || 'Harish Babu'}
                  </p>
                  <p className="text-[10px] text-blue-200">Verified Owner</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="text-blue-200 hover:text-white p-1 ml-1 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* SUB-HEADER BREADCRUMB & CONTEXT BAR */}
      <div className="bg-white border-b border-slate-200 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-[#244B8F] flex items-center space-x-1 font-medium cursor-pointer"
            >
              <span>Home</span>
            </button>
            <span>/</span>
            <span className="text-slate-800 font-bold">Owner Dashboard</span>
            <span>/</span>
            <span className="text-[#244B8F] font-bold">Resale & Rental Listings</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold text-[11px] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full-Stack Backend Handled • Zero Broker Haggling</span>
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* LEFT SIDEBAR */}
          <aside className="lg:col-span-3 space-y-4">
            
            {/* Owner Profile Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#244B8F] to-[#1B396E]" />
              
              <div className="relative pt-4">
                <div className="w-16 h-16 rounded-full bg-white border-3 border-white shadow-md mx-auto flex items-center justify-center text-xl font-extrabold text-[#244B8F]">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'HB'}
                </div>
                
                <h3 className="font-extrabold text-base text-slate-900 mt-2">
                  {user?.name || 'Harish Babu'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Verified Property Owner (Resale & Rentals)
                </p>
                <div className="mt-2 inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ID & Mobile KYC Verified</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">For Sale</span>
                  <span className="text-base font-extrabold text-[#244B8F]">{kpiStats.saleCount}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">For Rent</span>
                  <span className="text-base font-extrabold text-purple-600">{kpiStats.rentCount}</span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Menu */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Dashboard Sections
                </span>
              </div>
              <nav className="p-2 space-y-1 text-xs font-bold">
                
                <button
                  type="button"
                  onClick={() => setActiveTab('LISTINGS')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'LISTINGS'
                      ? 'bg-blue-50 text-[#244B8F] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="w-4 h-4 text-[#244B8F]" />
                    <span>My Listings (Sale & Rent)</span>
                  </div>
                  <span className="bg-[#244B8F] text-white px-2 py-0.2 rounded-full text-[10px]">
                    {properties.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('TIMELINE')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'TIMELINE'
                      ? 'bg-blue-50 text-[#244B8F] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>Live Amazon-Style Stepper</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full text-[10px]">
                    Dot-by-Dot
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('VISITS')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'VISITS'
                      ? 'bg-blue-50 text-[#244B8F] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Site Visits & RM Escorts</span>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full text-[10px]">
                    {kpiStats.totalSiteVisits}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('VAULT')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'VAULT'
                      ? 'bg-blue-50 text-[#244B8F] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>5 Statutory Deeds Vault</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full text-[10px]">
                    {kpiStats.verifiedDocs}/{kpiStats.totalDocs}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('DEMAND')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'DEMAND'
                      ? 'bg-blue-50 text-[#244B8F] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span>Corridor Price & Rent Index</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

              </nav>
            </div>

            {/* Dedicated Relationship Manager Card */}
            <div className="bg-gradient-to-br from-slate-900 to-[#172033] text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Award className="w-4 h-4" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Assigned Relationship Manager
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Kavitha Ranganathan</h4>
                <p className="text-[11px] text-slate-300">
                  Senior Property & Diligence Lead
                </p>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Handles all buyer & tenant screening, site visit escorts, and Sub-Registrar closing from the backend. Zero spam calls to you.
              </p>
              <a
                href="tel:+919845012345"
                className="inline-flex items-center justify-center w-full py-2 bg-[#244B8F] hover:bg-[#1B396E] text-white rounded-lg text-xs font-bold transition-colors space-x-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call RM: +91 98450 12345</span>
              </a>
            </div>

          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* Top Heading Bar with Intent Selector (Sale vs Rent) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Manage My Properties
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Amazon-style milestone progression, statutory title audit, and scheduled site visits.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={fetchProperties}
                    disabled={loading}
                    className="p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Refresh Listings"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={onPostPropertyClick}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post New Property</span>
                  </button>
                </div>
              </div>

              {/* SALE vs RENTAL Quick Intent Filter Tabs */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIntentFilter('ALL')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intentFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Properties ({properties.length})
                </button>

                <button
                  type="button"
                  onClick={() => setIntentFilter('SELL')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    intentFilter === 'SELL'
                      ? 'bg-[#244B8F] text-white shadow-2xs'
                      : 'bg-blue-50 text-[#244B8F] hover:bg-blue-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Resale / Sale ({kpiStats.saleCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntentFilter('RENT')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    intentFilter === 'RENT'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Rentals ({kpiStats.rentCount})</span>
                </button>
              </div>
            </div>

            {/* 5 SUMMARY KPI CHIPS (Tailored for both Resale and Rentals) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              
              {/* Chip 1: Live on Market */}
              <div 
                onClick={() => setStatusFilter('ACTIVE')}
                className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                  statusFilter === 'ACTIVE' ? 'border-[#244B8F] ring-2 ring-[#244B8F]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-900">
                    {kpiStats.activeCount.toString().padStart(2, '0')}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 mt-1">Live Broadcast</p>
                <span className="text-[10px] text-slate-400">Buyers & Tenants Active</span>
              </div>

              {/* Chip 2: Verification Pending */}
              <div 
                onClick={() => setStatusFilter('REVIEW')}
                className={`bg-white p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs ${
                  statusFilter === 'REVIEW' ? 'border-[#244B8F] ring-2 ring-[#244B8F]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-amber-600">
                    {kpiStats.reviewCount.toString().padStart(2, '0')}
                  </span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 mt-1">Under Diligence</p>
                <span className="text-[10px] text-slate-400">Kaveri portal check</span>
              </div>

              {/* Chip 3: Site Visits */}
              <div 
                onClick={() => setActiveTab('VISITS')}
                className="bg-white p-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-indigo-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-indigo-600">
                    {kpiStats.totalSiteVisits.toString().padStart(2, '0')}
                  </span>
                  <Users className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 mt-1">RM Site Visits</p>
                <span className="text-[10px] text-slate-400">Screened & Escorted</span>
              </div>

              {/* Chip 4: 5 Statutory Deeds */}
              <div 
                onClick={() => setActiveTab('VAULT')}
                className="bg-white p-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-emerald-400"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-emerald-600">
                    {kpiStats.verifiedDocs}/{kpiStats.totalDocs}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 mt-1">Title Deeds</p>
                <span className="text-[10px] text-slate-400">RERA Compliance</span>
              </div>

              {/* Chip 5: Total Views */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-blue-600">
                    {kpiStats.totalViews}
                  </span>
                  <Eye className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-[11px] font-bold text-slate-600 mt-1">Direct Views</p>
                <span className="text-[10px] text-slate-400">Verified Corridor</span>
              </div>

            </div>

            {/* TAB 1: LISTINGS VIEW (Primary Core View with Amazon Stepper on each card) */}
            {activeTab === 'LISTINGS' && (
              <div className="space-y-4">
                
                {/* Search & Filter Toolbar */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Search input */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by society, locality, or SMG ID..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Filter Status Dropdown */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={statusFilter}
                      onChange={(e: any) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#244B8F] cursor-pointer"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="ACTIVE">Status: Live</option>
                      <option value="REVIEW">Status: Under Diligence</option>
                      <option value="VERIFIED">Status: Verified</option>
                      <option value="SOLD">Status: Finalized</option>
                    </select>

                    {/* Filter BHK Dropdown */}
                    <select
                      value={bhkFilter}
                      onChange={(e) => setBhkFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#244B8F] cursor-pointer"
                    >
                      <option value="ALL">BHK: All</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="2.5 BHK">2.5 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="3.5 BHK">3.5 BHK</option>
                      <option value="4 BHK">4 BHK+</option>
                    </select>

                    {/* Sort Dropdown */}
                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#244B8F] cursor-pointer"
                    >
                      <option value="NEWEST">Sort: Newest First</option>
                      <option value="PRICE_DESC">Price: High to Low</option>
                      <option value="PRICE_ASC">Price: Low to High</option>
                      <option value="MOST_VIEWS">Most Viewed</option>
                    </select>

                    {(searchQuery || statusFilter !== 'ALL' || bhkFilter !== 'ALL' || intentFilter !== 'ALL') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setStatusFilter('ALL');
                          setBhkFilter('ALL');
                          setIntentFilter('ALL');
                        }}
                        className="text-xs font-bold text-rose-600 hover:underline px-2 cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                </div>

                {/* Listings Counter Subtitle */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Showing <strong>{filteredProperties.length}</strong> of {properties.length} properties</span>
                  <span className="text-[11px] text-slate-400">All buyer offers & site visits coordinated directly by assigned RM</span>
                </div>

                {/* LISTING CARDS */}
                {loading ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <RefreshCw className="w-8 h-8 text-[#244B8F] animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">Loading your properties...</p>
                  </div>
                ) : filteredProperties.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
                    <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No properties matching filters</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Try clearing filters or search criteria, or post a new flat for verified resale or rental.
                    </p>
                    <button
                      type="button"
                      onClick={onPostPropertyClick}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#244B8F] text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post Property Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProperties.map((property) => {
                      const isRent = (property.listing_intent || property.intent) === 'RENT';
                      const isListed = property.status === 'LISTED';
                      const isLost = Boolean(property.progressTracker?.isLost || property.crm_status === 'LOST' || property.status === 'LOST');
                      const verifiedDocCount = Object.values(property.documents).filter(d => d.status === 'VERIFIED').length;
                      const milestoneActiveIdx = getAmazonMilestoneIndex(property);
                      const activeMilestones = property.progressTracker?.stages || amazonMilestones;

                      return (
                        <div
                          key={property.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                        >
                          {/* Card Top Meta Line */}
                          <div className="bg-slate-50/80 px-4 sm:px-6 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                            <div className="flex items-center space-x-3">
                              {/* Intent Badge */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isRent 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : 'bg-blue-100 text-[#244B8F] border border-blue-200'
                              }`}>
                                {isRent ? '🔑 FOR RENT' : '🏠 FOR RESALE'}
                              </span>

                              <span className="font-mono font-bold text-slate-700">
                                {property.referenceId}
                              </span>
                              <span>•</span>
                              <span>Posted: {new Date(property.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                              <span>•</span>
                              <span>RM: <strong>{property.rmName}</strong></span>
                            </div>

                            {/* Status Pill Badge */}
                            <div className="flex items-center space-x-2">
                              {isLost ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                  <AlertTriangle className="w-3 h-3 text-red-700" />
                                  <span>INQUIRY CLOSED</span>
                                </span>
                              ) : isListed ? (
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                                  <span>{isRent ? 'LIVE FOR RENT' : 'LIVE ON MARKET'}</span>
                                </span>
                              ) : property.status === 'IN_VERIFICATION' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  <span>UNDER DILIGENCE</span>
                                </span>
                              ) : property.status === 'VERIFIED' ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-100 text-[#244B8F] border border-blue-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>TITLE VERIFIED</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-slate-200 text-slate-700">
                                  <span>{property.stageBadgeLabel}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Main Body Grid */}
                          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                            
                            {/* Left: Thumbnail Image + Badges */}
                            <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-slate-100 aspect-4/3 sm:aspect-16/10">
                              <img
                                src={property.photos[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'}
                                alt={property.societyName}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                              
                              {/* Photo counter chip on bottom left */}
                              <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <Camera className="w-3 h-3" />
                                <span>{property.photoCount} Photos</span>
                              </div>

                              {/* Verified RERA Badge on top left */}
                              <div className="absolute top-2.5 left-2.5 bg-[#244B8F] text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm flex items-center space-x-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>{isRent ? 'TENANCY VERIFIED' : 'RERA CHECKED'}</span>
                              </div>
                            </div>

                            {/* Middle: Title, Pricing, Specs */}
                            <div className="md:col-span-5 space-y-2.5">
                              <div>
                                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                                  {property.bhkType} Flat {isRent ? 'for Rent' : 'for Resale'}
                                </h3>
                                <p className="text-xs font-bold text-[#244B8F] mt-0.5">
                                  {property.societyName}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                  <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                  <span>{property.locality}</span>
                                </p>
                              </div>

                              {/* Price Row: Either Resale Price or Monthly Rent */}
                              <div className="flex items-baseline space-x-2 pt-1 border-t border-slate-100">
                                {isRent ? (
                                  <>
                                    <span className="text-xl font-black text-purple-900">
                                      ₹{(property.monthlyRentInr || 45000).toLocaleString('en-IN')}/mo
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      (Deposit: {formatInr(property.securityDepositInr || 200000)})
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xl font-black text-slate-900">
                                      {formatInr(property.askingPriceInr)}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium">
                                      (₹{property.pricePerSqft?.toLocaleString('en-IN')}/sqft)
                                    </span>
                                  </>
                                )}

                                {property.isNegotiable && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Negotiable
                                  </span>
                                )}
                              </div>

                              {/* Specs Grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Built-Up Area</span>
                                  <span className="font-bold text-slate-800">{property.superBuiltUpSqft} sqft</span>
                                  <span className="text-[10px] text-slate-500 block">Carpet: {property.carpetAreaSqft} sqft</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Floor & Facing</span>
                                  <span className="font-bold text-slate-800">Floor {property.unitFloor} of {property.totalFloors}</span>
                                  <span className="text-[10px] text-slate-500 block">{property.facing} Facing</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Column: Performance Scores & View Counts */}
                            <div className="md:col-span-3 bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-3">
                              
                              <div className="grid grid-cols-3 gap-1 text-center">
                                <div>
                                  <span className="text-base font-black text-[#244B8F] block">
                                    {property.visibilityScore}%
                                  </span>
                                  <span className="text-[9px] text-slate-500 uppercase font-bold block leading-tight">
                                    Corridor Match
                                  </span>
                                </div>
                                <div>
                                  <span className="text-base font-black text-emerald-600 block">
                                    {property.completionScore}%
                                  </span>
                                  <span className="text-[9px] text-slate-500 uppercase font-bold block leading-tight">
                                    Profile Score
                                  </span>
                                </div>
                                <div>
                                  <span className="text-base font-black text-slate-800 block">
                                    {isListed ? property.viewsCount : '—'}
                                  </span>
                                  <span className="text-[9px] text-slate-500 uppercase font-bold block leading-tight">
                                    Direct Views
                                  </span>
                                </div>
                              </div>

                              {/* Site Visits Quick Pill */}
                              <div className="pt-2 border-t border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('VISITS')}
                                  className="w-full py-2 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{property.siteVisits?.length || 0} Site Visits Coordinated</span>
                                </button>
                              </div>

                              {/* Manage Documents Quick Link */}
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedPropertyForDocs(property)}
                                  className="w-full py-2 bg-[#244B8F] hover:bg-[#1B396E] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Manage 5 Deeds ({verifiedDocCount}/5)</span>
                                </button>
                              </div>

                            </div>

                          </div>

                          {/* ======================================================== */}
                          {/* AMAZON DELIVERY STYLE PROGRESSIVE STEPPER (DOT BY DOT)   */}
                          {/* ======================================================== */}
                          <div className="bg-slate-50/90 px-4 sm:px-6 py-4 border-t border-slate-200">
                            
                            {/* Stepper Header */}
                            <div className="flex items-center justify-between text-xs mb-3">
                              <div className="flex items-center space-x-2">
                                <Truck className="w-4 h-4 text-[#244B8F]" />
                                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                                  Amazon-Style Progress Tracker
                                </span>
                              </div>
                              <span className="text-slate-500 text-[11px]">
                                Current Status: <strong className="text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-black">{property.stageBadgeLabel}</strong>
                              </span>
                            </div>

                            {/* Connected Horizontal Timeline (Dot-by-Dot) */}
                            {isLost ? (
                              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 text-red-800 my-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold font-['Montserrat']">
                                    Inquiry Closed / Journey Ended
                                  </p>
                                  <p className="text-[11px] text-red-700 mt-0.5">
                                    This property inquiry has been closed. Your dedicated relationship manager ({property.rmName}) is available if you wish to reactivate or re-evaluate.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="relative pt-2 pb-1">
                                
                                {/* Horizontal Connecting Rail */}
                                <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 z-0" />
                                
                                {/* Active Progress Fill Rail */}
                                <div 
                                  className="absolute top-5 left-6 h-1 bg-gradient-to-r from-emerald-500 to-[#244B8F] z-0 transition-all duration-500"
                                  style={{ width: `${(Math.max(0, milestoneActiveIdx) / Math.max(1, activeMilestones.length - 1)) * 100}%` }}
                                />

                                {/* 6 Core Operational Milestone Dots */}
                                <div className="relative z-10 grid grid-cols-6 gap-2 text-center">
                                  {activeMilestones.map((m, mIdx) => {
                                    const isDone = mIdx < milestoneActiveIdx;
                                    const isCurrent = mIdx === milestoneActiveIdx;

                                    return (
                                      <div key={m.key} className="flex flex-col items-center">
                                        
                                        {/* Dot Circle */}
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                          isDone
                                            ? 'bg-emerald-600 text-white shadow-sm ring-3 ring-emerald-100'
                                            : isCurrent
                                            ? 'bg-[#244B8F] text-white shadow-md ring-4 ring-blue-200 scale-110'
                                            : 'bg-white text-slate-400 border-2 border-slate-300'
                                        }`}>
                                          {isDone ? (
                                            <Check className="w-4 h-4 stroke-[3]" />
                                          ) : isCurrent ? (
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                                          ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                          )}
                                        </div>

                                        {/* Milestone Label */}
                                        <span className={`text-[11px] font-extrabold mt-2 leading-tight block ${
                                          isCurrent ? 'text-[#244B8F]' : isDone ? 'text-slate-800' : 'text-slate-400'
                                        }`}>
                                          {m.label}
                                        </span>

                                        {/* Short Sub-label */}
                                        <span className="text-[9px] text-slate-500 hidden sm:block mt-0.5 leading-tight">
                                          {m.shortDesc}
                                        </span>

                                      </div>
                                    );
                                  })}
                                </div>

                              </div>
                            )}

                            {/* View Full Timeline Button */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-slate-500">
                                📅 Next Milestone Estimated: <strong>Within 24-48 Hours</strong> (Direct Advocate Follow-up)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPropertyForTimeline(property);
                                  setActiveTab('TIMELINE');
                                }}
                                className="text-xs font-bold text-[#244B8F] hover:underline flex items-center space-x-1 cursor-pointer"
                              >
                                <span>View Detailed Audit History</span>
                                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                              </button>
                            </div>

                          </div>

                          {/* 5 STATUTORY DOCUMENTS GLANCE ROW */}
                          <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                            
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-slate-400 font-bold text-[11px]">5 Statutory Deeds:</span>
                              {Object.entries(property.documents).map(([key, doc]) => {
                                const isVer = doc.status === 'VERIFIED';
                                const isInRev = doc.status === 'IN_REVIEW';
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedPropertyForDocs(property)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center space-x-1 border cursor-pointer transition-colors ${
                                      isVer
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                        : isInRev
                                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                    }`}
                                    title={doc.subLabel}
                                  >
                                    {isVer ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-amber-600" />
                                    )}
                                    <span>{doc.label.split(' ')[0]}</span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center space-x-3">
                              <button
                                type="button"
                                onClick={() => showToast(`Shareable direct link copied for ${property.referenceId}`)}
                                className="text-slate-500 hover:text-[#244B8F] flex items-center space-x-1 text-xs font-semibold cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Share Listing</span>
                              </button>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: AMAZON-STYLE VERTICAL DELIVERY LOG (DOT BY DOT WITH TIMESTAMPS) */}
            {activeTab === 'TIMELINE' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                
                {/* Header with Amazon-style Delivery Tracker Banner */}
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError(null)} className="font-bold">Dismiss</button>
                  </div>
                )}

                {(() => {
                  const timelineTarget = selectedPropertyForTimeline || properties[0];
                  return (
                    <>
                      <div className="bg-gradient-to-r from-[#172033] to-[#244B8F] text-white p-5 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                            <Truck className="w-4 h-4" />
                            <span>Live Diligence Tracking • Amazon Style</span>
                          </div>
                          <h2 className="text-lg font-black tracking-tight">
                            Delivery Pipeline: {timelineTarget?.societyName || 'Bengaluru Property'} ({timelineTarget?.bhkType || 'Flat'})
                          </h2>
                          <p className="text-xs text-blue-200">
                            Tracking ID: <span className="font-mono font-bold text-white">{timelineTarget?.referenceId || 'SMG-TRACK'}</span> • Assigned RM: {timelineTarget?.rmName || 'Kavitha Ranganathan'}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-blue-200 uppercase font-bold block">Estimated Closing Date</span>
                          <span className="text-base font-extrabold text-emerald-400">Within 32-45 Days</span>
                        </div>
                      </div>

                      {/* Vertical Amazon-style connected dot-by-dot tracking list */}
                      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                        {(timelineTarget?.activityTimeline || []).map((log) => {
                          return (
                            <div key={log.id} className="relative group">
                              
                              {/* Dot indicator on the vertical line */}
                              <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                log.isCompleted
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100'
                                  : log.isCurrent
                                  ? 'bg-[#244B8F] text-white shadow-md ring-3 ring-blue-200 scale-110'
                                  : 'bg-white border-2 border-slate-300 text-slate-400'
                              }`}>
                                {log.isCompleted ? (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : log.isCurrent ? (
                                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                ) : (
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                )}
                              </div>

                              {/* Event Details Card */}
                              <div className={`p-4 rounded-xl border transition-all ${
                                log.isCurrent
                                  ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                                  : log.isCompleted
                                  ? 'bg-slate-50/70 border-slate-200'
                                  : 'bg-white border-dashed border-slate-200 opacity-60'
                              }`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <h4 className="font-black text-sm text-slate-900">
                                    {log.title}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-slate-500">
                                    {log.timestamp}
                                  </span>
                                </div>

                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {log.description}
                                </p>

                                {log.officerName && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                                    <span className="text-slate-500">
                                      Handled By: <strong className="text-slate-800">{log.officerName}</strong>
                                    </span>
                                    <span className={`px-2 py-0.2 rounded font-black text-[9px] uppercase ${
                                      log.isCompleted
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : log.isCurrent
                                        ? 'bg-blue-100 text-[#244B8F]'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {log.isCompleted ? 'COMPLETED' : log.isCurrent ? 'IN PROGRESS' : 'UPCOMING'}
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}

              </div>
            )}

            {/* TAB 3: BACKEND MANAGED SITE VISITS & ESCORTS */}
            {activeTab === 'VISITS' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      Coordinated Site Visits & RM Escorts
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Our Relationship Managers personally accompany every screened buyer and tenant. You don't have to show your flat repeatedly.
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center space-x-1.5">
                    <Users className="w-4 h-4" />
                    <span>{kpiStats.totalSiteVisits} Verified Visits Logged</span>
                  </span>
                </div>

                <div className="space-y-4">
                  {properties.map(p => (
                    p.siteVisits?.map(visit => (
                      <div
                        key={visit.id}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                            <span className="font-black text-sm text-slate-900">
                              {visit.visitorProfile}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800">
                              Screened Tech Buyer
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-700">{visit.scheduledTime}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                          <span className="font-bold text-[#244B8F] block">
                            RM Field Notes ({visit.rmEscort}):
                          </span>
                          <p className="text-slate-600 italic">
                            "{visit.feedbackNotes}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 text-[11px]">
                            Property: <strong>{p.societyName}</strong> ({p.bhkType})
                          </span>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            visit.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {visit.status === 'COMPLETED' ? '✓ VISIT COMPLETED' : '⏳ SCHEDULED WITH RM'}
                          </span>
                        </div>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: 5 STATUTORY DOCUMENTS VAULT */}
            {activeTab === 'VAULT' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Statutory Title Document Vault
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Every resale home on SellMyGhar is verified against the 5 essential Karnataka land records before finalizing buyer transactions.
                  </p>
                </div>

                {/* Progress bar */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#244B8F] block">
                      Overall Compliance Progress: {kpiStats.verifiedDocs} of {kpiStats.totalDocs} Documents Verified
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Clear titles sell up to 3x faster without buyer renegotiation.
                    </span>
                  </div>
                  <div className="w-32 bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${(kpiStats.verifiedDocs / Math.max(1, kpiStats.totalDocs)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Documents Table / Card List */}
                {properties.map(p => (
                  <div key={p.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-sm text-slate-900">
                        {p.societyName} ({p.bhkType})
                      </span>
                      <span className="text-xs font-mono text-slate-400">{p.referenceId}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.values(p.documents).map(doc => (
                        <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-slate-800 block">
                              {doc.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {doc.subLabel}
                            </span>
                            {doc.fileName && (
                              <span className="text-[11px] text-slate-600 font-mono block mt-1">
                                📎 {doc.fileName} ({doc.fileSize})
                              </span>
                            )}
                            {doc.legalReviewNote && (
                              <p className="text-[10px] text-emerald-700 bg-emerald-50 p-1 rounded font-medium mt-1">
                                Note: {doc.legalReviewNote}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0 ml-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              doc.status === 'VERIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {doc.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPropertyForDocs(p);
                                setUploadDocType(doc.type);
                              }}
                              className="block text-[11px] font-bold text-[#244B8F] hover:underline mt-2 cursor-pointer"
                            >
                              Upload / Replace
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: LOCAL CORRIDOR PRICE & RENT DEMAND INDEX */}
            {activeTab === 'DEMAND' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Bengaluru Tech Corridor Resale & Rent Demand Index
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Live market intelligence derived from registrar deed prices and corporate rental transactions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map(p => (
                    <div key={p.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-[#244B8F] block uppercase tracking-wider">
                            {p.locality}
                          </span>
                          <h4 className="font-extrabold text-base text-slate-900">{p.societyName}</h4>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {p.corridorDemand?.demandScore}/100 Demand
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg Resale Rate</span>
                          <span className="font-extrabold text-sm text-slate-800">
                            ₹{p.corridorDemand?.avgPriceSqft.toLocaleString('en-IN')}/sqft
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Avg Monthly Rent</span>
                          <span className="font-extrabold text-sm text-purple-700">
                            ₹{p.corridorDemand?.avgMonthlyRent.toLocaleString('en-IN')}/mo
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Active Corridor Buyers</span>
                          <span className="font-extrabold text-sm text-slate-800">
                            {p.corridorDemand?.activeBuyersInCorridor} Pre-approved
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Est. Time to Close</span>
                          <span className="font-extrabold text-sm text-emerald-600">
                            ~{p.corridorDemand?.estimatedDaysToClose} Days
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                        💡 <strong>Pricing Recommendation:</strong> Your property is positioned competitively against current Sub-Registrar guidance values. Demand in this micro-market is 18% higher than Q2 2026.
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </main>

        </div>
      </div>

      {/* MODAL: STATUTORY DOCUMENT VAULT MODAL */}
      {selectedPropertyForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Document Vault: {selectedPropertyForDocs.societyName}
                </h3>
                <p className="text-xs text-slate-500">
                  Unit Ref: {selectedPropertyForDocs.referenceId} • Verified Advocate Due Diligence
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPropertyForDocs(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccessMessage}</span>
              </div>
            )}

            {/* List of 5 statutory documents */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                5 Mandatory Title Documents (Bengaluru RERA)
              </span>

              {Object.values(selectedPropertyForDocs.documents).map(doc => {
                const isVer = doc.status === 'VERIFIED';
                return (
                  <div key={doc.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{doc.label}</span>
                        <span className={`px-2 py-0.2 rounded text-[9px] font-black uppercase ${
                          isVer ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{doc.subLabel}</p>
                      {doc.fileName && (
                        <p className="text-[11px] font-mono text-slate-700">
                          📄 {doc.fileName} • {doc.fileSize}
                        </p>
                      )}
                      {doc.legalReviewNote && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded font-medium mt-1">
                          ✓ {doc.legalReviewNote}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setUploadDocType(doc.type)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shrink-0"
                    >
                      Upload
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Upload file section */}
            <form onSubmit={handleUploadDocumentSubmit} className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700">
                Upload or Replace Document
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Select Document Type
                  </label>
                  <select
                    value={uploadDocType}
                    onChange={(e: any) => setUploadDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="TITLE_DEED">Sale Deed (Registered Title)</option>
                    <option value="MOTHER_DEED">Mother Deed (30-Yr Chain)</option>
                    <option value="KHATA_CERTIFICATE">BBMP A-Khata Certificate</option>
                    <option value="ENCUMBRANCE_CERTIFICATE">Encumbrance Certificate (EC Form 15)</option>
                    <option value="TAX_RECEIPT">BBMP Property Tax Receipt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Document File Name (PDF / Scan)
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadFileName}
                    onChange={(e) => setUploadFileName(e.target.value)}
                    placeholder="e.g. Sale_Deed_Copy_2026.pdf"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPropertyForDocs(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc || !uploadFileName}
                  className="px-5 py-2 bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingDoc ? 'Uploading...' : 'Confirm Upload'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
