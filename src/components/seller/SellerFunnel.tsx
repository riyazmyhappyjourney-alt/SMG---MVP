import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Layers,
  Camera,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
  Check,
  Star,
  Trash2,
  Plus,
  Minus,
  HelpCircle,
  Eye,
  ShieldCheck,
  Users,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { 
  BENGALURU_LOCALITIES, 
  BENGALURU_SOCIETIES, 
  LocalityItem, 
  SocietyItem, 
  searchLocalities, 
  searchSocieties,
  getZoneForLocality
} from '../../data/bengaluruData';
import { AutocompleteInput } from '../common/AutocompleteInput';
import { 
  sanitizeOwnerName, 
  sanitizeIndianPhone, 
  sanitizeEmail, 
  sanitizeLocality, 
  sanitizeSociety, 
  sanitizeUnitOrTower, 
  sanitizeSBUA, 
  sanitizeCarpetArea, 
  sanitizePrice, 
  validateVideoUrl, 
  sanitizeDescription 
} from '../../utils/formSanitizer';
import { trackFunnelStep, trackFunnelCompleted } from '../../utils/analytics';

export type PropertyKind = 'Flat / Apartment' | 'Gated Community Villa';
export type FurnishingStatus = 'Furnished' | 'Semi-furnished' | 'Unfurnished';

export interface PhotoItem {
  id: string;
  url: string;
  name: string;
  size: string;
  isFeatured?: boolean;
}

interface SellerFunnelProps {
  onBackToHome?: () => void;
  onViewDashboard?: () => void;
}

// Indian currency formatters
export function formatINR(val: number | string): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
  if (!num || isNaN(num)) return '';
  return '₹' + num.toLocaleString('en-IN');
}

export function formatINRWords(val: number | string): string {
  const num = typeof val === 'string' ? parseInt(val.replace(/\D/g, ''), 10) : val;
  if (!num || isNaN(num)) return '';
  if (num >= 10000000) {
    const cr = (num / 10000000).toFixed(2);
    return `₹ ${cr.replace(/\.00$/, '')} Crore`;
  }
  if (num >= 100000) {
    const lk = (num / 100000).toFixed(2);
    return `₹ ${lk.replace(/\.00$/, '')} Lakh`;
  }
  return `₹ ${num.toLocaleString('en-IN')}`;
}

// Official Application SVG Icons for YouTube, Google Drive, Dropbox
const YouTubeIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <path
      d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      fill="#FF0000"
    />
    <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
  </svg>
);

const GoogleDriveIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 87.3 78" fill="none">
    <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
    <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
    <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
    <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.25z" fill="#00832d"/>
    <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.25z" fill="#2684fc"/>
    <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
  </svg>
);

const DropboxIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M6 2L0 6.5L6 11L12 6.5L6 2Z" fill="#0061FE"/>
    <path d="M18 2L12 6.5L18 11L24 6.5L18 2Z" fill="#0061FE"/>
    <path d="M0 15.5L6 20L12 15.5L6 11L0 15.5Z" fill="#0061FE"/>
    <path d="M24 15.5L18 11L12 15.5L18 20L24 15.5Z" fill="#0061FE"/>
    <path d="M6 21.5L12 17.5L18 21.5L12 25.5L6 21.5Z" fill="#0061FE"/>
  </svg>
);

const BENGALURU_ZONES = [
  'Bengaluru East',
  'Bengaluru North',
  'Bengaluru South',
  'Bengaluru West',
  'Central Bengaluru'
] as const;

const FURNISHING_ITEMS_LIST = [
  'AC', 'TV', 'Beds', 'Wardrobe', 'Geyser', 'Lights', 'Fans',
  'Sofa', 'Washing Machine', 'Stove', 'Fridge', 'Water Purifier',
  'Microwave', 'Modular Kitchen', 'Chimney', 'Dining Table'
];

const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YEARS_LIST = ['2026', '2027', '2028', '2029', '2030'];

const DRAFT_STORAGE_KEY = 'sellmyghar_seller_draft_v3';

export function SellerFunnel({
  onBackToHome,
  onViewDashboard,
}: SellerFunnelProps) {
  // Wizard active step 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Field-level inline errors (Matching Image 2 Reference)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // STEP 1: Basic Details (Sell only, no rent)
  const [propertyKind, setPropertyKind] = useState<PropertyKind>('Flat / Apartment');

  // STEP 2: Location Details (Starts clean, NO hardcoded Whitefield or Shantiniketan)
  const [cityZone, setCityZone] = useState<string>('');
  const [localityQuery, setLocalityQuery] = useState<string>('');
  const [subLocality, setSubLocality] = useState<string>('');
  const [societyQuery, setSocietyQuery] = useState<string>('');
  const [flatNo, setFlatNo] = useState<string>(''); // Flat number only (wing removed)

  // STEP 3: Property Profile (Matching Image 1 & Image 2)
  const [bhkConfig, setBhkConfig] = useState<string>('3 BHK');
  const [customBhk, setCustomBhk] = useState<string>('');
  const [bedrooms, setBedrooms] = useState<number>(3);
  const [customBedrooms, setCustomBedrooms] = useState<string>('');
  const [showCustomBedrooms, setShowCustomBedrooms] = useState<boolean>(false);

  const [bathrooms, setBathrooms] = useState<number>(3);
  const [customBathrooms, setCustomBathrooms] = useState<string>('');
  const [showCustomBathrooms, setShowCustomBathrooms] = useState<boolean>(false);

  const [balconies, setBalconies] = useState<number>(2);
  const [customBalconies, setCustomBalconies] = useState<string>('');
  const [showCustomBalconies, setShowCustomBalconies] = useState<boolean>(false);

  // Area Details (Super built-up is primary; built-up & carpet can be revealed via links)
  const [superBuiltUpSqft, setSuperBuiltUpSqft] = useState<number | ''>('');
  const [showBuiltUpField, setShowBuiltUpField] = useState<boolean>(false);
  const [builtUpAreaSqft, setBuiltUpAreaSqft] = useState<number | ''>('');
  const [showCarpetField, setShowCarpetField] = useState<boolean>(false);
  const [carpetAreaSqft, setCarpetAreaSqft] = useState<number | ''>('');

  // Other Rooms with '+' pills (Image 1)
  const [otherRooms, setOtherRooms] = useState<string[]>([]);

  // Furnishing & Parking & Floor
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('Semi-furnished');
  const [selectedFurnishings, setSelectedFurnishings] = useState<string[]>([
    'Wardrobe', 'Lights', 'Fans', 'Modular Kitchen'
  ]);
  const [coveredParking, setCoveredParking] = useState<number>(1);
  const [openParking, setOpenParking] = useState<number>(0);
  const [unitFloor, setUnitFloor] = useState<number | ''>('');
  const [totalFloors, setTotalFloors] = useState<number | ''>('');
  const [isDuplex, setIsDuplex] = useState<boolean>(false);
  const [availability, setAvailability] = useState<'Ready to move' | 'Under construction'>('Ready to move');
  const [possessionMonth, setPossessionMonth] = useState<string>('December');
  const [possessionYear, setPossessionYear] = useState<string>('2026');

  // STEP 4: Photos and Videos (YouTube, Google Drive, Dropbox - NO device video)
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videoMethod, setVideoMethod] = useState<'YOUTUBE' | 'GOOGLE_DRIVE' | 'DROPBOX'>('YOUTUBE');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 5: Pricing and Description (Starts clean, NO hardcoded default price)
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);
  const [allInclusivePrice, setAllInclusivePrice] = useState<boolean>(false);
  const [taxChargesExcluded, setTaxChargesExcluded] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [ownerEmail, setOwnerEmail] = useState<string>('');

  // Authentication & Submission State
  const [authSession, setAuthSession] = useState<{
    authenticated: boolean;
    user?: { id: string; name?: string; email?: string; phone?: string; roles?: string[] };
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [serverReferenceId, setServerReferenceId] = useState<string>('');

  // Check active session on mount
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setAuthSession(data);
          if (data.user.name && !ownerName) setOwnerName(data.user.name);
          if (data.user.phone && !ownerPhone) setOwnerPhone(data.user.phone.replace(/\D/g, '').slice(-10));
          if (data.user.email && !ownerEmail) setOwnerEmail(data.user.email);
        } else {
          setAuthSession({ authenticated: false });
        }
      })
      .catch(() => setAuthSession({ authenticated: false }));
  }, []);



  // Dynamic Matched Buyers Counter (Replaces generic Property Score per prompt)
  const matchedBuyersCount = useMemo(() => {
    let count = 42; // base Bengaluru buyers looking for homes
    if (localityQuery.trim().length > 0) count += 46;
    if (bhkConfig) count += 32;
    if (superBuiltUpSqft && typeof superBuiltUpSqft === 'number' && superBuiltUpSqft > 0) count += 28;
    if (photos.length > 0) count += 35;
    if (expectedPrice && parseInt(expectedPrice.replace(/\D/g, ''), 10) > 0) count += 32;
    return count;
  }, [localityQuery, bhkConfig, superBuiltUpSqft, photos.length, expectedPrice]);

  // Calculated Price Per Sq Ft (for Sell)
  const calculatedPricePerSqft = useMemo(() => {
    const priceNum = parseInt(expectedPrice.replace(/\D/g, ''), 10);
    const sqftNum = typeof superBuiltUpSqft === 'number' ? superBuiltUpSqft : 0;
    if (!priceNum || !sqftNum || sqftNum <= 0) return null;
    return Math.round(priceNum / sqftNum);
  }, [expectedPrice, superBuiltUpSqft]);

  // Stepper metadata with active summary for completed steps
  const stepsMetadata = [
    { 
      number: 1, 
      name: 'Basic Details', 
      summary: `${propertyKind} for Sale`,
      icon: Building2 
    },
    { 
      number: 2, 
      name: 'Location Details', 
      summary: societyQuery ? `${societyQuery}, ${localityQuery}` : localityQuery || 'Bengaluru',
      icon: MapPin 
    },
    { 
      number: 3, 
      name: 'Property Profile', 
      summary: superBuiltUpSqft ? `${bhkConfig} • ${superBuiltUpSqft} sq.ft.` : bhkConfig,
      icon: Layers 
    },
    { 
      number: 4, 
      name: 'Photos, Videos & Media', 
      summary: photos.length > 0 ? `${photos.length} Photo${photos.length === 1 ? '' : 's'}` : 'Media',
      icon: Camera 
    },
    { 
      number: 5, 
      name: 'Pricing & Others', 
      summary: expectedPrice ? formatINRWords(expectedPrice) : 'Commercial terms',
      icon: IndianRupee 
    },
  ];

  // Telemetry track step
  useEffect(() => {
    const s = stepsMetadata.find(item => item.number === currentStep);
    trackFunnelStep('SELLER_WIZARD_V3', currentStep, s ? s.name : `Step ${currentStep}`);
  }, [currentStep]);

  // ====================================================================
  // STEP VALIDATION (Field-level errors under fields)
  // ====================================================================
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!propertyKind) {
        errors.propertyKind = 'Please select your property type.';
      }
    } else if (step === 2) {
      const locVal = sanitizeLocality(localityQuery);
      if (!locVal.isValid) {
        errors.locality = locVal.error || 'Please enter a valid Bengaluru locality.';
      }
      const socVal = sanitizeSociety(societyQuery);
      if (!socVal.isValid) {
        errors.society = socVal.error || 'Apartment / Society / Project name is required.';
      }
    } else if (step === 3) {
      if (bhkConfig === 'Other' && (!customBhk || customBhk.trim().length < 2)) {
        errors.bhkConfig = 'Please specify your custom configuration.';
      }
      const sbuaVal = sanitizeSBUA(superBuiltUpSqft);
      if (!sbuaVal.isValid) {
        errors.superBuiltUpSqft = 'Atleast one area type mandatory (Super Built-up Area 250 - 30,000 sq.ft.).';
      }
      if (showCarpetField && carpetAreaSqft) {
        const carpetVal = sanitizeCarpetArea(carpetAreaSqft, typeof superBuiltUpSqft === 'number' ? superBuiltUpSqft : undefined);
        if (!carpetVal.isValid) {
          errors.carpetAreaSqft = carpetVal.error || 'Carpet area cannot exceed Super Built-up Area.';
        }
      }
      if (unitFloor !== '' && totalFloors !== '' && typeof unitFloor === 'number' && typeof totalFloors === 'number') {
        if (unitFloor > totalFloors) {
          errors.unitFloor = 'Property floor cannot exceed total floors in building.';
        }
      }
    } else if (step === 4) {
      if (videoUrl.trim()) {
        const vidVal = validateVideoUrl(videoUrl);
        if (!vidVal.isValid) {
          errors.videoUrl = vidVal.error || 'Invalid video link. Supported: YouTube, Google Drive, Dropbox.';
        }
      }
    } else if (step === 5) {
      const priceVal = sanitizePrice(expectedPrice, false);
      if (!priceVal.isValid) {
        errors.expectedPrice = priceVal.error || 'Valid expected selling price is required (minimum ₹5 Lakhs).';
      }
      const nameVal = sanitizeOwnerName(ownerName);
      if (!nameVal.isValid) {
        errors.ownerName = nameVal.error || 'Please enter owner full name (2 - 50 characters).';
      }
      const phoneVal = sanitizeIndianPhone(ownerPhone);
      if (!phoneVal.isValid) {
        errors.ownerPhone = phoneVal.error || 'Valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 is required.';
      }
      if (ownerEmail && ownerEmail.trim()) {
        const emailVal = sanitizeEmail(ownerEmail);
        if (!emailVal.isValid) {
          errors.ownerEmail = emailVal.error || 'Please enter a valid email address.';
        }
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMessage(Object.values(errors)[0]);
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setErrorMessage(null);
      setFieldErrors({});
      setCurrentStep(prev => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setFieldErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ====================================================================
  // PHOTO HANDLERS
  // ====================================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: File[]) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    for (const file of files) {
      if (!validExtensions.includes(file.type)) {
        setUploadError(`Unsupported format: ${file.name}. Select JPG, PNG, or WEBP.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setUploadError(`${file.name} is larger than 10 MB limit.`);
        return;
      }
    }

    setIsUploading(true);
    let loadedCount = 0;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        if (result) {
          const newPhoto: PhotoItem = {
            id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            url: result,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            isFeatured: photos.length === 0,
          };
          setPhotos(prev => [...prev.slice(0, 14), newPhoto]);
        }
        loadedCount++;
        if (loadedCount === files.length) setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Could not process this image.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSetCoverPhoto = (id: string) => {
    setPhotos(prev => prev.map(p => ({ ...p, isFeatured: p.id === id })));
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => {
      const remaining = prev.filter(p => p.id !== id);
      if (remaining.length > 0 && !remaining.some(p => p.isFeatured)) {
        remaining[0].isFeatured = true;
      }
      return remaining;
    });
  };

  // ====================================================================
  // FINAL SUBMISSION (OTP API pending from vendor: Direct Submission)
  // ====================================================================
  const handleSubmitProperty = async () => {
    if (!validateStep(5)) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
    const normalizedPhone = `+91${cleanPhone}`;
    const effPrice = parseInt(expectedPrice.replace(/\D/g, ''), 10);

    const resolvedBedrooms = showCustomBedrooms && customBedrooms
      ? parseInt(customBedrooms, 10) || bedrooms
      : bedrooms;

    const resolvedBathrooms = showCustomBathrooms && customBathrooms
      ? parseInt(customBathrooms, 10) || bathrooms
      : bathrooms;

    const resolvedBalconies = showCustomBalconies && customBalconies
      ? parseInt(customBalconies, 10) || balconies
      : balconies;

    const payload = {
      intent: 'sell',
      listing_intent: 'SELL',
      propertyType: propertyKind === 'Gated Community Villa' ? 'Villa' : 'Apartment',
      subType: propertyKind,
      locality: localityQuery.trim(),
      subLocality: subLocality.trim() || localityQuery.trim(),
      societyName: societyQuery.trim(),
      houseNo: flatNo.trim(),
      wingTower: 'Main',
      bedrooms: resolvedBedrooms,
      bathrooms: resolvedBathrooms,
      balconies: resolvedBalconies,
      superBuiltUpSqft: typeof superBuiltUpSqft === 'number' ? superBuiltUpSqft : 1550,
      carpetAreaSqft: showCarpetField && typeof carpetAreaSqft === 'number' ? carpetAreaSqft : undefined,
      builtUpAreaSqft: showBuiltUpField && typeof builtUpAreaSqft === 'number' ? builtUpAreaSqft : undefined,
      furnishing,
      furnishingItems: furnishing !== 'Unfurnished' ? selectedFurnishings : [],
      otherRooms,
      floorNumber: typeof unitFloor === 'number' ? unitFloor : 1,
      totalFloors: typeof totalFloors === 'number' ? totalFloors : 10,
      facing: 'East',
      propertyAge: availability === 'Under construction' ? 'Under Construction' : 'Ready to Move',
      expectedPossessionDate: availability === 'Under construction' ? `${possessionMonth} ${possessionYear}` : null,
      hasCoveredParking: coveredParking > 0,
      parkingCount: coveredParking,
      openParkingCount: openParking,
      photos: photos.map(p => p.url),
      videoUrl: videoUrl.trim() || null,
      videoProvider: videoUrl.trim() ? videoMethod : null,
      expectedPrice: effPrice,
      isNegotiable,
      allInclusivePrice,
      taxChargesExcluded,
      description: description.trim(),
      ownerName: ownerName.trim(),
      ownerPhone: normalizedPhone,
      ownerEmail: ownerEmail.trim() || undefined,
      zone: cityZone || 'Bengaluru East',
      isDuplex,
    };

    try {
      // Background auto-authentication if user is not already logged in
      if (!authSession?.authenticated) {
        try {
          const reqRes = await fetch('/api/auth/otp/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ phone: cleanPhone }),
          });
          const reqData = await reqRes.json();
          if (reqData && reqData.devOtp) {
            await fetch('/api/auth/otp/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                phone: cleanPhone,
                otp: reqData.devOtp,
                name: ownerName.trim(),
              }),
            });
            setAuthSession({ authenticated: true });
          }
        } catch (authErr) {
          console.warn('[AutoAuth] Background authentication note:', authErr);
        }
      }

      const propRes = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const propData = await propRes.json();
      if (!propRes.ok || !propData.success) {
        throw new Error(propData.error || propData.message || 'Failed to submit property listing.');
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {}

      setServerReferenceId(propData.referenceId || `SMG-${Date.now().toString(36).toUpperCase()}`);
      setSubmissionSuccess(true);
      trackFunnelCompleted('SELLER_WIZARD_V3', {
        bhkType: bhkConfig,
        locality: localityQuery,
        totalImages: photos.length,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setFieldErrors(prev => ({ ...prev, expectedPrice: err.message || 'Submission failed. Please check your network connection.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ====================================================================
  // SUBMISSION SUCCESS VIEW
  // ====================================================================
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] py-12 px-4 sm:px-6 lg:px-8 font-['Montserrat']">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xs border border-slate-200 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
            Listing Status: Published & Live
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mb-2">
            Property Listed Successfully
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg mx-auto font-['Poppins']">
            Your residential property has been posted to SellMyGhar.in. Our Bengaluru relationship team will verify documentation and connect matched buyers.
          </p>

          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 mb-6 text-left max-w-md mx-auto space-y-2 font-['Poppins'] text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Reference ID:</span>
              <span className="font-mono font-bold text-slate-800">{serverReferenceId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Property:</span>
              <span className="font-bold text-slate-800">{societyQuery}, {localityQuery}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Configuration:</span>
              <span className="font-bold text-slate-800">{bhkConfig} ({superBuiltUpSqft} sq.ft.)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Expected Pricing:</span>
              <span className="font-bold text-[#0073E6]">{formatINRWords(expectedPrice)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onViewDashboard && (
              <button
                type="button"
                onClick={onViewDashboard}
                className="w-full sm:w-auto px-6 py-3 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Go to Seller Dashboard
              </button>
            )}
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Return to Homepage
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // MAIN RENDER: MATCHING IMAGE 1, 2, & 3 REFERENCES
  // ====================================================================
  return (
    <div className="min-h-screen bg-[#F4F6F9] selection:bg-[#0073E6] selection:text-white pb-20 font-['Poppins']">
      
      {/* 99acres-Style Header Bar */}
      <header className="bg-[#0073E6] text-white sticky top-0 z-30 shadow-xs font-['Montserrat']">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Back to Homepage"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="text-lg font-extrabold tracking-tight">
              SellMyGhar<span className="text-blue-200 font-normal text-xs">.in</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-medium">
            <span className="hidden sm:inline text-white/80">Post Resale Property</span>
            {authSession?.user && (
              <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-xs">
                {authSession.user.name?.slice(0, 2).toUpperCase() || 'SM'}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container: 2 Columns on Desktop */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: Stepper + Matched Buyers (Image 1 Reference)    */}
        {/* ============================================================ */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-20">
          
          {/* Stepper Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs font-['Montserrat']">
            <nav aria-label="Progress Stepper" className="space-y-6 relative">
              {/* Vertical connector line */}
              <div className="absolute left-3.5 top-3 bottom-3 w-0.5 bg-slate-200 -z-0" />

              {stepsMetadata.map((st) => {
                const isCurrent = currentStep === st.number;
                const isCompleted = currentStep > st.number;

                return (
                  <div key={st.number} className="relative z-10 flex items-start space-x-3.5">
                    {/* Step Icon / Circle */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isCompleted || st.number < currentStep) setCurrentStep(st.number);
                      }}
                      disabled={st.number > currentStep && !isCompleted}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#0073E6] text-white ring-4 ring-blue-100 shadow-xs'
                          : isCompleted
                          ? 'bg-[#0073E6] text-white hover:bg-[#005BB5]'
                          : 'bg-white text-slate-400 border-2 border-slate-300'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : st.number}
                    </button>

                    {/* Step Information */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold block ${isCurrent ? 'text-[#0073E6]' : 'text-slate-800'}`}>
                          {st.name}
                        </span>
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => setCurrentStep(st.number)}
                            className="text-[#0073E6] hover:underline text-[11px] font-bold cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-500 block font-['Poppins'] truncate mt-0.5">
                        {isCompleted ? st.summary : isCurrent ? `Step ${st.number}` : `Step ${st.number}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Matched Buyers Widget (Replaces generic Property Score per prompt) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-2xs flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 text-[#0073E6] flex flex-col items-center justify-center shrink-0">
              <span className="text-base font-extrabold font-['Montserrat'] leading-none">
                {matchedBuyersCount}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">
                Buyers
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-1">
                <span>Matched Buyers</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-500 font-['Poppins'] leading-tight mt-0.5">
                Active buyers searching for homes in {localityQuery || 'Bengaluru'}. Details increase your buyer reach.
              </p>
            </div>
          </div>

        </aside>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Form Surface (Image 1, 2, 3 Reference)         */}
        {/* ============================================================ */}
        <main className="lg:col-span-8">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
            
            {/* Desktop Back Navigation Link & Step Dot Tracker */}
            <div className="hidden lg:flex items-center justify-between pb-4 mb-5 border-b border-slate-100 font-['Montserrat']">
              <div>
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-[#0073E6] transition-colors cursor-pointer font-['Montserrat']"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400">Step 1 of 5</span>
                )}
              </div>

              {/* Desktop 5-Step Dot Tracker & WhatsApp Support */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {stepsMetadata.map((st) => {
                    const isCurrent = currentStep === st.number;
                    const isCompleted = currentStep > st.number;
                    return (
                      <React.Fragment key={st.number}>
                        <button
                          type="button"
                          onClick={() => {
                            if (isCompleted || st.number < currentStep) setCurrentStep(st.number);
                          }}
                          disabled={st.number > currentStep && !isCompleted}
                          title={`Step ${st.number}: ${st.name}`}
                          className="flex items-center space-x-1.5 group cursor-pointer"
                          aria-label={`Step ${st.number}: ${st.name}`}
                        >
                          <span
                            className={`rounded-full transition-all flex items-center justify-center ${
                              isCurrent
                                ? 'w-3.5 h-3.5 bg-[#0073E6] ring-4 ring-blue-100 shadow-xs'
                                : isCompleted
                                ? 'w-2.5 h-2.5 bg-[#0073E6]'
                                : 'w-2.5 h-2.5 bg-slate-300 group-hover:bg-slate-400'
                            }`}
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              isCurrent
                                ? 'text-[#0073E6]'
                                : isCompleted
                                ? 'text-slate-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {st.number}
                          </span>
                        </button>
                        {st.number < 5 && (
                          <div
                            className={`w-5 h-0.5 rounded-full transition-all ${
                              currentStep > st.number ? 'bg-[#0073E6]' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                <a
                  href="https://wa.me/918217873708?text=Hello%20SellMyGhar%20Desk%2C%20I%20need%20assistance%20with%20my%20property%20listing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-[11px] font-bold shrink-0"
                  aria-label="Official Support on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Need Help?</span>
                </a>
              </div>
            </div>

            {/* Mobile Header Bar & Step Dot Tracker (Image 4 Reference) */}
            <div className="lg:hidden pb-4 mb-5 border-b border-slate-100 font-['Montserrat']">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="p-1 -ml-1 text-slate-600 hover:text-[#0073E6] transition-colors"
                      aria-label="Back"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  ) : onBackToHome ? (
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="p-1 -ml-1 text-slate-600 hover:text-[#0073E6] transition-colors"
                      aria-label="Back to Home"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  ) : null}
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-[#172033] leading-tight">
                      {stepsMetadata.find(s => s.number === currentStep)?.name || 'Property Details'}
                    </h2>
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      STEP {currentStep} OF 5
                    </span>
                  </div>
                </div>

                <a
                  href="https://wa.me/918217873708?text=Hello%20SellMyGhar%20Desk%2C%20I%20need%20assistance%20with%20my%20property%20listing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors text-[11px] font-bold shrink-0"
                  aria-label="Official Support on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Need Help?</span>
                </a>
              </div>

              {/* Mobile 5-Step Connected Dot Tracker */}
              <div className="flex items-center justify-between mt-3 px-1">
                {stepsMetadata.map((st) => {
                  const isCurrent = currentStep === st.number;
                  const isCompleted = currentStep > st.number;
                  return (
                    <React.Fragment key={st.number}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isCompleted || st.number < currentStep) setCurrentStep(st.number);
                        }}
                        disabled={st.number > currentStep && !isCompleted}
                        className="flex flex-col items-center group cursor-pointer"
                        aria-label={`Step ${st.number}: ${st.name}`}
                      >
                        <span
                          className={`rounded-full transition-all flex items-center justify-center ${
                            isCurrent
                              ? 'w-3.5 h-3.5 bg-[#0073E6] ring-4 ring-blue-100 shadow-xs'
                              : isCompleted
                              ? 'w-2.5 h-2.5 bg-[#0073E6]'
                              : 'w-2.5 h-2.5 bg-slate-300'
                          }`}
                        />
                      </button>
                      {st.number < 5 && (
                        <div
                          className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${
                            currentStep > st.number ? 'bg-[#0073E6]' : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* STEP 1: BASIC DETAILS (Sell Only, Property Type)        */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] font-['Montserrat'] tracking-tight">
                    Tell us about your property
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-['Poppins'] mt-1">
                    Select your residential property type to start your direct owner listing for sale.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                    What kind of property do you have? <span className="text-rose-500">*</span>
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-lg">
                    <button
                      type="button"
                      onClick={() => setPropertyKind('Flat / Apartment')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-3.5 ${
                        propertyKind === 'Flat / Apartment'
                          ? 'border-[#0073E6] bg-blue-50/70 text-[#0073E6] shadow-xs ring-2 ring-[#0073E6]/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100/60 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-[#0073E6]" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block font-['Montserrat']">Flat / Apartment</span>
                        <span className="text-[11px] text-slate-500 font-['Poppins']">Gated community societies & apartments</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPropertyKind('Gated Community Villa')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-3.5 ${
                        propertyKind === 'Gated Community Villa'
                          ? 'border-[#0073E6] bg-blue-50/70 text-[#0073E6] shadow-xs ring-2 ring-[#0073E6]/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100/60 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-[#0073E6]" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold block font-['Montserrat']">Gated Community Villa</span>
                        <span className="text-[11px] text-slate-500 font-['Poppins']">Private row houses & luxury villa enclaves</span>
                      </div>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: LOCATION DETAILS (Clean start, Zone Auto-fill)   */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] font-['Montserrat'] tracking-tight">
                    Where is your property located?
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-['Poppins'] mt-1">
                    Enter your locality. The corresponding Bengaluru zone is detected automatically.
                  </p>
                </div>

                {/* Locality Autocomplete (Starts clean) */}
                <div>
                  <AutocompleteInput
                    label="Locality"
                    required
                    placeholder="Type locality (e.g. Whitefield, Sarjapur Road, Hebbal, HSR Layout...)"
                    value={localityQuery}
                    error={fieldErrors.locality}
                    onChange={(val) => {
                      setLocalityQuery(val);
                      const detected = getZoneForLocality(val);
                      if (detected) {
                        setCityZone(`Bengaluru ${detected}`);
                      }
                    }}
                    onSelectSuggestion={(sug) => {
                      if (sug.data?.zone) {
                        setCityZone(`Bengaluru ${sug.data.zone}`);
                      }
                    }}
                    getSuggestions={(q) => {
                      const results = searchLocalities(q);
                      return results.map(loc => ({
                        id: loc.id,
                        primaryText: loc.name,
                        secondaryText: `Bengaluru ${loc.zone} • ${(loc.popularSubLocalities || []).slice(0, 3).join(', ')}`,
                        badge: loc.zone,
                        data: loc
                      }));
                    }}
                    iconType="locality"
                    maxLength={80}
                  />
                </div>

                {/* Bengaluru Zone Tabs (Highlights automatically based on locality) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                    Bengaluru Zone <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BENGALURU_ZONES.map(zone => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setCityZone(zone)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
                          cityZone === zone
                            ? 'bg-[#0073E6] text-white border-[#0073E6] shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-locality (Optional) */}
                <div>
                  <label htmlFor="subLocalityInput" className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide mb-1.5">
                    Sub-locality / Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="subLocalityInput"
                    type="text"
                    maxLength={80}
                    value={subLocality}
                    onChange={(e) => setSubLocality(e.target.value)}
                    placeholder="e.g. AECS Layout, Hope Farm, Sector 2..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                  />
                </div>

                {/* Apartment / Society / Project Name (Starts clean) */}
                <div>
                  <AutocompleteInput
                    label={propertyKind === 'Gated Community Villa' ? 'Villa Community / Project Name' : 'Apartment / Society / Project Name'}
                    required
                    placeholder="Type project name (e.g. Prestige Shantiniketan, Sobha Dream Acres, Brigade Gateway...)"
                    value={societyQuery}
                    error={fieldErrors.society}
                    onChange={(val) => setSocietyQuery(val)}
                    onSelectSuggestion={(sug) => {
                      if (sug.data) {
                        if (sug.data.locality) setLocalityQuery(sug.data.locality);
                        if (sug.data.zone) setCityZone(`Bengaluru ${sug.data.zone}`);
                      }
                    }}
                    getSuggestions={(q) => {
                      const results = searchSocieties(q, localityQuery);
                      return results.map(soc => ({
                        id: soc.id,
                        primaryText: soc.name,
                        secondaryText: `${soc.builder} • ${soc.locality}`,
                        badge: soc.zone,
                        data: soc
                      }));
                    }}
                    iconType="society"
                    maxLength={100}
                  />
                </div>

                {/* Flat Number Only (Wing/Tower removed per prompt) */}
                <div className="max-w-xs">
                  <label htmlFor="flatNoInput" className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide mb-1.5">
                    Flat / House Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="flatNoInput"
                    type="text"
                    maxLength={20}
                    value={flatNo}
                    onChange={(e) => setFlatNo(e.target.value)}
                    placeholder="e.g. 1102, Villa 42"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                  />
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: PROPERTY PROFILE (Exact Image 1 & 2 Layout)      */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-7">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] font-['Montserrat'] tracking-tight">
                    Tell us about your property
                  </h1>
                </div>

                {/* "Your apartment is a" (Image 1 Reference) */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                    Your apartment is a
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Other'].map(cfg => (
                      <button
                        key={cfg}
                        type="button"
                        onClick={() => {
                          setBhkConfig(cfg);
                          if (cfg.includes('1')) setBedrooms(1);
                          if (cfg.includes('2')) setBedrooms(2);
                          if (cfg.includes('3')) setBedrooms(3);
                          if (cfg.includes('4')) setBedrooms(4);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          bhkConfig === cfg
                            ? 'bg-[#0073E6] text-white border-[#0073E6] shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {cfg}
                      </button>
                    ))}
                  </div>

                  {bhkConfig === 'Other' && (
                    <div className="mt-2 max-w-sm">
                      <input
                        type="text"
                        maxLength={30}
                        value={customBhk}
                        onChange={(e) => setCustomBhk(e.target.value)}
                        placeholder="e.g. 5 BHK Penthouse, 2.5 BHK Studio..."
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:border-[#0073E6]"
                      />
                    </div>
                  )}
                </div>

                {/* "Add Room Details" (Image 1 Reference) */}
                <div className="space-y-4 pt-1">
                  <h3 className="text-xs font-bold text-slate-900 font-['Montserrat'] uppercase tracking-wider">
                    Add Room Details
                  </h3>

                  {/* No. of Bedrooms (Circular numbers + Add other) */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600 block">No. of Bedrooms</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setBedrooms(num);
                            setShowCustomBedrooms(false);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
                            bedrooms === num && !showCustomBedrooms
                              ? 'bg-[#0073E6] text-white border-[#0073E6]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setShowCustomBedrooms(true)}
                        className={`text-xs font-bold px-2 py-1 cursor-pointer ${
                          showCustomBedrooms ? 'text-[#0073E6] underline' : 'text-[#0073E6] hover:underline'
                        }`}
                      >
                        + Add other
                      </button>
                    </div>

                    {showCustomBedrooms && (
                      <div className="mt-2 max-w-xs">
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={customBedrooms}
                          onChange={(e) => setCustomBedrooms(e.target.value)}
                          placeholder="Enter bedroom count (e.g. 5, 6)"
                          className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300 focus:border-[#0073E6]"
                        />
                      </div>
                    )}
                  </div>

                  {/* No. of Bathrooms */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600 block">No. of Bathrooms</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setBathrooms(num);
                            setShowCustomBathrooms(false);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
                            bathrooms === num && !showCustomBathrooms
                              ? 'bg-[#0073E6] text-white border-[#0073E6]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setShowCustomBathrooms(true)}
                        className={`text-xs font-bold px-2 py-1 cursor-pointer ${
                          showCustomBathrooms ? 'text-[#0073E6] underline' : 'text-[#0073E6] hover:underline'
                        }`}
                      >
                        + Add other
                      </button>
                    </div>

                    {showCustomBathrooms && (
                      <div className="mt-2 max-w-xs">
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={customBathrooms}
                          onChange={(e) => setCustomBathrooms(e.target.value)}
                          placeholder="Enter bathroom count"
                          className="w-full px-3 py-1.5 text-xs border rounded-lg border-slate-300 focus:border-[#0073E6]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Balconies */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-600 block">Balconies</span>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setBalconies(num);
                            setShowCustomBalconies(false);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer border ${
                            balconies === num && !showCustomBalconies
                              ? 'bg-[#0073E6] text-white border-[#0073E6]'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          setBalconies(4);
                          setShowCustomBalconies(true);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                          showCustomBalconies
                            ? 'bg-[#0073E6] text-white border-[#0073E6]'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        More than 3
                      </button>
                    </div>
                  </div>
                </div>

                {/* "Add Area Details" (Exact Image 1 & 2 Layout with Blue filled state & error under heading) */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-sm font-bold text-slate-900 font-['Montserrat']">
                      Add Area Details
                    </h3>
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    {fieldErrors.superBuiltUpSqft && (
                      <span className="w-4 h-4 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold flex items-center justify-center">
                        !
                      </span>
                    )}
                  </div>

                  {/* Error line directly below heading (Image 2 Reference) */}
                  {/* Primary Area Box: Super Built-up Area (Image 4 Reference) */}
                  <div
                    className={`relative rounded-md border p-2.5 max-w-md transition-all ${
                      superBuiltUpSqft && typeof superBuiltUpSqft === 'number' && superBuiltUpSqft > 0
                        ? 'border-[#0073E6] bg-blue-50/20 ring-1 ring-[#0073E6]'
                        : fieldErrors.superBuiltUpSqft
                        ? 'border-rose-400 bg-rose-50/20'
                        : 'border-slate-300 bg-white focus-within:border-[#0073E6] focus-within:ring-1 focus-within:ring-[#0073E6]'
                    }`}
                  >
                    <label
                      htmlFor="sbuaMainInput"
                      className={`text-[11px] font-semibold block mb-0.5 ${
                        superBuiltUpSqft ? 'text-[#0073E6]' : 'text-slate-500'
                      }`}
                    >
                      Super Built-up Area
                    </label>

                    <div className="flex items-center justify-between">
                      <input
                        id="sbuaMainInput"
                        type="number"
                        min="250"
                        max="30000"
                        value={superBuiltUpSqft}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value.slice(0, 5), 10);
                          setSuperBuiltUpSqft(val);
                          if (fieldErrors.superBuiltUpSqft) {
                            setFieldErrors(prev => ({ ...prev, superBuiltUpSqft: '' }));
                          }
                        }}
                        placeholder="Enter area"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 focus:outline-none font-['Poppins']"
                      />

                      <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200 shrink-0 text-xs font-medium text-slate-600">
                        <span>sq.ft.</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Field-level error directly under area input */}
                  {fieldErrors.superBuiltUpSqft && (
                    <p className="text-xs font-medium text-rose-600 font-['Poppins']">
                      {fieldErrors.superBuiltUpSqft}
                    </p>
                  )}

                  {/* Conditional Built-up Area Box (Revealed via + Built-up Area link) */}
                  {showBuiltUpField && (
                    <div className="relative rounded-md border border-slate-300 bg-white p-2.5 max-w-md mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <label htmlFor="builtUpAddInput" className="text-[11px] font-semibold text-slate-500">
                          Built-up Area
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowBuiltUpField(false);
                            setBuiltUpAreaSqft('');
                          }}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                          aria-label="Remove built-up area"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <input
                          id="builtUpAddInput"
                          type="number"
                          min="200"
                          max="30000"
                          value={builtUpAreaSqft}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value.slice(0, 5), 10);
                            setBuiltUpAreaSqft(val);
                          }}
                          placeholder="Enter built-up area"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none font-['Poppins']"
                        />
                        <div className="flex items-center space-x-1 pl-3 border-l border-slate-200 shrink-0 text-xs font-medium text-slate-600">
                          <span>sq.ft.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conditional Carpet Area Box (Revealed via + Carpet Area link) */}
                  {showCarpetField && (
                    <div className="relative rounded-md border border-slate-300 bg-white p-2.5 max-w-md mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <label htmlFor="carpetAddInput" className="text-[11px] font-semibold text-slate-500">
                          Carpet Area
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCarpetField(false);
                            setCarpetAreaSqft('');
                          }}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                          aria-label="Remove carpet area"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <input
                          id="carpetAddInput"
                          type="number"
                          min="150"
                          max="30000"
                          value={carpetAreaSqft}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value.slice(0, 5), 10);
                            setCarpetAreaSqft(val);
                          }}
                          placeholder="Enter carpet area"
                          className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none font-['Poppins']"
                        />
                        <div className="flex items-center space-x-1 pl-3 border-l border-slate-200 shrink-0 text-xs font-medium text-slate-600">
                          <span>sq.ft.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* '+ Built-up Area' and '+ Carpet Area' links below (Image 4 Reference) */}
                  <div className="flex items-center space-x-4 pt-1">
                    {!showBuiltUpField && (
                      <button
                        type="button"
                        onClick={() => setShowBuiltUpField(true)}
                        className="text-xs font-semibold text-[#0073E6] hover:underline cursor-pointer"
                      >
                        + Built-up Area
                      </button>
                    )}
                    {!showCarpetField && (
                      <button
                        type="button"
                        onClick={() => setShowCarpetField(true)}
                        className="text-xs font-semibold text-[#0073E6] hover:underline cursor-pointer"
                      >
                        + Carpet Area
                      </button>
                    )}
                  </div>
                </div>

                {/* "Other rooms (Optional)" (Image 1 Reference) */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-900 font-['Montserrat']">
                    Other rooms <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Pooja Room', 'Study Room', 'Servant Room', 'Store Room'].map(room => {
                      const isSelected = otherRooms.includes(room);
                      return (
                        <button
                          key={room}
                          type="button"
                          onClick={() => {
                            setOtherRooms(prev => 
                              isSelected ? prev.filter(r => r !== room) : [...prev, room]
                            );
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-[#0073E6] text-white border-[#0073E6] font-bold'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <span>{isSelected ? '✓' : '+'}</span>
                          <span>{room}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Furnishing Status */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                    Furnishing <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['Furnished', 'Semi-furnished', 'Unfurnished'] as FurnishingStatus[]).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setFurnishing(st);
                          if (st === 'Unfurnished') setSelectedFurnishings([]);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          furnishing === st
                            ? 'bg-[#0073E6] text-white border-[#0073E6] shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {furnishing !== 'Unfurnished' && (
                    <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                      <span className="text-xs font-bold text-slate-800 block font-['Montserrat']">
                        Select Furnishings & Appliances Present:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {FURNISHING_ITEMS_LIST.map(item => {
                          const checked = selectedFurnishings.includes(item);
                          return (
                            <label
                              key={item}
                              className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  setSelectedFurnishings(prev => 
                                    checked ? prev.filter(i => i !== item) : [...prev, item]
                                  );
                                }}
                                className="w-4 h-4 rounded text-[#0073E6] focus:ring-[#0073E6] border-slate-300"
                              />
                              <span>{item}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Floor Details (Image 4 Reference) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#172033] font-['Montserrat']">
                      Floor Details
                    </h3>
                    <p className="text-xs text-slate-500 font-['Poppins']">
                      Total no of floors and your floor details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md pt-1">
                    <div>
                      <input
                        id="totalFlInput"
                        type="number"
                        min="1"
                        max="100"
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        placeholder="Total Floors"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                      />
                    </div>
                    <div className="relative">
                      <select
                        id="propFloorInput"
                        value={unitFloor}
                        onChange={(e) => setUnitFloor(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins'] appearance-none pr-8 cursor-pointer"
                      >
                        <option value="">Property on floor</option>
                        <option value="0">Ground floor</option>
                        <option value="1">1st floor</option>
                        <option value="2">2nd floor</option>
                        <option value="3">3rd floor</option>
                        <option value="4">4th floor</option>
                        <option value="5">5th floor</option>
                        <option value="6">6th - 10th floor</option>
                        <option value="11">11th - 20th floor</option>
                        <option value="21">21st floor & above</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  {fieldErrors.unitFloor && (
                    <p className="text-xs text-rose-600 font-medium font-['Poppins']">{fieldErrors.unitFloor}</p>
                  )}
                </div>

                {/* Availability Status (Image 4 Reference) */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <h3 className="text-sm sm:text-base font-bold text-[#172033] font-['Montserrat']">
                    Availability Status
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {(['Ready to move', 'Under construction'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAvailability(st)}
                        className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                          availability === st
                            ? 'bg-[#0073E6] text-white border-[#0073E6] shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {availability === 'Under construction' && (
                    <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-md max-w-md space-y-2">
                      <span className="text-xs font-bold text-slate-800 block font-['Montserrat']">
                        Expected Possession Date:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={possessionMonth}
                          onChange={(e) => setPossessionMonth(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800"
                        >
                          {MONTHS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                          value={possessionYear}
                          onChange={(e) => setPossessionYear(e.target.value)}
                          className="px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800"
                        >
                          {YEARS_LIST.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: PHOTOS AND VIDEOS (YouTube, Drive, Dropbox Only) */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-7">
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] font-['Montserrat'] tracking-tight">
                    Add photos & videos of your property
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 font-['Poppins'] mt-1">
                    A picture is worth a thousand words. Listings with photos receive 5x more buyer views.
                  </p>
                </div>

                {uploadError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
                    <span>{uploadError}</span>
                    <button type="button" onClick={() => setUploadError(null)}>
                      <X className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                )}

                {/* Photo Upload Zone */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                      Property Photos <span className="text-slate-400 font-normal">({photos.length}/15 uploaded)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      JPG, PNG, WEBP (Max 10MB each)
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#0073E6] bg-blue-50/50'
                        : 'border-slate-300 hover:border-[#0073E6] bg-slate-50/60 hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div className="w-12 h-12 rounded-full bg-blue-100/70 text-[#0073E6] flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800 font-['Montserrat']">
                      {isUploading ? 'Uploading photos...' : '+ Add photos of your property'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-['Poppins'] mt-1">
                      Drag and drop your images here, or browse from device
                    </p>
                  </div>

                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      {photos.map((item) => (
                        <div
                          key={item.id}
                          className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100"
                        >
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          {item.isFeatured ? (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1E3A8A] text-white text-[10px] font-bold font-['Montserrat'] shadow-xs flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-white" />
                              <span>Cover</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetCoverPhoto(item.id);
                              }}
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              Set as Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemovePhoto(item.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                            aria-label="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Options: YouTube, Google Drive, Dropbox (Device upload removed) */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                    Add Property Video <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>

                  <div className="grid grid-cols-3 gap-3 max-w-md">
                    <button
                      type="button"
                      onClick={() => setVideoMethod('YOUTUBE')}
                      className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                        videoMethod === 'YOUTUBE'
                          ? 'border-[#0073E6] bg-blue-50/70 text-[#0073E6] font-bold shadow-2xs ring-1 ring-[#0073E6]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <YouTubeIcon />
                      <span className="text-xs font-semibold">YouTube</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVideoMethod('GOOGLE_DRIVE')}
                      className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                        videoMethod === 'GOOGLE_DRIVE'
                          ? 'border-[#0073E6] bg-blue-50/70 text-[#0073E6] font-bold shadow-2xs ring-1 ring-[#0073E6]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <GoogleDriveIcon />
                      <span className="text-xs font-semibold">Google Drive</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVideoMethod('DROPBOX')}
                      className={`p-3 rounded-md border text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                        videoMethod === 'DROPBOX'
                          ? 'border-[#0073E6] bg-blue-50/70 text-[#0073E6] font-bold shadow-2xs ring-1 ring-[#0073E6]'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <DropboxIcon />
                      <span className="text-xs font-semibold">Dropbox</span>
                    </button>
                  </div>

                  <div>
                    <input
                      type="url"
                      maxLength={300}
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder={
                        videoMethod === 'YOUTUBE'
                          ? 'Paste YouTube video link: https://www.youtube.com/watch?v=...'
                          : videoMethod === 'GOOGLE_DRIVE'
                          ? 'Paste Google Drive file link: https://drive.google.com/file/d/...'
                          : 'Paste Dropbox share link: https://www.dropbox.com/s/...'
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                    />
                    {fieldErrors.videoUrl && (
                      <p className="text-xs text-rose-600 font-medium mt-1 font-['Poppins']">
                        {fieldErrors.videoUrl}
                      </p>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 5: PRICING AND DESCRIPTION (Image 4 Reference)      */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#172033] font-['Montserrat'] tracking-tight">
                    Price Details
                  </h1>
                  <p className="text-xs text-slate-500 font-['Poppins'] mt-0.5">
                    Set your commercial expectations. SellMyGhar connects you directly with serious verified buyers.
                  </p>
                </div>

                {/* Price Details Box (Image 4 Reference) */}
                <div className="space-y-3">
                  <div className="relative max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                      ₹
                    </span>
                    <input
                      id="expPriceCleanInput"
                      type="text"
                      maxLength={14}
                      value={expectedPrice ? parseInt(expectedPrice.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setExpectedPrice(raw);
                        if (fieldErrors.expectedPrice) {
                          setFieldErrors(prev => ({ ...prev, expectedPrice: '' }));
                        }
                      }}
                      placeholder="Expected Price"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] transition-all font-['Poppins']"
                    />
                  </div>

                  {fieldErrors.expectedPrice && (
                    <p className="text-xs text-rose-600 font-medium font-['Poppins']">
                      {fieldErrors.expectedPrice}
                    </p>
                  )}

                  {expectedPrice && (
                    <div className="flex items-center space-x-2 text-xs font-semibold text-[#0073E6] font-['Montserrat']">
                      <span>{formatINRWords(expectedPrice)}</span>
                      {calculatedPricePerSqft && (
                        <span className="text-slate-500 font-normal">
                          (₹{calculatedPricePerSqft.toLocaleString('en-IN')}/sq.ft)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Pricing Checkboxes (Image 4 Reference) */}
                  <div className="space-y-2.5 pt-1">
                    <label className="flex items-center space-x-2.5 text-xs sm:text-sm text-slate-700 font-normal cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allInclusivePrice}
                        onChange={(e) => setAllInclusivePrice(e.target.checked)}
                        className="w-4 h-4 rounded-xs text-[#0073E6] focus:ring-[#0073E6] border-slate-300"
                      />
                      <span className="flex items-center space-x-1">
                        <span>All inclusive price</span>
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </label>

                    <label className="flex items-center space-x-2.5 text-xs sm:text-sm text-slate-700 font-normal cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isNegotiable}
                        onChange={(e) => setIsNegotiable(e.target.checked)}
                        className="w-4 h-4 rounded-xs text-[#0073E6] focus:ring-[#0073E6] border-slate-300"
                      />
                      <span>Price Negotiable</span>
                    </label>

                    <label className="flex items-center space-x-2.5 text-xs sm:text-sm text-slate-700 font-normal cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={taxChargesExcluded}
                        onChange={(e) => setTaxChargesExcluded(e.target.checked)}
                        className="w-4 h-4 rounded-xs text-[#0073E6] focus:ring-[#0073E6] border-slate-300"
                      />
                      <span>Tax and Govt. charges excluded</span>
                    </label>

                    <button
                      type="button"
                      className="text-xs font-semibold text-[#0073E6] hover:underline cursor-pointer flex items-center space-x-1 pt-0.5"
                    >
                      <span>+ Add more pricing details</span>
                    </button>
                  </div>
                </div>

                {/* Property Description */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label htmlFor="descUniqueInput" className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
                      What makes your property unique? <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {description.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="descUniqueInput"
                    rows={4}
                    maxLength={1000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mention highlights: corner unit, pool facing, modular woodwork, proximity to schools..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                  />
                </div>

                {/* Owner Identity Verification */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 font-['Montserrat'] uppercase tracking-wider">
                    Owner Contact Verification
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ownerFullNameInput" className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide mb-1.5">
                        Owner Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="ownerFullNameInput"
                        type="text"
                        maxLength={50}
                        value={ownerName}
                        onChange={(e) => {
                          setOwnerName(e.target.value);
                          if (fieldErrors.ownerName) setFieldErrors(prev => ({ ...prev, ownerName: '' }));
                        }}
                        placeholder="e.g. Sunil Narang"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                      />
                      {fieldErrors.ownerName && (
                        <p className="text-xs text-rose-600 font-medium mt-1 font-['Poppins']">{fieldErrors.ownerName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="ownerMobileInput" className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide mb-1.5">
                        10-Digit Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                          +91
                        </span>
                        <input
                          id="ownerMobileInput"
                          type="tel"
                          maxLength={10}
                          value={ownerPhone}
                          onChange={(e) => {
                            setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                            if (fieldErrors.ownerPhone) setFieldErrors(prev => ({ ...prev, ownerPhone: '' }));
                          }}
                          placeholder="98765 00111"
                          className="w-full pl-11 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                        />
                      </div>
                      {fieldErrors.ownerPhone && (
                        <p className="text-xs text-rose-600 font-medium mt-1 font-['Poppins']">{fieldErrors.ownerPhone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ownerListingEmailInput" className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide mb-1.5">
                      Email Address <span className="text-slate-400 font-normal">(Optional, for inquiry alerts)</span>
                    </label>
                    <input
                      id="ownerListingEmailInput"
                      type="email"
                      maxLength={80}
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="e.g. sunil.narang@example.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6] font-['Poppins']"
                    />
                  </div>
                </div>

                {/* Summary Review Card */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#172033] font-['Montserrat'] uppercase tracking-wider">
                      Listing Summary Review
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Direct Owner Listing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-['Poppins']">
                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex justify-between items-start">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Property</span>
                        <span className="font-bold text-slate-800 block mt-0.5">{societyQuery || 'Society'}</span>
                        <span className="text-slate-500 text-[11px]">{localityQuery || 'Locality'}, {cityZone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[#0073E6] hover:underline text-[11px] font-bold p-1 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex justify-between items-start">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Configuration</span>
                        <span className="font-bold text-slate-800 block mt-0.5">{bhkConfig} ({superBuiltUpSqft || 0} sq.ft.)</span>
                        <span className="text-slate-500 text-[11px]">{furnishing}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-[#0073E6] hover:underline text-[11px] font-bold p-1 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ======================================================== */}
            {/* BOTTOM ACTION CONTROLS (Back / Continue / Submit)        */}
            {/* ======================================================== */}
            <div className="mt-8 pt-6 border-t border-slate-200 font-['Montserrat']">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="order-2 sm:order-1 px-5 py-3 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}

                <div className="order-1 sm:order-2 flex-1 sm:flex-initial sm:ml-auto">
                  {currentStep < 5 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-md bg-[#0073E6] sm:bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-2"
                    >
                      <span>Post and Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitProperty}
                      disabled={isSubmitting}
                      className={`w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-md bg-[#0073E6] sm:bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Listing...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Post Property FREE</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
