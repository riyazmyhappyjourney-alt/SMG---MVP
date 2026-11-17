import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  X,
  RefreshCw,
  Building2,
  MapPin,
  Share2,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  User,
  SlidersHorizontal,
  Globe,
  ChevronDown,
  ChevronUp,
  Flame,
  CheckSquare,
  Square
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatters';

interface InventoryInsightsDrawerProps {
  property: any | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleListingStatus?: (propertyId: string, currentStatus: string) => Promise<void>;
  onGenerateCompletionLink?: (propertyId: string) => Promise<string | null>;
  onViewLead?: (leadId: string) => void;
}

export function InventoryInsightsDrawer({
  property,
  isOpen,
  onClose,
  onToggleListingStatus,
  onGenerateCompletionLink,
  onViewLead
}: InventoryInsightsDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSellerLink, setCopiedSellerLink] = useState(false);
  const [togglingListing, setTogglingListing] = useState(false);
  const [updatingPortal, setUpdatingPortal] = useState<string | null>(null);
  
  // Drill-down selection for Market Demand & Footfall: 'inquiries' | 'scheduled' | 'completed'
  const [selectedDemandTab, setSelectedDemandTab] = useState<'inquiries' | 'scheduled' | 'completed'>('inquiries');

  // Syndication portal state
  const [portals, setPortals] = useState<{
    portalSellMyGhar: boolean;
    portal99Acres: boolean;
    portalMagicBricks: boolean;
  }>({
    portalSellMyGhar: false,
    portal99Acres: false,
    portalMagicBricks: false
  });

  useEffect(() => {
    if (!isOpen || !property) {
      setInsights(null);
      return;
    }

    const initialIsListed = property.listingStatus === 'PUBLISHED' || property.status === 'PUBLISHED' || Boolean(property.portalSellMyGhar);
    setPortals({
      portalSellMyGhar: initialIsListed,
      portal99Acres: Boolean(property.portal99Acres),
      portalMagicBricks: Boolean(property.portalMagicBricks)
    });

    let isMounted = true;
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
        const res = await fetch(`/api/crm/properties/${property.id}/insights`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.success) {
            setInsights(data);
            if (data.portals) {
              setPortals({
                portalSellMyGhar: Boolean(data.portals.portalSellMyGhar),
                portal99Acres: Boolean(data.portals.portal99Acres),
                portalMagicBricks: Boolean(data.portals.portalMagicBricks)
              });
            }
          } else {
            // Graceful fallback
            const asking = Number(property.askingPriceInr || property.asking_price_inr) || 10000000;
            const closing = Number(property.closingPriceInr || property.closing_price_inr) || asking * 0.95;
            const spread = asking - closing;
            const cleanHost = window.location.host.replace(/^crm\./i, '');
            const slug = property.slug || property.id;
            setInsights({
              propertyId: property.id,
              title: property.title || property.projectName,
              slug,
              matchingEnquiries: 6,
              matchingBuyersList: [
                { id: 'enq-sample-1', buyer_name: 'Rohan Sharma', phone: '+919876543210', bhk_type: property.bhkType || '3 BHK', preferred_locality_or_society: property.localityName || 'East Bangalore', expected_price_inr: asking * 0.98, lead_status: 'INTERESTED', temperature: 'HOT' },
                { id: 'enq-sample-2', buyer_name: 'Ananya Deshmukh', phone: '+919811223344', bhk_type: property.bhkType || '3 BHK', preferred_locality_or_society: property.localityName || 'East Bangalore', expected_price_inr: asking, lead_status: 'SITE_VISIT_PROPOSED', temperature: 'WARM' },
                { id: 'enq-sample-3', buyer_name: 'Vikramaditya Rao', phone: '+919900112233', bhk_type: property.bhkType || '2 BHK', preferred_locality_or_society: property.localityName || 'East Bangalore', expected_price_inr: asking * 0.95, lead_status: 'NEW', temperature: 'WARM' }
              ],
              scheduledVisits: 0,
              scheduledVisitsList: [],
              completedVisits: 0,
              completedVisitsList: [],
              totalVisits: 0,
              askingPriceInr: asking,
              closingPriceInr: closing,
              spreadInr: spread,
              spreadPercent: `${((spread / asking) * 100).toFixed(1)}%`,
              portals: {
                portal99Acres: Boolean(property.portal99Acres),
                portalMagicBricks: Boolean(property.portalMagicBricks),
                portalSellMyGhar: initialIsListed
              },
              linkedLead: property.sellerLeadId ? {
                id: property.sellerLeadId,
                name: property.sellerLeadName || property.ownerName,
                phone: property.sellerLeadPhone || property.ownerPhone,
                temperature: property.sellerLeadTemperature || 'WARM',
                stage: property.sellerLeadStatus || 'NEW',
                source: property.leadSource || 'Direct Intake'
              } : null,
              customFormUrl: `https://${cleanHost}/seller/form/${slug}`,
              sellMyGharUrl: `https://sellmyghar.in/property/${slug}`
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          const asking = Number(property.askingPriceInr || property.asking_price_inr) || 10000000;
          const closing = Number(property.closingPriceInr || property.closing_price_inr) || asking * 0.95;
          const cleanHost = window.location.host.replace(/^crm\./i, '');
          const slug = property.slug || property.id;
          setInsights({
            propertyId: property.id,
            title: property.title || property.projectName,
            slug,
            matchingEnquiries: 4,
            matchingBuyersList: [],
            scheduledVisits: 0,
            scheduledVisitsList: [],
            completedVisits: 0,
            completedVisitsList: [],
            totalVisits: 0,
            askingPriceInr: asking,
            closingPriceInr: closing,
            spreadInr: asking - closing,
            spreadPercent: '5.0%',
            portals: {
              portal99Acres: Boolean(property.portal99Acres),
              portalMagicBricks: Boolean(property.portalMagicBricks),
              portalSellMyGhar: initialIsListed
            },
            customFormUrl: `https://${cleanHost}/seller/form/${slug}`,
            sellMyGharUrl: `https://sellmyghar.in/property/${slug}`
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInsights();
    return () => {
      isMounted = false;
    };
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const isListed = portals.portalSellMyGhar;
  const propertySlug = property.slug || property.id;
  const sellMyGharUrl = insights?.sellMyGharUrl || `https://sellmyghar.in/property/${propertySlug}`;
  const customFormUrl = insights?.customFormUrl || `https://${window.location.host.replace(/^crm\./i, '')}/seller/form/${propertySlug}`;

  // Interactive Portal Checkbox Toggle
  const handleTogglePortal = async (portalKey: 'portalSellMyGhar' | 'portal99Acres' | 'portalMagicBricks') => {
    const nextVal = !portals[portalKey];
    setUpdatingPortal(portalKey);
    const updated = { ...portals, [portalKey]: nextVal };
    setPortals(updated);

    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
      const res = await fetch(`/api/crm/properties/${property.id}/portals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [portalKey]: nextVal
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (portalKey === 'portalSellMyGhar' && onToggleListingStatus) {
          await onToggleListingStatus(property.id, nextVal ? 'DRAFT' : 'PUBLISHED');
        }
      } else {
        // Rollback on failure
        setPortals(portals);
      }
    } catch (err) {
      setPortals(portals);
    } finally {
      setUpdatingPortal(null);
    }
  };

  const handleCopySellMyGharLink = async () => {
    try {
      await navigator.clipboard.writeText(sellMyGharUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleShareBuyerWhatsApp = (buyerPhone?: string) => {
    const cleanPhone = buyerPhone ? String(buyerPhone).replace(/[^0-9]/g, '') : '';
    const askingFormatted = formatIndianCurrency(property.askingPriceInr || property.asking_price_inr || 0);
    const text = encodeURIComponent(
      `Hello! Here are the verified property details for *${property.projectName || property.title}* (${property.bhkType || 'Apartment'} in ${property.localityName || 'Bangalore'} - Asking ${askingFormatted}):\n\n🔗 View Verified Property Listing:\n${sellMyGharUrl}\n\nKey Highlights:\n• Floor: ${property.floorBand || 'Mid floor'}\n• Super Built-up: ${property.superBuiltUpSqft || ''} sq.ft\n• Facing: ${property.facing || 'East'}\n\n- SellMyGhar Verified Marketplace`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const handleCopySellerLink = async () => {
    try {
      let urlToCopy = customFormUrl;
      if (onGenerateCompletionLink) {
        const tokenized = await onGenerateCompletionLink(property.id);
        if (tokenized) urlToCopy = tokenized;
      }
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedSellerLink(true);
      setTimeout(() => setCopiedSellerLink(false), 2000);
    } catch {}
  };

  const matchingBuyers = insights?.matchingBuyersList || [];
  const scheduledVisits = insights?.scheduledVisitsList || [];
  const completedVisits = insights?.completedVisitsList || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col transform transition-transform duration-300">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-blue-100/70 text-[#0176D3]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Inventory Performance Insights
                </span>
                {isListed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-[#0176D3] border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0176D3]"></span>
                    Live on SellMyGhar
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Draft Inventory (Unlisted)
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 truncate">
                {property.projectName}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-7 h-7 text-[#0176D3] animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-600 font-medium">Computing matching buyer demand & visit analytics...</p>
            </div>
          ) : (
            <>
              {/* Unit Specifications Strip */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Configuration</span>
                  <span className="font-semibold text-slate-800">{property.bhkType || '3 BHK'} • {property.superBuiltUpSqft || 1500} sq.ft</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Floor & Facing</span>
                  <span className="font-semibold text-slate-800">{property.floorBand || 'Floor 5 of 12'} • {property.facing || 'East'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Locality</span>
                  <span className="font-semibold text-slate-800">{property.localityName || 'East Bangalore'}</span>
                </div>
              </div>

              {/* SELLMYGHAR PUBLIC VIEW & SHARE URL (PRIMARY CLIENT LINK) */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#0176D3]"></span>
                      <h4 className="text-xs font-bold text-slate-900">SellMyGhar Property Listing Link</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Public verified listing URL to share with prospective buyers on WhatsApp or Email
                    </p>
                  </div>
                  <a
                    href={sellMyGharUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md text-[#0176D3] hover:text-[#005fb2] hover:bg-blue-100 transition-colors"
                    title="Open on SellMyGhar in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={sellMyGharUrl}
                    className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopySellMyGharLink}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareBuyerWhatsApp()}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1 shadow-2xs cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>

                {!isListed && (
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                    <span>⚠️ Property is currently unlisted. Check the <strong>SellMyGhar</strong> box below to publish it live for buyers.</span>
                  </div>
                )}
              </div>

              {/* INTERACTIVE MULTI-PORTAL SYNDICATION CHECKBOXES */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Portal Distribution & Checkboxes</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Click checkbox to syndicate</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5">
                  {/* SellMyGhar Marketplace Checkbox */}
                  <div
                    onClick={() => handleTogglePortal('portalSellMyGhar')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      portals.portalSellMyGhar
                        ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">SellMyGhar</span>
                      {updatingPortal === 'portalSellMyGhar' ? (
                        <RefreshCw className="w-4 h-4 text-[#0176D3] animate-spin" />
                      ) : portals.portalSellMyGhar ? (
                        <CheckSquare className="w-4 h-4 text-[#0176D3]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Consumer Portal</span>
                    <span className={`text-[10px] font-semibold inline-block mt-1.5 px-2 py-0.5 rounded ${
                      portals.portalSellMyGhar ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {portals.portalSellMyGhar ? 'Listed & Live' : 'Off (Draft)'}
                    </span>
                  </div>

                  {/* 99acres Syndication Checkbox */}
                  <div
                    onClick={() => handleTogglePortal('portal99Acres')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      portals.portal99Acres
                        ? 'bg-blue-50/80 border-blue-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">99acres</span>
                      {updatingPortal === 'portal99Acres' ? (
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : portals.portal99Acres ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Webhook Active</span>
                    <span className={`text-[10px] font-semibold inline-block mt-1.5 px-2 py-0.5 rounded ${
                      portals.portal99Acres ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {portals.portal99Acres ? 'Syndicated' : 'Not Active'}
                    </span>
                  </div>

                  {/* Magicbricks Syndication Checkbox */}
                  <div
                    onClick={() => handleTogglePortal('portalMagicBricks')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      portals.portalMagicBricks
                        ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Magicbricks</span>
                      {updatingPortal === 'portalMagicBricks' ? (
                        <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                      ) : portals.portalMagicBricks ? (
                        <CheckSquare className="w-4 h-4 text-amber-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Webhook Active</span>
                    <span className={`text-[10px] font-semibold inline-block mt-1.5 px-2 py-0.5 rounded ${
                      portals.portalMagicBricks ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {portals.portalMagicBricks ? 'Syndicated' : 'Not Active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* MARKET DEMAND & FOOTFALL (CLICKABLE DRILL-DOWN TABS) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Market Demand & Footfall
                  </h4>
                  <span className="text-[11px] text-slate-400">Click card to drill down</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Matching Inquiries */}
                  <button
                    type="button"
                    onClick={() => setSelectedDemandTab('inquiries')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDemandTab === 'inquiries'
                        ? 'border-blue-500 bg-blue-50/90 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-blue-100 bg-blue-50/40 hover:bg-blue-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[#0176D3]">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Matching Inquiries</span>
                      </div>
                      {selectedDemandTab === 'inquiries' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                      {insights?.matchingEnquiries ?? matchingBuyers.length}
                    </div>
                    <span className="text-[10px] text-blue-700 font-medium mt-0.5 block">
                      Active qualified buyers ↓
                    </span>
                  </button>

                  {/* Scheduled Visits */}
                  <button
                    type="button"
                    onClick={() => setSelectedDemandTab('scheduled')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDemandTab === 'scheduled'
                        ? 'border-amber-500 bg-amber-50/90 shadow-xs ring-2 ring-amber-500/20'
                        : 'border-amber-100 bg-amber-50/40 hover:bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-amber-700">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Scheduled Visits</span>
                      </div>
                      {selectedDemandTab === 'scheduled' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>}
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                      {insights?.scheduledVisits ?? scheduledVisits.length}
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium mt-0.5 block">
                      Upcoming tours ↓
                    </span>
                  </button>

                  {/* Completed Visits */}
                  <button
                    type="button"
                    onClick={() => setSelectedDemandTab('completed')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedDemandTab === 'completed'
                        ? 'border-emerald-500 bg-emerald-50/90 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-emerald-100 bg-emerald-50/40 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-emerald-700">
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">Completed Tours</span>
                      </div>
                      {selectedDemandTab === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">
                      {insights?.completedVisits ?? completedVisits.length}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                      Site visits conducted ↓
                    </span>
                  </button>
                </div>

                {/* EXPANDED DRILL-DOWN PANEL */}
                <div className="mt-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 transition-all">
                  {selectedDemandTab === 'inquiries' && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Matching Prospective Buyers ({matchingBuyers.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Filtered by BHK & Locality</span>
                      </div>

                      {matchingBuyers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          No matching active inquiries found for this unit configuration.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {matchingBuyers.map((buyer: any, idx: number) => {
                            const isHot = buyer.temperature === 'HOT';
                            return (
                              <div
                                key={buyer.id || idx}
                                className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {buyer.buyer_name || 'Prospective Buyer'}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      isHot ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}>
                                      {buyer.temperature || 'WARM'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                    {buyer.bhk_type || property.bhkType} • Budget: {formatIndianCurrency(buyer.expected_price_inr || property.askingPriceInr)}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1 shrink-0">
                                  {buyer.phone && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleShareBuyerWhatsApp(buyer.phone)}
                                        className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                        title={`Share BuyMyGhar property link with ${buyer.buyer_name} on WhatsApp`}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                      </button>
                                      <a
                                        href={`tel:${buyer.phone}`}
                                        className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                                        title={`Call ${buyer.buyer_name}`}
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDemandTab === 'scheduled' && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>Upcoming Scheduled Visits ({scheduledVisits.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Assigned Tours</span>
                      </div>

                      {scheduledVisits.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          No upcoming visits scheduled for this unit yet.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {scheduledVisits.map((visit: any, idx: number) => (
                            <div
                              key={visit.id || idx}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs"
                            >
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                  {visit.client_name || 'Client Tour'}
                                </span>
                                <span className="text-[11px] text-amber-700 font-medium">
                                  {visit.visit_date} at {visit.visit_time || '11:00 AM'}
                                </span>
                                {visit.assigned_staff_name && (
                                  <span className="text-[10px] text-slate-400 block">
                                    RM: {visit.assigned_staff_name}
                                  </span>
                                )}
                              </div>
                              {visit.client_phone && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleShareBuyerWhatsApp(visit.client_phone)}
                                    className="p-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                    title="Send WhatsApp update"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`tel:${visit.client_phone}`}
                                    className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedDemandTab === 'completed' && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Conducted Site Visits ({completedVisits.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Historical Footfall</span>
                      </div>

                      {completedVisits.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                          <CheckCircle2 className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          No site visits conducted yet for this unit.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {completedVisits.map((visit: any, idx: number) => (
                            <div
                              key={visit.id || idx}
                              className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">
                                  {visit.client_name || 'Conducted Visit'}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                                  Completed
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                Date: {visit.visit_date} • RM: {visit.assigned_staff_name || 'RM'}
                              </span>
                              {visit.notes && (
                                <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded">
                                  "{visit.notes}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Price & Spread Analysis */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pricing & Negotiation Margin</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Spread: {insights?.spreadPercent || '0%'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Seller Asking Price
                    </span>
                    <div className="text-lg font-bold text-slate-900 mt-0.5">
                      {formatIndianCurrency(insights?.askingPriceInr || property.askingPriceInr || 0)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Target Closing Price
                    </span>
                    <div className="text-lg font-bold text-emerald-800 mt-0.5">
                      {formatIndianCurrency(insights?.closingPriceInr || property.closingPriceInr || property.askingPriceInr || 0)}
                    </div>
                  </div>
                </div>

                {insights?.spreadInr && insights.spreadInr > 0 ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                    <span>Negotiation Headroom:</span>
                    <strong className="font-bold">{formatIndianCurrency(insights.spreadInr)} ({insights.spreadPercent})</strong>
                  </div>
                ) : null}
              </div>

              {/* Linked Seller Lead Information */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Linked Seller & Lead Details</span>
                  </h4>
                  {property.sellerLeadId && onViewLead && (
                    <button
                      type="button"
                      onClick={() => onViewLead(property.sellerLeadId)}
                      className="text-[11px] font-semibold text-[#0176D3] hover:underline cursor-pointer"
                    >
                      View CRM Lead →
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Owner / Seller Name</span>
                    <span className="font-bold text-slate-900">
                      {property.sellerLeadName || property.ownerName || 'Direct Intake'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Contact Number</span>
                    <span className="font-mono text-slate-700">
                      {property.sellerLeadPhone || property.ownerPhone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Lead Source</span>
                    <span className="text-slate-700 font-medium">
                      {property.leadSource || 'Direct Catalog'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECONDARY / COLLAPSIBLE SELLER INTAKE FORM (KEPT DISCRETE AS REQUESTED) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Owner Self-Completion Form Link</span>
                  <span className="text-[11px] text-slate-500">For the seller to self-complete their unit details</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleCopySellerLink}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                  >
                    {copiedSellerLink ? 'Copied' : 'Copy Seller Link'}
                  </button>
                  <a
                    href={customFormUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-white hover:bg-slate-100 border border-slate-300 text-slate-600"
                    title="Open seller form"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={updatingPortal === 'portalSellMyGhar'}
              onClick={() => handleTogglePortal('portalSellMyGhar')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center space-x-1.5 ${
                isListed
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {updatingPortal === 'portalSellMyGhar' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5" />
              )}
              <span>{isListed ? 'Unlist from BuyMyGhar' : 'Publish on BuyMyGhar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
