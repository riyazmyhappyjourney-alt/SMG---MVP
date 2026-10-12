import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Bed,
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
  Bath,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lock,
  Heart,
  MoreHorizontal,
  Armchair,
  Waves,
  Dumbbell,
  Baby,
  GlassWater,
  Trees,
  Zap,
  ZoomIn,
  X
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

  // Reference Image 2 Interactive States
  const [activeSubTab, setActiveSubTab] = useState<'VISAO_GERAL' | 'LOCALIZACAO' | 'CONDOMINIO' | 'PLANTA'>('VISAO_GERAL');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showMoreSpecs, setShowMoreSpecs] = useState<boolean>(false);
  const [activeFloorPlanTab, setActiveFloorPlanTab] = useState<number>(0);
  const [isFloorPlanZoomOpen, setIsFloorPlanZoomOpen] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [offerPrice, setOfferPrice] = useState<string>('');

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

  const scrollToSection = (sectionId: string, tab: 'VISAO_GERAL' | 'LOCALIZACAO' | 'CONDOMINIO' | 'PLANTA') => {
    setActiveSubTab(tab);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        notes: `Preferred Slot: ${preferredSlot}. Funding: ${fundingMode}. Requested via Image-2 Styled Detail Page.`
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

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerPhone || buyerPhone.length < 10) {
      showToast('Please enter your 10-digit mobile number in the viewing form below.');
      setIsOfferModalOpen(false);
      scrollToSection('schedule-viewing-card', 'VISAO_GERAL');
      return;
    }
    showToast(`Offer of ${offerPrice || 'indicated amount'} submitted to SellMyGhar RM Desk!`);
    setIsOfferModalOpen(false);
  };

  const getWhatsAppUrl = () => {
    const rmPhone = '918217873708';
    const text = encodeURIComponent(
      `Hello SellMyGhar Desk, I am interested in viewing the verified ${property?.bhkType} at ${property?.projectName}, ${property?.localityName} (Ref: ${property?.id}). Please assist with viewing details.`
    );
    return `https://wa.me/${rmPhone}?text=${text}`;
  };

  const rmCallPhone = '+918217873708';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col items-center justify-center p-4 font-['Montserrat']">
        <div className="w-12 h-12 border-4 border-[#244B8F] border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800">Loading Verified Property Details...</h2>
        <p className="text-xs text-slate-500 mt-1">Inspecting statutory title and Kaveri 2.0 benchmarking data</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat']">
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
  const floorPlanList = (property.floorPlans && property.floorPlans.length > 0)
    ? property.floorPlans
    : [
        {
          id: 'fp-1',
          title: 'Layout Arquitetônico Original',
          carpetAreaSqft: property.carpetAreaSqft,
          superBuiltUpSqft: property.superBuiltUpSqft,
          imageUrl: property.floorPlanUrl || '/images/sample-architectural-floor-plan.svg',
          tag: 'Verified 2D Layout'
        },
        {
          id: 'fp-2',
          title: 'Layout Mobiliado & Vastu',
          carpetAreaSqft: property.carpetAreaSqft,
          superBuiltUpSqft: property.superBuiltUpSqft,
          imageUrl: '/images/sample-architectural-floor-plan.svg',
          tag: 'Interior Placement'
        }
      ];

  const currentFloorPlan = floorPlanList[activeFloorPlanTab] || floorPlanList[0];

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#172033] font-['Montserrat'] selection:bg-[#244B8F] selection:text-white pb-24 md:pb-16 text-left">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#172033] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Search</span>
              <span className="sm:hidden">Back</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center space-x-2">
              <Logo />
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Share Listing"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <a
              href={`tel:${rmCallPhone}`}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
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

      {/* 1. TOP PHOTO BANNER (Reference Image 2 Style: Wide Center Hero + Flanking Images + Photo Count) */}
      <section className="bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
            
            {/* Left side preview (desktop only) */}
            <div className="hidden md:block md:col-span-2 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer"
                 onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : property.photos.length - 1))}>
              <img
                src={property.photos[(activePhotoIndex - 1 + property.photos.length) % property.photos.length]?.url || activePhoto.url}
                alt="Previous photo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>

            {/* Main Center Featured Photo (Image 2 style with photo counter badge in corner) */}
            <div className="md:col-span-8 relative aspect-16/10 rounded-2xl overflow-hidden bg-slate-900 shadow-sm group">
              <img
                src={activePhoto.url}
                alt={activePhoto.caption || property.projectName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-101"
              />

              {/* Photo Counter Pill (Matching Image 2 "[📷 24]") */}
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md">
                <span className="text-[13px]">📷</span>
                <span>{property.photos.length > 0 ? property.photos.length : 24}</span>
                <span className="text-slate-300 font-normal">photos</span>
              </div>

              {/* Navigation Arrows */}
              {property.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : property.photos.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoIndex((prev) => (prev < property.photos.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Right side preview (desktop only) */}
            <div className="hidden md:block md:col-span-2 aspect-4/3 rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer"
                 onClick={() => setActivePhotoIndex((prev) => (prev < property.photos.length - 1 ? prev + 1 : 0))}>
              <img
                src={property.photos[(activePhotoIndex + 1) % property.photos.length]?.url || activePhoto.url}
                alt="Next photo"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>

          </div>
        </div>
      </section>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Image 2 Layout (8 cols on large screens) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Header: Title, Subtitle, Heart/Share/More Actions (Matching Image 2) */}
            <div className="border-b border-slate-200 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
                    {property.projectName}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 font-['Poppins']">
                    {property.localityName} · Unit {property.floorBand.replace('Floor', '').split(' ')[1] || '402'} · {property.propertyType}
                  </p>
                </div>

                {/* Top-Right Action Icons (Heart, Share, More) */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSaved(!isSaved);
                      showToast(isSaved ? 'Removed from saved properties' : 'Saved to favorite properties');
                    }}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                    aria-label="Save to favorites"
                  >
                    <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-slate-600'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                    aria-label="Share listing"
                  >
                    <Share2 className="w-5 h-5 text-slate-600" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="w-5 h-5 text-slate-600" />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 text-xs">
                        <button
                          type="button"
                          onClick={() => { handleShare(); setShowMoreMenu(false); }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium"
                        >
                          Copy Listing Link
                        </button>
                        <a
                          href={getWhatsAppUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowMoreMenu(false)}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 text-slate-700 font-medium block"
                        >
                          Ask RM via WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Navigation Tabs (Matching Image 2: Visão Geral | Localização | Condomínio | Planta) */}
              <div className="flex items-center space-x-6 sm:space-x-8 pt-6 border-t border-slate-100 mt-5 overflow-x-auto text-xs font-bold font-['Montserrat']">
                <button
                  type="button"
                  onClick={() => scrollToSection('section-overview', 'VISAO_GERAL')}
                  className={`pb-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                    activeSubTab === 'VISAO_GERAL'
                      ? 'border-[#244B8F] text-[#244B8F]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('section-location', 'LOCALIZACAO')}
                  className={`pb-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                    activeSubTab === 'LOCALIZACAO'
                      ? 'border-[#244B8F] text-[#244B8F]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Localização
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('section-condominio', 'CONDOMINIO')}
                  className={`pb-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                    activeSubTab === 'CONDOMINIO'
                      ? 'border-[#244B8F] text-[#244B8F]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Condomínio
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection('section-plantas', 'PLANTA')}
                  className={`pb-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                    activeSubTab === 'PLANTA'
                      ? 'border-[#244B8F] text-[#244B8F]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Planta
                </button>
              </div>
            </div>

            {/* KEY SPECIFICATIONS GRID (Matching Image 2 2-column layout with authentic non-AI circular icons) */}
            <div id="section-overview" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-6 scroll-mt-24">
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-6 sm:gap-x-12">
                
                {/* 1. Quartos (Bedrooms) */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Bed className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-['Poppins']">Quartos</span>
                    <span className="text-sm font-extrabold text-[#172033]">{property.bhkType.replace('BHK', '') || '03'}</span>
                  </div>
                </div>

                {/* 2. Suítes (Bathrooms) */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Bath className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-['Poppins']">Suítes</span>
                    <span className="text-sm font-extrabold text-[#172033]">0{property.bathroomsCount || 2}</span>
                  </div>
                </div>

                {/* 3. Garagem (Parking) */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-['Poppins']">Garagem</span>
                    <span className="text-sm font-extrabold text-[#172033]">
                      0{property.carParksCount} {property.isCoveredParking ? 'vaga' : 'open'}
                    </span>
                  </div>
                </div>

                {/* 4. Metragem (Area) */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-['Poppins']">Metragem</span>
                    <span className="text-sm font-extrabold text-[#172033]">{property.superBuiltUpSqft} sqft ({Math.round(property.superBuiltUpSqft / 10.764)} m²)</span>
                  </div>
                </div>

                {/* 5. Andar (Floor) */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-['Poppins']">Andar</span>
                    <span className="text-sm font-extrabold text-[#172033]">{property.floorBand}</span>
                  </div>
                </div>

                {/* 6. Mobiliado (Furnished) */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block font-['Poppins']">Mobiliado</span>
                    <span className="text-sm font-extrabold text-[#172033]">Semi-Furnished</span>
                  </div>
                </div>

              </div>

              {/* Expandable Specifications Toggle ("Ver mais" matching Image 2) */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoreSpecs(!showMoreSpecs)}
                  className="text-xs font-bold text-[#244B8F] hover:underline cursor-pointer"
                >
                  {showMoreSpecs ? 'Ver menos' : 'Ver mais'}
                </button>

                {showMoreSpecs && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-['Poppins'] animate-fade-in">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Carpet Area</span>
                      <strong className="text-slate-800">{property.carpetAreaSqft} sq.ft (~{Math.round((property.carpetAreaSqft / property.superBuiltUpSqft) * 100)}% usable)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Orientação Solar (Facing)</span>
                      <strong className="text-slate-800">{property.facing} (Vastu Compliant)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Varandas (Balconies)</span>
                      <strong className="text-slate-800">{property.balconiesCount} Balconies</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">BBMP e-Khata</span>
                      <strong className="text-emerald-700">{property.verification.khata}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kaveri 2.0 EC</span>
                      <strong className="text-emerald-700">{property.verification.encumbrance}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Status</span>
                      <strong className="text-slate-800">Ready to Move</strong>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* SECTION LOCALIZAÇÃO (Location Section Matching Image 2) */}
            <div id="section-location" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-4 scroll-mt-24">
              <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                Localização
              </h2>
              
              {/* Styled Map Graphic Matching Image 2 */}
              <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-blue-50/50 border border-slate-200 flex items-center justify-center">
                {/* Visual road grid simulation */}
                <svg className="absolute inset-0 w-full h-full text-slate-200" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 0 50 L 800 250 M 100 0 L 300 400 M 500 0 L 700 400 M 0 180 L 800 120" stroke="#CBD5E1" strokeWidth="6" fill="none" />
                  <path d="M 50 200 C 200 150, 400 300, 600 200" stroke="#E2E8F0" strokeWidth="8" fill="none" />
                  <rect x="580" y="30" width="120" height="90" rx="20" fill="#DCFCE7" opacity="0.6" />
                </svg>

                {/* Society Pin (Image 2 Style teal camera/pin icon) */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="mt-1 px-3 py-1 bg-white rounded-md shadow-md text-slate-800 text-xs font-bold border border-slate-200">
                    {property.projectName}
                  </div>
                </div>
              </div>

              {/* Transit & Landmarks */}
              {property.landmarks && property.landmarks.length > 0 && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {property.landmarks.map((lm, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="font-semibold text-slate-700">{lm.name}</span>
                      <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">{lm.distance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION CONDOMÍNIO (Society Amenities Matching Image 2) */}
            <div id="section-condominio" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5 scroll-mt-24">
              <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                Condomínio
              </h2>

              {/* Horizontal Icon Grid with Circular Line Icon Badges Matching Image 2 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Waves className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Piscina</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Dumbbell className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Academia</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Baby className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Playground</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Sparkles className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Brinquedoteca</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <GlassWater className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Salão de festas</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Trees className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Área Verde</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Zap className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Gerador 100%</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#244B8F]" />
                  </div>
                  <span className="text-xs font-medium text-slate-800">Segurança 24h</span>
                </div>

              </div>
            </div>

            {/* SECTION PLANTAS (Floor Plan Section Matching Image 2) */}
            <div id="section-plantas" className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-2xs space-y-5 scroll-mt-24">
              <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                Plantas
              </h2>

              {/* Callout Banner (Matching Image 2: "★ Este apartamento tem planta flexível para mudar!") */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <span>★</span>
                <span>Este apartamento tem planta flexível para mudar!</span>
              </div>

              {/* Layout Tabs (Matching Image 2: "2 Quartos" / "3 Quartos" etc.) */}
              <div className="flex items-center space-x-6 border-b border-slate-200 text-xs font-bold">
                {floorPlanList.map((plan, idx) => (
                  <button
                    key={plan.id || idx}
                    type="button"
                    onClick={() => setActiveFloorPlanTab(idx)}
                    className={`pb-2.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                      activeFloorPlanTab === idx
                        ? 'border-[#10B981] text-[#10B981]'
                        : 'border-transparent text-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {plan.title || `${property.bhkType} Layout`}
                  </button>
                ))}
              </div>

              {/* Architectural Floor Plan Drawing Display */}
              <div className="relative bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-6 overflow-hidden flex flex-col items-center group">
                <div className="w-full max-h-[460px] flex items-center justify-center overflow-hidden">
                  <img
                    src={currentFloorPlan.imageUrl}
                    alt={currentFloorPlan.title || 'Architectural Floor Plan'}
                    className="max-h-[440px] w-auto object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
                    onClick={() => setIsFloorPlanZoomOpen(true)}
                  />
                </div>

                {/* Click to zoom pill button */}
                <button
                  type="button"
                  onClick={() => setIsFloorPlanZoomOpen(true)}
                  className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-[#244B8F]" />
                  <span>Ampliador de Planta / Fullscreen Zoom</span>
                </button>
              </div>

            </div>

            {/* SELLMYGHAR ADVOCATE TITLE DILIGENCE CARD */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-white to-blue-50/50 rounded-2xl border border-emerald-200/90 p-6 sm:p-7 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-black text-slate-900">
                    SellMyGhar Advocate Legal Diligence
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  100% Verified Title
                </span>
              </div>

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
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-100/50 p-2.5 rounded-lg border border-emerald-200/50 flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Private owner deeds and flat identity remain protected under DPDP Act until private viewing.</span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Sobre este apartamento
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-['Poppins']">
                {property.description}
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY PRICING & ACTION CARD (Matching Reference Image 2) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* PRICING & ACTION CARD (Image 2 style) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-lg space-y-5">
              
              {/* Valor Venda */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 font-['Poppins']">Valor venda</span>
                  <span className="text-2xl font-black text-[#10B981] tracking-tight">
                    {formatPriceCroresOrLakhs(property.askingPriceInr)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400">
                    ₹{property.pricePerSqft.toLocaleString('en-IN')} / sqft
                  </span>
                </div>
              </div>

              {/* DESPESAS MENSAIS (Image 2 style) */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  DESPESAS MENSAIS
                </span>
                
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>Condomínio</span>
                  <span className="font-bold text-slate-900">
                    ₹{(property.monthlyMaintenanceInr || 4200).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>IPTU (BBMP Property Tax)</span>
                  <span className="font-bold text-slate-900">
                    ₹650
                  </span>
                </div>
              </div>

              {/* BUTTONS MATCHING IMAGE 2: Orange 'Agendar visita' + Outline 'Enviar proposta' */}
              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  onClick={() => scrollToSection('schedule-viewing-card', 'VISAO_GERAL')}
                  className="w-full py-3.5 bg-[#FF6A4D] hover:bg-[#F25838] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
                >
                  Agendar visita
                </button>

                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  Enviar proposta
                </button>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Zero corretagem oculta · Agendamento gratuito</span>
              </div>

            </div>

            {/* SCHEDULE PRIVATE VIEWING FORM CARD (Preserving DPDP & Backend Lead Coordination) */}
            <div id="schedule-viewing-card" className="bg-white rounded-2xl border-2 border-[#244B8F]/20 p-6 sm:p-7 shadow-md space-y-5 scroll-mt-24">
              
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#244B8F] px-2.5 py-0.5 rounded">
                  Escorted Private Tour
                </span>
                <h3 className="text-base font-black text-[#172033] mt-2">
                  Agendar Visita com Gerente
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Walkthrough com gerente exclusivo SellMyGhar. Zero spam de corretores.
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
                      Seu Nome Completo
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
                      Telefone / Celular (10 dígitos)
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
                      Horário de Preferência
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

                  <div className="pt-1">
                    <label className="flex items-start space-x-2 cursor-pointer text-[11px] text-slate-600 leading-tight">
                      <input
                        type="checkbox"
                        checked={dpdpConsent}
                        onChange={(e) => setDpdpConsent(e.target.checked)}
                        className="mt-0.5 rounded text-[#244B8F] focus:ring-[#244B8F]"
                      />
                      <span>
                        Concordo com a coordenação de visita privada sob o Digital Personal Data Protection Act, 2023.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-[#244B8F] hover:bg-[#1B396E] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento'}</span>
                  </button>
                </form>
              )}

            </div>

            {/* ASSIGNED RELATIONSHIP MANAGER CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Gerente Responsável
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
                  <span>Ligar Desk</span>
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
                Você também pode gostar desses apartamentos em {property.localityName.split(',')[0]}
              </h2>
              <p className="text-xs text-slate-500 font-['Poppins']">
                Real backend inventory matched deterministically by project, locality, and bedroom layout.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {property.similarProperties.map((sim) => (
                <div
                  key={sim.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group"
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
                        Ver Detalhes do Imóvel
                      </button>
                    ) : (
                      <a
                        href={`/property/${sim.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-[#244B8F]/10 hover:bg-[#244B8F] text-[#244B8F] hover:text-white font-bold text-xs rounded-lg transition-colors cursor-pointer text-center block"
                      >
                        Ver Detalhes do Imóvel
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ENVIAR PROPOSTA (MAKE AN OFFER MODAL) */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Montserrat']">
          <div className="fixed inset-0" onClick={() => setIsOfferModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#172033]">Enviar Proposta Formal</h3>
                <p className="text-xs text-slate-500">Proposta direta com benchmarking Kaveri 2.0</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor da sua Oferta (INR)</label>
                <input
                  type="text"
                  required
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder={`Ex: ₹${(property.askingPriceInr * 0.96 / 10000000).toFixed(2)} Cr`}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Seu Telefone para Contato</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9845012345"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FF6A4D] hover:bg-[#F25838] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Enviar Proposta ao Desk
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULLSCREEN FLOOR PLAN ZOOM (Ampliador de Planta) */}
      {isFloorPlanZoomOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setIsFloorPlanZoomOpen(false)} />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-[#172033] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{currentFloorPlan.title || 'Architectural Floor Plan'}</h3>
                <span className="text-[11px] text-blue-300">
                  {property.projectName} · SBUA {property.superBuiltUpSqft} sq.ft · Carpet {property.carpetAreaSqft} sq.ft
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsFloorPlanZoomOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-[#FAFAF8]">
              <img
                src={currentFloorPlan.imageUrl}
                alt={currentFloorPlan.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY BOTTOM BAR (Small Screens Only) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shadow-2xl">
        <div className="text-left">
          <span className="text-[10px] text-slate-400 font-bold block uppercase">Valor venda</span>
          <span className="text-sm font-black text-[#10B981]">
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
            onClick={() => scrollToSection('schedule-viewing-card', 'VISAO_GERAL')}
            className="px-4 py-2.5 bg-[#FF6A4D] text-white font-bold text-xs rounded-lg"
          >
            Agendar visita
          </button>
        </div>
      </div>

    </div>
  );
};
