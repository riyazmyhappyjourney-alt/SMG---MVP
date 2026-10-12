import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Mail,
  MessageSquare,
  Check,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Maximize2,
  Compass,
  Bath,
  Car,
  Clock,
  IndianRupee,
  MapPin,
  Sparkles,
  Phone,
  ZoomIn,
  ZoomOut,
  FileText,
  Eye,
  Sliders,
  Send,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { QrCodeSvg } from '../../utils/qrCode';

export interface PropertyBrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyData: any; // Full data from /api/crm/properties/:id/details
  currentUser?: any;
}

export const PropertyBrochureModal: React.FC<PropertyBrochureModalProps> = ({
  isOpen,
  onClose,
  propertyData,
  currentUser,
}) => {
  if (!isOpen || !propertyData || !propertyData.property) {
    return null;
  }

  const property = propertyData.property;
  const owner = propertyData.owner;
  const documents = propertyData.documents || [];

  // Available images from CRM details or fallback
  const rawImages: any[] = propertyData.images || [];
  const availableImages = useMemo(() => {
    if (rawImages.length > 0) {
      return rawImages.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}`,
        url: img.url,
        isFeatured: Boolean(img.is_featured || img.isFeatured || idx === 0),
        caption: img.caption || (idx === 0 ? 'Primary Exterior Residence' : `Interior View ${idx}`),
      }));
    }
    // Fallback if no images recorded
    return [
      {
        id: 'img-fb-0',
        url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        isFeatured: true,
        caption: 'Primary Featured Residence',
      },
      {
        id: 'img-fb-1',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        isFeatured: false,
        caption: 'Living Lounge & Balcony',
      },
      {
        id: 'img-fb-2',
        url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        isFeatured: false,
        caption: 'Master Suite',
      },
      {
        id: 'img-fb-3',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        isFeatured: false,
        caption: 'Township Amenities & Open Space',
      },
    ];
  }, [rawImages]);

  // Initial Cover Image
  const defaultCoverId = availableImages.find((img) => img.isFeatured)?.id || availableImages[0]?.id || '';

  // Configuration State
  const [coverPhotoId, setCoverPhotoId] = useState<string>(defaultCoverId);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState<string[]>(
    availableImages.map((img) => img.id)
  );

  // Section Toggles
  const [sections, setSections] = useState({
    cover: true,
    about: true,
    overview: true,
    gallery: true,
    specs: true,
    amenities: true,
    pricingLegal: true,
    contactQr: true,
  });

  // Custom metadata controls
  const [customHeadline, setCustomHeadline] = useState<string>(
    property.title || property.projectName || property.project_locality_id || 'Bengaluru Verified Resale'
  );
  const [customSubtitle, setCustomSubtitle] = useState<string>(
    property.project_locality_id || property.public_address || 'East Bengaluru Corridor'
  );
  const [advisorName, setAdvisorName] = useState<string>(
    currentUser?.displayName || currentUser?.display_name || 'Relationship Desk'
  );
  const [advisorPhone, setAdvisorPhone] = useState<string>(
    currentUser?.phone || '+91 80 4725 8900'
  );
  const [advisorEmail, setAdvisorEmail] = useState<string>(
    currentUser?.email || 'concierge@sellmyghar.in'
  );

  // Preview zoom scale (0.5, 0.7, 0.85, 1.0)
  const [zoomScale, setZoomScale] = useState<number>(0.75);
  const [activeTab, setActiveTab] = useState<'configure' | 'share'>('configure');

  // Share by Email state
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailRecipientName, setEmailRecipientName] = useState<string>('');
  const [emailCustomNote, setEmailCustomNote] = useState<string>(
    'Sharing the verified SellMyGhar property brochure for your review. Please let me know if you would like to schedule an escorted private tour.'
  );
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // WhatsApp share notification
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Printing reference
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Derived property metrics
  const askingPriceInr = Number(property.asking_price_inr || property.askingPriceInr || 0);
  const askingPriceCr = (askingPriceInr / 10000000).toFixed(2);
  const sbua = Number(property.super_built_up_sqft || property.superBuiltUpSqft || 1650);
  const carpet = Number(property.carpet_area_sqft || property.carpetAreaSqft || Math.round(sbua * 0.78));
  const usablePercent = Math.round((carpet / sbua) * 100);
  const pricePerSqft = sbua > 0 ? Math.round(askingPriceInr / sbua) : 0;
  const bhk = property.bhk_type || property.bhkType || '3 BHK';
  const floorBand = property.floor_band || `Floor ${property.unit_floor || 11} of ${property.total_floors || 18}`;
  const facing = property.facing || 'EAST';
  const bathrooms = Number(property.bathrooms_count || property.bathroomsCount || 3);
  const balconies = Number(property.balconies_count || property.balconiesCount || 2);
  const carParks = Number(property.car_parks_count || property.carParksCount || 1);
  const isCoveredParking = property.is_covered_parking ?? true;
  const monthlyMaintenance = Number(property.monthly_maintenance_inr || property.monthlyMaintenanceInr || 4500);
  const occupancy = property.occupancy_status || 'READY_TO_MOVE';
  const description = property.description ||
    `Verified ${bhk} residential apartment located in a prime gated township in ${customSubtitle}. Screened title deeds, Form 15 NIL Encumbrance Certificate, and registered deed price benchmarked.`;

  // Parsed amenities
  const amenitiesList = useMemo(() => {
    if (Array.isArray(property.amenities)) return property.amenities;
    if (typeof property.amenities === 'string') {
      try {
        const parsed = JSON.parse(property.amenities);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return property.amenities.split(',').map((s: string) => s.trim());
      }
    }
    return [
      'Clubhouse with Indoor Games',
      'Olympic-Sized Swimming Pool',
      '24/7 Gated Security & CCTV',
      '100% DG Power Backup',
      'Equipped Gymnasium',
      'Children’s Play Park',
      'Dedicated EV Charging Stations',
    ];
  }, [property.amenities]);

  // Selected Cover Image Object
  const coverImage = useMemo(() => {
    return availableImages.find((img) => img.id === coverPhotoId) || availableImages[0];
  }, [availableImages, coverPhotoId]);

  // Selected Gallery Images
  const galleryImages = useMemo(() => {
    return availableImages.filter((img) => selectedGalleryIds.includes(img.id));
  }, [availableImages, selectedGalleryIds]);

  // Public Property URL
  const publicListingUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sellmyghar.in';
    return `${origin}/#/property/${property.id}`;
  }, [property.id]);

  // Print Handler
  const handlePrint = () => {
    const printableElement = document.getElementById('property-brochure-print-canvas');
    if (!printableElement) {
      window.print();
      return;
    }

    // Create an isolated hidden print iframe for zero interference with the CRM dashboard
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${customHeadline} - SellMyGhar Property Presentation</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 0;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: 'Poppins', sans-serif;
              color: #172033;
            }
            h1, h2, h3, h4, .font-heading {
              font-family: 'Montserrat', sans-serif;
            }
            .brochure-page {
              width: 210mm !important;
              height: 297mm !important;
              max-height: 297mm !important;
              min-height: 297mm !important;
              padding: 16mm 16mm 14mm 16mm !important;
              margin: 0 auto !important;
              page-break-after: always !important;
              break-after: page !important;
              position: relative !important;
              background: #ffffff !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
            }
            @media screen {
              body { background: #f1f5f9; padding: 20px; }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printableElement.innerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }, 1000);
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    doc.close();
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const text = `*SELLMYGHAR.IN | VERIFIED PROPERTY PRESENTATION*\n\n` +
      `🏡 *${customHeadline}*\n` +
      `📍 ${customSubtitle}\n` +
      `💰 *Asking Price:* ₹${askingPriceCr} Cr (₹${pricePerSqft.toLocaleString('en-IN')}/sq.ft)\n` +
      `📐 *Specs:* ${bhk} • ${sbua} sq.ft SBUA • ${floorBand} • ${facing} Facing\n\n` +
      `🛡️ *SellMyGhar Legal Diligence:*\n` +
      `✓ BBMP A-Khata Authenticated\n` +
      `✓ Form 15 Encumbrance NIL (Zero Claims)\n` +
      `✓ 30-Year Continuous Parent Title Chain Verified\n` +
      `✓ Physical Inspection Completed by Relationship Desk\n\n` +
      `📄 *View Live Verified Listing & Schedule Escorted Tour:*\n` +
      `${publicListingUrl}\n\n` +
      `📞 *Relationship Advisor:* ${advisorName} (${advisorPhone})`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Dispatch Email Handler
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipient || !emailRecipient.includes('@')) {
      setEmailFeedback({ type: 'error', message: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSendingEmail(true);
    setEmailFeedback(null);

    try {
      const res = await fetch(`/api/crm/properties/${property.id}/share-brochure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          recipientEmail: emailRecipient,
          recipientName: emailRecipientName,
          customNote: emailCustomNote,
          staffName: advisorName,
          staffPhone: advisorPhone,
        }),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        data = null;
      }

      if (res.ok && data?.success) {
        setEmailFeedback({
          type: 'success',
          message: data.message || `Brochure email successfully dispatched to ${emailRecipient}`,
        });
        setEmailRecipient('');
      } else {
        setEmailFeedback({
          type: 'error',
          message: data?.message || data?.error || (res.status === 404 ? 'Service endpoint restarting. Please try again.' : `Server error (${res.status}): ${res.statusText || 'Failed to dispatch email'}`),
        });
      }
    } catch (err: any) {
      setEmailFeedback({
        type: 'error',
        message: err.message || 'Network error attempting to share brochure email.',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex bg-slate-950/80 backdrop-blur-md">
      
      {/* ============================================================== */}
      {/* LEFT: CONFIGURATION & SHARING DOCK (380px)                    */}
      {/* ============================================================== */}
      <div className="w-full sm:w-[420px] lg:w-[440px] bg-white border-r border-slate-200/90 h-full flex flex-col justify-between shrink-0 shadow-2xl z-20 overflow-hidden">
        
        {/* Dock Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#244B8F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#172033] font-['Montserrat']">
                Property Presentation Studio
              </h2>
              <p className="text-[11px] text-slate-500 font-['Poppins']">
                Editorial A4 Brochure Generator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Configure vs Share */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex space-x-2 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('configure')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 font-['Montserrat'] ${
              activeTab === 'configure'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Brochure Controls</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 font-['Montserrat'] ${
              activeTab === 'share'
                ? 'bg-[#244B8F] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Buyer Delivery</span>
          </button>
        </div>

        {/* Dock Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs font-['Poppins']">
          {activeTab === 'configure' ? (
            <>
              {/* 1. Cover Photograph Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                    Cover Photograph
                  </label>
                  <span className="text-[10px] text-slate-400">Click to set primary</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {availableImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setCoverPhotoId(img.id)}
                      className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                        coverPhotoId === img.id
                          ? 'border-[#244B8F] ring-2 ring-blue-200 scale-102'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                      {coverPhotoId === img.id && (
                        <div className="absolute top-1 left-1 bg-[#244B8F] text-white p-0.5 rounded-full shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[9px] px-1 py-0.5 truncate text-left">
                        {img.caption}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Gallery Photographs Selector */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                    Gallery Inclusions ({selectedGalleryIds.length} of {availableImages.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedGalleryIds.length === availableImages.length) {
                        setSelectedGalleryIds([coverPhotoId]);
                      } else {
                        setSelectedGalleryIds(availableImages.map((i) => i.id));
                      }
                    }}
                    className="text-[10px] text-[#244B8F] font-bold hover:underline cursor-pointer"
                  >
                    {selectedGalleryIds.length === availableImages.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableImages.map((img) => (
                    <label
                      key={img.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 cursor-pointer text-xs"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <img src={img.url} alt="" className="w-9 h-7 rounded-md object-cover shrink-0" />
                        <span className="truncate text-slate-700 font-medium">{img.caption}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedGalleryIds.includes(img.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGalleryIds((prev) => [...prev, img.id]);
                          } else {
                            setSelectedGalleryIds((prev) => prev.filter((id) => id !== img.id));
                          }
                        }}
                        className="rounded text-[#244B8F] focus:ring-[#244B8F] h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Section Toggles */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat'] block">
                  Brochure Sections
                </label>
                <div className="space-y-2">
                  {[
                    { key: 'cover', label: '1. Luxury Image-Led Cover' },
                    { key: 'about', label: '2. About SellMyGhar & Resale Model' },
                    { key: 'overview', label: '3. Property Overview & Facts' },
                    { key: 'gallery', label: '4. Curated Photo Gallery Grid' },
                    { key: 'specs', label: '5. Architectural Specifications' },
                    { key: 'amenities', label: '6. Amenities & Transit Landmarks' },
                    { key: 'pricingLegal', label: '7. Pricing & Statutory Legal Diligence' },
                    { key: 'contactQr', label: '8. Private Viewing, RM Card & Live QR' },
                  ].map((sec) => (
                    <label
                      key={sec.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 text-xs font-['Montserrat']">
                        {sec.label}
                      </span>
                      <input
                        type="checkbox"
                        checked={(sections as any)[sec.key]}
                        onChange={(e) =>
                          setSections((prev) => ({ ...prev, [sec.key]: e.target.checked }))
                        }
                        className="rounded text-[#244B8F] focus:ring-[#244B8F] h-4 w-4"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 4. Advisor Contact Card Customization */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat'] block">
                  Designated Resale Advisor
                </label>
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Advisor Name</span>
                    <input
                      type="text"
                      value={advisorName}
                      onChange={(e) => setAdvisorName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-[#244B8F]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Direct Phone</span>
                      <input
                        type="text"
                        value={advisorPhone}
                        onChange={(e) => setAdvisorPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-[#244B8F]"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Official Email</span>
                      <input
                        type="text"
                        value={advisorEmail}
                        onChange={(e) => setAdvisorEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-[#244B8F]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* SHARE & BUYER DELIVERY TAB */
            <div className="space-y-5">
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100 space-y-2">
                <h4 className="text-xs font-bold text-[#244B8F] font-['Montserrat'] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approved Resale Distribution</span>
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Share this verified presentation brochure directly with vetted buyers via WhatsApp or official Resend email automation.
                </p>
              </div>

              {/* Instant WhatsApp Share */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat'] block">
                  Option 1: Direct WhatsApp Share
                </label>
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer font-['Montserrat']"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </button>
              </div>

              {/* Formal Resend Email Dispatch */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat'] block">
                  Option 2: Send Official Email (Resend)
                </label>

                {emailFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                      emailFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {emailFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    )}
                    <span>{emailFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleSendEmail} className="space-y-2.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Buyer Email *</span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. buyer@example.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-[#244B8F]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Buyer Name (Optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. Anand Murthy"
                      value={emailRecipientName}
                      onChange={(e) => setEmailRecipientName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-[#244B8F]"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Custom Advisor Note</span>
                    <textarea
                      rows={3}
                      value={emailCustomNote}
                      onChange={(e) => setEmailCustomNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-[#244B8F]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="w-full py-2.5 px-4 bg-[#244B8F] hover:bg-[#1B396E] disabled:bg-slate-400 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer font-['Montserrat']"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Dispatching Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Dispatch Verified Presentation</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Direct Listing Hash URL */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <span className="text-[10px] text-slate-400 block font-medium">Public Discovery URL</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    readOnly
                    value={publicListingUrl}
                    className="flex-1 px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-[10px] text-slate-600 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(publicListingUrl);
                      setCopyFeedback('Copied!');
                      setTimeout(() => setCopyFeedback(null), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    {copyFeedback || 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dock Bottom Actions */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer font-['Montserrat']"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF / Print</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer font-['Montserrat']"
          >
            Close
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT: EDITORIAL A4 LIVE PREVIEW CANVAS                        */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/90 text-slate-100">
        
        {/* Preview Toolbar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-[#B68A4A] font-bold">
              EDITORIAL LIVE PREVIEW
            </span>
            <span>•</span>
            <span className="text-slate-300 font-medium">Standard A4 Portrait (210mm × 297mm)</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(0.5, prev - 0.1))}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-slate-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(1.0, prev + 0.1))}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#B68A4A] hover:bg-[#a0763b] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs font-['Montserrat']"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center gap-10">
          
          <div
            id="property-brochure-print-canvas"
            ref={printAreaRef}
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
            className="transition-transform duration-150 flex flex-col gap-10 text-slate-900"
          >
            
            {/* ============================================================== */}
            {/* PAGE 1: LUXURY IMAGE-LED COVER                                 */}
            {/* ============================================================== */}
            {sections.cover && (
              <div className="brochure-page w-[210mm] min-h-[297mm] h-[297mm] p-[16mm] bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden select-none border border-slate-200">
                
                {/* Header Wordmark & Tagline */}
                <div className="border-b border-[#172033]/15 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-black tracking-widest text-[#244B8F] font-['Montserrat']">
                        SELLMYGHAR<span className="text-[#B68A4A]">.IN</span>
                      </div>
                      <div className="text-[9px] uppercase tracking-[0.25em] text-[#172033]/70 font-semibold mt-0.5 font-['Montserrat']">
                        Bengaluru's Escorted Resale Marketplace
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-slate-100 rounded-full font-mono text-[10px] font-bold text-slate-600 tracking-wider">
                        REF: SMG-{property.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-[#244B8F] via-[#B68A4A] to-[#244B8F] mt-3 opacity-80" />
                </div>

                {/* Primary Large Cover Photograph */}
                <div className="relative my-4 aspect-16/10 rounded-2xl overflow-hidden border border-slate-300/80 shadow-md">
                  <img
                    src={coverImage.url}
                    alt={customHeadline}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white flex items-end justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B68A4A] block font-['Montserrat']">
                        Verified Resale Listing
                      </span>
                      <span className="text-lg font-bold font-['Montserrat']">
                        {coverImage.caption}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-mono">
                      High Floor • Clear Title
                    </span>
                  </div>
                </div>

                {/* Property Typography Presentation */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-[#B68A4A] font-['Montserrat']">
                    <span>Exclusive Property Dossier</span>
                    <span>•</span>
                    <span>Direct Owner Resale</span>
                  </div>
                  
                  <h1 className="text-3xl font-black text-[#172033] font-['Montserrat'] leading-tight tracking-tight">
                    {customHeadline}
                  </h1>

                  <div className="flex items-center text-xs text-slate-600 font-['Poppins']">
                    <MapPin className="w-3.5 h-3.5 mr-1 text-[#244B8F] shrink-0" />
                    <span>{customSubtitle}, Bengaluru</span>
                  </div>

                  {/* Highlights Strip */}
                  <div className="pt-2 flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-[#172033] font-bold text-xs font-['Montserrat']">
                      {bhk} Configuration
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-[#172033] font-bold text-xs font-['Montserrat']">
                      {sbua} sq.ft Super Built-up
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-[#172033] font-bold text-xs font-['Montserrat']">
                      {facing} Facing
                    </span>
                  </div>
                </div>

                {/* Asking Price & Benchmark Card */}
                <div className="p-4 bg-gradient-to-br from-[#F4F6F9] to-white rounded-2xl border border-slate-200/90 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Poppins']">
                      Asking Benchmark Price
                    </span>
                    <span className="text-3xl font-extrabold text-[#244B8F] font-['Montserrat'] tracking-tight">
                      ₹ {askingPriceCr} Cr
                    </span>
                  </div>
                  <div className="text-right border-l border-slate-200 pl-6">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Poppins']">
                      Calculated Rate / SBUA
                    </span>
                    <span className="text-base font-bold text-slate-800 font-mono">
                      ₹ {pricePerSqft.toLocaleString('en-IN')}/sq.ft
                    </span>
                  </div>
                </div>

                {/* Cover Page Footer */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-['Poppins']">
                  <span>Confidential • Prepared exclusively for verified prospective purchasers</span>
                  <span className="font-mono">Page 01</span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PAGE 2: ABOUT SELLMYGHAR & PROPERTY OVERVIEW                   */}
            {/* ============================================================== */}
            {(sections.about || sections.overview) && (
              <div className="brochure-page w-[210mm] min-h-[297mm] h-[297mm] p-[16mm] bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden select-none border border-slate-200">
                
                {/* Micro Header */}
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 font-['Montserrat']">
                  <span>SellMyGhar.in Resale Dossier</span>
                  <span>Page 02</span>
                </div>

                <div className="space-y-6 my-auto">
                  
                  {/* Section 01: About SellMyGhar */}
                  {sections.about && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                          01 / ASSISTED RESALE METHODOLOGY
                        </span>
                      </div>
                      
                      <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] tracking-tight">
                        About SellMyGhar.in Resale Marketplace
                      </h2>

                      <p className="text-xs text-slate-600 leading-relaxed font-['Poppins']">
                        SellMyGhar.in is Bengaluru's premier residential resale platform engineered for transparency, statutory legal security, and private escorted transactions. Unlike open broker classifieds, every listed apartment undergoes multi-tier physical inspection and parent deed scrutiny before private viewing.
                      </p>

                      {/* 4 Resale Pillars Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-1 font-['Poppins']">
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                          <strong className="text-xs font-bold text-[#244B8F] block font-['Montserrat']">
                            Direct Owner Resale
                          </strong>
                          <p className="text-[11px] text-slate-600">
                            Zero duplicate broker spam. Authenticated seller agreements with direct relationship desk coordination.
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                          <strong className="text-xs font-bold text-[#244B8F] block font-['Montserrat']">
                            Registered Deed Benchmarked
                          </strong>
                          <p className="text-[11px] text-slate-600">
                            Realistic pricing corroborating authentic Sub-Registrar registered transaction data across the micro-market.
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                          <strong className="text-xs font-bold text-[#244B8F] block font-['Montserrat']">
                            Statutory Title Diligence
                          </strong>
                          <p className="text-[11px] text-slate-600">
                            Comprehensive review of BBMP A-Khata, Form 15 NIL Encumbrance certificates, and 30-year parent mother deed chains.
                          </p>
                        </div>
                        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1">
                          <strong className="text-xs font-bold text-[#244B8F] block font-['Montserrat']">
                            Escorted Private Walkthroughs
                          </strong>
                          <p className="text-[11px] text-slate-600">
                            Dedicated relationship desk accompanies prospective buyers for private viewings and escrow coordination.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Section 02: Property Overview */}
                  {sections.overview && (
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                          02 / RESIDENCE OVERVIEW
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#172033] font-['Montserrat']">
                        Property Description & Living Experience
                      </h3>

                      <p className="text-xs text-slate-700 leading-relaxed font-['Poppins']">
                        {description}
                      </p>

                      {/* Quick Facts Metric Chips */}
                      <div className="grid grid-cols-4 gap-2 pt-2 text-center font-['Montserrat']">
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Floor Band</span>
                          <strong className="text-xs text-slate-900 block mt-0.5">{floorBand}</strong>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Usable Carpet</span>
                          <strong className="text-xs text-slate-900 block mt-0.5">~{usablePercent}% Usable</strong>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Facing</span>
                          <strong className="text-xs text-slate-900 block mt-0.5">{facing}</strong>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Occupancy</span>
                          <strong className="text-xs text-emerald-700 block mt-0.5">Ready to Move</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Page Footer */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-['Poppins']">
                  <span>SellMyGhar.in • Bengaluru's Escorted Resale Marketplace</span>
                  <span className="font-mono">Page 02</span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PAGE 3: CURATED PHOTO GALLERY                                  */}
            {/* ============================================================== */}
            {sections.gallery && galleryImages.length > 0 && (
              <div className="brochure-page w-[210mm] min-h-[297mm] h-[297mm] p-[16mm] bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden select-none border border-slate-200">
                
                {/* Micro Header */}
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 font-['Montserrat']">
                  <span>SellMyGhar.in Resale Dossier</span>
                  <span>Page 03</span>
                </div>

                <div className="space-y-4 my-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                        03 / RESIDENTIAL GALLERY
                      </span>
                      <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mt-0.5">
                        Selected Actual Property Photographs
                      </h2>
                    </div>
                    <span className="text-[11px] text-slate-500 font-['Poppins']">
                      {galleryImages.length} verified photographic plates
                    </span>
                  </div>

                  {/* Multi-Image Architectural Grid */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {galleryImages.slice(0, 4).map((img, idx) => (
                      <div
                        key={img.id}
                        className={`rounded-2xl overflow-hidden border border-slate-200 relative shadow-xs ${
                          idx === 0 && galleryImages.length === 3 ? 'col-span-2 aspect-21/9' : 'aspect-4/3'
                        }`}
                      >
                        <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2.5 flex items-center justify-between text-white text-[11px] font-['Poppins']">
                          <span className="font-semibold truncate pr-2">{img.caption}</span>
                          <span className="px-1.5 py-0.5 rounded bg-black/50 text-[9px] font-mono shrink-0">
                            Plate 0{idx + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {galleryImages.length > 4 && (
                    <div className="grid grid-cols-3 gap-3">
                      {galleryImages.slice(4, 7).map((img, idx) => (
                        <div key={img.id} className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 relative">
                          <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-white text-[9px] truncate">
                            {img.caption}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 italic text-center font-['Poppins'] pt-1">
                    * Photographs represent actual conditions verified during field inspection by SellMyGhar relationship desk.
                  </p>
                </div>

                {/* Page Footer */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-['Poppins']">
                  <span>SellMyGhar.in • Bengaluru's Escorted Resale Marketplace</span>
                  <span className="font-mono">Page 03</span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PAGE 4: SPECIFICATIONS & AMENITIES                             */}
            {/* ============================================================== */}
            {(sections.specs || sections.amenities) && (
              <div className="brochure-page w-[210mm] min-h-[297mm] h-[297mm] p-[16mm] bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden select-none border border-slate-200">
                
                {/* Micro Header */}
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 font-['Montserrat']">
                  <span>SellMyGhar.in Resale Dossier</span>
                  <span>Page 04</span>
                </div>

                <div className="space-y-6 my-auto">
                  
                  {/* Section 04: Specifications */}
                  {sections.specs && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                          04 / ARCHITECTURAL SPECIFICATIONS
                        </span>
                        <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mt-0.5">
                          Verified Dimensional & Technical Data
                        </h2>
                      </div>

                      {/* Aligned 2-Column Specification Table */}
                      <div className="bg-slate-50/80 rounded-2xl border border-slate-200/90 overflow-hidden text-xs font-['Poppins']">
                        <table className="w-full text-left border-collapse">
                          <tbody>
                            <tr className="border-b border-slate-200/80">
                              <td className="py-2.5 px-4 font-semibold text-slate-500 w-1/4">Configuration</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900 w-1/4">{bhk} Residence</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-500 w-1/4 border-l border-slate-200/80">Super Built-up</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900 w-1/4 font-mono">{sbua} sq.ft</td>
                            </tr>
                            <tr className="border-b border-slate-200/80 bg-white">
                              <td className="py-2.5 px-4 font-semibold text-slate-500">Usable Carpet Area</td>
                              <td className="py-2.5 px-4 font-bold text-emerald-800 font-mono">{carpet} sq.ft (~{usablePercent}%)</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-500 border-l border-slate-200/80">Floor Band</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">{floorBand}</td>
                            </tr>
                            <tr className="border-b border-slate-200/80">
                              <td className="py-2.5 px-4 font-semibold text-slate-500">Orientation / Facing</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">{facing} Facing</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-500 border-l border-slate-200/80">Bathrooms</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">{bathrooms} Baths</td>
                            </tr>
                            <tr className="border-b border-slate-200/80 bg-white">
                              <td className="py-2.5 px-4 font-semibold text-slate-500">Balconies</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">{balconies} Balconies</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-500 border-l border-slate-200/80">Allocated Car Parking</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">{carParks} {isCoveredParking ? 'Covered' : 'Open'}</td>
                            </tr>
                            <tr className="border-b border-slate-200/80">
                              <td className="py-2.5 px-4 font-semibold text-slate-500">Est. Maintenance</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">₹{monthlyMaintenance.toLocaleString('en-IN')}/mo</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-500 border-l border-slate-200/80">Possession / Status</td>
                              <td className="py-2.5 px-4 font-bold text-emerald-800">Ready to Move</td>
                            </tr>
                            <tr className="bg-white">
                              <td className="py-2.5 px-4 font-semibold text-slate-500">Water Supply</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">Cauvery & Treated Borewell</td>
                              <td className="py-2.5 px-4 font-semibold text-slate-500 border-l border-slate-200/80">Power Backup</td>
                              <td className="py-2.5 px-4 font-bold text-slate-900">100% DG Backup</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Section 05: Amenities & Transit */}
                  {sections.amenities && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                          05 / TOWNSHIP AMENITIES & CONNECTIVITY
                        </span>
                        <h3 className="text-lg font-bold text-[#172033] font-['Montserrat'] mt-0.5">
                          Gated Community Infrastructure & Key Landmarks
                        </h3>
                      </div>

                      {/* Amenities Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-['Poppins']">
                        {amenitiesList.slice(0, 6).map((am: string, idx: number) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center space-x-2 text-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F] shrink-0" />
                            <span className="truncate font-medium">{am}</span>
                          </div>
                        ))}
                      </div>

                      {/* Nearby Transit & Distances */}
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat'] mb-2">
                          Corridor Transit & Landmarks
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-['Poppins']">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                            <span className="text-slate-700 font-medium">Outer Ring Road Metro</span>
                            <span className="font-bold text-[#244B8F] font-mono text-[11px]">600 m</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                            <span className="text-slate-700 font-medium">Major Tech Parks (ORR/ITPB)</span>
                            <span className="font-bold text-[#244B8F] font-mono text-[11px]">3.2 km</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                            <span className="text-slate-700 font-medium">Manipal / Columbia Asia Hospital</span>
                            <span className="font-bold text-[#244B8F] font-mono text-[11px]">2.5 km</span>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                            <span className="text-slate-700 font-medium">International Schools</span>
                            <span className="font-bold text-[#244B8F] font-mono text-[11px]">4.0 km</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Page Footer */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-['Poppins']">
                  <span>SellMyGhar.in • Bengaluru's Escorted Resale Marketplace</span>
                  <span className="font-mono">Page 04</span>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PAGE 5: PRICING, LEGAL DILIGENCE & QR CODE                     */}
            {/* ============================================================== */}
            {(sections.pricingLegal || sections.contactQr) && (
              <div className="brochure-page w-[210mm] min-h-[297mm] h-[297mm] p-[16mm] bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden select-none border border-slate-200">
                
                {/* Micro Header */}
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-400 font-['Montserrat']">
                  <span>SellMyGhar.in Resale Dossier</span>
                  <span>Page 05</span>
                </div>

                <div className="space-y-6 my-auto">
                  
                  {/* Section 06: Legal Diligence & Title Framework */}
                  {sections.pricingLegal && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                          06 / ADVOCATE LEGAL TITLE DILIGENCE
                        </span>
                        <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mt-0.5">
                          Statutory Verification & Title Scrutiny
                        </h2>
                      </div>

                      {/* Diligence Checklist */}
                      <div className="space-y-2 font-['Poppins']">
                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-start space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block font-['Montserrat']">
                              BBMP A-Khata Authenticated
                            </strong>
                            <p className="text-[11px] text-slate-600">
                              Validated municipal khata certificate with active SAS property tax payment challans.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-start space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block font-['Montserrat']">
                              Form 15 Encumbrance NIL (Zero Claims)
                            </strong>
                            <p className="text-[11px] text-slate-600">
                              Sub-Registrar 15 to 30 year continuous search reflecting zero mortgage or adverse claims.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-start space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block font-['Montserrat']">
                              30-Year Continuous Parent Mother Deed Verified
                            </strong>
                            <p className="text-[11px] text-slate-600">
                              Unbroken registered conveyance chain establishing marketable, undisputed title.
                            </p>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-start space-x-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block font-['Montserrat']">
                              Physical Field Inspection Completed
                            </strong>
                            <p className="text-[11px] text-slate-600">
                              Relationship desk verified physical occupancy, boundaries, and association dues clearance.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* DPDP Notice */}
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 flex items-center space-x-2 font-['Poppins']">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#244B8F] shrink-0" />
                        <span>
                          Protected under DPDP Act 2023. Private flat unit numbers, owner deeds, and phone numbers remain protected until escorted private tour.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Section 07: Private Viewing, Next Steps & Live QR Code */}
                  {sections.contactQr && (
                    <div className="space-y-4 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] font-bold text-[#B68A4A] font-['Montserrat'] tracking-wider">
                          07 / PRIVATE TOUR & NEXT STEPS
                        </span>
                        <h3 className="text-lg font-bold text-[#172033] font-['Montserrat'] mt-0.5">
                          Escorted Walkthrough & Purchase Coordination
                        </h3>
                      </div>

                      {/* Contact Card & QR Code Grid */}
                      <div className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 flex items-center justify-between gap-6">
                        
                        {/* Left: Relationship Advisor Details */}
                        <div className="space-y-2 flex-1 font-['Poppins']">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#244B8F] font-['Montserrat'] block">
                            Assigned Relationship Advisor
                          </span>
                          <strong className="text-base font-bold text-[#172033] block font-['Montserrat']">
                            {advisorName}
                          </strong>
                          <div className="space-y-1 text-xs text-slate-600">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{advisorPhone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{advisorEmail}</span>
                            </div>
                          </div>
                          <div className="pt-1 text-[11px] text-slate-500">
                            Concierge Desk: <strong>+91 80 4725 8900</strong> • <strong>concierge@sellmyghar.in</strong>
                          </div>
                        </div>

                        {/* Right: Live Vector QR Code */}
                        <div className="flex flex-col items-center text-center shrink-0 border-l border-slate-200 pl-6">
                          <div className="p-2 bg-white rounded-xl border border-slate-200/90 shadow-xs">
                            <QrCodeSvg value={publicListingUrl} size={100} />
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-2 font-['Montserrat']">
                            Scan for Live Listing
                          </span>
                          <span className="text-[8px] text-slate-400 font-['Poppins']">
                            Photos, Map & Tour Request
                          </span>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* Page Footer */}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-['Poppins']">
                  <span>SellMyGhar.in • Bengaluru's Escorted Resale Marketplace</span>
                  <span className="font-mono">Page 05</span>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
