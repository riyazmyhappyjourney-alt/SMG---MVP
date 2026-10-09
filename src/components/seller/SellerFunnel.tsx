import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Layers,
  Camera,
  IndianRupee,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  AlertTriangle,
  Lock,
  Check,
  RefreshCw,
  Video,
  ExternalLink
} from 'lucide-react';
import { BENGALURU_LOCALITIES, BENGALURU_SOCIETIES, LocalityItem, SocietyItem } from '../../data/bengaluruData';

export type WizardIntent = 'SELL' | 'RENT';
export type PropertySubtype = 
  | 'Flat / Apartment' 
  | 'Independent House / Villa'
  | 'Penthouse' 
  | 'Duplex';

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
  onViewCrm?: () => void;
}

// Indian Rupee currency helpers
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

export function SellerFunnel({
  onBackToHome,
  onViewDashboard,
  onViewCrm,
}: SellerFunnelProps) {
  // Wizard active step 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // STEP 1: Basic Details
  const [intent, setIntent] = useState<WizardIntent>('SELL');
  const [subType, setSubType] = useState<PropertySubtype>('Flat / Apartment');

  // STEP 2: Location (Searchable Autocomplete)
  const [localityQuery, setLocalityQuery] = useState<string>('Whitefield');
  const [isLocalityOpen, setIsLocalityOpen] = useState<boolean>(false);
  const [highlightedLocalityIdx, setHighlightedLocalityIdx] = useState<number>(0);
  const localityWrapperRef = useRef<HTMLDivElement>(null);

  const [societyQuery, setSocietyQuery] = useState<string>('Prestige Shantiniketan');
  const [isSocietyOpen, setIsSocietyOpen] = useState<boolean>(false);
  const [highlightedSocietyIdx, setHighlightedSocietyIdx] = useState<number>(0);
  const societyWrapperRef = useRef<HTMLDivElement>(null);

  const [wingTower, setWingTower] = useState<string>('');
  const [houseNo, setHouseNo] = useState<string>('');

  // STEP 3: Unit Specifications
  const [bhkType, setBhkType] = useState<string>('3 BHK');
  const [bathrooms, setBathrooms] = useState<number>(3);
  const [balconies, setBalconies] = useState<number>(2);
  const [superBuiltUpSqft, setSuperBuiltUpSqft] = useState<number | ''>(1550);
  const [carpetAreaSqft, setCarpetAreaSqft] = useState<number | ''>(1209);
  const [isCarpetCustomized, setIsCarpetCustomized] = useState<boolean>(false);
  const [unitFloor, setUnitFloor] = useState<number | ''>(5);
  const [totalFloors, setTotalFloors] = useState<number | ''>(14);
  const [facing, setFacing] = useState<string>('East');
  const [furnishing, setFurnishing] = useState<string>('Semi-Furnished');
  const [propertyAge, setPropertyAge] = useState<string>('1 to 5 years');
  const [hasCoveredParking, setHasCoveredParking] = useState<boolean>(true);
  const [parkingCount, setParkingCount] = useState<number>(1);

  // Auto-calculate Carpet Area ~78% when superBuiltUpSqft changes unless manually customized
  useEffect(() => {
    if (!isCarpetCustomized && typeof superBuiltUpSqft === 'number' && superBuiltUpSqft > 0) {
      setCarpetAreaSqft(Math.round(superBuiltUpSqft * 0.78));
    }
  }, [superBuiltUpSqft, isCarpetCustomized]);

  // STEP 4: Photos and Video
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 5: Pricing & Owner Details
  // Sell-specific
  const [expectedPrice, setExpectedPrice] = useState<string>('');
  const [isNegotiable, setIsNegotiable] = useState<boolean>(true);
  const [bookingAmount, setBookingAmount] = useState<string>('');
  // Rent-specific
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [securityDeposit, setSecurityDeposit] = useState<string>('');
  const [preferredTenant, setPreferredTenant] = useState<string>('Family');
  const [rentalDuration, setRentalDuration] = useState<string>('11-Month (Standard)');
  const [customDurationMonths, setCustomDurationMonths] = useState<number>(12);
  const [moveInAvailability, setMoveInAvailability] = useState<string>('Immediate');
  const [moveInDate, setMoveInDate] = useState<string>('');
  // Common terms
  const [maintenanceCharges, setMaintenanceCharges] = useState<string>('');
  const [ownerName, setOwnerName] = useState<string>('');
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // STEP 6: Declarations & Verification
  const [lawfulDeclaration, setLawfulDeclaration] = useState<boolean>(false);
  const [contactConsent, setContactConsent] = useState<boolean>(false);

  // OTP Verification Modal / State
  const [showOtpModal, setShowOtpModal] = useState<boolean>(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState<number>(60);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Submission Results
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [serverReferenceId, setServerReferenceId] = useState<string>('');
  const [createdPropertyId, setCreatedPropertyId] = useState<string>('');

  // Close dropdowns on outside click or Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (localityWrapperRef.current && !localityWrapperRef.current.contains(e.target as Node)) {
        setIsLocalityOpen(false);
      }
      if (societyWrapperRef.current && !societyWrapperRef.current.contains(e.target as Node)) {
        setIsSocietyOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsLocalityOpen(false);
        setIsSocietyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (!showOtpModal || otpCooldown <= 0) return;
    const interval = setInterval(() => {
      setOtpCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [showOtpModal, otpCooldown]);

  // Filtered Locality Suggestions (Ranked: Prefix match first, then substring)
  const filteredLocalities = useMemo(() => {
    const q = localityQuery.trim().toLowerCase();
    if (!q) return BENGALURU_LOCALITIES.slice(0, 7);

    const prefixMatches: LocalityItem[] = [];
    const substringMatches: LocalityItem[] = [];

    BENGALURU_LOCALITIES.forEach(item => {
      const nameLower = item.name.toLowerCase();
      if (nameLower.startsWith(q)) {
        prefixMatches.push(item);
      } else if (nameLower.includes(q)) {
        substringMatches.push(item);
      }
    });

    return [...prefixMatches, ...substringMatches].slice(0, 7);
  }, [localityQuery]);

  // Filtered Society Suggestions (Ranked: Prefix match first, then substring)
  const filteredSocieties = useMemo(() => {
    const q = societyQuery.trim().toLowerCase();
    if (!q) {
      // Prioritize societies in selected locality if any
      const locLower = localityQuery.toLowerCase();
      const inLoc = BENGALURU_SOCIETIES.filter(s => s.locality.toLowerCase().includes(locLower));
      return inLoc.length > 0 ? inLoc.slice(0, 7) : BENGALURU_SOCIETIES.slice(0, 7);
    }

    const prefixMatches: SocietyItem[] = [];
    const substringMatches: SocietyItem[] = [];

    BENGALURU_SOCIETIES.forEach(item => {
      const nameLower = item.name.toLowerCase();
      if (nameLower.startsWith(q)) {
        prefixMatches.push(item);
      } else if (nameLower.includes(q)) {
        substringMatches.push(item);
      }
    });

    return [...prefixMatches, ...substringMatches].slice(0, 7);
  }, [societyQuery, localityQuery]);

  // Dynamic Listing Readiness Calculation
  const listingReadiness = useMemo<number>(() => {
    let score = 0;
    // Step 1: Intent & Subtype (20%)
    if (intent) score += 10;
    if (subType) score += 10;
    // Step 2: Location (20%)
    if (localityQuery.trim()) score += 10;
    if (societyQuery.trim()) score += 5;
    if (houseNo.trim()) score += 5;
    // Step 3: Specs (25%)
    if (bhkType) score += 5;
    if (typeof superBuiltUpSqft === 'number' && superBuiltUpSqft > 0) score += 10;
    if (typeof unitFloor === 'number' && typeof totalFloors === 'number' && unitFloor <= totalFloors) score += 5;
    if (facing && furnishing) score += 5;
    // Step 4: Photos & Visuals (15%)
    if (photos.length >= 3) score += 15;
    else if (photos.length > 0) score += 10;
    else if (videoUrl.trim()) score += 5;
    // Step 5: Pricing & Owner (20%)
    const priceVal = intent === 'SELL' ? parseInt(expectedPrice.replace(/\D/g, ''), 10) : parseInt(monthlyRent.replace(/\D/g, ''), 10);
    if (!isNaN(priceVal) && priceVal > 0) score += 10;
    if (ownerName.trim().length >= 2) score += 5;
    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
    if (/^[6-9]\d{9}$/.test(cleanPhone)) score += 5;

    return Math.min(100, Math.max(15, score));
  }, [
    intent,
    subType,
    localityQuery,
    societyQuery,
    houseNo,
    bhkType,
    superBuiltUpSqft,
    unitFloor,
    totalFloors,
    facing,
    furnishing,
    photos,
    videoUrl,
    expectedPrice,
    monthlyRent,
    ownerName,
    ownerPhone
  ]);

  // Navigation & Step Validation
  const validateStep = (stepNumber: number): boolean => {
    setErrorMessage(null);

    if (stepNumber === 1) {
      if (!intent) {
        setErrorMessage('Please choose whether you want to Sell or Rent.');
        return false;
      }
      if (!subType) {
        setErrorMessage('Please select a property type.');
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      if (!localityQuery.trim() || localityQuery.trim().length < 2) {
        setErrorMessage('Please enter a Bengaluru locality.');
        return false;
      }
      if (!societyQuery.trim() || societyQuery.trim().length < 2) {
        setErrorMessage('Please enter your apartment complex or society name.');
        return false;
      }
      if (!houseNo.trim()) {
        setErrorMessage('Please enter your flat or unit number (kept strictly confidential).');
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      if (!bhkType) {
        setErrorMessage('Please choose the BHK configuration.');
        return false;
      }
      const sbua = typeof superBuiltUpSqft === 'number' ? superBuiltUpSqft : 0;
      if (sbua < 200) {
        setErrorMessage('Please enter a valid Super Built-up Area in square feet.');
        return false;
      }
      const carpet = typeof carpetAreaSqft === 'number' ? carpetAreaSqft : 0;
      if (carpet > sbua) {
        setErrorMessage('Carpet Area cannot exceed the Super Built-up Area.');
        return false;
      }
      const fl = typeof unitFloor === 'number' ? unitFloor : 0;
      const tot = typeof totalFloors === 'number' ? totalFloors : 0;
      if (fl < 0) {
        setErrorMessage('Unit floor cannot be negative.');
        return false;
      }
      if (tot < 1) {
        setErrorMessage('Total building floors must be at least 1.');
        return false;
      }
      if (fl > tot) {
        setErrorMessage(`Unit floor (${fl}) cannot be higher than total building floors (${tot}).`);
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      if (videoUrl.trim()) {
        const isSupportedHost = 
          videoUrl.includes('youtube.com') || 
          videoUrl.includes('youtu.be') || 
          videoUrl.includes('drive.google.com') ||
          videoUrl.includes('dropbox.com');
        if (!isSupportedHost) {
          setErrorMessage('Please provide a video share link from YouTube, Google Drive, or Dropbox.');
          return false;
        }
      }
      return true;
    }

    if (stepNumber === 5) {
      if (intent === 'SELL') {
        const priceNum = parseInt(expectedPrice.replace(/\D/g, ''), 10);
        if (isNaN(priceNum) || priceNum < 500000) {
          setErrorMessage('Please enter a valid expected selling price (minimum ₹5,00,000).');
          return false;
        }
      } else {
        const rentNum = parseInt(monthlyRent.replace(/\D/g, ''), 10);
        if (isNaN(rentNum) || rentNum < 5000) {
          setErrorMessage('Please enter a valid expected monthly rent (minimum ₹5,000/month).');
          return false;
        }
        if (rentalDuration === 'Custom Duration' && (!customDurationMonths || customDurationMonths < 1)) {
          setErrorMessage('Please enter the custom rental duration in months.');
          return false;
        }
        if (moveInAvailability === 'Specific Date' && !moveInDate) {
          setErrorMessage('Please pick the available move-in date.');
          return false;
        }
      }

      if (!ownerName.trim() || ownerName.trim().length < 2) {
        setErrorMessage('Please provide your full name.');
        return false;
      }
      const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage('Please enter a valid 10-digit mobile number.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      setErrorMessage(null);
      setCurrentStep(prev => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // STEP 4: Photo Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = (files: File[]) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 8 * 1024 * 1024; // 8 MB

    for (const file of files) {
      if (!validExtensions.includes(file.type)) {
        setUploadError(`Unsupported format: ${file.name}. Please select JPG, PNG, or WEBP images.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setUploadError(`${file.name} is larger than 8 MB. Please choose images under 8 MB.`);
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
          setPhotos(prev => [...prev.slice(0, 9), newPhoto]);
        }
        loadedCount++;
        if (loadedCount === files.length) {
          setIsUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Could not process this image. Please try another file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleAddSamplePhotos = () => {
    setUploadError(null);
    const sampleAssets: PhotoItem[] = [
      {
        id: `sample-hero-${Date.now()}`,
        url: '/images/brigade-granada-hero.webp',
        name: 'brigade-granada-hero.webp',
        size: '1.2 MB',
        isFeatured: photos.length === 0,
      },
      {
        id: `sample-club-${Date.now()}`,
        url: '/images/brigade-granada-clubhouse.webp',
        name: 'brigade-granada-clubhouse.webp',
        size: '980 KB',
      },
      {
        id: `sample-night-${Date.now()}`,
        url: '/images/brigade-granada-night-vision.webp',
        name: 'living-hall-balcony.webp',
        size: '1.1 MB',
      },
      {
        id: `sample-town-${Date.now()}`,
        url: '/images/luxury-apartment-township-sunset.webp',
        name: 'township-view.webp',
        size: '1.4 MB',
      },
    ];

    setPhotos(prev => {
      const existingNames = new Set(prev.map(p => p.name));
      const fresh = sampleAssets.filter(s => !existingNames.has(s.name));
      const merged = [...prev, ...fresh];
      return merged.slice(0, 10);
    });
  };

  // STEP 6: OTP & Final Submission Flow
  const handleInitiateOtp = async () => {
    setErrorMessage(null);

    if (!validateStep(5)) {
      setCurrentStep(5);
      return;
    }

    if (!lawfulDeclaration) {
      setErrorMessage(
        intent === 'SELL'
          ? 'Please confirm that you own or are legally authorised to sell this property.'
          : 'Please confirm that you have legal authority to lease out this property.'
      );
      return;
    }

    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${cleanPhone}` }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unable to send OTP. Please check your mobile number.');
      }

      setOtpCooldown(data.cooldownSeconds || 60);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
      setShowOtpModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtpAndSubmit = async () => {
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
    const normalizedPhone = `+91${cleanPhone}`;

    try {
      // 1. Verify OTP with backend
      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: enteredOtp,
          name: ownerName.trim(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Incorrect or expired verification code.');
      }

      // 2. Submit Property directly to POST /api/properties
      setIsSubmitting(true);
      setShowOtpModal(false);

      const effPrice = intent === 'SELL' 
        ? parseInt(expectedPrice.replace(/\D/g, ''), 10)
        : parseInt(monthlyRent.replace(/\D/g, ''), 10);

      const payload = {
        intent: intent.toLowerCase(),
        listing_intent: intent,
        propertyType: 'Residential',
        subType,
        locality: localityQuery.trim(),
        subLocality: localityQuery.trim(),
        societyName: societyQuery.trim(),
        houseNo: houseNo.trim(),
        wingTower: wingTower.trim() || 'Wing-A',
        bedrooms: bhkType.includes('1') ? 1 : bhkType.includes('2.5') ? 2 : bhkType.includes('2') ? 2 : bhkType.includes('3.5') ? 3 : bhkType.includes('3') ? 3 : 4,
        bathrooms,
        balconies,
        superBuiltUpSqft: typeof superBuiltUpSqft === 'number' ? superBuiltUpSqft : 1550,
        carpetAreaSqft: typeof carpetAreaSqft === 'number' ? carpetAreaSqft : 1209,
        furnishing,
        floorNumber: typeof unitFloor === 'number' ? unitFloor : 1,
        totalFloors: typeof totalFloors === 'number' ? totalFloors : 10,
        facing,
        propertyAge,
        hasCoveredParking,
        parkingCount: hasCoveredParking ? parkingCount : 0,
        photos: photos.map(p => p.url),
        videoUrl: videoUrl.trim() || null,
        expectedPrice: effPrice,
        isNegotiable,
        maintenanceCharges: parseInt(maintenanceCharges.replace(/\D/g, ''), 10) || 0,
        bookingAmount: intent === 'SELL' ? (parseInt(bookingAmount.replace(/\D/g, ''), 10) || null) : null,
        securityDeposit: intent === 'RENT' ? (parseInt(securityDeposit.replace(/\D/g, ''), 10) || null) : null,
        preferredTenant: intent === 'RENT' ? preferredTenant : null,
        rentalDuration: intent === 'RENT' ? (rentalDuration === 'Custom Duration' ? `${customDurationMonths} Months` : rentalDuration) : null,
        moveInAvailability: intent === 'RENT' ? moveInAvailability : null,
        moveInDate: intent === 'RENT' && moveInAvailability === 'Specific Date' ? moveInDate : null,
        description: description.trim(),
        ownerName: ownerName.trim(),
        ownerPhone: normalizedPhone,
      };

      const propRes = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const propData = await propRes.json();
      if (!propRes.ok || !propData.success) {
        throw new Error(propData.error || 'Failed to submit property listing.');
      }

      setServerReferenceId(propData.referenceId || `SMG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setCreatedPropertyId(propData.propertyId || propData.property?.id || '');
      setSubmissionSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
      setShowOtpModal(true);
    } finally {
      setOtpLoading(false);
      setIsSubmitting(false);
    }
  };

  // STEP WIZARD METADATA
  const stepsMetadata = [
    { number: 1, name: 'Basic Details', icon: Building2 },
    { number: 2, name: 'Location', icon: MapPin },
    { number: 3, name: 'Property Profile', icon: Layers },
    { number: 4, name: 'Photos & Videos', icon: Camera },
    { number: 5, name: 'Pricing & Owner', icon: IndianRupee },
    { number: 6, name: 'Review & Submit', icon: ClipboardCheck },
  ];

  // ====================================================================
  // SUBMISSION SUCCESS VIEW (Preserved existing complete view)
  // ====================================================================
  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] py-12 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xs border border-slate-200 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mb-2 font-['Montserrat']">
            Property Listed Successfully
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
            Your property at <strong className="text-slate-800">{societyQuery}, {localityQuery}</strong> has been received by our Bengaluru property team.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 max-w-md mx-auto">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Listing Reference ID
            </div>
            <div className="text-2xl font-mono font-extrabold text-[#244B8F] tracking-wide">
              {serverReferenceId}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Please quote this reference ID whenever you contact our support desk.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onViewDashboard && (
              <button
                type="button"
                onClick={onViewDashboard}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Go to Seller Dashboard
              </button>
            )}
            {onViewCrm && (
              <button
                type="button"
                onClick={onViewCrm}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
              >
                View in CRM
              </button>
            )}
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ====================================================================
  // MAIN WIZARD VIEW
  // ====================================================================
  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] py-6 sm:py-8 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header / Context Navigation */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
          )}
          <h1 className="text-lg sm:text-xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
            Post Property
          </h1>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            Bengaluru Only
          </span>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
          <span>Step {currentStep} of 6</span>
          <span className="text-slate-300">•</span>
          <span className="font-bold text-[#244B8F]">{listingReadiness}% Ready</span>
        </div>
      </div>

      {/* Mobile Sticky Step Tracker */}
      <div className="lg:hidden max-w-6xl mx-auto mb-6 bg-white border border-slate-200 rounded-xl p-4 shadow-xs sticky top-2 z-20">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-[#244B8F] uppercase tracking-wider">
            STEP {currentStep} OF 6: {stepsMetadata[currentStep - 1].name}
          </span>
          <span className="text-slate-600">{listingReadiness}% Ready</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#244B8F] transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ============================================================ */}
        {/* LEFT COLUMN: Sidebar Navigation                              */}
        {/* ============================================================ */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            {/* Header */}
            <div className="mb-6">
              <span className="text-[11px] font-bold text-[#B68A4A] tracking-wider uppercase block">
                Verification Pipeline
              </span>
              <h2 className="text-xl font-bold text-[#172033] tracking-tight mt-0.5 font-['Montserrat']">
                Post Property
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Simple, verified property listing for Bengaluru homeowners.
              </p>
            </div>

            {/* Steps Navigation */}
            <nav className="space-y-2">
              {stepsMetadata.map((st) => {
                const isActive = currentStep === st.number;
                const isCompleted = currentStep > st.number;
                const Icon = st.icon;

                return (
                  <button
                    key={st.number}
                    type="button"
                    onClick={() => {
                      if (isCompleted || st.number < currentStep) {
                        setCurrentStep(st.number);
                      }
                    }}
                    disabled={st.number > currentStep && !isCompleted}
                    className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center space-x-3.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#1B396E] text-white shadow-xs'
                        : isCompleted
                        ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                        : 'bg-white hover:bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 font-bold" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[10px] font-bold tracking-wider uppercase ${
                          isActive ? 'text-blue-200' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        STEP {st.number}
                      </div>
                      <div
                        className={`text-sm font-semibold truncate ${
                          isActive ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {st.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Readiness Indicator */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-700">Listing Readiness</span>
                <span className="text-[#244B8F] text-sm font-bold">{listingReadiness}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#244B8F] rounded-full transition-all duration-300"
                  style={{ width: `${listingReadiness}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Calculated dynamically from real completed fields to ensure maximum buyer inquiry conversion.
              </p>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Step Content Panel                             */}
        {/* ============================================================ */}
        <main className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs">
            {/* Step Header */}
            <div className="mb-8">
              <span className="text-xs font-bold text-[#244B8F] tracking-wider uppercase block mb-1">
                STEP {currentStep} OF 6
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
                {currentStep === 1 && "Let's start with your property"}
                {currentStep === 2 && "Where is your property located?"}
                {currentStep === 3 && "Tell us about the unit"}
                {currentStep === 4 && "Add photos & video"}
                {currentStep === 5 && "Pricing & your details"}
                {currentStep === 6 && "Everything looks good?"}
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {currentStep === 1 && "Just a few simple details to get started. We'll guide you through the rest, one step at a time."}
                {currentStep === 2 && "Start typing your locality or society name to choose from verified Bengaluru projects."}
                {currentStep === 3 && "Share the layout, size, and floor specifications of your home."}
                {currentStep === 4 && "Genuine photos help prospective buyers and tenants picture themselves in your home."}
                {currentStep === 5 && "Set your commercial terms and provide the best phone number to contact you."}
                {currentStep === 6 && "Take a quick look at your details. You can still make changes before submitting your property."}
              </p>
            </div>

            {/* Error Notification Alert */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-sm"
              >
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 1: Basic Details                                    */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Intent Selection (Sell vs Rent) */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-3">
                    I want to
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setIntent('SELL')}
                      className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        intent === 'SELL'
                          ? 'border-[#244B8F] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-base text-[#172033]">
                        Sell (Resale)
                      </div>
                      <div className="text-xs text-slate-500 mt-1 leading-normal">
                        Full ownership transfer to verified buyers.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntent('RENT')}
                      className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        intent === 'RENT'
                          ? 'border-[#244B8F] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-base text-[#172033]">
                        Rent
                      </div>
                      <div className="text-xs text-slate-500 mt-1 leading-normal">
                        11-Month or standard residential tenancy.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Property Subtype (Flat, Villa, Penthouse, Duplex) */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-3">
                    Property type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {[
                      {
                        type: 'Flat / Apartment',
                        label: 'Flat / Apartment',
                        desc: 'Gated society or apartment complex',
                      },
                      {
                        type: 'Independent House / Villa',
                        label: 'Independent House / Villa',
                        desc: 'Standalone villa or gated community',
                      },
                      {
                        type: 'Penthouse',
                        label: 'Penthouse',
                        desc: 'Top-floor luxury unit with private terrace',
                      },
                      {
                        type: 'Duplex',
                        label: 'Duplex',
                        desc: 'Two-floor connected residential unit',
                      },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSubType(item.type as PropertySubtype)}
                        className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          subType === item.type
                            ? 'border-[#244B8F] bg-blue-50/30 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-sm font-bold text-[#172033]">
                          {item.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 leading-normal">
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 2: Location (Searchable Autocomplete)                */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* City Indicator */}
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 w-fit">
                  <MapPin className="w-3.5 h-3.5 text-[#244B8F]" />
                  <span>Bengaluru, Karnataka</span>
                  <span className="text-slate-400">• Primary service zone</span>
                </div>

                {/* Locality Searchable Autocomplete */}
                <div ref={localityWrapperRef} className="relative">
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                    Locality in Bengaluru <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type your locality (e.g. Whitefield, HSR Layout, Sarjapur Road)"
                      value={localityQuery}
                      onChange={(e) => {
                        setLocalityQuery(e.target.value);
                        setIsLocalityOpen(true);
                        setHighlightedLocalityIdx(0);
                      }}
                      onFocus={() => setIsLocalityOpen(true)}
                      onKeyDown={(e) => {
                        if (!isLocalityOpen) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedLocalityIdx(prev => (prev + 1) % Math.max(1, filteredLocalities.length));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedLocalityIdx(prev => (prev - 1 + filteredLocalities.length) % Math.max(1, filteredLocalities.length));
                        } else if (e.key === 'Enter') {
                          if (filteredLocalities[highlightedLocalityIdx]) {
                            e.preventDefault();
                            setLocalityQuery(filteredLocalities[highlightedLocalityIdx].name);
                            setIsLocalityOpen(false);
                          }
                        }
                      }}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                    />
                    {localityQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalityQuery('');
                          setIsLocalityOpen(true);
                        }}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Locality Autocomplete Dropdown */}
                  {isLocalityOpen && filteredLocalities.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-56 overflow-y-auto">
                      {filteredLocalities.map((item, idx) => (
                        <div
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setLocalityQuery(item.name);
                            setIsLocalityOpen(false);
                          }}
                          className={`p-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                            idx === highlightedLocalityIdx ? 'bg-blue-50 text-[#244B8F] font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{item.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">{item.zone} Bengaluru</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Type naturally. If your exact layout is not listed, enter it directly.
                  </p>
                </div>

                {/* Society / Apartment Name Searchable Autocomplete */}
                <div ref={societyWrapperRef} className="relative">
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                    Apartment or Society Name <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Start typing complex name (e.g. Prestige Shantiniketan, Sobha Dream Acres)"
                      value={societyQuery}
                      onChange={(e) => {
                        setSocietyQuery(e.target.value);
                        setIsSocietyOpen(true);
                        setHighlightedSocietyIdx(0);
                      }}
                      onFocus={() => setIsSocietyOpen(true)}
                      onKeyDown={(e) => {
                        if (!isSocietyOpen) return;
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setHighlightedSocietyIdx(prev => (prev + 1) % Math.max(1, filteredSocieties.length));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setHighlightedSocietyIdx(prev => (prev - 1 + filteredSocieties.length) % Math.max(1, filteredSocieties.length));
                        } else if (e.key === 'Enter') {
                          if (filteredSocieties[highlightedSocietyIdx]) {
                            e.preventDefault();
                            setSocietyQuery(filteredSocieties[highlightedSocietyIdx].name);
                            setIsSocietyOpen(false);
                          }
                        }
                      }}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                    />
                    {societyQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSocietyQuery('');
                          setIsSocietyOpen(true);
                        }}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Society Autocomplete Dropdown */}
                  {isSocietyOpen && filteredSocieties.length > 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-white rounded-xl shadow-lg border border-slate-200 max-h-56 overflow-y-auto">
                      {filteredSocieties.map((item, idx) => (
                        <div
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSocietyQuery(item.name);
                            setIsSocietyOpen(false);
                          }}
                          className={`p-3 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                            idx === highlightedSocietyIdx ? 'bg-blue-50 text-[#244B8F] font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-slate-400 text-xs ml-2">({item.builder})</span>
                          </div>
                          <span className="text-[11px] text-slate-400">{item.locality}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    If your society is not suggested, simply type the full name.
                  </p>
                </div>

                {/* Wing & Flat Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Wing or Tower <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tower 4, Wing B"
                      value={wingTower}
                      onChange={(e) => setWingTower(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Unit or Flat Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 1102"
                      value={houseNo}
                      onChange={(e) => setHouseNo(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                    />
                  </div>
                </div>

                {/* Calm, Reassuring Privacy Notice */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3 leading-relaxed">
                  <Lock className="w-4 h-4 text-[#244B8F] shrink-0 mt-0.5" />
                  <div>
                    Your property details help us understand the home you're listing. Private information, including your flat number and verification documents, is kept confidential and isn't displayed on your public listing.
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 3: Unit Specifications                              */}
            {/* ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-7">
                {/* BHK Selection */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-3">
                    BHK Configuration <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                    {['1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK+'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBhkType(b)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                          bhkType === b
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bathrooms & Balconies */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Bathrooms <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBathrooms(b)}
                          className={`py-2.5 rounded-lg text-xs font-bold text-center cursor-pointer ${
                            bathrooms === b
                              ? 'bg-[#244B8F] text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {b === 5 ? '5+' : b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Balconies <span className="text-red-600">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[0, 1, 2, 3, 4].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setBalconies(b)}
                          className={`py-2.5 rounded-lg text-xs font-bold text-center cursor-pointer ${
                            balconies === b
                              ? 'bg-[#244B8F] text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {b === 4 ? '4+' : b}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Super Built-Up & Carpet Area (No Native Spinner Arrows) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Super Built-up Area (sq. ft.) <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="200"
                        max="20000"
                        placeholder="e.g. 1550"
                        value={superBuiltUpSqft}
                        onChange={(e) => setSuperBuiltUpSqft(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full p-3.5 pr-14 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
                        sq. ft.
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Carpet Area (sq. ft.)
                      </label>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Estimated ~78%
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="150"
                        max="18000"
                        placeholder="e.g. 1209"
                        value={carpetAreaSqft}
                        onChange={(e) => {
                          setIsCarpetCustomized(true);
                          setCarpetAreaSqft(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                        }}
                        className="w-full p-3.5 pr-14 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-semibold pointer-events-none">
                        sq. ft.
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Calculated as an estimate. You can adjust this value if you have exact architectural figures.
                    </p>
                  </div>
                </div>

                {/* Floor Numbers with Clear Explanation */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                        Unit Floor <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        placeholder="e.g. 5"
                        value={unitFloor}
                        onChange={(e) => setUnitFloor(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                        Total Floors in Building <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        placeholder="e.g. 14"
                        value={totalFloors}
                        onChange={(e) => setTotalFloors(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Helps buyers understand the property's position within the building.
                  </p>
                </div>

                {/* Facing Direction */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2.5">
                    Facing Direction
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      'East',
                      'North',
                      'North-East',
                      'South',
                      'West',
                      'North-West',
                      'South-East',
                      'South-West',
                    ].map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setFacing(dir)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors ${
                          facing === dir
                            ? 'bg-[#244B8F] text-white shadow-xs font-bold'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furnishing & Property Age (with Under Construction) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Furnishing Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFurnishing(f)}
                          className={`py-2.5 px-1.5 rounded-lg text-xs font-bold text-center cursor-pointer ${
                            furnishing === f
                              ? 'bg-[#244B8F] text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Property Age
                    </label>
                    <select
                      value={propertyAge}
                      onChange={(e) => setPropertyAge(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    >
                      <option value="Under Construction">Under Construction</option>
                      <option value="Under 1 year">Under 1 year (Ready to move)</option>
                      <option value="1 to 5 years">1 to 5 years</option>
                      <option value="5 to 10 years">5 to 10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                </div>

                {/* Covered Parking: Conditional Yes / No */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-[#172033]">Covered Car Parking</div>
                      <div className="text-xs text-slate-500">Dedicated basement or stilt parking space</div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setHasCoveredParking(true);
                          if (parkingCount === 0) setParkingCount(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          hasCoveredParking
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHasCoveredParking(false);
                          setParkingCount(0);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                          !hasCoveredParking
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Conditional Slots Field */}
                  {hasCoveredParking && (
                    <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">Allocated parking slots:</span>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setParkingCount(num)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                              parkingCount === num
                                ? 'bg-[#172033] text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {num === 3 ? '3+ slots' : `${num} slot${num > 1 ? 's' : ''}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: Photos and Video Walkthrough                     */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Upload Zone */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Property Photos ({photos.length} / 10 Uploaded)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddSamplePhotos}
                      className="text-xs font-semibold text-[#244B8F] hover:text-[#1B396E] bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer inline-flex items-center space-x-1"
                      title="Load genuine local sample photos for development testing"
                    >
                      <span>+ Add High-Res Sample Photos</span>
                    </button>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                        processFiles(Array.from(e.dataTransfer.files));
                      }
                    }}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-[#244B8F] bg-blue-50/50 scale-[1.01]'
                        : 'border-slate-300 hover:border-[#244B8F] bg-slate-50/60 hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-12 h-12 bg-white rounded-xl shadow-xs text-[#244B8F] flex items-center justify-center mx-auto mb-3 border border-slate-200">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      Click to browse or drag and drop photos
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      JPG, PNG, or WEBP up to 8 MB per file.
                    </p>
                  </div>

                  {uploadError && (
                    <div className="mt-2 text-xs font-bold text-red-600 flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="mt-3 text-xs text-slate-600 flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#244B8F]" />
                      <span>Validating and uploading images...</span>
                    </div>
                  )}
                </div>

                {/* Uploaded Thumbnails Grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {photos.map((p, idx) => (
                      <div
                        key={p.id}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3"
                      >
                        <img
                          src={p.url}
                          alt={`Property Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 bg-[#172033]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePhoto(p.id);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-[10px] truncate">
                          {p.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Non-blocking Visual Quality Nudge Card: SHOWN WHEN PHOTOS < 3 */}
                {photos.length === 0 ? (
                  <div className="border border-amber-300 bg-amber-50/70 rounded-xl p-5 text-amber-900 space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <h4 className="text-sm font-bold text-amber-900">
                        Help buyers picture themselves here
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Photos make it easier for buyers and prospective tenants to understand your home's layout, light and space before arranging a visit. Adding a few clear pictures can help your listing make a stronger first impression.
                    </p>
                    <div className="pt-1 flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-[#244B8F] hover:underline cursor-pointer inline-flex items-center space-x-1"
                      >
                        <span>Add property photos →</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAddSamplePhotos}
                        className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
                      >
                        <span>Load sample photos</span>
                      </button>
                    </div>
                  </div>
                ) : photos.length < 3 ? (
                  <div className="border border-amber-300 bg-amber-50/70 rounded-xl p-4 text-amber-900 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <h4 className="text-xs font-bold text-amber-900">
                        Add at least 3 photos for maximum response ({photos.length} uploaded so far)
                      </h4>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Listings with 3 or more photos get up to 4x higher buyer engagement. We recommend uploading photos of the living room, master bedroom, and balcony or kitchen.
                    </p>
                  </div>
                ) : null}

                {/* Video Walkthrough Share Link */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                      Video walkthrough (optional)
                    </label>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600">YouTube</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">Google Drive</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-600">Dropbox</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    Already have a property video? Paste its share link here.
                  </p>
                  <input
                    type="url"
                    placeholder="e.g. https://www.youtube.com/watch?v=... or Google Drive link"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    For Google Drive and Dropbox links, ensure link sharing permissions are set to "Anyone with the link can view".
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 5: Pricing and Owner Details                        */}
            {/* ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-7">
                {/* Intent: SELL Form */}
                {intent === 'SELL' && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                          Expected selling price <span className="text-red-600">*</span>
                        </label>
                        {expectedPrice && (
                          <span className="text-xs font-extrabold text-[#244B8F] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                            {formatINRWords(expectedPrice)}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 1,65,00,000"
                          value={expectedPrice ? parseInt(expectedPrice.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                          onChange={(e) => setExpectedPrice(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                          Price Negotiability
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIsNegotiable(true)}
                            className={`py-3 px-2 rounded-lg text-xs font-bold text-center cursor-pointer ${
                              isNegotiable
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            Flexible to Serious Buyers
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsNegotiable(false)}
                            className={`py-3 px-2 rounded-lg text-xs font-bold text-center cursor-pointer ${
                              !isNegotiable
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            Fixed Price
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                          Token / Booking Advance (INR)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 2,00,000"
                            value={bookingAmount ? parseInt(bookingAmount.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                            onChange={(e) => setBookingAmount(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                        Monthly Society Maintenance (INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">₹</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="e.g. 4,500"
                          value={maintenanceCharges ? parseInt(maintenanceCharges.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                          onChange={(e) => setMaintenanceCharges(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Intent: RENT Form */}
                {intent === 'RENT' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                            Expected monthly rent <span className="text-red-600">*</span>
                          </label>
                          {monthlyRent && (
                            <span className="text-xs font-extrabold text-[#244B8F]">
                              {formatINR(monthlyRent)} / mo
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 45,000"
                            value={monthlyRent ? parseInt(monthlyRent.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                            onChange={(e) => setMonthlyRent(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-300 text-base font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                            Security Deposit (INR) <span className="text-red-600">*</span>
                          </label>
                          {securityDeposit && (
                            <span className="text-xs font-extrabold text-[#244B8F]">
                              {formatINRWords(securityDeposit)}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 2,50,000"
                            value={securityDeposit ? parseInt(securityDeposit.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                            onChange={(e) => setSecurityDeposit(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                          Preferred Tenant
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {['Family', 'Bachelors', 'Corporate IT', 'Any'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setPreferredTenant(t)}
                              className={`py-2.5 px-1 rounded-lg text-xs font-bold text-center cursor-pointer ${
                                preferredTenant === t
                                  ? 'bg-[#244B8F] text-white shadow-xs'
                                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                          Rental Duration
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setRentalDuration('11-Month (Standard)')}
                            className={`py-2.5 px-2 rounded-lg text-xs font-bold text-center cursor-pointer ${
                              rentalDuration === '11-Month (Standard)'
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            11-Month (Standard)
                          </button>
                          <button
                            type="button"
                            onClick={() => setRentalDuration('Custom Duration')}
                            className={`py-2.5 px-2 rounded-lg text-xs font-bold text-center cursor-pointer ${
                              rentalDuration === 'Custom Duration'
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            Custom Duration
                          </button>
                        </div>
                        {rentalDuration === 'Custom Duration' && (
                          <div className="mt-2 flex items-center space-x-2">
                            <input
                              type="number"
                              min="3"
                              max="60"
                              value={customDurationMonths}
                              onChange={(e) => setCustomDurationMonths(parseInt(e.target.value, 10) || 12)}
                              className="w-24 p-2 rounded-lg border border-slate-300 text-xs font-bold"
                            />
                            <span className="text-xs text-slate-500 font-semibold">Months</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                          Move-in Availability
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMoveInAvailability('Immediate')}
                            className={`py-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                              moveInAvailability === 'Immediate'
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            Immediate
                          </button>
                          <button
                            type="button"
                            onClick={() => setMoveInAvailability('Specific Date')}
                            className={`py-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                              moveInAvailability === 'Specific Date'
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-slate-50 border border-slate-200 text-slate-700'
                            }`}
                          >
                            Specific Date
                          </button>
                        </div>
                        {moveInAvailability === 'Specific Date' && (
                          <input
                            type="date"
                            value={moveInDate}
                            onChange={(e) => setMoveInDate(e.target.value)}
                            className="mt-2 w-full p-2.5 rounded-lg border border-slate-300 text-xs font-semibold"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                          Monthly Maintenance (INR)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-400">₹</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="e.g. 4,500"
                            value={maintenanceCharges ? parseInt(maintenanceCharges.replace(/\D/g, ''), 10).toLocaleString('en-IN') : ''}
                            onChange={(e) => setMaintenanceCharges(e.target.value.replace(/\D/g, ''))}
                            className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Owner Details Section */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h3 className="text-sm font-bold text-[#172033]">
                    Your Contact Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                        Your full name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Kumar"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                        Mobile number <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-sm font-bold text-slate-500">
                          +91
                        </span>
                        <input
                          type="tel"
                          inputMode="tel"
                          maxLength={10}
                          placeholder="e.g. 9845012345"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white tracking-wider"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center space-x-1.5">
                        <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>We'll use your number to contact you about your property. Your phone number isn't shown on your public listing.</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                      Property Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Highlights of your home, natural sunlight, interior work, views, or nearby conveniences..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 6: Review, Declarations and Submit                  */}
            {/* ======================================================== */}
            {currentStep === 6 && (
              <div className="space-y-8">
                {/* Review Summary Organized by Section */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Listing Summary
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#244B8F] text-white">
                      {intent === 'SELL' ? 'FOR SALE (RESALE)' : 'FOR RENT'}
                    </span>
                  </div>

                  {/* Section 1: Property Details */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Property Details</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {subType}
                      </strong>
                      <span className="text-slate-500">Residential Unit in Bengaluru</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Section 2: Location */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Location</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {societyQuery || 'Society'}
                      </strong>
                      <span className="text-slate-500">{localityQuery}, Bengaluru</span>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Unit: {houseNo || 'Declared'} {wingTower ? `(${wingTower})` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Section 3: Configuration & Area */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Configuration & Area</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {bhkType} • {bathrooms} Baths • {balconies} Balconies
                      </strong>
                      <span className="text-slate-500">
                        {superBuiltUpSqft} sq.ft. SBUA (~{carpetAreaSqft} sq.ft. carpet) • Floor {unitFloor} of {totalFloors}
                      </span>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Facing {facing} • {furnishing} • Age: {propertyAge} • {hasCoveredParking ? `${parkingCount} Covered Parking Slot(s)` : 'No Parking'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Section 4: Photos & Video */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Photos & Visuals</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'} Uploaded
                      </strong>
                      <span className="text-slate-500">
                        {videoUrl ? 'Video walkthrough link included' : 'No video walkthrough provided'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Section 5: Commercial Terms & Owner */}
                  <div className="flex items-start justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Pricing & Contact</span>
                      <strong className="text-[#244B8F] text-base font-extrabold block mt-0.5">
                        {intent === 'SELL' 
                          ? (expectedPrice ? formatINRWords(expectedPrice) : 'Price declared') 
                          : `${monthlyRent ? formatINR(monthlyRent) : 'Rent declared'} / month`}
                      </strong>
                      <span className="text-slate-600 block mt-0.5">
                        Owner: {ownerName || 'Owner'} (+91 {ownerPhone})
                      </span>
                      {intent === 'SELL' && maintenanceCharges && (
                        <div className="text-slate-400 text-[11px]">
                          Maintenance: ₹{parseInt(maintenanceCharges, 10).toLocaleString('en-IN')}/mo • {isNegotiable ? 'Flexible to Serious Buyers' : 'Fixed Price'}
                        </div>
                      )}
                      {intent === 'RENT' && (
                        <div className="text-slate-400 text-[11px]">
                          Deposit: {formatINRWords(securityDeposit)} • Preferred: {preferredTenant} • Duration: {rentalDuration}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(5)}
                      className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Property Ownership & Verification Declaration */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#172033] font-['Montserrat']">
                      Property ownership and verification
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      To help us maintain accurate listings, please confirm that you own this property or are legally authorised to list it. Our team may request supporting documents to verify the details before the listing is approved.
                    </p>
                  </div>

                  <label className="flex items-start space-x-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={lawfulDeclaration}
                      onChange={(e) => setLawfulDeclaration(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-[#244B8F] focus:ring-[#244B8F] cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      {intent === 'SELL' ? (
                        <>
                          I confirm that I am the <strong>lawful registered owner</strong> (or authorized Power of Attorney holder) with legal authority to list and sell this residential property.
                        </>
                      ) : (
                        <>
                          I confirm that I am the <strong>lawful owner</strong> (or authorized representative) with legal authority to lease out this residential property.
                        </>
                      )}
                    </span>
                  </label>

                  {/* Proposed Document Checklist */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 mt-3">
                    <div className="font-semibold text-slate-700">
                      Documents that may be requested during onboarding verification:
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                      {intent === 'SELL' ? (
                        <>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Title Deed</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Mother Deed</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Khata Certificate</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Encumbrance Certificate</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>BBMP Property Tax Receipt</span>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Possession Letter</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Society NOC (where applicable)</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Latest BESCOM Bill</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>Rental Agreement draft</span>
                          </li>
                          <li className="flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#244B8F]"></span>
                            <span>BBMP Property Tax Receipt</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Contact and Marketing Consent Checkbox (Exact Wording Requested) */}
                <div className="space-y-3 pt-1">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contactConsent}
                      onChange={(e) => setContactConsent(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#244B8F] focus:ring-[#244B8F] cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      I agree to be contacted by Sell My Ghar via WhatsApp, SMS, RCS, Email, or Call regarding my enquiry and related services, and I agree to the{' '}
                      <a
                        href="#/consent"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#244B8F] font-bold underline hover:text-[#1B396E]"
                      >
                        Terms & Conditions
                      </a>{' '}
                      and{' '}
                      <a
                        href="#/consent"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#244B8F] font-bold underline hover:text-[#1B396E]"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Step {currentStep - 1}</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-6 py-3 rounded-xl bg-[#1B396E] hover:bg-[#244B8F] text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Continue to Step {currentStep + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleInitiateOtp}
                  disabled={otpLoading || isSubmitting}
                  className="px-7 py-3.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {otpLoading || isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Submit Property</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* 6-DIGIT OTP VERIFICATION MODAL                               */}
      {/* ============================================================ */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#244B8F] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172033]">
                  Verify Mobile Number
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-5 text-center space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                We've sent a 6-digit code to{' '}
                <strong className="text-slate-900">+91 {ownerPhone}</strong>.
              </p>

              {/* Dev mode code preview badge */}
              {devOtpHint && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-[#244B8F] font-mono font-bold">
                  [DEV TEST HOOK] Verification Code: {devOtpHint}
                </div>
              )}

              {/* 6-digit input boxes */}
              <div className="flex justify-center items-center space-x-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-box-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const newDigits = [...otpDigits];
                      newDigits[i] = val;
                      setOtpDigits(newDigits);
                      if (val && i < 5) {
                        const next = document.getElementById(`otp-box-${i + 1}`);
                        next?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[i] && i > 0) {
                        const prev = document.getElementById(`otp-box-${i - 1}`);
                        prev?.focus();
                      }
                    }}
                    className="w-11 h-13 text-center text-xl font-bold font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white shadow-xs"
                  />
                ))}
              </div>

              {otpError && (
                <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                  {otpError}
                </div>
              )}

              {/* Resend Cooldown */}
              <div className="text-xs text-slate-500">
                {otpCooldown > 0 ? (
                  <span>Resend code in {otpCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiateOtp}
                    className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyOtpAndSubmit}
                disabled={otpLoading || otpDigits.join('').length !== 6}
                className="px-5 py-2.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {otpLoading ? 'Verifying...' : 'Verify & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
