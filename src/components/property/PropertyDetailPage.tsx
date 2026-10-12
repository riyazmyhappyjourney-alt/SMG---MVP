import React, { useState, useEffect } from 'react';
import {
  Building2,
  Building,
  MapPin,
  Bed,
  Bath,
  Maximize2,
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
  Layers,
  ChevronLeft,
  ChevronRight,
  Heart,
  ZoomIn,
  X,
  IndianRupee,
  Layout,
  Waves,
  Dumbbell,
  Activity,
  Zap,
  Trees,
  Smile,
  Droplets,
  TrainFront,
  Briefcase,
  Stethoscope,
  GraduationCap,
  ArrowRight,
  ArrowUpRight,
  PhoneCall,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { isFavoriteProperty, toggleFavoriteProperty } from '../../utils/favoritesStore';

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
  floorPlanUrl?: string;
  floorPlans?: Array<{
    id: string;
    title: string;
    carpetAreaSqft?: number;
    superBuiltUpSqft?: number;
    imageUrl: string;
    tag?: string;
  }>;
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
  onNavigateToLocality?: (slug: string) => void;
}

export const PropertyDetailPage: React.FC<PropertyDetailPageProps> = ({
  propertyId,
  onBackToHome,
  onNavigateToProperty,
  onNavigateToLocality
}) => {
  const [property, setProperty] = useState<PublicPropertyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  // Favorites state
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Floor plan tab & zoom modal
  const [activeFloorPlanTab, setActiveFloorPlanTab] = useState<number>(0);
  const [isFloorPlanZoomOpen, setIsFloorPlanZoomOpen] = useState<boolean>(false);

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

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

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
            setIsSaved(isFavoriteProperty(data.listing.id));
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

  const handleToggleSaved = () => {
    if (!property) return;
    const newState = toggleFavoriteProperty(property.id);
    setIsSaved(newState);
    showToast(newState ? 'Saved to your favorite properties!' : 'Removed from saved properties');
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

  const handleNextPhoto = () => {
    if (!property) return;
    setSlideDirection('right');
    setActivePhotoIndex((prev) => (prev + 1) % property.photos.length);
  };

  const handlePrevPhoto = () => {
    if (!property) return;
    setSlideDirection('left');
    setActivePhotoIndex((prev) => (prev - 1 + property.photos.length) % property.photos.length);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${property?.bhkType} in ${property?.projectName} | SellMyGhar`,
          text: `Verified ${property?.bhkType} resale apartment at ${property?.projectName}, ${property?.localityName}. Price: ${formatPriceCroresOrLakhs(property?.askingPriceInr || 0)}`,
          url
        });
      } catch {
        // User cancelled share
      }
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Property link copied to clipboard!');
    }
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanPhone = buyerPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!buyerName.trim() || buyerName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!dpdpConsent) {
      setFormError('Statutory DPDP consent is required to coordinate this private walkthrough.');
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

  const getWhatsAppUrl = () => {
    const rmPhone = '918217873708';
    const text = encodeURIComponent(
      `Hello SellMyGhar Desk, I am interested in viewing the verified ${property?.bhkType} at ${property?.projectName}, ${property?.localityName} (Ref: ${property?.id}). Please assist with viewing details.`
    );
    return `https://wa.me/${rmPhone}?text=${text}`;
  };

  const rmCallPhone = '+918217873708';

  // Helper to resolve clean, authentic icons for society amenities
  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('pool') || lower.includes('swimming')) return <Waves className="w-5 h-5 text-[#244B8F] shrink-0" />;
    if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className="w-5 h-5 text-[#244B8F] shrink-0" />;
    if (lower.includes('club') || lower.includes('hall')) return <Building className="w-5 h-5 text-[#244B8F] shrink-0" />;
    if (lower.includes('tennis') || lower.includes('court') || lower.includes('badminton') || lower.includes('squash')) {
      return <Activity className="w-5 h-5 text-[#244B8F] shrink-0" />;
    }
    if (lower.includes('power') || lower.includes('backup') || lower.includes('generator')) return <Zap className="w-5 h-5 text-amber-600 shrink-0" />;
    if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard')) return <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />;
    if (lower.includes('garden') || lower.includes('park') || lower.includes('lawn')) return <Trees className="w-5 h-5 text-emerald-600 shrink-0" />;
    if (lower.includes('play') || lower.includes('kids') || lower.includes('children')) return <Smile className="w-5 h-5 text-orange-500 shrink-0" />;
    if (lower.includes('parking') || lower.includes('car')) return <Car className="w-5 h-5 text-[#244B8F] shrink-0" />;
    if (lower.includes('water') || lower.includes('rainwater')) return <Droplets className="w-5 h-5 text-sky-500 shrink-0" />;
    return <CheckCircle2 className="w-5 h-5 text-[#244B8F] shrink-0" />;
  };

  // Helper to resolve authentic icons for nearby landmarks
  const getLandmarkIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('metro') || lower.includes('station') || lower.includes('transit')) {
      return <TrainFront className="w-5 h-5 text-[#244B8F] shrink-0" />;
    }
    if (lower.includes('tech') || lower.includes('prestige') || lower.includes('cisco') || lower.includes('park') || lower.includes('office')) {
      return <Briefcase className="w-5 h-5 text-[#244B8F] shrink-0" />;
    }
    if (lower.includes('hospital') || lower.includes('medical') || lower.includes('manipal') || lower.includes('columbia') || lower.includes('clinic')) {
      return <Stethoscope className="w-5 h-5 text-rose-600 shrink-0" />;
    }
    if (lower.includes('school') || lower.includes('dps') || lower.includes('academy') || lower.includes('greenwood') || lower.includes('college')) {
      return <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0" />;
    }
    return <MapPin className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  const handleHeaderTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'SELL') {
      window.location.hash = '#/post-property';
    } else if (tab === 'CONTACT') {
      window.location.hash = '#/contact';
    } else {
      onBackToHome();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-4 font-['Montserrat']">
        <div className="w-12 h-12 border-4 border-[#244B8F] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading Property Details...</h2>
        <p className="text-xs text-slate-500 mt-1 font-['Poppins']">Inspecting statutory title records and verified inventory benchmarks</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat']">
        <Header
          onPostPropertyClick={() => { window.location.hash = '#/post-property'; }}
          onLoginClick={() => { window.location.hash = '#/login'; }}
          onTabClick={handleHeaderTabClick}
        />
        <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mb-4">
            <Info className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Property Not Available</h1>
          <p className="text-sm text-slate-600 mb-6 font-['Poppins']">
            {error || 'This property is no longer active on the public discovery portal.'}
          </p>
          <button
            type="button"
            onClick={onBackToHome}
            className="px-6 py-2.5 bg-[#244B8F] text-white font-bold text-xs rounded-xl hover:bg-[#1B396E] transition-all cursor-pointer shadow-md font-['Montserrat']"
          >
            Explore Active Bengaluru Homes
          </button>
        </div>
      </div>
    );
  }

  const activePhoto = property.photos[activePhotoIndex] || property.photos[0];
  const floorPlanList = (property.floorPlans && property.floorPlans.length > 0)
    ? property.floorPlans
    : [
        {
          id: 'fp-1',
          title: `${property.bhkType} Floor Plan`,
          carpetAreaSqft: property.carpetAreaSqft,
          superBuiltUpSqft: property.superBuiltUpSqft,
          imageUrl: property.floorPlanUrl || '/images/sample-architectural-floor-plan.svg',
          tag: 'Verified Layout'
        }
      ];

  const currentFloorPlan = floorPlanList[activeFloorPlanTab] || floorPlanList[0];
  const localitySlug = property.localityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 font-['Montserrat'] selection:bg-[#244B8F] selection:text-white pb-24 md:pb-0 text-left">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 text-xs font-semibold font-['Montserrat']">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Full interactive header matching Homepage */}
      <Header
        onPostPropertyClick={() => { window.location.hash = '#/post-property'; }}
        onLoginClick={() => { window.location.hash = '#/login'; }}
        onTabClick={handleHeaderTabClick}
      />

      {/* SUB-HEADER / FUNCTIONAL BREADCRUMBS BAR */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between text-xs gap-3 font-['Poppins']">
          
          {/* Functional Breadcrumb Links */}
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center text-slate-500 hover:text-[#244B8F] transition-colors cursor-pointer mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back</span>
            </button>
            <span className="text-slate-300">/</span>
            
            <button
              type="button"
              onClick={onBackToHome}
              className="hover:text-[#244B8F] transition-colors cursor-pointer"
            >
              Bengaluru
            </button>
            <span className="text-slate-300">/</span>

            <button
              type="button"
              onClick={() => {
                if (onNavigateToLocality) {
                  onNavigateToLocality(localitySlug);
                } else {
                  window.location.hash = `#/sell-flat-in-${localitySlug}-bangalore`;
                }
              }}
              className="hover:text-[#244B8F] transition-colors cursor-pointer"
            >
              {property.localityName}
            </button>
            <span className="text-slate-300">/</span>

            <span className="text-slate-900 font-semibold font-['Montserrat'] truncate max-w-[200px] sm:max-w-xs">
              {property.projectName}
            </span>
          </div>

          {/* Right Action Icons & Property ID */}
          <div className="flex items-center space-x-2.5">
            {/* Property Reference Code */}
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-mono font-medium">
              <span>REF: {property.id}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(property.id);
                  showToast('Property Reference ID copied to clipboard');
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                title="Copy Property ID"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleToggleSaved}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-rose-500 transition-colors cursor-pointer"
              title={isSaved ? 'Saved in favorites' : 'Save to favorites'}
              aria-label="Save Property"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-[#244B8F] transition-colors cursor-pointer"
              title="Share Listing"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* WhatsApp RM */}
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-3 py-1 bg-[#25D366] hover:bg-[#1EBE5D] text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer font-['Montserrat']"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>

        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* ROW 1: TITLE & TOP HIGHLIGHTS */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-2">
            
            <div className="flex flex-wrap items-center gap-2 font-['Montserrat']">
              <span className="px-3 py-1 rounded-full bg-[#244B8F] text-white text-[11px] font-bold shadow-xs">
                For Resale
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                {property.bhkType}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                {property.propertyType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
              {property.bhkType} Apartment in {property.projectName}
            </h1>

            <p className="text-sm text-slate-600 flex items-center font-['Poppins']">
              <MapPin className="w-4 h-4 mr-1.5 text-[#244B8F] shrink-0" />
              <span>{property.localityName}, Bengaluru</span>
            </p>
          </div>

          {/* Pricing Highlight Pill */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between lg:justify-end gap-6 shrink-0 font-['Montserrat']">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-['Poppins']">Asking Price</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                {formatPriceCroresOrLakhs(property.askingPriceInr)}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-6 text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-['Poppins']">Price / SBUA</span>
              <span className="text-base sm:text-lg font-bold text-slate-700 font-mono">
                ₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft
              </span>
            </div>
          </div>
        </div>

        {/* ROW 2: IMAGE GALLERY & COMPREHENSIVE DETAILS (2 Columns on Large Screens) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Gallery, Specs, Description, Floor Plan, Legal, Amenities, Developer (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            
            {/* 1. Large Sliding Photo Showcase */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="relative aspect-16/10 bg-slate-950 overflow-hidden">
                <AnimatePresence initial={false} mode="wait">
                  <motion.img
                    key={activePhotoIndex}
                    src={activePhoto.url}
                    alt={activePhoto.caption || property.projectName}
                    initial={{ opacity: 0, x: slideDirection === 'right' ? 60 : -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: slideDirection === 'right' ? -60 : 60 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>
                
                {/* Photo Caption Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 flex items-end justify-between text-white text-xs font-['Poppins']">
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
                      onClick={handlePrevPhoto}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/55 hover:bg-black/80 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/55 hover:bg-black/80 text-white transition-all cursor-pointer shadow-lg hover:scale-105"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Row */}
              {property.photos.length > 1 && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2.5 overflow-x-auto scrollbar-thin">
                  {property.photos.map((p, idx) => (
                    <button
                      key={p.id || idx}
                      type="button"
                      onClick={() => {
                        setSlideDirection(idx > activePhotoIndex ? 'right' : 'left');
                        setActivePhotoIndex(idx);
                      }}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        idx === activePhotoIndex
                          ? 'border-[#244B8F] ring-2 ring-blue-200 scale-102'
                          : 'border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Key Specifications Grid (Montserrat headings + Poppins details) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2 font-['Montserrat']">
                <Layers className="w-4 h-4 text-[#244B8F]" />
                <span>Property Specifications</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-['Poppins']">
                
                {/* Super Built-Up Sqft */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Maximize2 className="w-5 h-5 text-[#244B8F] shrink-0" />
                    <span>Super Built-up</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-['Montserrat'] block">{property.superBuiltUpSqft} sq.ft</span>
                </div>

                {/* Carpet Area Sqft */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Maximize2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Carpet Area</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-['Montserrat'] block">{property.carpetAreaSqft} sq.ft</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">~{Math.round((property.carpetAreaSqft / property.superBuiltUpSqft) * 100)}% usable</span>
                </div>

                {/* Floor Level */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Building2 className="w-5 h-5 text-[#244B8F] shrink-0" />
                    <span>Floor Level</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 font-['Montserrat'] block">{property.floorBand}</span>
                </div>

                {/* Facing */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Compass className="w-5 h-5 text-[#244B8F] shrink-0" />
                    <span>Facing</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-['Montserrat'] block">{property.facing}</span>
                </div>

                {/* Bathrooms */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Bath className="w-5 h-5 text-[#244B8F] shrink-0" />
                    <span>Bathrooms</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-['Montserrat'] block">{property.bathroomsCount} Baths</span>
                </div>

                {/* Parking */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Car className="w-5 h-5 text-[#244B8F] shrink-0" />
                    <span>Parking</span>
                  </div>
                  <span className="text-base font-bold text-slate-900 font-['Montserrat'] block">
                    {property.carParksCount} {property.isCoveredParking ? 'Covered' : 'Open'}
                  </span>
                </div>

                {/* Occupancy Status */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Occupancy</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 font-['Montserrat'] block">Ready to Move</span>
                </div>

                {/* Monthly Maintenance */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 text-xs mb-1.5 font-medium">
                    <IndianRupee className="w-5 h-5 text-blue-600 shrink-0" />
                    <span>Est. Maintenance</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 font-['Montserrat'] block font-mono">
                    ₹{(property.monthlyMaintenanceInr || 4500).toLocaleString('en-IN')}/mo
                  </span>
                </div>

              </div>
            </div>

            {/* 3. Property Description (Renamed from About this Home) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                Property Description
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed font-['Poppins']">
                {property.description}
              </p>
            </div>

            {/* 4. Floor Plan Section (Renamed from Architectural Floor Plan, updated icon, clean layout) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-2 font-['Montserrat']">
                  <Layout className="w-4 h-4 text-[#244B8F]" />
                  <span>Floor Plan</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-['Montserrat']">
                  Verified Blueprint
                </span>
              </div>

              {floorPlanList.length > 1 && (
                <div className="flex items-center space-x-4 border-b border-slate-100 text-xs font-bold font-['Montserrat']">
                  {floorPlanList.map((plan, idx) => (
                    <button
                      key={plan.id || idx}
                      type="button"
                      onClick={() => setActiveFloorPlanTab(idx)}
                      className={`pb-2.5 transition-all cursor-pointer border-b-2 ${
                        activeFloorPlanTab === idx
                          ? 'border-[#244B8F] text-[#244B8F]'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {plan.title || `${property.bhkType} Layout`}
                    </button>
                  ))}
                </div>
              )}

              <div className="relative bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center group">
                <div className="w-full max-h-[380px] flex items-center justify-center overflow-hidden">
                  <img
                    src={currentFloorPlan.imageUrl}
                    alt={currentFloorPlan.title || 'Floor Plan'}
                    className="max-h-[360px] w-auto object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-101"
                    onClick={() => setIsFloorPlanZoomOpen(true)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsFloorPlanZoomOpen(true)}
                  className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer font-['Montserrat']"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#244B8F]" />
                  <span>Click to Zoom Floor Plan</span>
                </button>
              </div>
            </div>

            {/* 5. SellMyGhar Advocate Legal Diligence Card (MOVED AFTER FLOOR PLAN - Premium Redesign without AI look) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#244B8F]" />
                  <h2 className="text-base font-bold text-[#172033] font-['Montserrat']">
                    SellMyGhar Advocate Legal Diligence
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-['Montserrat']">
                  100% Verified Title
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-['Poppins']">
                This property has been vetted by our legal diligence panel. All statutory title deeds, BBMP khata certificates, and Sub-Registrar encumbrance records have been reviewed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-['Poppins']">
                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-['Montserrat']">{property.verification.khata || 'BBMP A-Khata Authenticated'}</span>
                    <span className="text-[11px] text-slate-500">BBMP A-Khata with valid SAS tax challan</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-['Montserrat']">{property.verification.encumbrance || 'Form 15 Encumbrance NIL'}</span>
                    <span className="text-[11px] text-slate-500">Form 15 Sub-Registrar search zero encumbrances</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-['Montserrat']">{property.verification.titleDeed || '30-Year Continuous Parent Title'}</span>
                    <span className="text-[11px] text-slate-500">Complete registered sale deed & mother deed chain</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block font-['Montserrat']">{property.verification.fieldInspection || 'Physical Inspection Completed'}</span>
                    <span className="text-[11px] text-slate-500">Physical field verification completed by relationship desk</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center space-x-2 font-['Poppins']">
                <ShieldCheck className="w-4 h-4 text-[#244B8F] shrink-0" />
                <span>Private owner deeds and flat identity remain protected under the Digital Personal Data Protection (DPDP) Act until escorted private viewing.</span>
              </div>
            </div>

            {/* 6. Township & Society Amenities (Authentic Non-AI Icons) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                Township & Society Amenities
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-['Poppins']">
                {property.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800">
                    {getAmenityIcon(amenity)}
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Developer & Project Information */}
            {property.developer && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                    Developer & Project Information
                  </h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-[#244B8F] text-[11px] font-bold font-['Montserrat']">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>RERA Registered</span>
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-extrabold text-[#172033] font-['Montserrat'] tracking-tight">
                      {property.developer.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-['Poppins'] mt-0.5">
                      Master Township & Residential Developer
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                        Statutory RERA ID
                      </span>
                      <span className="text-xs font-semibold text-slate-800 font-mono block mt-0.5">
                        {property.developer.reraNumber}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                        Project Launch Year
                      </span>
                      <span className="text-xs font-bold text-slate-800 font-['Montserrat'] block mt-0.5">
                        {property.developer.launchYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Nearby Transit & Landmarks (Authentic Non-AI Icons & Clear Distances) */}
            {property.landmarks && property.landmarks.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4 font-['Poppins']">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                  Nearby Transit & Landmarks
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {property.landmarks.map((lm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center space-x-2.5 pr-2">
                        {getLandmarkIcon(lm.name)}
                        <span className="font-medium text-slate-800">{lm.name}</span>
                      </div>
                      <span className="text-slate-600 font-bold bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px] shrink-0 font-mono">
                        {lm.distance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Escorted Private Tour Form & RM Desk (Solid Premium, No Gradients) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-20">
            
            {/* 1. Schedule Private Viewing Card */}
            <div id="tour-booking-form" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
              
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-[#244B8F] px-2.5 py-0.5 rounded-full font-['Montserrat']">
                  Private Tour
                </span>
                <h3 className="text-lg font-bold text-[#172033] mt-2 font-['Montserrat']">
                  Schedule Private Viewing
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-['Poppins']">
                  Walkthrough escorted by dedicated relationship desk. Zero external broker calls.
                </p>
              </div>

              {bookingSuccess ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 text-emerald-900 text-xs font-['Poppins']">
                  <div className="flex items-center space-x-2 font-bold text-emerald-800 font-['Montserrat']">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Viewing Request Received</span>
                  </div>
                  <p>{bookingSuccess.message}</p>
                  <p className="font-mono font-bold pt-1 text-[11px]">
                    Booking Reference: {bookingSuccess.referenceId}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingSuccess(null)}
                    className="mt-2 w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold cursor-pointer font-['Montserrat'] transition-colors"
                  >
                    Schedule Another Time
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="space-y-4 font-['Poppins']">
                  {formError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl">
                      {formError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-['Montserrat']">
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
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-['Montserrat']">
                      Mobile Number (10 digits)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-['Montserrat']">+91</span>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-['Montserrat']">
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
                    <label className="block text-xs font-bold text-slate-700 mb-1 font-['Montserrat']">
                      Financing Status
                    </label>
                    <select
                      value={fundingMode}
                      onChange={(e) => setFundingMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                    >
                      <option value="PRE_APPROVED_LOAN">Pre-Approved Home Loan</option>
                      <option value="SELF_FUNDED">Self-Funded / Ready Capital</option>
                      <option value="NEED_LOAN_ASSISTANCE">Need Loan Assistance</option>
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
                    className="w-full py-3 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 font-['Montserrat']"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isSubmitting ? 'Confirming Request...' : 'Confirm Private Viewing Slot'}</span>
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    Zero broker spam. Unit identity confirmed on escorted visit day.
                  </p>
                </form>
              )}

            </div>

            {/* 2. Assigned Relationship Manager Desk Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5 font-['Poppins']">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                Assigned Diligence Desk
              </span>
              
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-[#172033] text-white font-bold text-xs flex items-center justify-center font-['Montserrat']">
                  KR
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-['Montserrat']">{property.relationshipManager.name}</h4>
                  <p className="text-xs text-slate-500">{property.relationshipManager.role}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2 font-['Montserrat']">
                <a
                  href={`tel:${rmCallPhone}`}
                  className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-800 text-center flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-700" />
                  <span>Call Desk</span>
                </a>
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/40 text-[#128C7E] rounded-lg font-bold text-center flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* ROW 3: SIMILAR PROPERTIES SECTION (Redesigned from Image 2 to match Image 1 Reference Design) */}
        {property.similarProperties && property.similarProperties.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            
            {/* Header: Clean, direct, with Deterministic Relevance removed */}
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] font-['Montserrat']">
                Similar Properties in {property.localityName.split(',')[0]}
              </h2>
              <p className="text-xs text-slate-500 font-['Poppins'] mt-1">
                Explore comparable verified apartments in this residential corridor
              </p>
            </div>

            {/* Grid matching Image 1 Reference Card Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {property.similarProperties.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => {
                    const url = `/property/${sim.id}`;
                    if (isMobile) {
                      window.location.href = url;
                    } else {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                >
                  {/* Photo & Badges Matching Reference Design */}
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={sim.image}
                      alt={sim.projectName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Top-Left: "OWNER VERIFIED" Rounded Pill Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#1E3A8A]/90 backdrop-blur-xs text-white text-[11px] font-bold tracking-wide shadow-xs font-['Montserrat']">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>OWNER VERIFIED</span>
                      </span>
                    </div>

                    {/* Top-Right: BHK Pill Badge + Heart Favorite Button */}
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                      <span className="px-2.5 py-1 rounded-md bg-[#172033]/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs font-['Montserrat']">
                        {sim.bhkType}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteProperty(sim.id);
                          showToast('Updated favorite properties');
                        }}
                        className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all shadow-xs cursor-pointer"
                        aria-label="Save to favorites"
                      >
                        <Heart className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>

                    {/* Bottom Image Overlay Strip: Price on Left, Price/Sq.ft on Right */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-8 pb-3 px-4 flex items-baseline justify-between text-white">
                      <span className="text-xl sm:text-2xl font-extrabold tracking-tight font-['Montserrat']">
                        {formatPriceCroresOrLakhs(sim.askingPriceInr)}
                      </span>
                      <span className="text-xs text-slate-300 font-['Poppins']">
                        ₹{sim.pricePerSqft.toLocaleString('en-IN')}/sq.ft
                      </span>
                    </div>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5 text-left">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#172033] font-['Montserrat'] group-hover:text-[#244B8F] transition-colors leading-snug">
                        {sim.projectName}
                      </h3>
                      <p className="text-xs text-slate-500 font-['Poppins'] flex items-center mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                        <span>{sim.localityName}</span>
                      </p>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* 3 Specifications Tiles: SBUA Area | Facing | Floor */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
                        <Maximize2 className="w-5 h-5 text-[#244B8F] mb-1" />
                        <span className="text-xs font-bold text-slate-800 font-['Montserrat'] leading-tight">
                          {sim.superBuiltUpSqft.toLocaleString('en-IN')} sq.ft
                        </span>
                        <span className="text-[10px] text-slate-400 font-['Poppins'] mt-0.5">SBUA Area</span>
                      </div>

                      <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
                        <Compass className="w-5 h-5 text-[#244B8F] mb-1" />
                        <span className="text-xs font-bold text-slate-800 font-['Montserrat'] uppercase leading-tight">
                          {sim.facing || 'EAST'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-['Poppins'] mt-0.5">Facing</span>
                      </div>

                      <div className="bg-slate-50/80 rounded-xl p-2.5 text-center border border-slate-100 flex flex-col items-center justify-center">
                        <Building2 className="w-5 h-5 text-[#244B8F] mb-1" />
                        <span className="text-xs font-bold text-slate-800 font-['Montserrat'] leading-tight truncate w-full">
                          {sim.floorBand || 'Floor 8 of 8'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-['Poppins'] mt-0.5">Floor</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Action Buttons: View Property ↗ & Quick Call */}
                    <div className="flex items-center space-x-2.5 pt-0.5">
                      <a
                        href={`/property/${sim.id}`}
                        target={isMobile ? '_self' : '_blank'}
                        rel={isMobile ? undefined : 'noopener noreferrer'}
                        onClick={(e) => e.stopPropagation()}
                        className="group/view flex-1 relative overflow-hidden py-2.5 px-3 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center space-x-1.5 font-['Montserrat'] cursor-pointer hover:scale-[1.02] active:scale-[0.98] before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700"
                      >
                        <span>View Property</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover/view:translate-x-0.5 group-hover/view:-translate-y-0.5 transition-transform duration-200" />
                      </a>

                      <a
                        href={`https://wa.me/918217873708?text=${encodeURIComponent(`Hello SellMyGhar Desk, I would like a quick callback regarding ${sim.projectName} (${sim.bhkType}) in ${sim.localityName}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="group/call py-2.5 px-3 bg-slate-100 hover:bg-emerald-50/90 border border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:text-emerald-800 font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center space-x-1.5 font-['Montserrat'] cursor-pointer shrink-0 hover:scale-[1.02] active:scale-[0.98] shadow-2xs hover:shadow-xs"
                        title="Quick Call Enquiry"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-slate-600 group-hover/call:text-emerald-600 group-hover-phone-ring transition-colors" />
                        <span>Quick Call</span>
                      </a>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* FLOOR PLAN ZOOM MODAL */}
      {isFloorPlanZoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 font-['Montserrat']">
                {currentFloorPlan.title || 'Floor Plan'}
              </h3>
              <button
                type="button"
                onClick={() => setIsFloorPlanZoomOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center overflow-auto p-4">
              <img
                src={currentFloorPlan.imageUrl}
                alt={currentFloorPlan.title || 'Floor Plan'}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Floating Action Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-lg flex items-center justify-between gap-3 font-['Montserrat']">
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Asking Price</span>
          <div className="flex items-baseline space-x-1">
            <span className="text-base font-black text-slate-900 leading-tight">
              {formatPriceCroresOrLakhs(property.askingPriceInr)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium font-mono">
            ₹{property.pricePerSqft.toLocaleString('en-IN')}/sq.ft
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <a
            href="tel:+918217873708"
            className="group/call py-2 px-3 bg-slate-100 hover:bg-emerald-50 border border-slate-200 text-slate-800 hover:text-emerald-800 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
            title="Quick Call Desk"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600 group-hover-phone-ring" />
            <span>Call</span>
          </a>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('tour-booking-form');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="group/view py-2 px-3.5 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Book Tour</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer identical to Homepage */}
      <Footer
        onNavClick={handleHeaderTabClick}
      />

    </div>
  );
};
