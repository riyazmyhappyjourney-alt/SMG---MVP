import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
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
  Award,
  Calendar,
  Users,
  Key,
  Truck,
  AlertTriangle,
  Activity,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { UserAuthProfile } from '../../types/user';
import {
  SellerPropertyItem,
  PropertyStageEnum
} from '../../types/seller';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

interface SellerDashboardProps {
  user: UserAuthProfile | null;
  onPostPropertyClick: () => void;
  onBackToHome: () => void;
  onLogout: () => void;
}

// 6 Core CRM Lifecycle Milestones (Single source of truth)
export const CRM_MILESTONES = [
  { key: 'NEW', label: 'NEW', subLabel: 'Uploaded & Digitized' },
  { key: 'CONTACTED', label: 'CONTACTED', subLabel: 'RM Assigned' },
  { key: 'FOLLOW_UP', label: 'FOLLOW UP', subLabel: 'Due Diligence' },
  { key: 'SITE_VISIT', label: 'SITE VISIT', subLabel: 'Buyer Visits' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', subLabel: 'Offer & Pricing' },
  { key: 'CONVERTED', label: 'CONVERTED', subLabel: 'Sale Completed' },
] as const;

/**
 * Maps property backend status to the 6 CRM lifecycle milestones
 */
export const getCrmMilestoneIndex = (status: string): { index: number; isLost: boolean; label: string } => {
  const s = (status || '').toUpperCase();
  if (s === 'LOST' || s === 'DROPPED') {
    return { index: -1, isLost: true, label: 'LOST' };
  }
  switch (s) {
    case 'NEW':
      return { index: 0, isLost: false, label: 'NEW' };
    case 'CONTACTED':
      return { index: 1, isLost: false, label: 'CONTACTED' };
    case 'FOLLOW_UP':
    case 'DOCS_REQUESTED':
    case 'IN_VERIFICATION':
    case 'REVIEW':
      return { index: 2, isLost: false, label: 'FOLLOW UP' };
    case 'SITE_VISIT':
    case 'VISIT':
    case 'VISITS':
      return { index: 3, isLost: false, label: 'SITE VISIT' };
    case 'NEGOTIATION':
    case 'VERIFIED':
      return { index: 4, isLost: false, label: 'NEGOTIATION' };
    case 'CONVERTED':
    case 'LISTED':
    case 'SOLD':
    case 'CLOSED':
      return { index: 5, isLost: false, label: 'CONVERTED' };
    default:
      return { index: 0, isLost: false, label: 'NEW' };
  }
};

/**
 * Formats a real backend ISO or date string to readable Indian local format:
 * e.g. "08 Oct 2026 • 10:42 AM"
 * Returns "Pending" if invalid or not provided.
 */
export const formatBackendTimestamp = (isoOrDateStr?: string | null): string => {
  if (!isoOrDateStr) return 'Pending';
  const trimmed = isoOrDateStr.trim();
  if (trimmed.toLowerCase().includes('pending')) return 'Pending';

  const dateObj = new Date(trimmed);
  if (!isNaN(dateObj.getTime()) && (trimmed.includes('-') || trimmed.includes('T'))) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hourStr = String(hours).padStart(2, '0');
    return `${day} ${month} ${year} • ${hourStr}:${minutes} ${ampm}`;
  }

  // Already formatted string like "01 Oct 2026, 10:15 AM"
  if (trimmed.includes(',')) {
    return trimmed.replace(',', ' •');
  }
  return trimmed;
};

/**
 * Extracts the real backend timestamp for each milestone event.
 * NEVER invents or hardcodes a timestamp; returns "Pending" if unreached or unrecorded.
 */
export const getMilestoneEventTimestamp = (
  property: SellerPropertyItem,
  key: string,
  isCompletedOrCurrent: boolean
): string => {
  if (!isCompletedOrCurrent) return 'Pending';

  // 1. NEW: Real property created / uploaded timestamp
  if (key === 'NEW') {
    if (property.createdAt) return formatBackendTimestamp(property.createdAt);
    const newLog = property.activityTimeline?.find(l => l.stageKey === 'NEW');
    if (newLog?.timestamp) return formatBackendTimestamp(newLog.timestamp);
    return 'Pending';
  }

  // 2. CONTACTED: RM assignment event timestamp
  if (key === 'CONTACTED') {
    const contactedLog = property.activityTimeline?.find(
      l => l.stageKey === 'CONTACTED' || l.title?.toLowerCase().includes('rm assigned')
    );
    if (contactedLog?.timestamp) return formatBackendTimestamp(contactedLog.timestamp);
    return 'Pending';
  }

  // 3. FOLLOW_UP: Diligence / docs follow-up event timestamp
  if (key === 'FOLLOW_UP') {
    const followLog = property.activityTimeline?.find(
      l => l.stageKey === 'FOLLOW_UP' || l.stageKey === 'IN_VERIFICATION' || l.stageKey === 'DOCS_REQUESTED'
    );
    if (followLog?.timestamp) return formatBackendTimestamp(followLog.timestamp);
    return 'Pending';
  }

  // 4. SITE_VISIT: Real scheduled or completed visit timestamp
  if (key === 'SITE_VISIT') {
    if (property.siteVisits && property.siteVisits.length > 0) {
      const firstVisit = property.siteVisits[0];
      if (firstVisit.scheduledTime) return formatBackendTimestamp(firstVisit.scheduledTime);
    }
    const visitLog = property.activityTimeline?.find(
      l => l.stageKey === 'SITE_VISIT' || l.title?.toLowerCase().includes('visit')
    );
    if (visitLog?.timestamp) return formatBackendTimestamp(visitLog.timestamp);
    return 'Pending';
  }

  // 5. NEGOTIATION: Title clearance / negotiation event timestamp
  if (key === 'NEGOTIATION') {
    const negLog = property.activityTimeline?.find(
      l => l.stageKey === 'NEGOTIATION' || l.stageKey === 'VERIFIED'
    );
    if (negLog?.timestamp) return formatBackendTimestamp(negLog.timestamp);
    return 'Pending';
  }

  // 6. CONVERTED: Handover / listing / closing event timestamp
  if (key === 'CONVERTED') {
    const convLog = property.activityTimeline?.find(
      l => l.stageKey === 'CONVERTED' || l.stageKey === 'SOLD' || l.stageKey === 'LISTED'
    );
    if (convLog?.timestamp) return formatBackendTimestamp(convLog.timestamp);
    return 'Pending';
  }

  return 'Pending';
};

/**
 * Reusable Connected Milestone Dots Tracker Component
 * Renders the 6 CRM milestones horizontally on desktop with connected lines and responsive mobile layout.
 */
export const PropertyProgressTracker: React.FC<{
  property: SellerPropertyItem;
  variant?: 'card' | 'detailed';
  onViewDetailed?: () => void;
}> = ({ property, variant = 'card', onViewDetailed }) => {
  const { index: activeIdx, isLost, label: currentStageLabel } = getCrmMilestoneIndex(property.status);

  return (
    <div className="bg-slate-50/90 px-4 sm:px-6 py-4 border-t border-slate-200">
      {/* Tracker Header */}
      <div className="flex items-center justify-between text-xs mb-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#0073E6]" />
          <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
            Property Progress
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {isLost ? (
            <span className="text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full font-black text-[11px] border border-rose-200">
              STATUS: LOST
            </span>
          ) : (
            <span className="text-slate-500 text-[11px]">
              Current Milestone: <strong className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded font-black border border-emerald-200">{currentStageLabel}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Connected Milestone Dots (Responsive scroll wrapper for mobile) */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto pb-2 no-scrollbar sm:scrollbar-thin">
        <div className="min-w-[500px] sm:min-w-0 relative px-3 sm:px-4 pt-1 pb-2">
          
          {/* Base Horizontal Connecting Rail running through dot center (top 16px) */}
          <div className="absolute top-[18px] left-8 right-8 h-1 bg-slate-200 z-0 rounded-full" />

          {/* Active Progress Fill Rail */}
          {!isLost && (
            <div
              className="absolute top-[18px] left-8 h-1 bg-gradient-to-r from-[#0073E6] via-[#1E3A8A] to-[#B68A4A] z-0 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, (activeIdx / (CRM_MILESTONES.length - 1)) * 100))}%`
              }}
            />
          )}

          {/* 6 Connected Milestone Dots */}
          <div className="relative z-10 grid grid-cols-6 gap-2 text-center">
            {CRM_MILESTONES.map((m, mIdx) => {
              const isCompleted = !isLost && mIdx < activeIdx;
              const isCurrent = !isLost && mIdx === activeIdx;
              const isUpcoming = !isLost && mIdx > activeIdx;
              const isThisLost = isLost && mIdx === 0;

              const timestampText = getMilestoneEventTimestamp(
                property,
                m.key,
                isCompleted || isCurrent
              );

              return (
                <div key={m.key} className="flex flex-col items-center group">
                  {/* Visual Dot */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isCompleted
                        ? 'bg-[#0073E6] text-white shadow-sm ring-3 ring-blue-100'
                        : isCurrent
                        ? 'bg-[#B68A4A] text-white shadow-md ring-4 ring-amber-200 scale-105'
                        : isThisLost
                        ? 'bg-rose-600 text-white shadow-sm ring-3 ring-rose-100'
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <div className="relative flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#B68A4A] animate-ping absolute" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white relative" />
                      </div>
                    ) : isThisLost ? (
                      <X className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>

                  {/* Status Name */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-black uppercase mt-2.5 tracking-tight leading-tight block text-center ${
                      isCurrent
                        ? 'text-[#0073E6]'
                        : isCompleted
                        ? 'text-slate-800'
                        : isThisLost
                        ? 'text-rose-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {m.label}
                  </span>

                  {/* Real Date & Time (Visually Secondary) */}
                  <span
                    className={`text-[9px] sm:text-[10px] mt-1 block leading-tight text-center ${
                      timestampText === 'Pending'
                        ? 'text-slate-400 font-normal italic'
                        : 'text-slate-600 font-semibold font-mono'
                    }`}
                  >
                    {timestampText}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Footer link to detailed view if in card mode */}
      {variant === 'card' && onViewDetailed && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-slate-500">
            Lifecycle managed directly by assigned Relationship Manager.
          </span>
          <button
            type="button"
            onClick={onViewDetailed}
            className="text-xs font-bold text-[#0073E6] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>View Property Progress Details</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  user,
  onPostPropertyClick,
  onBackToHome,
  onLogout,
}) => {
  // User profile state synced with session cookie
  const [currentUser, setCurrentUser] = useState<UserAuthProfile | null>(user || null);

  useEffect(() => {
    if (user?.phone) {
      setCurrentUser(user);
    } else {
      fetch('/api/auth/me', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data?.authenticated && data?.user) {
            setCurrentUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [user]);

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

  // Dashboard Section Navigation: Simplified to 3 core sections
  const [activeTab, setActiveTab] = useState<'LISTINGS' | 'TIMELINE' | 'VISITS'>('LISTINGS');

  // Selected property for detailed Property Progress tab
  const [selectedPropertyForTimeline, setSelectedPropertyForTimeline] = useState<SellerPropertyItem | null>(null);

  // Quick Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Primary Fetch properties from backend
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const storedPhone = (() => {
        try { return localStorage.getItem('sellmyghar_last_owner_phone') || ''; } catch { return ''; }
      })();
      const activePhone = currentUser?.phone || user?.phone || storedPhone;
      const phoneParam = activePhone ? activePhone.replace(/\D/g, '').slice(-10) : ((currentUser?.name || user?.name)?.match(/\d{10}/)?.[0] || '');
      const url = phoneParam ? `/api/properties?phone=${phoneParam}` : '/api/properties';
      const res = await fetch(url, { credentials: 'include' });
      if (res.status === 401) {
        setProperties([]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load properties');
      }
      const rawList = Array.isArray(data.properties) ? (data.properties as SellerPropertyItem[]) : [];
      const uniqueList = Array.from(new Map(rawList.map((p) => [p.id, p])).values());
      setProperties(uniqueList);

    } catch (err: any) {
      const msg = err?.message || 'Error connecting to database';
      if (!msg.includes('UNAUTHORIZED')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser, user]);

  // Silent Revalidation for Real-Time Synchronization (no UI flicker)
  const fetchPropertiesSilently = useCallback(async () => {
    try {
      const storedPhone = (() => {
        try { return localStorage.getItem('sellmyghar_last_owner_phone') || ''; } catch { return ''; }
      })();
      const activePhone = currentUser?.phone || user?.phone || storedPhone;
      const phoneParam = activePhone ? activePhone.replace(/\D/g, '').slice(-10) : ((currentUser?.name || user?.name)?.match(/\d{10}/)?.[0] || '');
      const url = phoneParam ? `/api/properties?phone=${phoneParam}` : '/api/properties';
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.properties)) {
          const rawItems = data.properties as SellerPropertyItem[];
          const uniqueList = Array.from(new Map(rawItems.map((p) => [p.id, p])).values());
          setProperties(uniqueList);
        }


      }
    } catch {
      // Keep existing properties on transient network drop
    }
  }, [currentUser, user]);

  // Initial load + Real-time lightweight polling and window focus synchronization
  useEffect(() => {
    fetchProperties();

    // Lightweight 8s interval polling while window is active
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPropertiesSilently();
      }
    }, 8000);

    // Sync immediately when owner switches back to window/tab
    const handleFocus = () => {
      fetchPropertiesSilently();
    };

    // Sync across browser tabs on CRM updates
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sellmyghar_owner_properties' || e.key === 'crm_property_update') {
        fetchPropertiesSilently();
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchProperties, fetchPropertiesSilently]);

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

        // Intent Filter (SELL vs RENT)
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

  // Global KPI Counters
  const kpiStats = useMemo(() => {
    const saleCount = properties.filter(p => (p.listing_intent || p.intent) === 'SELL').length;
    const rentCount = properties.filter(p => (p.listing_intent || p.intent) === 'RENT').length;
    const activeCount = properties.filter(p => p.status === 'LISTED').length;
    const reviewCount = properties.filter(p => p.status === 'IN_VERIFICATION' || p.status === 'DOCS_REQUESTED' || p.status === 'NEW').length;
    const totalViews = properties.reduce((acc, p) => acc + (p.viewsCount || 0), 0);
    const totalSiteVisits = properties.reduce((acc, p) => acc + (p.siteVisits?.length || 0), 0);

    return {
      saleCount,
      rentCount,
      activeCount,
      reviewCount,
      totalViews,
      totalSiteVisits,
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

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif] text-slate-900">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVBAR */}
      <header className="bg-[#0073E6] text-white sticky top-0 z-40 shadow-md w-full max-w-full">
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand Logo & Portal Name */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 shrink">
              <button
                type="button"
                onClick={onBackToHome}
                className="flex items-center space-x-1.5 sm:space-x-2 text-white hover:opacity-90 transition-opacity cursor-pointer focus:outline-none min-w-0"
              >
                <div className="bg-white p-1 rounded-md shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#0073E6]" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-base sm:text-lg font-black tracking-tight block leading-tight truncate">
                    SellMy<span className="text-[#B68A4A]">Ghar</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest uppercase font-extrabold text-blue-200 block -mt-0.5 truncate">
                    <span className="sm:hidden">Owner Portal</span>
                    <span className="hidden sm:inline">Owner Portal • Resale & Rentals</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Middle: Support & RM helpline with updated number */}
            <div className="hidden md:flex items-center space-x-6 text-xs text-blue-100">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-sky-300" />
                <span>Live Status: <strong>Property Progress Tracking Active</strong></span>
              </div>
              <div className="flex items-center space-x-2 border-l border-blue-400/40 pl-6">
                <Phone className="w-3.5 h-3.5 text-[#B68A4A]" />
                <span>Dedicated RM Desk: <strong className="text-white">+91 8217873708</strong></span>
              </div>
            </div>

            {/* Right: Actions & User Capsule */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              
              {/* Post Property FREE Button */}
              <button
                type="button"
                onClick={onPostPropertyClick}
                className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#0073E6] hover:bg-[#005BB5] text-white rounded-lg text-[11px] sm:text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer border border-white/20 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Post Flat / Rent</span>
                <span className="sm:hidden">Post Flat</span>
                <span className="hidden sm:inline bg-white/20 px-1 py-0.2 rounded text-[9px] uppercase tracking-wider">FREE</span>
              </button>

              {/* User Dropdown / Profile Badge (Truthful Owner Label) */}
              <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 hover:bg-white/15 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-white/20 transition-colors">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0073E6] text-white font-black text-[11px] sm:text-xs flex items-center justify-center border border-white/30 shrink-0">
                  {(currentUser || user)?.name ? (currentUser || user)!.name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="hidden sm:block text-left text-xs leading-tight">
                  <p className="font-bold text-white truncate max-w-[120px]">
                    {(currentUser || user)?.name || 'Property Owner'}
                  </p>
                  <p className="text-[10px] text-blue-200">Property Owner</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out"
                  className="text-blue-200 hover:text-white p-1 ml-0.5 sm:ml-1 cursor-pointer transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* SUB-HEADER BREADCRUMB (Clean without technical or promotional badge) */}
      <div className="bg-white border-b border-slate-200 py-2 sm:py-2.5 shadow-2xs w-full max-w-full overflow-hidden">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-slate-500 min-w-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap min-w-0 py-0.5 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-[#0073E6] flex items-center space-x-1 font-medium cursor-pointer shrink-0"
            >
              <span>Home</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-bold shrink-0">
              <span className="hidden sm:inline">Owner Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-[#0073E6] font-bold truncate">Resale & Rental Listings</span>
          </div>

          <div className="text-slate-400 font-medium text-[11px] hidden sm:block shrink-0 pl-2">
            Direct RM Desk: +91 8217873708
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 min-w-0">
        
        {/* Mobile Top Segmented Tab Switcher (Instant 1-Tap Navigation for Mobile Screens) */}
        <div className="lg:hidden mb-4 bg-white p-1 sm:p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1 sm:gap-1.5 sticky top-16 z-20 w-full max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('LISTINGS')}
            className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer ${
              activeTab === 'LISTINGS'
                ? 'bg-[#0073E6] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Listings ({properties.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TIMELINE')}
            className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer ${
              activeTab === 'TIMELINE'
                ? 'bg-[#0073E6] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Progress</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('VISITS')}
            className={`flex-1 min-w-0 py-2 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center space-x-1 sm:space-x-1.5 cursor-pointer ${
              activeTab === 'VISITS'
                ? 'bg-[#0073E6] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Visits ({kpiStats.totalSiteVisits})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start w-full min-w-0">
          
          {/* LEFT SIDEBAR (Desktop Left, Mobile Follows Content) */}
          <aside className="lg:col-span-3 space-y-4 order-last lg:order-first w-full min-w-0">
            
            {/* Owner Profile Card (Truthful Account Badge) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-[#0073E6] to-[#005BB5]" />
              
              <div className="relative pt-4">
                <div className="w-16 h-16 rounded-full bg-white border-3 border-white shadow-md mx-auto flex items-center justify-center text-xl font-extrabold text-[#0073E6]">
                  {(currentUser || user)?.name ? (currentUser || user)!.name.slice(0, 2).toUpperCase() : 'PO'}
                </div>
                
                <h3 className="font-extrabold text-base text-slate-900 mt-2">
                  {(currentUser || user)?.name || 'Property Owner'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Property Owner (Resale & Rentals)
                </p>
                
                {/* Subtle Truthful Account Indicator */}
                <div className="mt-2 inline-flex items-center space-x-1.5 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>Owner Account</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">For Sale</span>
                  <span className="text-base font-extrabold text-[#0073E6]">{kpiStats.saleCount}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">For Rent</span>
                  <span className="text-base font-extrabold text-purple-600">{kpiStats.rentCount}</span>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation Menu (Desktop Only, mobile uses top switcher) */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Dashboard Sections
                </span>
              </div>
              <nav className="p-2 space-y-1 text-xs font-bold">
                
                {/* 1. My Listings */}
                <button
                  type="button"
                  onClick={() => setActiveTab('LISTINGS')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'LISTINGS'
                      ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Building2 className="w-4 h-4 text-[#0073E6]" />
                    <span>My Listings (Sale & Rent)</span>
                  </div>
                  <span className="bg-[#0073E6] text-white px-2 py-0.2 rounded-full text-[10px]">
                    {properties.length}
                  </span>
                </button>

                {/* 2. Property Progress */}
                <button
                  type="button"
                  onClick={() => setActiveTab('TIMELINE')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'TIMELINE'
                      ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span>Property Progress</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full text-[10px]">
                    Live Milestones
                  </span>
                </button>

                {/* 3. Site Visits & RM Support */}
                <button
                  type="button"
                  onClick={() => setActiveTab('VISITS')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                    activeTab === 'VISITS'
                      ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Site Visits & RM Support</span>
                  </div>
                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.2 rounded-full text-[10px]">
                    {kpiStats.totalSiteVisits}
                  </span>
                </button>

              </nav>
            </div>

            {/* Dedicated Relationship Manager Card with updated phone +91 8217873708 */}
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
                Handles all buyer & tenant screening, site visit escorts, and Sub-Registrar closing from the backend. Direct owner support.
              </p>
              <a
                href="tel:+918217873708"
                className="inline-flex items-center justify-center w-full py-2 bg-[#0073E6] hover:bg-[#005BB5] text-white rounded-lg text-xs font-bold transition-colors space-x-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call RM: +91 8217873708</span>
              </a>
            </div>

          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 space-y-4 sm:space-y-6 w-full min-w-0 max-w-full">
            
            {/* Top Heading Bar with Intent Selector (Clean, spacious, no corner visuals) */}
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 sm:space-y-4 w-full min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                    Manage My Properties
                  </h1>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Property progress tracking, statutory title audit, and scheduled site visits.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={fetchProperties}
                    disabled={loading}
                    className="p-2 sm:p-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                    title="Refresh Listings"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={onPostPropertyClick}
                    className="inline-flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#0073E6] hover:bg-[#005BB5] text-white text-[11px] sm:text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>Post New Property</span>
                  </button>
                </div>
              </div>

              {/* SALE vs RENTAL Quick Intent Filter Tabs */}
              <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-slate-100 overflow-x-auto no-scrollbar py-0.5">
                <button
                  type="button"
                  onClick={() => setIntentFilter('ALL')}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
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
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 whitespace-nowrap ${
                    intentFilter === 'SELL'
                      ? 'bg-[#0073E6] text-white shadow-2xs'
                      : 'bg-blue-50 text-[#0073E6] hover:bg-blue-100'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Resale / Sale ({kpiStats.saleCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntentFilter('RENT')}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 whitespace-nowrap ${
                    intentFilter === 'RENT'
                      ? 'bg-purple-700 text-white shadow-2xs'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 shrink-0" />
                  <span>Rentals ({kpiStats.rentCount})</span>
                </button>
              </div>
            </div>

            {/* 4 Clean Summary KPI Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full min-w-0">
              
              {/* Chip 1: Live Broadcast */}
              <div 
                onClick={() => setStatusFilter('ACTIVE')}
                className={`bg-white p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs min-w-0 ${
                  statusFilter === 'ACTIVE' ? 'border-[#0073E6] ring-2 ring-[#0073E6]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-slate-900">
                    {kpiStats.activeCount.toString().padStart(2, '0')}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1 truncate">Live Broadcast</p>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">Buyers & Tenants Active</span>
              </div>

              {/* Chip 2: Verification Pending */}
              <div 
                onClick={() => setStatusFilter('REVIEW')}
                className={`bg-white p-2.5 sm:p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs min-w-0 ${
                  statusFilter === 'REVIEW' ? 'border-[#0073E6] ring-2 ring-[#0073E6]/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-amber-600">
                    {kpiStats.reviewCount.toString().padStart(2, '0')}
                  </span>
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1 truncate">Under Diligence</p>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">Title registry check</span>
              </div>

              {/* Chip 3: RM Site Visits */}
              <div 
                onClick={() => setActiveTab('VISITS')}
                className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-indigo-400 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-indigo-600">
                    {kpiStats.totalSiteVisits.toString().padStart(2, '0')}
                  </span>
                  <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1 truncate">RM Site Visits</p>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">Screened & Escorted</span>
              </div>

              {/* Chip 4: Direct Views */}
              <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xl sm:text-2xl font-black text-blue-600">
                    {kpiStats.totalViews}
                  </span>
                  <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-1 truncate">Direct Views</p>
                <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate">Verified Corridor</span>
              </div>

            </div>

            {/* TAB 1: LISTINGS VIEW (Primary View with Connected Milestones Tracker on each card) */}
            {activeTab === 'LISTINGS' && (
              <div className="space-y-4 w-full min-w-0">
                
                {/* Search & Filter Toolbar */}
                <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
                  
                  {/* Search input */}
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by society, locality, or SMG ID..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:bg-white transition-all"
                    />
                  </div>

                  {/* Filter Status Dropdown */}
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                    <select
                      value={statusFilter}
                      onChange={(e: any) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-auto sm:min-w-[125px] px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0073E6] cursor-pointer"
                    >
                      <option value="ALL">Status: All</option>
                      <option value="ACTIVE">Status: Live</option>
                      <option value="REVIEW">Status: Under Diligence</option>
                      <option value="VERIFIED">Status: Verified</option>
                      <option value="SOLD">Status: Closed / Sold</option>
                    </select>

                    <select
                      value={bhkFilter}
                      onChange={(e) => setBhkFilter(e.target.value)}
                      className="w-full sm:w-auto sm:min-w-[95px] px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0073E6] cursor-pointer"
                    >
                      <option value="ALL">All BHK</option>
                      <option value="2 BHK">2 BHK</option>
                      <option value="3 BHK">3 BHK</option>
                      <option value="4 BHK">4 BHK+</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e: any) => setSortBy(e.target.value)}
                      className="col-span-2 sm:col-span-1 w-full sm:w-auto sm:min-w-[125px] px-2.5 sm:px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] sm:text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0073E6] cursor-pointer"
                    >
                      <option value="NEWEST">Newest First</option>
                      <option value="PRICE_DESC">Price: High to Low</option>
                      <option value="PRICE_ASC">Price: Low to High</option>
                      <option value="MOST_VIEWS">Most Views</option>
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
                        className="col-span-2 sm:col-span-1 text-xs font-bold text-rose-600 hover:underline px-2 py-1 cursor-pointer text-center sm:text-left"
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
                    <RefreshCw className="w-8 h-8 text-[#0073E6] animate-spin mx-auto mb-3" />
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
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0073E6] text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post Property Now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredProperties.map((property) => {
                      const isRent = (property.listing_intent || property.intent) === 'RENT';
                      const isListed = property.status === 'LISTED' || (property as any).listingStatus === 'PUBLISHED';
                      const isLost = Boolean(property.progressTracker?.isLost || property.crm_status === 'LOST' || property.status === 'LOST');
                      // Calculate simple document status from backend documents without building extra workflows
                      const docList = property.documents ? Object.values(property.documents) : [];
                      const hasRejectedDoc = docList.some(d => d.status === 'REJECTED');
                      const allDocsVerified = docList.length > 0 && docList.every(d => d.status === 'VERIFIED');
                      const overallDocStatus = hasRejectedDoc ? 'REJECTED' : allDocsVerified ? 'VERIFIED' : 'PENDING';
                      
                      // Find real backend verification timestamp if available
                      const verifiedDoc = docList.find(d => d.status === 'VERIFIED' && d.verifiedAt);
                      const verifiedTimestamp = verifiedDoc?.verifiedAt ? formatBackendTimestamp(verifiedDoc.verifiedAt) : null;

                      return (
                        <div
                          key={property.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
                        >
                          {/* Card Top Meta Line */}
                          <div className="bg-slate-50/80 px-3 sm:px-6 py-2.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs">
                              {/* Intent Badge */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isRent 
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                  : 'bg-blue-100 text-[#0073E6] border border-blue-200'
                              }`}>
                                {isRent ? '🔑 FOR RENT' : '🏠 FOR RESALE'}
                              </span>

                              <span className="font-mono font-bold text-slate-700">
                                {property.referenceId}
                              </span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-slate-500">Uploaded: {formatBackendTimestamp(property.createdAt)}</span>
                              <span className="text-slate-300 hidden sm:inline">•</span>
                              <span className="text-slate-600">RM: <strong>{property.rmName || 'Kavitha Ranganathan'}</strong></span>
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
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-blue-100 text-[#0073E6] border border-blue-300">
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
                            <a 
                              href={`/property/${property.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="md:col-span-4 relative rounded-xl overflow-hidden bg-slate-100 aspect-4/3 sm:aspect-16/10 block group/thumb cursor-pointer"
                              title="View live property listing"
                            >
                              <img
                                src={property.photos[0] || getDistinctCommunityPhoto(property.id || property.societyName, 800)}
                                alt={property.societyName}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.dataset.hasFallback) {
                                    target.dataset.hasFallback = 'true';
                                    target.src = getDistinctCommunityPhoto(property.id || property.societyName, 800);
                                  }
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                              
                              {/* Photo counter chip on bottom left */}
                              <div className="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1">
                                <Camera className="w-3 h-3" />
                                <span>{property.photoCount} Photos</span>
                              </div>

                              {/* Diligence Tag on top left */}
                              <div className="absolute top-2.5 left-2.5 bg-[#0073E6] text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm flex items-center space-x-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>{isRent ? 'TENANCY ASSISTED' : 'TITLE CHECKED'}</span>
                              </div>
                            </a>

                            {/* Middle: Title, Pricing, Specs */}
                            <div className="md:col-span-5 space-y-2.5">
                              <div>
                                <a
                                  href={`/property/${property.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group/title block hover:underline"
                                >
                                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover/title:text-[#0073E6] transition-colors leading-tight flex items-center space-x-1.5">
                                    <span>{property.bhkType} Flat {isRent ? 'for Rent' : 'for Resale'}</span>
                                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/title:text-[#0073E6]" />
                                  </h3>
                                </a>
                                <p className="text-xs font-bold text-[#0073E6] mt-0.5">
                                  {property.societyName}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                  <MapPin className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                  <span>{property.locality}</span>
                                </p>
                              </div>

                              {/* Price Row */}
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

                            {/* Right Column: Performance Scores & Simple Document Status */}
                            <div className="md:col-span-3 bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-3">
                              
                              <div className="grid grid-cols-3 gap-1 text-center">
                                <div>
                                  <span className="text-base font-black text-[#0073E6] block">
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

                              {/* Simple Document Status (Truthful backend state without verification workflows) */}
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[11px] font-bold text-slate-600 flex items-center space-x-1">
                                    <FileText className="w-3 h-3 text-slate-400" />
                                    <span>Document Status:</span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    overallDocStatus === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : overallDocStatus === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {overallDocStatus === 'VERIFIED' ? 'Verified' : overallDocStatus === 'REJECTED' ? 'Rejected' : 'Pending'}
                                  </span>
                                </div>
                                {verifiedTimestamp && (
                                  <p className="text-[10px] text-slate-500 font-mono text-right">
                                    {verifiedTimestamp}
                                  </p>
                                )}
                              </div>

                            </div>

                          </div>

                          {/* ======================================================== */}
                          {/* PROPERTY PROGRESS TRACKER (6 CONNECTED CRM MILESTONE DOTS) */}
                          {/* ======================================================== */}
                          <PropertyProgressTracker
                            property={property}
                            variant="card"
                            onViewDetailed={() => {
                              setSelectedPropertyForTimeline(property);
                              setActiveTab('TIMELINE');
                            }}
                          />

                          {/* Share bar */}
                          <div className="px-3 sm:px-6 py-2.5 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-slate-400">
                              Unit Reference: <strong className="font-mono text-slate-700">{property.referenceId}</strong>
                            </span>
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                              <a
                                href={`/property/${property.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0073E6] hover:text-[#005BB5] flex items-center space-x-1 text-xs font-bold"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>View Live Listing</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = `${window.location.origin}/property/${property.id}`;
                                  navigator.clipboard?.writeText(url);
                                  showToast(`Shareable direct link copied for ${property.referenceId}`);
                                }}
                                className="text-slate-500 hover:text-[#0073E6] flex items-center space-x-1 text-xs font-semibold cursor-pointer"
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

            {/* TAB 2: DEDICATED PROPERTY PROGRESS VIEW (CRM LIFECYCLE TRACKER) */}
            {activeTab === 'TIMELINE' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 space-y-4 sm:space-y-6 shadow-xs w-full min-w-0">
                
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
                    <span>{error}</span>
                    <button type="button" onClick={() => setError(null)} className="font-bold">Dismiss</button>
                  </div>
                )}

                {(() => {
                  const timelineTarget = selectedPropertyForTimeline || properties[0];
                  if (!timelineTarget) {
                    return (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        No property selected for progress tracking.
                      </div>
                    );
                  }

                  const { index: activeIdx, isLost, label: currentStageLabel } = getCrmMilestoneIndex(timelineTarget.status);

                  return (
                    <>
                      {/* Property Progress Header Banner */}
                      <div className="bg-gradient-to-r from-[#172033] to-[#0073E6] text-white p-3.5 sm:p-5 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                            <Activity className="w-4 h-4" />
                            <span>Property Progress</span>
                          </div>
                          <h2 className="text-base sm:text-lg font-black tracking-tight">
                            {timelineTarget.societyName || 'Bengaluru Property'} ({timelineTarget.bhkType || 'Flat'})
                          </h2>
                          <div className="text-xs text-blue-200 flex flex-wrap items-center gap-1.5">
                            <span>Tracking ID: <strong className="font-mono text-white">{timelineTarget.referenceId || 'SMG-TRACK'}</strong></span>
                            <span className="hidden sm:inline">•</span>
                            <span>RM: Kavitha Ranganathan (+91 8217873708)</span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-blue-200 uppercase font-bold block">Current Lifecycle Stage</span>
                          <span className="text-base font-extrabold text-emerald-400">
                            {isLost ? 'LOST' : currentStageLabel}
                          </span>
                        </div>
                      </div>

                      {/* Property selector if owner has multiple properties */}
                      {properties.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-slate-600">Select Property:</span>
                          <select
                            value={timelineTarget.id}
                            onChange={(e) => {
                              const found = properties.find(p => p.id === e.target.value);
                              if (found) setSelectedPropertyForTimeline(found);
                            }}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                          >
                            {properties.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.societyName} ({p.bhkType}) - {p.referenceId}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Primary Connected Milestone Dots Bar */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          CRM Lifecycle Milestones
                        </h3>
                        <PropertyProgressTracker
                          property={timelineTarget}
                          variant="detailed"
                        />
                      </div>

                      {/* Chronological Milestone Event Log with Real Backend Timestamps */}
                      <div className="space-y-3 pt-2">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Milestone Event Details & Notes
                        </h3>

                        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                          {CRM_MILESTONES.map((m, mIdx) => {
                            const isCompleted = !isLost && mIdx < activeIdx;
                            const isCurrent = !isLost && mIdx === activeIdx;
                            const timestamp = getMilestoneEventTimestamp(timelineTarget, m.key, isCompleted || isCurrent);

                            return (
                              <div key={m.key} className="relative group">
                                {/* Dot indicator on vertical rail */}
                                <div className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-100'
                                    : isCurrent
                                    ? 'bg-[#0073E6] text-white shadow-md ring-3 ring-blue-200 scale-110'
                                    : 'bg-white border-2 border-slate-300 text-slate-400'
                                }`}>
                                  {isCompleted ? (
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  ) : isCurrent ? (
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                  )}
                                </div>

                                {/* Event Card */}
                                <div className={`p-4 rounded-xl border transition-all ${
                                  isCurrent
                                    ? 'bg-blue-50/70 border-blue-300 shadow-2xs'
                                    : isCompleted
                                    ? 'bg-slate-50/70 border-slate-200'
                                    : 'bg-white border-dashed border-slate-200 opacity-60'
                                }`}>
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-black text-sm text-slate-900">
                                        {m.label} • {m.subLabel}
                                      </h4>
                                      <span className={`px-2 py-0.2 rounded font-black text-[9px] uppercase ${
                                        isCompleted
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : isCurrent
                                          ? 'bg-blue-100 text-[#0073E6]'
                                          : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        {isCompleted ? 'COMPLETED' : isCurrent ? 'CURRENT MILESTONE' : 'PENDING'}
                                      </span>
                                    </div>

                                    <span className="text-xs font-mono font-bold text-slate-500">
                                      {timestamp}
                                    </span>
                                  </div>

                                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    {m.key === 'NEW' && 'Property unit specifications, pricing expectation, and ownership intake digitized in system.'}
                                    {m.key === 'CONTACTED' && 'Assigned Dedicated Relationship Manager Kavitha Ranganathan (+91 8217873708) for personal support.'}
                                    {m.key === 'FOLLOW_UP' && 'Due diligence follow-up, title documentation screening, and property readiness review.'}
                                    {m.key === 'SITE_VISIT' && 'Coordinated screened buyer / tenant site visits escorted by RM. Zero spam calls to owner.'}
                                    {m.key === 'NEGOTIATION' && 'Offer structuring, earnest token verification, and buyer price negotiations handled by lead counsel.'}
                                    {m.key === 'CONVERTED' && 'Sale deed registered at Sub-Registrar / rental agreement executed in secure bank escrow.'}
                                  </p>

                                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                                    <span>Handled by: <strong className="text-slate-800">RM Desk (+91 8217873708)</strong></span>
                                    <span className="font-medium text-slate-400">Unit: {timelineTarget.referenceId}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}

              </div>
            )}

            {/* TAB 3: BACKEND MANAGED SITE VISITS & RM SUPPORT */}
            {activeTab === 'VISITS' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 space-y-4 sm:space-y-6 shadow-xs w-full min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      Coordinated Site Visits & RM Escorts
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Our Relationship Managers personally accompany every screened buyer and tenant. You don't have to show your flat repeatedly.
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 sm:px-3 py-1.5 rounded-lg border border-indigo-200 flex items-center space-x-1.5">
                    <Users className="w-4 h-4" />
                    <span>{kpiStats.totalSiteVisits} Verified Visits Logged</span>
                  </span>
                </div>

                {kpiStats.totalSiteVisits === 0 ? (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#0073E6]">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Site Visits Scheduled Yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      As soon as your property passes title diligence and prospective buyers or tenants are pre-screened for loan eligibility, your assigned Relationship Manager will schedule visits and log field feedback notes here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {properties.map(p => (
                      p.siteVisits?.map(visit => (
                        <div
                          key={visit.id}
                          className="p-3.5 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                              <span className="font-black text-sm text-slate-900">
                                {visit.visitorProfile}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800">
                                Screened Tech Buyer
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-700">{visit.scheduledTime}</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                            <span className="font-bold text-[#0073E6] block">
                              RM Field Notes ({visit.rmEscort}):
                            </span>
                            <p className="text-slate-600 italic">
                              "{visit.feedbackNotes}"
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-xs pt-1 gap-2">
                            <span className="text-slate-500 text-[11px]">
                              Property: <strong>{p.societyName}</strong> ({p.bhkType}) • Ref: {p.referenceId}
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
                )}
              </div>
            )}

          </main>

        </div>
      </div>

    </div>
  );
};
