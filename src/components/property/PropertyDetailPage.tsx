import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  BedDouble,
  Maximize,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  ArrowLeft,
  Share2,
  Check,
  Info,
  Car,
  Bath,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  UserCheck
} from 'lucide-react';
import { Logo } from '../brand/Logo';

export interface PublicPropertyDetail {
  id: string;
  projectName: string;
  localityName: string;
  propertyType: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft: number;
  floorBand: string;
  facing: string;
  bathroomsCount: number;
  balconiesCount: number;
  carParksCount: number;
  isCoveredParking: boolean;
  askingPriceInr: number;
  pricePerSqft: number;
  monthlyMaintenanceInr?: number;
  amenities: string[];
  description: string;
  developer?: {
    name: string;
    reraNumber: string;
    launchYear: number;
  };
  landmarks?: Array<{ name: string; distance: string; type: string }>;
  verification: {
    tier: string;
    badge: string;
    khata: string;
    encumbrance: string;
    titleDeed: string;
    taxReceipt: string;
    fieldInspection: string;
  };
  photos: Array<{ id: string; url: string; caption: string; isCover: boolean }>;
  relationshipManager: {
    name: string;
    role: string;
    phone: string;
    desk: string;
  };
  similarProperties: Array<{
    id: string;
    projectName: string;
    localityName: string;
    bhkType: string;
    superBuiltUpSqft: number;
    carpetAreaSqft: number;
    floorBand: string;
    facing: string;
    askingPriceInr: number;
    pricePerSqft: number;
    image: string;
    verificationBadge: string;
  }>;
}

interface PropertyDetailPageProps {
  propertyId: string;
  onBackToHome: () => void;
  onNavigateToProperty?: (id: string) => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  propertyId,
  onBackToHome,
  onNavigateToProperty
}) => {
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Enquiry / Schedule Visit Form State
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('This Saturday (11:00 AM)');
  const [fundingMode, setFundingMode] = useState('PRE_APPROVED_LOAN');
  const [dpdpConsent, setDpdpConsent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    referenceId: string;
    message: string;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProperty() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/listings/${encodeURIComponent(propertyId)}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This property is not available or is no longer publicly listed.');
          }
          throw new Error('Unable to load property details. Please try again later.');
        }
        const data = await res.json();
        if (isMounted) {
          if (data.listing) {
            setProperty(data.listing);
            setActivePhotoIndex(0);
          } else {
            throw new Error('Property record not found.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load property');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (propertyId) {
      fetchProperty();
    }
    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const formatPriceCroresOrLakhs = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} Lakhs`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.projectName || 'SellMyGhar Verified Home',
        text: `Verified ${property?.bhkType} apartment in ${property?.projectName}, ${property?.localityName}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Property link copied to clipboard!');
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!buyerName.trim() || buyerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }

    const cleanPhone = buyerPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!dpdpConsent) {
      setFormError('Statutory consent is required under the DPDP Act for visit coordination.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: buyerName.trim(),
        phone: cleanPhone,
        intent: 'BUY',
        propertyId: property?.id,
        societyName: property?.projectName,
        locality: property?.localityName,
        bhkType: property?.bhkType,
        builtUpSqft: property?.superBuiltUpSqft,
        notes: `Preferred Slot: ${preferredSlot}. Funding: ${fundingMode}. Requested via Public Detail Page.`
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry.');
      }

      setBookingSuccess({
        referenceId: data.referenceId || `SMG-${Date.now().toString().slice(-4)}`,
        message: data.message || 'Viewing request confirmed. Our relationship lead will contact you shortly.'
      });
    } catch (err: any) {
      setFormError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Link Handler (Strictly Contacts SellMyGhar RM Channel)
  const getWhatsAppUrl = () => {
    const rmPhone = '918217873708';
    const text = encodeURIComponent(
      `Hello SellMyGhar Desk, I am interested in viewing the verified ${property?.bhkType} at ${property?.projectName}, ${property?.localityName} (Ref: ${property?.id}). Please assist with viewing details.`
    );
    return `https://wa.me/${rmPhone}?text=${text}`;
  };

  // Call Link Handler (Strictly Contacts SellMyGhar RM Desk)
  const rmCallPhone = '+918217873708';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-4 font-['Montserrat']">
        <div className="w-12 h-12 border-4 border-[#244B8F] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading Verified Property Details...</h2>
        <p className="text-xs text-slate-500 mt-1">Inspecting statutory title and RERA compliance data</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat']">
        {/* Navigation Bar */}
        <header className="bg-[#172033] text-white px-4 py-3 border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Listings</span>
            </button>
            <div className="flex items-center space-x-2">
              <Logo />
            </div>
          </div>
        </header>

        <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Property Not Available</h1>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'This property is no longer active on the public discovery portal.'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="px-6 py-2.5 bg-[#244B8F] text-white font-bold text-xs rounded-xl hover:bg-[#1B396E] transition-all cursor-pointer shadow-md"
          >
            Explore Active Bengaluru Homes
          </button>
        </div>
      </div>
    );
  }

  const activePhoto = property.photos[activePhotoIndex] || property.photos[0];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 font-['Montserrat'] selection:bg-[#244B8F] selection:text-white pb-24 md:pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-fade-in text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#172033]/95 backdrop-blur-md text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Search</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-4 w-px bg-slate-700 hidden sm:block" />
            <div className="hidden sm:flex items-center space-x-2">
              <Logo />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Share Verified Listing"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={`tel:${rmCallPhone}`}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call RM Desk</span>
            </a>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>

        </div>
      </header>

      {/* BREADCRUMB / ID BAR */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <span>Bengaluru</span>
            <span>›</span>
            <span>{property.localityName}</span>
            <span>›</span>
            <strong className="text-slate-800">{property.projectName}</strong>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
              REF: {property.id}
            </span>
            <span className="inline-flex items-center text-emerald-700 font-semibold">
              <Lock className="w-3 h-3 mr-1 text-emerald-600" />
              Verified Escorted Resale
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* ROW 1: TITLE & TOP HIGHLIGHTS */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider ${
                property.verification.badge === 'INSPECTED'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : property.verification.badge === 'DOCS CHECKED'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-blue-100 text-blue-900 border border-blue-300'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                {property.verification.badge}
              </span>
              <span className="px-2.5 py-1 rounded bg-[#172033] text-white text-[11px] font-bold">
                {property.bhkType}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 text-[11px] font-semibold">
                {property.propertyType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight">
              {property.bhkType} Resale Apartment in {property.projectName}
            </h1>

            <p className="text-sm text-slate-600 flex items-center">
              <MapPin className="w-4 h-4 mr-1.5 text-[#244B8F] shrink-0" />
              <span>{property.localityName}</span>
            </p>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between lg:justify-end gap-6 shrink-0">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Asking Price</span>
              <span className="text-2xl sm:text-3xl font-black text-[#172033]">
                {formatPriceCroresOrLakhs(property.askingPriceInr)}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6 text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Price / SBUA</span>
              <span className="text-base sm:text-lg font-bold text-slate-700">
                ₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: IMAGE GALLERY & SUMMARY LAYOUT (2 Columns on Large Screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Gallery & Comprehensive Details (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* 1. Large Photo Showcase */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="relative aspect-16/10 bg-slate-950 overflow-hidden">
                <img
                  src={activePhoto.url}
                  alt={activePhoto.caption || property.projectName}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
                
                {/* Photo Caption Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-end justify-between text-white text-xs">
                  <span className="font-semibold">{activePhoto.caption}</span>
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs font-mono text-[11px]">
                    {activePhotoIndex + 1} of {property.photos.length}
                  </span>
                </div>

                {/* Left / Right Arrow Overlay Buttons */}
                {property.photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : property.photos.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors cursor-pointer"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePhotoIndex((prev) => (prev < property.photos.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors cursor-pointer"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {property.photos.length > 1 && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto scrollbar-thin">
                  {property.photos.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        idx === activePhotoIndex
                          ? 'border-[#244B8F] ring-2 ring-blue-200'
                          : 'border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Key Specifications Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
              <h2 className="text-base font-extrabold text-[#172033] uppercase tracking-wider text-xs flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#244B8F]" />
                <span>Property Specifications</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Maximize className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Super Built-up</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{property.superBuiltUpSqft} sq.ft</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Maximize className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Carpet Area</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{property.carpetAreaSqft} sq.ft</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">~{Math.round((property.carpetAreaSqft / property.superBuiltUpSqft) * 100)}% usable</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Building2 className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Floor Level</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{property.floorBand}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Compass className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Facing</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{property.facing}</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Bath className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Bathrooms</span>
                  </div>
                  <span className="text-base font-black text-slate-900">{property.bathroomsCount} Baths</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Car className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Parking</span>
                  </div>
                  <span className="text-base font-black text-slate-900">
                    {property.carParksCount} {property.isCoveredParking ? 'Covered' : 'Open'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Occupancy</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">Ready to Move</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Est. Maintenance</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">
                    ₹{(property.monthlyMaintenanceInr || 4500).toLocaleString('en-IN')}/mo
                  </span>
                </div>

              </div>
            </div>

            {/* 3. Statutory Verification & Legal Diligence Card */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 rounded-2xl border border-emerald-200/90 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-base font-black text-slate-900">
                    SellMyGhar Advocate Legal Diligence
                  </h2>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  100% Verified Title
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-['Poppins']">
                This property has been vetted by our legal diligence panel. All statutory title deeds, BBMP khata certificates, and Kaveri Sub-Registrar encumbrance records have been reviewed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{property.verification.khata}</span>
                    <span className="text-[11px] text-slate-500">BBMP A-Khata with valid SAS tax challan</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{property.verification.encumbrance}</span>
                    <span className="text-[11px] text-slate-500">Form 15 Kaveri portal search zero encumbrances</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{property.verification.titleDeed}</span>
                    <span className="text-[11px] text-slate-500">Complete registered sale deed & mother deed chain</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{property.verification.fieldInspection}</span>
                    <span className="text-[11px] text-slate-500">Physical field verification completed by relationship desk</span>
                  </div>
                </div>

              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-100/50 p-2.5 rounded-lg border border-emerald-200/50 flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Private owner deeds and flat identity remain protected under DPDP Act until private viewing.</span>
              </div>
            </div>

            {/* 4. Description & Layout Highlights */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-[#172033] uppercase tracking-wider text-xs">
                About this Home
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed font-['Poppins']">
                {property.description}
              </p>
            </div>

            {/* 5. Amenities Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-base font-extrabold text-[#172033] uppercase tracking-wider text-xs">
                Township & Society Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Developer & Nearby Landmarks */}
            {(property.developer || (property.landmarks && property.landmarks.length > 0)) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
                
                {property.developer && (
                  <div className="border-b border-slate-200 pb-4 space-y-1">
                    <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Developer & Project Information</h2>
                    <h3 className="text-base font-black text-slate-900">{property.developer.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">
                      RERA ID: {property.developer.reraNumber} • Launched: {property.developer.launchYear}
                    </p>
                  </div>
                )}

                {property.landmarks && property.landmarks.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Nearby Transit & Landmarks</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {property.landmarks.map((lm, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <span className="font-semibold text-slate-800">{lm.name}</span>
                          <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">{lm.distance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Sticky Viewing Request & RM Desk Card (4-5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
            
            {/* 1. Schedule Private Viewing Card */}
            <div className="bg-white rounded-2xl border-2 border-[#244B8F]/20 p-6 sm:p-7 shadow-lg space-y-5">
              
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#244B8F] px-2.5 py-0.5 rounded">
                  Escorted Private Tour
                </span>
                <h3 className="text-lg font-black text-[#172033] mt-2">
                  Schedule Private Viewing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Private walkthrough escorted by assigned SellMyGhar manager. Zero broker calls.
                </p>
              </div>

              {bookingSuccess ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Viewing Request Received</span>
                  </div>
                  <p>{bookingSuccess.message}</p>
                  <p className="font-mono font-bold pt-1">
                    Booking Reference: {bookingSuccess.referenceId}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="mt-3 w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    Schedule Another Time
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number (10 digits)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9845012345"
                        className="w-full pl-11 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Viewing Slot
                    </label>
                    <select
                      value={preferredSlot}
                      onChange={(e) => setPreferredSlot(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                    >
                      <option value="This Saturday (11:00 AM)">This Saturday (11:00 AM)</option>
                      <option value="This Saturday (04:00 PM)">This Saturday (04:00 PM)</option>
                      <option value="This Sunday (11:00 AM)">This Sunday (11:00 AM)</option>
                      <option value="This Sunday (04:00 PM)">This Sunday (04:00 PM)</option>
                      <option value="Weekday Morning (10:30 AM)">Weekday Morning (10:30 AM)</option>
                      <option value="Weekday Evening (05:30 PM)">Weekday Evening (05:30 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Financing Status
                    </label>
                    <select
                      value={fundingMode}
                      onChange={(e) => setFundingMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                    >
                      <option value="PRE_APPROVED_LOAN">Pre-Approved Home Loan</option>
                      <option value="SELF_FUNDED">Self-Funded / Ready Capital</option>
                      <option value="NEED_LOAN_ASSISTANCE">Need SellMyGhar Loan Diligence</option>
                      <option value="EXPLORING">Exploring Options</option>
                    </select>
                  </div>

                  {/* DPDP Statutory Consent Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start space-x-2 cursor-pointer text-[11px] text-slate-600 leading-tight">
                      <input
                        type="checkbox"
                        checked={dpdpConsent}
                        onChange={(e) => setDpdpConsent(e.target.checked)}
                        className="mt-0.5 rounded text-[#244B8F] focus:ring-[#244B8F]"
                      />
                      <span>
                        I consent to SellMyGhar coordinating this private viewing under the Digital Personal Data Protection Act, 2023.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#244B8F] hover:bg-[#1B396E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isSubmitting ? 'Confirming Request...' : 'Confirm Private Viewing Slot'}</span>
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    🔒 Zero broker calls. Unit identity revealed exclusively on private viewing day.
                  </p>
                </form>
              )}

            </div>

            {/* 2. Assigned Relationship Manager Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Assigned Diligence Desk
              </span>
              
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded-full bg-[#244B8F] text-white font-black text-sm flex items-center justify-center shadow-xs">
                  KR
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{property.relationshipManager.name}</h4>
                  <p className="text-xs text-slate-500">{property.relationshipManager.role}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                <a
                  href={`tel:${rmCallPhone}`}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800 text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Desk</span>
                </a>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#128C7E] rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* ROW 3: DETERMINISTIC SIMILAR PROPERTIES SECTION */}
        {property.similarProperties && property.similarProperties.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <div>
              <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-[#244B8F] px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deterministic Relevance</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#172033]">
                Similar Verified Properties in {property.localityName.split(',')[0]}
              </h2>
              <p className="text-xs text-slate-500 font-['Poppins']">
                Real backend inventory matched deterministically by project, locality, and bedroom layout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {property.similarProperties.map((sim) => (
                <div
                  key={sim.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                      <img
                        src={sim.image}
                        alt={sim.projectName}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 bg-[#172033] text-white px-2 py-0.5 rounded text-[11px] font-bold">
                        {sim.bhkType}
                      </div>
                      <div className="absolute top-3 right-3 bg-emerald-700 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {sim.verificationBadge}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-[#172033]/90 px-3 py-1.5 text-white flex items-center justify-between text-xs">
                        <span className="font-black text-sm">{formatPriceCroresOrLakhs(sim.askingPriceInr)}</span>
                        <span className="text-slate-300 text-[11px]">₹{sim.pricePerSqft.toLocaleString('en-IN')}/sq.ft</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#244B8F] transition-colors">
                        {sim.projectName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        <span>{sim.localityName}</span>
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <span>{sim.superBuiltUpSqft} sq.ft</span>
                        <span>•</span>
                        <span>{sim.floorBand}</span>
                        <span>•</span>
                        <span>{sim.facing}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    {onNavigateToProperty ? (
                      <button
                        type="button"
                        onClick={() => onNavigateToProperty(sim.id)}
                        className="w-full py-2 bg-[#244B8F]/10 hover:bg-[#244B8F] text-[#244B8F] hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center block"
                      >
                        View Property Details
                      </button>
                    ) : (
                      <a
                        href={`/property/${sim.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-[#244B8F]/10 hover:bg-[#244B8F] text-[#244B8F] hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center block"
                      >
                        View Property Details
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MOBILE STICKY BOTTOM BAR (Small Screens Only) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xl">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Asking</span>
          <span className="text-sm font-black text-[#172033]">
            {formatPriceCroresOrLakhs(property.askingPriceInr)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <a
            href={`tel:${rmCallPhone}`}
            className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-800"
            title="Call RM Desk"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
          </a>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-lg bg-[#25D366] text-slate-950 font-bold"
            title="WhatsApp Desk"
          >
            <MessageSquare className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 600, behavior: 'smooth' });
            }}
            className="px-4 py-2.5 bg-[#244B8F] text-white font-bold text-xs rounded-lg"
          >
            Schedule Visit
          </button>
        </div>
      </div>

    </div>
  );
};
