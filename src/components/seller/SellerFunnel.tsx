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
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash2
} from 'lucide-react';
import { BENGALURU_LOCALITIES, BENGALURU_SOCIETIES, LocalityItem, SocietyItem, searchLocalities, searchSocieties } from '../../data/bengaluruData';
import { trackFunnelStep, trackFunnelCompleted } from '../../utils/analytics';
import { getBrowserSupabase } from '../../lib/supabase';

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
  // Property Status & Possession Details (Decoupled from Property Age)
  const [propertyStatus, setPropertyStatus] = useState<'Ready to Move' | 'Under Construction'>('Ready to Move');
  const [possessionMonth, setPossessionMonth] = useState<string>('December');
  const [possessionYear, setPossessionYear] = useState<string>('2026');
  const [propertyAge, setPropertyAge] = useState<string>('1 to 5 years');
  const [expectedPossessionDate, setExpectedPossessionDate] = useState<string>('');
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
  const [ownerEmail, setOwnerEmail] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [authSession, setAuthSession] = useState<{
    authenticated: boolean;
    user?: { id: string; name?: string; email?: string; phone?: string; roles?: string[] };
  } | null>(null);

  // Auto-fill active session user credentials if available
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
      .catch(() => {
        setAuthSession({ authenticated: false });
      });
  }, []);

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

  // Draft Persistence State
  const DRAFT_STORAGE_KEY = 'sellmyghar_seller_draft_v1';
  const [hasExistingDraft, setHasExistingDraft] = useState<{ savedAt: string; step: number; summary: string } | null>(null);
  const [draftSavedStatus, setDraftSavedStatus] = useState<string | null>(null);

  // Check for saved draft on initial mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data && (parsed.data.societyQuery || parsed.data.localityQuery || parsed.data.expectedPrice || parsed.data.monthlyRent || parsed.data.ownerPhone)) {
          const loc = parsed.data.societyQuery || parsed.data.localityQuery || 'Apartment';
          const savedDate = new Date(parsed.savedAt);
          const timeStr = !isNaN(savedDate.getTime())
            ? savedDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'earlier';
          setHasExistingDraft({
            savedAt: timeStr,
            step: parsed.currentStep || 1,
            summary: `${loc} (Step ${parsed.currentStep || 1})`
          });
        }
      }
    } catch {}
  }, []);

  // Resume draft handler
  const resumeDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.data) {
        const d = parsed.data;
        if (d.intent) setIntent(d.intent);
        if (d.subType) setSubType(d.subType);
        if (d.localityQuery !== undefined) setLocalityQuery(d.localityQuery);
        if (d.societyQuery !== undefined) setSocietyQuery(d.societyQuery);
        if (d.wingTower !== undefined) setWingTower(d.wingTower);
        if (d.houseNo !== undefined) setHouseNo(d.houseNo);
        if (d.bhkType) setBhkType(d.bhkType);
        if (d.bathrooms !== undefined) setBathrooms(d.bathrooms);
        if (d.balconies !== undefined) setBalconies(d.balconies);
        if (d.superBuiltUpSqft !== undefined) setSuperBuiltUpSqft(d.superBuiltUpSqft);
        if (d.carpetAreaSqft !== undefined) setCarpetAreaSqft(d.carpetAreaSqft);
        if (d.unitFloor !== undefined) setUnitFloor(d.unitFloor);
        if (d.totalFloors !== undefined) setTotalFloors(d.totalFloors);
        if (d.facing) setFacing(d.facing);
        if (d.furnishing) setFurnishing(d.furnishing);
        if (d.propertyStatus) setPropertyStatus(d.propertyStatus);
        if (d.possessionMonth) setPossessionMonth(d.possessionMonth);
        if (d.possessionYear) setPossessionYear(d.possessionYear);
        if (d.propertyAge) setPropertyAge(d.propertyAge);
        if (d.expectedPossessionDate !== undefined) setExpectedPossessionDate(d.expectedPossessionDate);
        if (d.hasCoveredParking !== undefined) setHasCoveredParking(d.hasCoveredParking);
        if (d.parkingCount !== undefined) setParkingCount(d.parkingCount);
        if (d.videoUrl !== undefined) setVideoUrl(d.videoUrl);
        if (d.expectedPrice !== undefined) setExpectedPrice(d.expectedPrice);
        if (d.isNegotiable !== undefined) setIsNegotiable(d.isNegotiable);
        if (d.bookingAmount !== undefined) setBookingAmount(d.bookingAmount);
        if (d.monthlyRent !== undefined) setMonthlyRent(d.monthlyRent);
        if (d.securityDeposit !== undefined) setSecurityDeposit(d.securityDeposit);
        if (d.preferredTenant) setPreferredTenant(d.preferredTenant);
        if (d.rentalDuration) setRentalDuration(d.rentalDuration);
        if (d.customDurationMonths !== undefined) setCustomDurationMonths(d.customDurationMonths);
        if (d.moveInAvailability) setMoveInAvailability(d.moveInAvailability);
        if (d.moveInDate !== undefined) setMoveInDate(d.moveInDate);
        if (d.maintenanceCharges !== undefined) setMaintenanceCharges(d.maintenanceCharges);
        if (d.ownerName && !ownerName) setOwnerName(d.ownerName);
        if (d.ownerPhone && !ownerPhone) setOwnerPhone(d.ownerPhone);
        if (d.ownerEmail && !ownerEmail) setOwnerEmail(d.ownerEmail);
        if (d.description !== undefined) setDescription(d.description);
      }
      if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 6) {
        setCurrentStep(parsed.currentStep);
      }
      setHasExistingDraft(null);
      setDraftSavedStatus('Draft restored from your last session');
    } catch (e) {
      console.warn('Failed to resume draft:', e);
    }
  };

  // Discard draft handler
  const discardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setHasExistingDraft(null);
    setDraftSavedStatus(null);
  };

  // Auto-save draft debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (submissionSuccess) return;
      if (!localityQuery && !societyQuery && !ownerPhone && !expectedPrice && !monthlyRent) return;

      try {
        const draft = {
          version: 1,
          savedAt: new Date().toISOString(),
          currentStep,
          data: {
            intent,
            subType,
            localityQuery,
            societyQuery,
            wingTower,
            houseNo,
            bhkType,
            bathrooms,
            balconies,
            superBuiltUpSqft,
            carpetAreaSqft,
            unitFloor,
            totalFloors,
            facing,
            furnishing,
            propertyStatus,
            possessionMonth,
            possessionYear,
            propertyAge,
            expectedPossessionDate,
            hasCoveredParking,
            parkingCount,
            videoUrl,
            expectedPrice,
            isNegotiable,
            bookingAmount,
            monthlyRent,
            securityDeposit,
            preferredTenant,
            rentalDuration,
            customDurationMonths,
            moveInAvailability,
            moveInDate,
            maintenanceCharges,
            ownerName,
            ownerPhone,
            ownerEmail,
            description,
          }
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setDraftSavedStatus('Draft saved just now');
      } catch (err) {
        console.warn('Auto-save error:', err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [
    submissionSuccess, currentStep, intent, subType, localityQuery, societyQuery,
    wingTower, houseNo, bhkType, bathrooms, balconies, superBuiltUpSqft,
    carpetAreaSqft, unitFloor, totalFloors, facing, furnishing, propertyStatus,
    possessionMonth, possessionYear, propertyAge, expectedPossessionDate,
    hasCoveredParking, parkingCount, videoUrl, expectedPrice, isNegotiable,
    bookingAmount, monthlyRent, securityDeposit, preferredTenant, rentalDuration,
    customDurationMonths, moveInAvailability, moveInDate, maintenanceCharges,
    ownerName, ownerPhone, ownerEmail, description
  ]);

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

  // Filtered Locality Suggestions (Ranked: Prefix match first, then word boundary, sub-locality, substring)
  const filteredLocalities = useMemo(() => {
    return searchLocalities(localityQuery).slice(0, 8);
  }, [localityQuery]);

  // Filtered Society Suggestions (Ranked: Name prefix, builder prefix, word boundary, substring)
  const filteredSocieties = useMemo(() => {
    return searchSocieties(societyQuery, localityQuery).slice(0, 10);
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
      if (propertyStatus === 'Under Construction' && !expectedPossessionDate.trim()) {
        setErrorMessage('Please select the expected possession date for under-construction property.');
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
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
      return true;
    }

    if (stepNumber === 6) {
      if (!ownerName.trim() || ownerName.trim().length < 2) {
        setErrorMessage('Please enter your full name for listing verification.');
        return false;
      }
      const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setErrorMessage('Please enter a valid 10-digit mobile number for OTP verification.');
        return false;
      }
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
      if (!lawfulDeclaration) {
        setErrorMessage('Please confirm that you are the lawful owner or authorized representative.');
        return false;
      }
      if (!contactConsent) {
        setErrorMessage('Please agree to communication and privacy consent.');
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

  const handleMovePhoto = (index: number, direction: 'LEFT' | 'RIGHT') => {
    setPhotos(prev => {
      const targetIndex = direction === 'LEFT' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
  };

  const handleSetFeatured = (id: string) => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      isFeatured: p.id === id,
    })));
  };

  // Google Sign-In for unauthenticated users (preserves drafted property specifications)
  const handleGoogleSignIn = async () => {
    try {
      const supabase = await getBrowserSupabase();
      if (!supabase) {
        window.location.hash = '/login';
        return;
      }
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in could not be initialized.');
    }
  };

  // Submit Property directly for authenticated Google / Session users
  const handleSubmitPropertyDirectly = async () => {
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

    if (!contactConsent) {
      setErrorMessage('Please agree to communication and privacy consent.');
      return;
    }

    if (!ownerName.trim() || ownerName.trim().length < 2) {
      setErrorMessage('Please enter your full name for listing verification.');
      return;
    }

    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian callback number.');
      return;
    }

    setIsSubmitting(true);
    const normalizedPhone = `+91${cleanPhone}`;

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
      expectedPossessionDate: propertyAge === 'Under Construction' ? (expectedPossessionDate.trim() || null) : null,
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
      ownerEmail: ownerEmail.trim() || undefined,
    };

    try {
      const propRes = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const propData = await propRes.json();
      if (!propRes.ok || !propData.success) {
        throw new Error(propData.error || 'Failed to submit property listing.');
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.setItem('sellmyghar_last_owner_phone', normalizedPhone);
        if (ownerEmail && ownerEmail.trim()) {
          localStorage.setItem('sellmyghar_last_owner_email', ownerEmail.trim().toLowerCase());
        }
      } catch {}

      setServerReferenceId(propData.referenceId || `SMG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setCreatedPropertyId(propData.propertyId || propData.property?.id || '');
      setSubmissionSuccess(true);
      trackFunnelCompleted('SELLER_WIZARD', {
        bhkType,
        locality: localityQuery,
        totalImages: photos.length,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 6: OTP & Final Submission Flow
  const handleInitiateOtp = async () => {
    setErrorMessage(null);

    if (authSession?.authenticated) {
      await handleSubmitPropertyDirectly();
      return;
    }

    setErrorMessage('Google sign-in is required to submit a property. Mobile SMS OTP is temporarily unavailable pending carrier registration.');
    await handleGoogleSignIn();
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
        credentials: 'include',
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
        expectedPossessionDate: propertyAge === 'Under Construction' ? (expectedPossessionDate.trim() || null) : null,
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
        ownerEmail: ownerEmail.trim() || undefined,
      };

      const propRes = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const propData = await propRes.json();
      if (!propRes.ok || !propData.success) {
        throw new Error(propData.error || 'Failed to submit property listing.');
      }

      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.setItem('sellmyghar_last_owner_phone', normalizedPhone);
        if (ownerEmail && ownerEmail.trim()) {
          localStorage.setItem('sellmyghar_last_owner_email', ownerEmail.trim().toLowerCase());
        }
      } catch {}

      setServerReferenceId(propData.referenceId || `SMG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setCreatedPropertyId(propData.propertyId || propData.property?.id || '');
      setSubmissionSuccess(true);
      trackFunnelCompleted('SELLER_WIZARD', {
        bhkType,
        locality: localityQuery,
        totalImages: photos.length,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
      setShowOtpModal(true);
    } finally {
      setOtpLoading(false);
      setIsSubmitting(false);
    }
  };

  // STEP WIZARD METADATA (Reordered strictly per Section 3 specifications)
  const stepsMetadata = [
    { number: 1, name: 'Type & Intent', icon: Building2 },
    { number: 2, name: 'Location & Society', icon: MapPin },
    { number: 3, name: 'Configuration & Status', icon: Layers },
    { number: 4, name: 'Area & Unit Details', icon: Layers },
    { number: 5, name: 'Commercial Terms', icon: IndianRupee },
    { number: 6, name: 'Contact & Verification', icon: Camera },
  ];

  // Telemetry: Track Step Progression
  useEffect(() => {
    const stepObj = stepsMetadata.find((s) => s.number === currentStep);
    trackFunnelStep('SELLER_WIZARD', currentStep, stepObj ? stepObj.name : `Step ${currentStep}`);
  }, [currentStep]);

  // ====================================================================
  // SUBMISSION SUCCESS VIEW (Premium Pre-Production Confirmation)
  // ====================================================================
  if (submissionSuccess) {
    const cleanPhone = ownerPhone.replace(/\D/g, '').slice(-10);
    const formattedPrice = intent === 'SELL' ? formatINRWords(expectedPrice) : `${formatINR(monthlyRent)}/mo`;

    return (
      <div className="min-h-screen bg-[#F4F6F9] py-12 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xs border border-slate-200 p-8 sm:p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            Listing Status: Under Diligence Review
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mb-2 font-['Montserrat']">
            Property Listed Successfully
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg mx-auto">
            Your listing details have been saved and assigned to our Bengaluru title and seller advisory team.
          </p>

          {/* Reference ID Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 max-w-md mx-auto text-center">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Property Reference ID
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-[#244B8F] tracking-wide">
              {serverReferenceId}
            </div>
            <div className="text-[11px] text-slate-500 mt-2">
              Please quote this reference ID for any queries regarding your property listing.
            </div>
          </div>

          {/* Concise Property Summary Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 text-left max-w-md mx-auto">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Submitted Property Details
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Property:</span>
                <span className="font-bold text-slate-900">{bhkType} {subType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Society:</span>
                <span className="font-semibold text-slate-900">{societyQuery}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Locality:</span>
                <span className="font-medium text-slate-800">{localityQuery}, Bengaluru</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Super Built-up Area:</span>
                <span className="font-medium text-slate-800">{superBuiltUpSqft} sq. ft.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Floor & Facing:</span>
                <span className="font-medium text-slate-800">Floor {unitFloor} of {totalFloors} • {facing} Facing</span>
              </div>
              {propertyAge === 'Under Construction' && expectedPossessionDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Possession:</span>
                  <span className="font-semibold text-[#244B8F]">{expectedPossessionDate}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-100">
                <span className="text-slate-500">{intent === 'SELL' ? 'Expected Price:' : 'Expected Rent:'}</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formattedPrice}</span>
              </div>
            </div>
          </div>

          {/* Transparent Next Steps */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-5 mb-8 text-left max-w-md mx-auto">
            <div className="text-xs font-bold text-[#244B8F] uppercase tracking-wider mb-2">
              Next Steps & Verification
            </div>
            <ul className="text-xs text-slate-700 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-[#244B8F] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                <span>A dedicated Relationship Manager will review your submission within 24 hours.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-[#244B8F] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                <span>We will call you at <strong>+91 {cleanPhone}</strong> to confirm ownership details and schedule an escorted physical verification.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-4 h-4 rounded-full bg-[#244B8F] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                <span>Once verified, your listing goes live to active buyers across Bengaluru.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            {onViewDashboard && (
              <button
                type="button"
                onClick={onViewDashboard}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors cursor-pointer shadow-xs"
              >
                Go to Seller Dashboard
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

          {/* Official Support Helpline */}
          <div className="pt-6 border-t border-slate-100 text-xs text-slate-500">
            Need urgent assistance? Contact SellMyGhar Seller Support at{' '}
            <a href="tel:+918217873708" className="text-[#244B8F] font-semibold hover:underline">
              +91 8217873708
            </a>{' '}
            or{' '}
            <a href="mailto:support@sellmyghar.in" className="text-[#244B8F] font-semibold hover:underline">
              support@sellmyghar.in
            </a>
            <div className="text-[11px] text-slate-400 mt-1">
              Available Monday – Saturday, 9:30 AM to 7:00 PM IST
            </div>
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

      {/* Draft Resume Banner */}
      {hasExistingDraft && (
        <div className="max-w-6xl mx-auto mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-[#172033] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#244B8F] text-white flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#172033]">
                Continue where you left off
              </div>
              <div className="text-xs text-slate-600">
                You have an unfinished draft for <strong>{hasExistingDraft.summary}</strong> saved on {hasExistingDraft.savedAt}.
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={discardDraft}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Discard Draft
            </button>
            <button
              type="button"
              onClick={resumeDraft}
              className="px-4 py-1.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Resume Draft
            </button>
          </div>
        </div>
      )}

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
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[#244B8F] tracking-wider uppercase block">
                  STEP {currentStep} OF 6
                </span>
                {draftSavedStatus && (
                  <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{draftSavedStatus}</span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight font-['Montserrat']">
                {currentStep === 1 && "Owner Contact & Listing Type"}
                {currentStep === 2 && "Where is your property located?"}
                {currentStep === 3 && "Configuration & Possession Status"}
                {currentStep === 4 && "Area, Floor & Unit Specifications"}
                {currentStep === 5 && "Commercial Terms & Pricing"}
                {currentStep === 6 && "Genuine Photos & Final Review"}
              </h2>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                {currentStep === 1 && "Provide your contact details so our verified Bengaluru residential desk can assist your listing."}
                {currentStep === 2 && "Pinpointing your apartment community in Bengaluru with verified society suggestions."}
                {currentStep === 3 && "Specify your apartment configuration, BHK count, and construction completion status."}
                {currentStep === 4 && "Detailed measurements, floor level, and orientation of your apartment."}
                {currentStep === 5 && "Set your financial expectations and highlight key society amenities."}
                {currentStep === 6 && "Upload authentic photos of your flat and review details before verification."}
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

                {/* Property Subtype (Flat / Apartment, Penthouse) */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-3">
                    Property type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      {
                        type: 'Flat / Apartment',
                        label: 'Flat / Apartment',
                        desc: 'Gated society or apartment complex',
                      },
                      {
                        type: 'Penthouse',
                        label: 'Penthouse',
                        desc: 'Top-floor luxury unit with private terrace',
                      },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSubType(item.type as PropertySubtype)}
                        className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
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
            {/* STEP 3: Configuration & Status                           */}
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

                {/* Property Status: Decoupled into Ready to Move vs Under Construction */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                      Property Status <span className="text-red-600">*</span>
                    </label>
                    <p className="text-xs text-slate-500 mb-3">
                      Is this apartment ready for physical possession or currently under construction?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setPropertyStatus('Ready to Move');
                        if (propertyAge === 'Under Construction') {
                          setPropertyAge('1 to 5 years');
                        }
                        setExpectedPossessionDate('');
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        propertyStatus === 'Ready to Move'
                          ? 'border-[#244B8F] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-[#172033]">
                        Ready to Move
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Occupancy / Completion certificate received, ready for immediate move-in.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPropertyStatus('Under Construction');
                        const defaultDate = expectedPossessionDate || `${possessionMonth} ${possessionYear}`;
                        setExpectedPossessionDate(defaultDate);
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        propertyStatus === 'Under Construction'
                          ? 'border-[#244B8F] bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-sm text-[#172033]">
                        Under Construction
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Work in progress, handover scheduled by builder for a future date.
                      </div>
                    </button>
                  </div>

                  {/* If Ready to Move: Property Age ONLY (NO 'Under Construction' in this dropdown) */}
                  {propertyStatus === 'Ready to Move' && (
                    <div className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                          Property Age <span className="text-red-600">*</span>
                        </label>
                        <p className="text-xs text-slate-500">
                          How long since the building received occupancy?
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          'Under 1 year',
                          '1 to 5 years',
                          '5 to 10 years',
                          '10+ years'
                        ].map((age) => (
                          <button
                            key={age}
                            type="button"
                            onClick={() => setPropertyAge(age)}
                            className={`p-3 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                              propertyAge === age
                                ? 'bg-[#244B8F] text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {age}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* If Under Construction: Expected Possession Month & Year */}
                  {propertyStatus === 'Under Construction' && (
                    <div className="p-4 sm:p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1">
                          Expected Possession Date <span className="text-red-600">*</span>
                        </label>
                        <p className="text-xs text-slate-600">
                          Specify target month and year of delivery as indicated by the developer.
                        </p>
                      </div>

                      {/* Month & Year Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Target Month
                          </label>
                          <select
                            value={possessionMonth}
                            onChange={(e) => {
                              const newMonth = e.target.value;
                              setPossessionMonth(newMonth);
                              setExpectedPossessionDate(`${newMonth} ${possessionYear}`);
                            }}
                            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          >
                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Target Year
                          </label>
                          <select
                            value={possessionYear}
                            onChange={(e) => {
                              const newYear = e.target.value;
                              setPossessionYear(newYear);
                              setExpectedPossessionDate(`${possessionMonth} ${newYear}`);
                            }}
                            className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          >
                            {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i)).map((yr) => (
                              <option key={yr} value={yr}>{yr}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Quick chips */}
                      <div>
                        <div className="text-xs font-semibold text-slate-600 mb-2">
                          Quick estimate shortcuts:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['Within 3 months', 'Within 6 months', 'By 2026', 'By 2027', 'By 2028', 'By 2029'].map((pos) => (
                            <button
                              key={pos}
                              type="button"
                              onClick={() => {
                                setExpectedPossessionDate(pos);
                                const yrMatch = pos.match(/\d{4}/);
                                if (yrMatch) setPossessionYear(yrMatch[0]);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                expectedPossessionDate === pos
                                  ? 'bg-[#244B8F] text-white shadow-xs font-bold'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>

                      {expectedPossessionDate && (
                        <div className="text-xs font-bold text-[#244B8F] bg-white px-3 py-1.5 rounded-lg border border-blue-200 w-fit">
                          Selected Possession: {expectedPossessionDate}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 4: Area, Floor & Unit Specifications                */}
            {/* ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-7">
                {/* Super Built-Up & Carpet Area */}
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
                      Calculated automatically from SBUA. You can edit this with your architectural floor plan figure.
                    </p>
                  </div>
                </div>

                {/* Floor Numbers */}
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
                    Helps buyers understand elevation, lighting, and elevator access.
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
                      'West',
                      'North',
                      'South',
                      'South East',
                      'South West',
                      'North East',
                      'North West',
                    ].map((dir) => (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => setFacing(dir)}
                        className={`py-2.5 px-3 rounded-lg text-xs font-semibold text-center cursor-pointer transition-colors ${
                          facing === dir || facing.replace(/-/g, ' ') === dir
                            ? 'bg-[#244B8F] text-white shadow-xs font-bold'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {dir}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furnishing Status */}
                <div>
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                    Furnishing Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFurnishing(f)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold text-center cursor-pointer transition-all ${
                          furnishing === f
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
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
            {/* STEP 5: Commercial Terms & Pricing                       */}
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

                {/* Property Description */}
                <div className="pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                    Property Description <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Highlights of your home, natural sunlight, interior work, views, or nearby conveniences..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Authentic descriptions detailing sunlight, ventilation, and interior wood-work attract quality inquiries faster.
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* STEP 6: Genuine Photos & Final Review                    */}
            {/* ======================================================== */}
            {currentStep === 6 && (
              <div className="space-y-8">
                {/* 0. Seller Identity Status Banner */}
                {authSession?.authenticated ? (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950 flex items-center space-x-2">
                          <span>Verified Seller: {authSession.user?.name || authSession.user?.email || 'Seller'}</span>
                        </div>
                        <div className="text-[11px] text-emerald-800 font-mono mt-0.5">{authSession.user?.email}</div>
                      </div>
                    </div>
                    <span className="hidden sm:inline-block text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full">
                      Ready for Assisted Resale Listing
                    </span>
                  </div>
                ) : (
                  <div className="p-5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3.5 shadow-2xs">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-950 font-['Montserrat']">
                          Google Sign-In Required to List Property
                        </h4>
                        <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                          Mobile SMS OTP verification is temporarily unavailable while telecom carrier registration is being finalized. To list your property securely, please sign in with your Google account. Your drafted property specifications are safely preserved and will not be lost.
                        </p>
                      </div>
                    </div>
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center space-x-2.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Sign In with Google</span>
                      </button>
                      <span className="text-[11px] text-amber-800 font-medium">
                        One-click sign in • Instant access
                      </span>
                    </div>
                  </div>
                )}

                {/* 1. Genuine Photo Upload Section */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-bold text-[#172033] font-['Montserrat']">
                        Property Photos ({photos.length} / 10 Uploaded)
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload authentic photos of your flat. No stock or sample photos allowed.
                      </p>
                    </div>
                    {photos.length > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} ready
                      </span>
                    )}
                  </div>

                  {/* Drag and Drop Zone */}
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
                      JPG, PNG, or WEBP up to 8 MB per file. High-resolution living room, bedroom, and kitchen photos recommended.
                    </p>
                  </div>

                  {uploadError && (
                    <div className="text-xs font-bold text-red-600 flex items-center space-x-1.5 bg-red-50 p-3 rounded-xl border border-red-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {isUploading && (
                    <div className="text-xs text-slate-600 flex items-center space-x-2 bg-blue-50 p-3 rounded-xl border border-blue-200">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#244B8F]" />
                      <span>Validating and uploading genuine photos...</span>
                    </div>
                  )}

                  {/* Uploaded Thumbnails Grid with Reorder, Cover, Delete Controls */}
                  {photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                      {photos.map((p, idx) => {
                        const isCover = p.isFeatured || (idx === 0 && !photos.some(item => item.isFeatured));
                        return (
                          <div
                            key={p.id}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex flex-col justify-between"
                          >
                            <img
                              src={p.url}
                              alt={`Property Photo ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Cover Badge */}
                            {isCover && (
                              <span className="absolute top-2 left-2 bg-[#172033]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center space-x-1 z-10">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span>Cover Photo</span>
                              </span>
                            )}

                            {/* Top-Right Delete Action */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(p.id);
                              }}
                              className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-opacity cursor-pointer z-10"
                              title="Delete photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>

                            {/* Bottom Controls Bar on Hover / Focus */}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 text-white flex items-center justify-between text-[11px] z-10">
                              <button
                                type="button"
                                onClick={() => handleSetFeatured(p.id)}
                                className={`text-[10px] font-semibold underline hover:text-amber-300 transition-colors cursor-pointer ${
                                  isCover ? 'text-amber-400 font-bold' : 'text-white/90'
                                }`}
                              >
                                {isCover ? '★ Cover' : 'Set as cover'}
                              </button>

                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMovePhoto(idx, 'LEFT')}
                                  className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
                                  title="Move left"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === photos.length - 1}
                                  onClick={() => handleMovePhoto(idx, 'RIGHT')}
                                  className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center cursor-pointer"
                                  title="Move right"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Non-blocking Quality Nudge (NO sample photo triggers) */}
                  {photos.length === 0 ? (
                    <div className="border border-blue-200 bg-blue-50/60 rounded-xl p-4 text-blue-950 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-[#244B8F] shrink-0" />
                        <h4 className="text-xs font-bold text-[#172033]">
                          Genuine photos increase buyer response up to 4x
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Buyers value authentic images of the living hall, bedrooms, balconies, and kitchen. You can proceed without photos now and add them later from your seller dashboard.
                      </p>
                    </div>
                  ) : photos.length < 3 ? (
                    <div className="border border-amber-300 bg-amber-50/70 rounded-xl p-4 text-amber-900 space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <h4 className="text-xs font-bold text-amber-900">
                          {photos.length} photo uploaded so far
                        </h4>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        Listings with 3 or more photos get up to 4x higher buyer engagement. We recommend uploading photos of the living room, master bedroom, and balcony or kitchen.
                      </p>
                    </div>
                  ) : null}

                  {/* Video Walkthrough Share Link */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Video Walkthrough Link <span className="text-slate-400 font-normal lowercase">(optional)</span>
                      </label>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-600">YouTube</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">Google Drive</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">Dropbox</span>
                      </div>
                    </div>
                    <input
                      type="url"
                      placeholder="e.g. https://www.youtube.com/watch?v=... or Google Drive link"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                    />
                  </div>
                </div>

                {/* 2. Review Summary Organized by Section */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/70 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Listing Review Summary
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#244B8F] text-white">
                      {intent === 'SELL' ? 'FOR SALE (RESALE)' : 'FOR RENT'}
                    </span>
                  </div>

                  {/* Section 1: Property Type & Intent */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">1. Property Type & Listing Intent</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {subType}
                      </strong>
                      <span className="text-slate-500">
                        {intent === 'SELL' ? 'Resale (Full Ownership)' : 'Residential Tenancy (Rental)'}
                      </span>
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
                      <span className="text-slate-400 font-medium block">2. Location & Society</span>
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

                  {/* Section 3: Configuration & Status */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">3. Configuration & Status</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {bhkType} • {bathrooms} Baths • {balconies} Balconies
                      </strong>
                      <span className="text-slate-500">
                        Status: {propertyStatus} {propertyStatus === 'Under Construction' ? `(Possession: ${expectedPossessionDate})` : `(Age: ${propertyAge})`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-[#244B8F] font-bold hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Section 4: Area & Unit Details */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200/70 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">4. Area & Unit Details</span>
                      <strong className="text-slate-800 text-sm font-bold block mt-0.5">
                        {superBuiltUpSqft} sq.ft. SBUA (~{carpetAreaSqft} sq.ft. carpet)
                      </strong>
                      <span className="text-slate-500">
                        Floor {unitFloor} of {totalFloors} • Facing {facing} • {furnishing} • {hasCoveredParking ? `${parkingCount} Covered Parking Slot(s)` : 'No Covered Parking'}
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

                  {/* Section 5: Commercial Terms */}
                  <div className="flex items-start justify-between text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">5. Commercial Terms</span>
                      <strong className="text-[#244B8F] text-base font-extrabold block mt-0.5">
                        {intent === 'SELL' 
                          ? (expectedPrice ? formatINRWords(expectedPrice) : 'Price declared') 
                          : `${monthlyRent ? formatINR(monthlyRent) : 'Rent declared'} / month`}
                      </strong>
                      {intent === 'SELL' && (
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {isNegotiable ? 'Flexible to Serious Buyers' : 'Fixed Price'}
                          {bookingAmount ? ` • Booking Token: ₹${parseInt(bookingAmount, 10).toLocaleString('en-IN')}` : ''}
                          {maintenanceCharges ? ` • Maintenance: ₹${parseInt(maintenanceCharges, 10).toLocaleString('en-IN')}/mo` : ''}
                        </div>
                      )}
                      {intent === 'RENT' && (
                        <div className="text-slate-500 text-[11px] mt-0.5">
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

                {/* 3. Owner Verification Contact Details (Collected in Final Step) */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-4 shadow-2xs">
                  <div>
                    <h3 className="text-sm font-bold text-[#172033] font-['Montserrat']">
                      Owner Contact & Verification Details
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Our verified Bengaluru residential desk will connect directly with you to coordinate title review and buyer visits. Your contact details are strictly confidential and never displayed on public listings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                        Your Full Name <span className="text-red-600">*</span>
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
                        Contact Callback Phone Number <span className="text-red-600">*</span>
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
                        <span>Dedicated advisor callback contact number (not phone/OTP verified).</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] uppercase tracking-wider mb-1.5">
                      Email Address <span className="text-slate-400 font-normal lowercase">(for listing confirmation receipt & diligence tracker)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rajesh.kumar@gmail.com"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F] bg-white"
                    />
                  </div>
                </div>

                {/* 4. Property Ownership & Verification Declaration */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#172033] font-['Montserrat']">
                      Property Ownership and Verification
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

                {/* 4. Contact and Marketing Consent Checkbox (Exact Wording Requested) */}
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
              ) : authSession?.authenticated ? (
                <button
                  type="button"
                  onClick={handleSubmitPropertyDirectly}
                  disabled={isSubmitting}
                  className="px-7 py-3.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-sm flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Property...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Property Listing</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="px-7 py-3.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-sm flex items-center space-x-2.5 shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In with Google to Submit</span>
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
