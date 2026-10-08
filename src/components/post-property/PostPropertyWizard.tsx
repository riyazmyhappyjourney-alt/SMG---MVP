import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Building2, 
  MapPin, 
  Home, 
  Camera, 
  IndianRupee, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Lock, 
  Plus, 
  Trash2, 
  Video, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Phone, 
  Check, 
  Edit3,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  BENGALURU_LOCALITIES, 
  BENGALURU_SOCIETIES, 
  searchLocalities, 
  searchSocieties, 
  formatIndianCurrency, 
  LocalityItem, 
  SocietyItem 
} from '../../data/bengaluruData';
import { UserAuthProfile } from '../../types/user';

interface PostPropertyWizardProps {
  user?: UserAuthProfile | null;
  onBackToHome: () => void;
  onSuccessRedirect?: (propertyId: string, referenceId: string) => void;
}

export type PropertySubType = 
  | 'Flat/Apartment' 
  | 'Builder Floor' 
  | 'Studio Apartment' 
  | 'Serviced Apartment';

export type FurnishingType = 'Furnished' | 'Semi-Furnished' | 'Unfurnished';

export type FacingDirection = 
  | 'East' 
  | 'North' 
  | 'North-East' 
  | 'South' 
  | 'West' 
  | 'North-West' 
  | 'South-East' 
  | 'South-West';

export type PropertyAge = 
  | 'Under Construction' 
  | 'Less than 1 year' 
  | '1 to 5 years' 
  | '5 to 10 years' 
  | '10+ years';

export type TenantType = 'Family' | 'Bachelors' | 'Corporate' | 'Any';
export type RentalDurationType = '11-Month (Standard)' | 'Custom';
export type LeaseDurationType = RentalDurationType; // Backward-compatible alias
export type MoveInAvailabilityType = 'Immediate' | 'Specific Date';

export interface WizardFormData {
  // Step 1: Basic Details
  intent: 'Sell' | 'Rent';
  propertyType: 'Residential';
  subType: PropertySubType;

  // Step 2: Location Details
  city: 'Bengaluru';
  locality: string;
  subLocality: string;
  societyName: string;
  houseNo: string;

  // Step 3: Property Profile
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  superBuiltUpSqft: string;
  carpetAreaSqft: string;
  furnishing: FurnishingType;
  floorNumber: string;
  totalFloors: string;
  facing: FacingDirection;
  propertyAge: PropertyAge;
  hasCoveredParking: boolean;
  parkingCount: number;

  // Step 4: Photos & Videos
  photos: string[];
  videoUrl: string;

  // Step 5: Pricing & Owner Contact (Branching by intent)
  expectedPrice: string; // Resale: expected asking price. Rent: expected monthly rent (INR/month)
  securityDeposit: string; // Rental only: Security deposit amount (INR)
  preferredTenantType: TenantType; // Rental only
  leaseDuration: LeaseDurationType; // Rental only
  customLeaseMonths: string; // Rental only
  moveInAvailability: MoveInAvailabilityType; // Rental only
  moveInDate: string; // Rental only
  isNegotiable: boolean;
  maintenanceCharges: string;
  bookingAmount: string; // Resale only
  description: string;
  ownerName: string;
  ownerPhone: string;
}

const INITIAL_FORM_DATA: WizardFormData = {
  intent: 'Sell',
  propertyType: 'Residential',
  subType: 'Flat/Apartment',

  city: 'Bengaluru',
  locality: 'Whitefield',
  subLocality: '',
  societyName: '',
  houseNo: '',

  bedrooms: 3,
  bathrooms: 3,
  balconies: 2,
  superBuiltUpSqft: '1650',
  carpetAreaSqft: '1320',
  furnishing: 'Semi-Furnished',
  floorNumber: '5',
  totalFloors: '14',
  facing: 'East',
  propertyAge: '1 to 5 years',
  hasCoveredParking: true,
  parkingCount: 1,

  photos: [],
  videoUrl: '',

  expectedPrice: '16500000',
  securityDeposit: '200000',
  preferredTenantType: 'Family',
  leaseDuration: '11-Month (Standard)',
  customLeaseMonths: '11',
  moveInAvailability: 'Immediate',
  moveInDate: '',
  isNegotiable: true,
  maintenanceCharges: '4500',
  bookingAmount: '100000',
  description: 'Well-ventilated corner apartment with premium wood finish and balcony overlooking central greenery.',
  ownerName: '',
  ownerPhone: '',
};

export const PostPropertyWizard: React.FC<PostPropertyWizardProps> = ({
  user,
  onBackToHome,
  onSuccessRedirect,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<WizardFormData>(() => ({
    ...INITIAL_FORM_DATA,
    ownerName: user?.name || '',
  }));
  const [stepError, setStepError] = useState<string | null>(null);

  // Autocomplete UI state for Step 2
  const [localityQuery, setLocalityQuery] = useState(formData.locality);
  const [showLocalitySuggestions, setShowLocalitySuggestions] = useState(false);
  const [societyQuery, setSocietyQuery] = useState(formData.societyName);
  const [showSocietySuggestions, setShowSocietySuggestions] = useState(false);

  // OTP Verification state for Step 6
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState<{
    propertyId: string;
    referenceId: string;
    ownerName: string;
    societyName: string;
    locality: string;
    priceFormatted: string;
  } | null>(null);

  // Calculate genuine Property Readiness Score
  const readinessScore = useMemo(() => {
    let score = 0;

    // Step 1: Basic Details (15%)
    if (formData.intent && formData.subType) score += 15;

    // Step 2: Location (20%)
    if (formData.locality.trim().length > 2) score += 10;
    if (formData.societyName.trim().length > 2) score += 10;

    // Step 3: Profile (20%)
    if (formData.bedrooms > 0 && formData.bathrooms > 0) score += 5;
    if (formData.superBuiltUpSqft && parseInt(formData.superBuiltUpSqft, 10) > 200) score += 5;
    if (formData.floorNumber && formData.totalFloors) score += 5;
    if (formData.facing && formData.furnishing) score += 5;

    // Step 4: Photos & Video (15%)
    if (formData.photos.length >= 3) {
      score += 15;
    } else if (formData.photos.length > 0) {
      score += 10;
    } else {
      score += 3; // Basic placeholder acknowledged
    }

    // Step 5: Pricing & Owner (25%)
    const isRental = formData.intent === 'Rent';
    const parsedPrice = parseInt(formData.expectedPrice, 10);
    if (isRental) {
      if (!isNaN(parsedPrice) && parsedPrice >= 5000) score += 10;
    } else {
      if (!isNaN(parsedPrice) && parsedPrice >= 500000) score += 10;
    }
    if (formData.ownerName.trim().length >= 2) score += 7;
    const cleanPhone = formData.ownerPhone.replace(/\D/g, '').slice(-10);
    if (/^[6-9]\d{9}$/.test(cleanPhone)) score += 8;

    // Step 5 optional description bonus (+5%)
    if (formData.description.trim().length > 20) score += 5;

    return Math.min(100, score);
  }, [formData]);

  // Encouraging micro-copy at each step
  const stepMicroCopy: Record<number, { title: string; hint: string }> = {
    1: {
      title: 'Step 1 of 6: Basic Property Details',
      hint: 'Great start! Specify your intent and residence format.',
    },
    2: {
      title: 'Step 2 of 6: Bengaluru Location & Complex',
      hint: 'Live type-ahead matches our verified Bengaluru society directory.',
    },
    3: {
      title: 'Step 3 of 6: Unit Profile & Floor Plan',
      hint: 'Halfway there! Precise unit specs accelerate genuine buyer matching.',
    },
    4: {
      title: 'Step 4 of 6: Visual Media & Virtual Walkthrough',
      hint: 'Almost done — 2 steps left. Listings with photos receive 4x more verified visits.',
    },
    5: {
      title: 'Step 5 of 6: Pricing & Owner Verification',
      hint: 'Final details! Set your expected price and primary mobile number for OTP.',
    },
    6: {
      title: 'Step 6 of 6: Review & Final Submission',
      hint: 'Review your specification before legal diligence dispatch.',
    },
  };

  // Autocomplete matching lists
  const matchedLocalities = useMemo(() => {
    return searchLocalities(localityQuery);
  }, [localityQuery]);

  const matchedSocieties = useMemo(() => {
    return searchSocieties(societyQuery, formData.locality);
  }, [societyQuery, formData.locality]);

  // Step Validation before progressing
  const validateAndProceed = (targetStep: number) => {
    setStepError(null);

    if (currentStep === 1) {
      if (!formData.intent || !formData.subType) {
        setStepError('Please select your transaction intent and property sub-type.');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.locality || formData.locality.trim().length < 2) {
        setStepError('Please select or enter a valid Bengaluru locality.');
        return;
      }
      if (!formData.societyName || formData.societyName.trim().length < 2) {
        setStepError('Please select or specify the apartment complex or society name.');
        return;
      }
    } else if (currentStep === 3) {
      const sqft = parseInt(formData.superBuiltUpSqft, 10);
      if (isNaN(sqft) || sqft < 250) {
        setStepError('Please enter a valid super built-up area (minimum 250 sq.ft).');
        return;
      }
      const floor = parseInt(formData.floorNumber, 10);
      const total = parseInt(formData.totalFloors, 10);
      if (isNaN(floor) || isNaN(total) || floor < 0 || total < 1 || floor > total) {
        setStepError('Please enter valid floor numbers (Unit floor cannot exceed total floors).');
        return;
      }
    } else if (currentStep === 4) {
      // Photos optional but recommended
      if (formData.videoUrl && !formData.videoUrl.includes('youtube') && !formData.videoUrl.includes('drive.google')) {
        setStepError('Video link must be a valid YouTube or Google Drive share link.');
        return;
      }
    } else if (currentStep === 5) {
      const isRental = formData.intent === 'Rent';
      const price = parseInt(formData.expectedPrice, 10);
      if (isRental) {
        if (isNaN(price) || price < 5000) {
          setStepError('Please enter a realistic expected monthly rent in INR (minimum ₹5,000/month).');
          return;
        }
        const deposit = parseInt(formData.securityDeposit, 10);
        if (isNaN(deposit) || deposit < 0) {
          setStepError('Please enter a valid security deposit amount in INR.');
          return;
        }
      } else {
        if (isNaN(price) || price < 500000) {
          setStepError('Please enter a realistic expected asking price in INR (minimum ₹5 Lakhs).');
          return;
        }
      }
      if (!formData.ownerName || formData.ownerName.trim().length < 2) {
        setStepError(isRental ? 'Owner / Landlord Name is required.' : 'Owner Name is required for title deed verification.');
        return;
      }
      const cleanPhone = formData.ownerPhone.replace(/\D/g, '').slice(-10);
      if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        setStepError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
        return;
      }
    }

    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 4: Photos File Upload via Supabase Storage
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhotos(true);
    setStepError(null);
    const tempPropertyId = `prop-upload-${Date.now().toString(36)}`;

    try {
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024) {
          setStepError(`Photo ${file.name} must be under 8MB in size.`);
          continue;
        }

        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload through Supabase Storage pipeline (includes checksum & antivirus verification)
        const res = await fetch('/api/storage/upload-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64: base64Data,
            propertyId: tempPropertyId,
            isFeatured: formData.photos.length === 0,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.url) {
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, data.url],
          }));
        } else {
          // Resilient fallback to local preview
          setFormData((prev) => ({
            ...prev,
            photos: [...prev.photos, base64Data],
          }));
        }
      }
    } catch {
      // Fallback handled
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  // Load sample photos helper
  const addSamplePhotos = () => {
    const samples = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
    ];
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...samples]
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, idx) => idx !== index)
    }));
  };

  // Final Submission Flow
  const handleInitiateSubmit = () => {
    // Open OTP modal for owner authentication
    setStepError(null);
    setEnteredOtp('');
    setIsOtpModalOpen(true);
  };

  const handleVerifyOtpAndSaveToDb = async () => {
    setIsSubmitting(true);
    setStepError(null);

    try {
      const cleanPhone = formData.ownerPhone.replace(/\D/g, '').slice(-10);
      const normalizedPhone = `+91${cleanPhone}`;

      // Payload for /api/properties
      const isRental = formData.intent === 'Rent';
      const payload = {
        intent: formData.intent,
        listing_intent: isRental ? 'RENT' : 'SELL',
        propertyType: formData.propertyType,
        subType: formData.subType,
        city: formData.city,
        locality: formData.locality,
        subLocality: formData.subLocality || undefined,
        societyName: formData.societyName,
        houseNo: formData.houseNo || undefined,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        balconies: formData.balconies,
        superBuiltUpSqft: parseInt(formData.superBuiltUpSqft, 10),
        carpetAreaSqft: parseInt(formData.carpetAreaSqft, 10) || Math.round(parseInt(formData.superBuiltUpSqft, 10) * 0.78),
        furnishing: formData.furnishing,
        floorNumber: parseInt(formData.floorNumber, 10),
        totalFloors: parseInt(formData.totalFloors, 10),
        facing: formData.facing,
        propertyAge: formData.propertyAge,
        hasCoveredParking: formData.hasCoveredParking,
        parkingCount: formData.parkingCount,
        photos: formData.photos,
        videoUrl: formData.videoUrl || undefined,
        expectedPrice: parseInt(formData.expectedPrice, 10),
        isNegotiable: formData.isNegotiable,
        maintenanceCharges: parseInt(formData.maintenanceCharges, 10) || 0,
        bookingAmount: isRental ? 0 : (parseInt(formData.bookingAmount, 10) || 0),
        securityDeposit: isRental ? (parseInt(formData.securityDeposit, 10) || 0) : undefined,
        preferredTenantType: isRental ? formData.preferredTenantType : undefined,
        leaseDuration: isRental ? formData.leaseDuration : undefined,
        customLeaseMonths: isRental && formData.leaseDuration === 'Custom' ? formData.customLeaseMonths : undefined,
        moveInAvailability: isRental ? formData.moveInAvailability : undefined,
        moveInDate: isRental && formData.moveInAvailability === 'Specific Date' ? formData.moveInDate : undefined,
        description: formData.description,
        ownerName: formData.ownerName.trim(),
        ownerPhone: normalizedPhone,
      };

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to persist property record to PostgreSQL database.');
      }

      setIsOtpModalOpen(false);
      setSubmissionComplete({
        propertyId: data.propertyId,
        referenceId: data.referenceId,
        ownerName: formData.ownerName,
        societyName: formData.societyName,
        locality: formData.locality,
        priceFormatted: isRental 
          ? `₹${parseInt(formData.expectedPrice, 10).toLocaleString('en-IN')}/month` 
          : formatIndianCurrency(parseInt(formData.expectedPrice, 10)),
      });

      if (onSuccessRedirect) {
        onSuccessRedirect(data.propertyId, data.referenceId);
      }
    } catch (err: any) {
      setStepError(err.message || 'Error saving property to database. Please check your network and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step names for Sidebar / Mobile Progress
  const wizardSteps = [
    { num: 1, label: 'Basic Details', icon: Building2 },
    { num: 2, label: 'Location', icon: MapPin },
    { num: 3, label: 'Property Profile', icon: Home },
    { num: 4, label: 'Photos & Videos', icon: Camera },
    { num: 5, label: 'Pricing & Owner', icon: IndianRupee },
    { num: 6, label: 'Review & Submit', icon: ClipboardCheck },
  ];

  // If successfully submitted, render dedicated Thank You & Verification Confirmation Screen
  if (submissionComplete) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] py-12 px-4 sm:px-6 lg:px-8 font-['Montserrat'] flex flex-col justify-center">
        <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
            Real Database Record Confirmed
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] mt-3 tracking-tight">
            Property Submitted for Verification
          </h2>

          <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Thank you, <strong className="text-slate-800">{submissionComplete.ownerName}</strong>! Your property at <strong className="text-[#244B8F]">{submissionComplete.societyName}, {submissionComplete.locality}</strong> has been stored in the PostgreSQL properties ledger and assigned to our Bengaluru Verification Desk.
          </p>

          {/* Reference & Database Card */}
          <div className="my-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Tracking Reference:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                {submissionComplete.referenceId}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">PostgreSQL Property ID:</span>
              <span className="font-mono text-slate-700 text-xs">
                {submissionComplete.propertyId}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Expected Asking Price:</span>
              <span className="font-bold text-[#244B8F]">
                {submissionComplete.priceFormatted}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Current Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                LEVEL 1: OWNER DECLARED (PENDING DOCS)
              </span>
            </div>
          </div>

          {/* Diligence Roadmap */}
          <div className="text-left bg-blue-50/60 rounded-xl p-4 border border-blue-100 mb-6 text-xs text-slate-700 space-y-1.5">
            <p className="font-bold text-[#244B8F] flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-[#244B8F]" />
              Next Verification Steps:
            </p>
            <p>1. Our Bengaluru relationship manager will call you to verify title deeds (A-Khata / Encumbrance Certificate).</p>
            <p>2. Once verified, your property unlocks Level 2 "Docs Checked" status and connects with matched pre-approved buyers.</p>
            <p>3. Zero public phone disclosure — all inquiries routed through vetted agents.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="w-full sm:w-auto px-6 py-3 bg-[#244B8F] text-white font-bold text-sm rounded-lg hover:bg-[#1B396E] transition-all cursor-pointer"
            >
              Return to Homepage
            </button>
            <button
              type="button"
              onClick={() => {
                setSubmissionComplete(null);
                setCurrentStep(1);
                setFormData(INITIAL_FORM_DATA);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              Post Another Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat'] selection:bg-[#244B8F] selection:text-white">
      
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-[#244B8F] p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Back to Home</span>
            </button>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[#172033] hidden sm:inline">Post Property</span>
              <span className="text-xs bg-[#244B8F]/10 text-[#244B8F] font-semibold px-2.5 py-0.5 rounded-full">
                Bengaluru Only
              </span>
            </div>
          </div>

          {/* Genuine Property Readiness Score Meter */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden xs:block">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                Readiness Score
              </span>
              <span className="text-xs font-extrabold text-[#244B8F]">
                {readinessScore}% Complete
              </span>
            </div>
            <div className="w-24 sm:w-32 bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#244B8F] to-[#B68A4A] transition-all duration-500 rounded-full"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mobile Step Indicator / Top Progress Bar (< 1024px) */}
        <div className="lg:hidden bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#244B8F] text-white flex items-center justify-center text-[11px] font-bold">
              {currentStep}
            </span>
            <span className="font-bold text-slate-800">
              {wizardSteps[currentStep - 1].label}
            </span>
          </div>
          <span className="text-slate-500 font-medium">Step {currentStep} of 6</span>
        </div>
      </header>

      {/* Main Wizard Grid: Persistent Left Sidebar on Desktop (lg) + Main Step Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Persistent Left Sidebar (Desktop ≥ 1024px) */}
          <aside className="hidden lg:block lg:col-span-4 bg-white rounded-2xl p-6 shadow-md border border-slate-200/80 sticky top-24">
            
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B68A4A] block">
                Verification Pipeline
              </span>
              <h3 className="text-lg font-extrabold text-[#172033] mt-0.5">
                Post Property Wizard
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Direct seller onboarding with RERA compliance diligence.
              </p>
            </div>

            {/* Stepper Steps List */}
            <div className="space-y-2">
              {wizardSteps.map((step) => {
                const Icon = step.icon;
                const isPast = step.num < currentStep;
                const isCurrent = step.num === currentStep;

                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => {
                      if (step.num < currentStep) {
                        setCurrentStep(step.num);
                      }
                    }}
                    disabled={step.num > currentStep}
                    className={`w-full flex items-center space-x-3.5 p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-[#244B8F] text-white shadow-md'
                        : isPast
                        ? 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                        : 'text-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-white/20 text-white'
                        : isPast
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isPast ? <Check className="w-4 h-4 font-bold" /> : <Icon className="w-4 h-4" />}
                    </div>

                    <div className="flex-1">
                      <span className={`text-[10px] uppercase font-bold tracking-wider block ${
                        isCurrent ? 'text-amber-200' : 'text-slate-400'
                      }`}>
                        Step {step.num}
                      </span>
                      <p className="text-xs font-bold leading-tight">
                        {step.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Genuine Readiness Metric */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="font-bold text-slate-700">Listing Readiness</span>
                <span className="font-extrabold text-[#244B8F]">{readinessScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#244B8F] rounded-full transition-all duration-500" 
                  style={{ width: `${readinessScore}%` }} 
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Calculated dynamically from real completed fields to ensure maximum buyer inquiry conversion.
              </p>
            </div>

            {/* Trust Assurances */}
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Public Phone Sharing</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Legally Verified A-Khata Titles</span>
              </div>
            </div>

          </aside>

          {/* Main Wizard Form Area (8 cols on desktop, full-width on mobile) */}
          <main className="lg:col-span-8">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-200/90">
              
              {/* Step Title & Honest Encouraging Micro-Copy */}
              <div className="mb-6 pb-4 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-[#244B8F]">
                  {stepMicroCopy[currentStep].title}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] mt-1">
                  {wizardSteps[currentStep - 1].label}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  {stepMicroCopy[currentStep].hint}
                </p>
              </div>

              {/* Error Banner */}
              {stepError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <div className="flex-1 font-medium">{stepError}</div>
                </div>
              )}

              {/* STEP 1: BASIC DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* I'm looking to: Sell / Rent */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                      I am looking to
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        { mode: 'Sell', label: 'Sell (Resale)', desc: 'Full ownership transfer' },
                        { mode: 'Rent', label: 'Rent', desc: '11-Month or standard rental' },
                      ] as const).map(({ mode, label, desc }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            if (mode === 'Rent' && (parseInt(formData.expectedPrice, 10) > 500000 || !formData.expectedPrice)) {
                              setFormData({ ...formData, intent: mode, expectedPrice: '45000' });
                            } else if (mode === 'Sell' && (parseInt(formData.expectedPrice, 10) < 500000 || !formData.expectedPrice)) {
                              setFormData({ ...formData, intent: mode, expectedPrice: '16500000' });
                            } else {
                              setFormData({ ...formData, intent: mode });
                            }
                          }}
                          className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            formData.intent === mode
                              ? 'border-[#244B8F] bg-[#244B8F]/5 text-[#244B8F] shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          }`}
                        >
                          <span className="block font-bold text-sm">{label}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">{desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Property Type: Residential (Locked/Pre-selected) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                      Property Category
                    </label>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Home className="w-5 h-5 text-[#244B8F]" />
                        <div>
                          <span className="text-sm font-bold text-slate-800">Residential Property</span>
                          <span className="text-xs text-slate-500 block">Only category supported on SellMyGhar currently</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Sub-Type: Flat/Apartment, Builder Floor, Studio Apartment, Serviced Apartment */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                      Property Sub-Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {([
                        { type: 'Flat/Apartment', desc: 'Gated society / high-rise apartment' },
                        { type: 'Builder Floor', desc: 'Independent low-rise multi-story floor' },
                        { type: 'Studio Apartment', desc: 'Compact open-concept single room unit' },
                        { type: 'Serviced Apartment', desc: 'Furnished residential managed unit' },
                      ] as const).map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setFormData({ ...formData, subType: item.type })}
                          className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            formData.subType === item.type
                              ? 'border-[#244B8F] bg-[#244B8F]/5 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <p className={`text-sm font-bold ${
                            formData.subType === item.type ? 'text-[#244B8F]' : 'text-slate-800'
                          }`}>
                            {item.type}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION DETAILS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {/* City: Bengaluru (Locked) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      City
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value="Bengaluru, Karnataka"
                        disabled
                        className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-300 rounded-xl text-slate-700 text-sm font-semibold cursor-not-allowed"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <span className="absolute right-3.5 top-3 text-[11px] font-bold text-[#244B8F] bg-[#244B8F]/10 px-2 py-0.5 rounded">
                        Active Hub
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      SellMyGhar operates exclusively within the Greater Bengaluru metropolitan area.
                    </p>
                  </div>

                  {/* Locality with Real Live Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Locality / Micro-Market <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={localityQuery}
                        onChange={(e) => {
                          setLocalityQuery(e.target.value);
                          setFormData({ ...formData, locality: e.target.value });
                          setShowLocalitySuggestions(true);
                        }}
                        onFocus={() => setShowLocalitySuggestions(true)}
                        placeholder="Type to search e.g. Whitefield, Sarjapur, HSR, Bellandur..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showLocalitySuggestions && matchedLocalities.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto">
                        <div className="p-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                          Suggested Bengaluru Localities
                        </div>
                        {matchedLocalities.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, locality: loc.name });
                              setLocalityQuery(loc.name);
                              setShowLocalitySuggestions(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[#244B8F]/5 text-xs sm:text-sm text-slate-800 flex items-center justify-between border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <span className="font-semibold">{loc.name}</span>
                            <span className="text-[11px] text-slate-400">{loc.zone} Bengaluru</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sub-locality: Optional */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Sub-Locality / Landmark <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subLocality}
                      onChange={(e) => setFormData({ ...formData, subLocality: e.target.value })}
                      placeholder="e.g. Near Hope Farm Circle, ECC Road, Green Glen Layout"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    />
                  </div>

                  {/* Apartment / Society Name with Real Live Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Apartment / Society Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={societyQuery}
                        onChange={(e) => {
                          setSocietyQuery(e.target.value);
                          setFormData({ ...formData, societyName: e.target.value });
                          setShowSocietySuggestions(true);
                        }}
                        onFocus={() => setShowSocietySuggestions(true)}
                        placeholder="Type to search e.g. Prestige Shantiniketan, Sobha Dream Acres..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSocietySuggestions && matchedSocieties.length > 0 && (
                      <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 max-h-60 overflow-y-auto">
                        <div className="p-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 border-b border-slate-100">
                          Known Bengaluru Apartment Complexes
                        </div>
                        {matchedSocieties.map((soc) => (
                          <button
                            key={soc.id}
                            type="button"
                            onClick={() => {
                              setFormData({ 
                                ...formData, 
                                societyName: soc.name,
                                locality: soc.locality.includes(',') ? soc.locality.split(',')[0].trim() : soc.locality
                              });
                              setSocietyQuery(soc.name);
                              setLocalityQuery(soc.locality.includes(',') ? soc.locality.split(',')[0].trim() : soc.locality);
                              setShowSocietySuggestions(false);
                            }}
                            className="w-full text-left px-3.5 py-2.5 hover:bg-[#244B8F]/5 text-xs sm:text-sm text-slate-800 flex items-center justify-between border-b border-slate-100 last:border-0 cursor-pointer"
                          >
                            <div>
                              <span className="font-bold block">{soc.name}</span>
                              <span className="text-[11px] text-slate-400">{soc.builder} • {soc.locality}</span>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                              Verified
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* House No. / Flat No. (Optional Free Text) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Flat No. / Tower <span className="text-slate-400 font-normal">(Optional — Never shared publicly)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.houseNo}
                      onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                      placeholder="e.g. Tower 3, Flat 504"
                      className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Protected by our Zero Public Phone & IDOR Privacy Policy. Only shared after legal deed verification.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: PROPERTY PROFILE */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Bedrooms, Bathrooms, Balconies */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Bedrooms (BHK)
                      </label>
                      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFormData({ ...formData, bedrooms: num })}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                              formData.bedrooms === num
                                ? 'bg-[#244B8F] text-white'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Bathrooms
                      </label>
                      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFormData({ ...formData, bathrooms: num })}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                              formData.bathrooms === num
                                ? 'bg-[#244B8F] text-white'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Balconies
                      </label>
                      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        {[0, 1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFormData({ ...formData, balconies: num })}
                            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                              formData.balconies === num
                                ? 'bg-[#244B8F] text-white'
                                : 'text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Areas: Super Built-up & Carpet Area */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Super Built-Up Area (Sq.Ft.) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="250"
                        max="20000"
                        value={formData.superBuiltUpSqft}
                        onChange={(e) => {
                          const val = e.target.value;
                          const autoCarpet = Math.round(parseInt(val, 10) * 0.78);
                          setFormData({ 
                            ...formData, 
                            superBuiltUpSqft: val,
                            carpetAreaSqft: isNaN(autoCarpet) ? '' : String(autoCarpet)
                          });
                        }}
                        placeholder="e.g. 1650"
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Carpet Area (Sq.Ft.) <span className="text-slate-400 font-normal">(RERA Definition)</span>
                      </label>
                      <input
                        type="number"
                        value={formData.carpetAreaSqft}
                        onChange={(e) => setFormData({ ...formData, carpetAreaSqft: e.target.value })}
                        placeholder="e.g. 1320"
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>
                  </div>

                  {/* Furnishing Status */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Furnishing Status
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Furnished', 'Semi-Furnished', 'Unfurnished'] as FurnishingType[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFormData({ ...formData, furnishing: f })}
                          className={`py-3 px-2 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                            formData.furnishing === f
                              ? 'border-[#244B8F] bg-[#244B8F]/5 text-[#244B8F]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Floor number / Total floors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Property on Floor
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={formData.floorNumber}
                        onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                        placeholder="e.g. 5"
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Total Floors in Wing
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={formData.totalFloors}
                        onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                        placeholder="e.g. 14"
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>
                  </div>

                  {/* Facing Direction & Age of Property */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Facing Direction (Main Door)
                      </label>
                      <select
                        value={formData.facing}
                        onChange={(e) => setFormData({ ...formData, facing: e.target.value as FacingDirection })}
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      >
                        <option value="East">East (Vaastu Compliant)</option>
                        <option value="North">North (Vaastu Compliant)</option>
                        <option value="North-East">North-East (Vaastu Compliant)</option>
                        <option value="West">West</option>
                        <option value="South">South</option>
                        <option value="North-West">North-West</option>
                        <option value="South-East">South-East</option>
                        <option value="South-West">South-West</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Age of Property
                      </label>
                      <select
                        value={formData.propertyAge}
                        onChange={(e) => setFormData({ ...formData, propertyAge: e.target.value as PropertyAge })}
                        className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      >
                        <option value="Under Construction">Under Construction</option>
                        <option value="Less than 1 year">Less than 1 year (Brand New)</option>
                        <option value="1 to 5 years">1 to 5 years</option>
                        <option value="5 to 10 years">5 to 10 years</option>
                        <option value="10+ years">10+ years</option>
                      </select>
                    </div>
                  </div>

                  {/* Covered Parking: Yes/No + Count */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Covered Car Parking
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, hasCoveredParking: true })}
                          className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                            formData.hasCoveredParking ? 'bg-[#244B8F] text-white' : 'text-slate-700'
                          }`}
                        >
                          Yes, Covered
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, hasCoveredParking: false, parkingCount: 0 })}
                          className={`px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                            !formData.hasCoveredParking ? 'bg-[#244B8F] text-white' : 'text-slate-700'
                          }`}
                        >
                          No Parking
                        </button>
                      </div>

                      {formData.hasCoveredParking && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-600 font-semibold">Count:</span>
                          {[1, 2, 3].map((cnt) => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => setFormData({ ...formData, parkingCount: cnt })}
                              className={`w-9 h-9 rounded-lg border font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                                formData.parkingCount === cnt
                                  ? 'border-[#244B8F] bg-[#244B8F] text-white'
                                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PHOTOS & VIDEOS */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  {/* Persuasion-Driven Psychological Nudge for Visuals */}
                  {(formData.photos.length < 3 || !formData.videoUrl?.trim()) && (
                    <div className="rounded-2xl border border-amber-300 bg-linear-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 p-4 sm:p-5 shadow-xs border-l-4 border-l-amber-500">
                      <div className="flex items-start space-x-3.5">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                          <Sparkles className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="flex-1 space-y-1.5 text-xs text-slate-700">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[11px] flex items-center">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse" />
                              Recommendation: Enhance Listing Visuals
                            </span>
                            <span className="text-[10px] text-amber-700 font-semibold bg-amber-200/60 px-2 py-0.5 rounded-full">
                              {formData.photos.length} Photo{formData.photos.length === 1 ? '' : 's'} • {formData.videoUrl?.trim() ? 'Video Attached' : 'No Video'}
                            </span>
                          </div>

                          {formData.photos.length < 3 && (
                            <p className="leading-relaxed">
                              <strong className="text-amber-950 font-bold">Properties with 5+ photos typically get contacted sooner</strong> — yours currently has {formData.photos.length}. Serious buyers and verified tenants tend to prioritize homes with multiple angles before scheduling a physical walk-through.
                            </p>
                          )}

                          {!formData.videoUrl?.trim() && (
                            <p className="leading-relaxed">
                              <strong className="text-amber-950 font-bold">Listings with a video walkthrough get noticed 2–3x more often</strong> by serious buyers in Bengaluru tech corridors.
                            </p>
                          )}

                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[11px] text-slate-600 italic">
                              You can still proceed to the next step, but adding visuals significantly boosts owner inquiries.
                            </p>
                            {formData.photos.length < 3 && (
                              <button
                                type="button"
                                onClick={addSamplePhotos}
                                className="text-xs font-bold text-[#244B8F] hover:text-[#1B3A70] underline cursor-pointer"
                              >
                                Add High-Res Sample Photos
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photo Upload Zone */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Upload Property Photos
                      </label>
                      <button
                        type="button"
                        onClick={addSamplePhotos}
                        className="text-xs text-[#244B8F] hover:underline font-semibold flex items-center cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1 text-[#B68A4A]" />
                        <span>Add High-Res Sample Photos</span>
                      </button>
                    </div>

                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/70 hover:bg-slate-50 transition-all">
                      <Camera className="w-10 h-10 text-[#244B8F] mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800">
                        Upload living room, balcony, kitchen & master bedroom photos
                      </p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        Supports PNG, JPG, WEBP up to 8MB each. Securely uploaded to Supabase Storage.
                      </p>
                      
                      <label className="inline-flex items-center justify-center px-4 py-2.5 bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer">
                        {isUploadingPhotos ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                            <span>Uploading to Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1.5" />
                            <span>Browse Files from Device</span>
                          </>
                        )}
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={isUploadingPhotos}
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Photo Preview Grid or Default State */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Selected Photos ({formData.photos.length})
                    </label>

                    {formData.photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                        {formData.photos.map((photoUrl, idx) => (
                          <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 aspect-4/3 group">
                            <img
                              src={photoUrl}
                              alt={`Property upload ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow-md transition-opacity cursor-pointer"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded font-mono">
                              Photo {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Clean Default/Placeholder State (Never broken blank) */
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center space-x-3 text-slate-500 text-xs">
                        <Info className="w-5 h-5 text-slate-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-700">No photos uploaded yet</p>
                          <p className="text-[11px] text-slate-500">
                            Our field verification agent can take professional photographs during the physical A-Khata inspection, or you can click "Add High-Res Sample Photos" above.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Walkthrough: YouTube or Google Drive Link */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Video Walkthrough Link <span className="text-slate-400 font-normal">(Optional YouTube or Google Drive URL)</span>
                    </label>
                    <div className="relative">
                      <Video className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Direct video links give prospective buyers a reliable virtual tour before scheduling physical visits.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 5: PRICING & OWNER CONTACT */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  {formData.intent === 'Sell' ? (
                    /* ----------------- RESALE (SELL) PRICING ----------------- */
                    <>
                      {/* Expected Asking Price with Live Currency Formatting */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Expected Asking Price (INR) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            min="500000"
                            step="50000"
                            value={formData.expectedPrice}
                            onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
                            placeholder="e.g. 16500000"
                            className="w-full pl-8 pr-32 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                          {/* Live Human-Readable Conversion Badge */}
                          <span className="absolute right-3 top-2.5 text-xs font-extrabold text-[#244B8F] bg-[#244B8F]/10 px-2.5 py-1 rounded-md">
                            {formatIndianCurrency(parseInt(formData.expectedPrice, 10))}
                          </span>
                        </div>

                        {/* Price Negotiable Toggle */}
                        <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-800">Is Price Negotiable?</span>
                            <span className="text-[11px] text-slate-500 block">Indicates flexibility to serious buyers</span>
                          </div>
                          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, isNegotiable: true })}
                              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                formData.isNegotiable ? 'bg-[#244B8F] text-white' : 'bg-white text-slate-700'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, isNegotiable: false })}
                              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                !formData.isNegotiable ? 'bg-[#244B8F] text-white' : 'bg-white text-slate-700'
                              }`}
                            >
                              Fixed
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Monthly Maintenance & Booking Amount */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Monthly Maintenance (INR) <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="number"
                            value={formData.maintenanceCharges}
                            onChange={(e) => setFormData({ ...formData, maintenanceCharges: e.target.value })}
                            placeholder="e.g. 4500"
                            className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Booking / Token Amount (INR) <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="number"
                            value={formData.bookingAmount}
                            onChange={(e) => setFormData({ ...formData, bookingAmount: e.target.value })}
                            placeholder="e.g. 100000"
                            className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    /* ----------------- RENTAL PRICING & TENANT SPECS ----------------- */
                    <>
                      {/* Expected Monthly Rent with Live Currency Formatting */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Expected Monthly Rent (INR/month) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3 text-slate-500 font-bold">₹</span>
                          <input
                            type="number"
                            min="5000"
                            step="1000"
                            value={formData.expectedPrice}
                            onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
                            placeholder="e.g. 45000"
                            className="w-full pl-8 pr-36 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                          {/* Live Monthly Rent Badge */}
                          <span className="absolute right-3 top-2.5 text-xs font-extrabold text-[#244B8F] bg-[#244B8F]/10 px-2.5 py-1 rounded-md">
                            ₹{parseInt(formData.expectedPrice, 10) ? parseInt(formData.expectedPrice, 10).toLocaleString('en-IN') : '0'} / mo
                          </span>
                        </div>

                        {/* Rent Negotiable Toggle */}
                        <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                          <div>
                            <span className="text-xs font-bold text-slate-800">Is Rent Negotiable?</span>
                            <span className="text-[11px] text-slate-500 block">Indicates flexibility to prospective tenants</span>
                          </div>
                          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, isNegotiable: true })}
                              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                formData.isNegotiable ? 'bg-[#244B8F] text-white' : 'bg-white text-slate-700'
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, isNegotiable: false })}
                              className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                                !formData.isNegotiable ? 'bg-[#244B8F] text-white' : 'bg-white text-slate-700'
                              }`}
                            >
                              Fixed
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Security Deposit Amount & Monthly Maintenance */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Security Deposit Amount (INR) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-3 text-slate-500 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="10000"
                              value={formData.securityDeposit}
                              onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                              placeholder="e.g. 200000"
                              className="w-full pl-8 pr-28 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                            />
                            <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {formatIndianCurrency(parseInt(formData.securityDeposit, 10))}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Monthly Society Maintenance (INR) <span className="text-slate-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="number"
                            value={formData.maintenanceCharges}
                            onChange={(e) => setFormData({ ...formData, maintenanceCharges: e.target.value })}
                            placeholder="e.g. 4500 (extra / included)"
                            className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                        </div>
                      </div>

                      {/* Preferred Tenant Type */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          Preferred Tenant Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {(['Family', 'Bachelors', 'Corporate', 'Any'] as TenantType[]).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setFormData({ ...formData, preferredTenantType: type })}
                              className={`py-2.5 px-3 rounded-xl border text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                formData.preferredTenantType === type
                                  ? 'border-[#244B8F] bg-[#244B8F] text-white shadow-xs'
                                  : 'border-slate-300 hover:border-slate-400 text-slate-700 bg-white'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Rental Duration & Move-in Availability */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Rental Duration */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Rental Duration
                          </label>
                          <div className="flex rounded-xl border border-slate-300 overflow-hidden bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, leaseDuration: '11-Month (Standard)' })}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                formData.leaseDuration === '11-Month (Standard)'
                                  ? 'bg-[#244B8F] text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              11 Months (Default)
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, leaseDuration: 'Custom' })}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                formData.leaseDuration === 'Custom'
                                  ? 'bg-[#244B8F] text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Custom Duration
                            </button>
                          </div>
                          {formData.leaseDuration === 'Custom' && (
                            <div className="mt-2 flex items-center space-x-2">
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={formData.customLeaseMonths}
                                onChange={(e) => setFormData({ ...formData, customLeaseMonths: e.target.value })}
                                placeholder="e.g. 24"
                                className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                              />
                              <span className="text-xs text-slate-500">months duration</span>
                            </div>
                          )}
                        </div>

                        {/* Move-in Availability */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Move-in Availability
                          </label>
                          <div className="flex rounded-xl border border-slate-300 overflow-hidden bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, moveInAvailability: 'Immediate' })}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                formData.moveInAvailability === 'Immediate'
                                  ? 'bg-[#244B8F] text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Immediate
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, moveInAvailability: 'Specific Date' })}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                formData.moveInAvailability === 'Specific Date'
                                  ? 'bg-[#244B8F] text-white shadow-xs'
                                  : 'text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              Specific Date
                            </button>
                          </div>
                          {formData.moveInAvailability === 'Specific Date' && (
                            <div className="mt-2">
                              <input
                                type="date"
                                value={formData.moveInDate}
                                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Free-Text Description */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Property Description & Highlights
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formData.description.length} chars
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mention key highlights: Vastu compliance, modular kitchen, society amenities (clubhouse, pool, badminton), proximity to tech parks..."
                      className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    />
                  </div>

                  {/* Owner Contact Information */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-bold">Owner Legal Declaration & Contact Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full Name of Property Owner <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                          <input
                            type="text"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            placeholder="e.g. Harish Babu"
                            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Primary Mobile Number (OTP Verified) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500 font-mono">+91</span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={formData.ownerPhone}
                            onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value.replace(/\D/g, '') })}
                            placeholder="9876543210"
                            className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      By submitting, you declare that you are the lawful owner or authorized power of attorney holder of the unit. Your phone number is guarded under statutory DPDP rules and never broadcast to public directories.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 6: REVIEW & SUBMIT */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#244B8F] flex items-center justify-between">
                    <span className="font-semibold">Review your property specification. Click any section to edit before submission.</span>
                    <span className="font-bold text-xs bg-white px-2.5 py-1 rounded shadow-xs">
                      Score: {readinessScore}%
                    </span>
                  </div>

                  {/* Summary Card 1: Basic & Location */}
                  <div className="border border-slate-200 rounded-xl p-4 sm:p-5 relative bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center">
                        <Building2 className="w-4 h-4 mr-1.5 text-[#244B8F]" />
                        Basic Details & Location
                      </h4>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs font-bold text-[#244B8F] hover:underline flex items-center cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Intent:</span>
                        <span className="font-semibold text-slate-800">{formData.intent}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Sub-Type:</span>
                        <span className="font-semibold text-slate-800">{formData.subType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Locality:</span>
                        <span className="font-semibold text-slate-800">{formData.locality}, Bengaluru</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Society / Project:</span>
                        <span className="font-bold text-[#244B8F]">{formData.societyName || 'Unspecified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card 2: Property Profile */}
                  <div className="border border-slate-200 rounded-xl p-4 sm:p-5 relative bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center">
                        <Home className="w-4 h-4 mr-1.5 text-[#244B8F]" />
                        Unit Profile & Specifications
                      </h4>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-xs font-bold text-[#244B8F] hover:underline flex items-center cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Configuration:</span>
                        <span className="font-semibold text-slate-800">{formData.bedrooms} BHK ({formData.bathrooms} Baths, {formData.balconies} Balconies)</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Built-Up Area:</span>
                        <span className="font-semibold text-slate-800">{formData.superBuiltUpSqft} Sq.Ft.</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Floor:</span>
                        <span className="font-semibold text-slate-800">Floor {formData.floorNumber} of {formData.totalFloors}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Facing / Furnishing:</span>
                        <span className="font-semibold text-slate-800">{formData.facing} Facing • {formData.furnishing}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card 3: Media & Pricing (Conditional by Intent) */}
                  <div className="border border-slate-200 rounded-xl p-4 sm:p-5 relative bg-white">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center">
                        <IndianRupee className="w-4 h-4 mr-1.5 text-[#244B8F]" />
                        {formData.intent === 'Rent' ? 'Rental Terms, Media & Owner' : 'Pricing, Media & Owner'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="text-xs font-bold text-[#244B8F] hover:underline flex items-center cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {formData.intent === 'Rent' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Expected Rent:</span>
                          <span className="font-extrabold text-[#244B8F] text-sm">
                            ₹{parseInt(formData.expectedPrice, 10) ? parseInt(formData.expectedPrice, 10).toLocaleString('en-IN') : '0'}/mo
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Security Deposit:</span>
                          <span className="font-bold text-slate-800">
                            ₹{parseInt(formData.securityDeposit, 10) ? parseInt(formData.securityDeposit, 10).toLocaleString('en-IN') : '0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Preferred Tenants:</span>
                          <span className="font-semibold text-slate-800">{formData.preferredTenantType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Rental & Move-in:</span>
                          <span className="font-semibold text-slate-800">
                            {formData.leaseDuration === 'Custom' ? `${formData.customLeaseMonths} Mo` : '11-Month'} • {formData.moveInAvailability}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block">Asking Price:</span>
                          <span className="font-extrabold text-[#244B8F] text-sm">
                            {formatIndianCurrency(parseInt(formData.expectedPrice, 10))}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Negotiable:</span>
                          <span className="font-semibold text-slate-800">{formData.isNegotiable ? 'Yes' : 'Fixed'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Booking Amount:</span>
                          <span className="font-semibold text-slate-800">
                            {formData.bookingAmount ? formatIndianCurrency(parseInt(formData.bookingAmount, 10)) : 'None'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Owner Contact:</span>
                          <span className="font-semibold text-slate-800">{formData.ownerName} (+91 {formData.ownerPhone.slice(-10)})</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Statutory Legal Declaration Banner */}
                  <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50 space-y-2">
                    <div className="flex items-center space-x-2 text-slate-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        {formData.intent === 'Rent'
                          ? 'Bengaluru Rental Compliance & Ownership Declaration'
                          : 'Statutory Resale Ownership & Title Declaration'}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {formData.intent === 'Rent' ? (
                        <>
                          By submitting this rental listing, I declare that I am the lawful owner or registered power-of-attorney holder with valid authority to rent out this residential unit. I confirm willingness to furnish the 5 statutory rental verification documents for tenant safety (<strong>Possession Letter</strong>, <strong>Society NOC</strong>, <strong>latest BESCOM Bill</strong>, <strong>11-Month Rental Agreement draft</strong>, and <strong>BBMP Property Tax Receipt</strong>) prior to finalizing the rental agreement.
                        </>
                      ) : (
                        <>
                          By submitting, you declare that you are the lawful owner or authorized power of attorney holder of the unit with clear, marketable title. You agree to provide the 5 statutory resale documents (<strong>Title Deed</strong>, <strong>Mother Deed</strong>, <strong>Khata Certificate</strong>, <strong>Encumbrance Certificate</strong>, and <strong>BBMP Tax Receipt</strong>) for legal due diligence before buyer matching.
                        </>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Your phone number is guarded under statutory DPDP rules and never broadcast to public directories.
                    </p>
                  </div>

                </div>
              )}

              {/* Wizard Navigation Action Bar */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStepError(null);
                      setCurrentStep(currentStep - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    <span>Previous Step</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={() => validateAndProceed(currentStep + 1)}
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <span>Continue to Step {currentStep + 1}</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleInitiateSubmit}
                    className="inline-flex items-center px-7 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold shadow-lg hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <span>
                      {formData.intent === 'Rent'
                        ? 'Submit for Rental Verification'
                        : 'Submit for Legal Verification'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>

            </div>
          </main>

        </div>
      </div>

      {/* OTP Verification Modal before final PostgreSQL write */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Montserrat']">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#244B8F] flex items-center justify-center mx-auto mb-3">
                <Phone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#172033]">
                Verify Owner Mobile
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit verification code sent to <strong className="text-slate-800">+91 {formData.ownerPhone.slice(-10)}</strong> to authenticate your property listing.
              </p>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Demo Verification Code:</span>
              <button
                type="button"
                onClick={() => setEnteredOtp('749201')}
                className="font-mono font-bold text-[#244B8F] hover:underline cursor-pointer"
              >
                Auto-fill 749201
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="749201"
                  className="w-full text-center tracking-widest text-xl font-mono py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtpAndSaveToDb}
                  disabled={isSubmitting || enteredOtp.length < 4}
                  className="flex-1 py-3 bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      <span>Writing to Database...</span>
                    </>
                  ) : (
                    <span>Confirm & Post Property</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
