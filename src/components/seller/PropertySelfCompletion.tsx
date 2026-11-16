import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Home,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  Layers,
  IndianRupee,
  Camera,
  Compass,
  Sparkles,
  HelpCircle,
  Upload,
  Trash2
} from 'lucide-react';
import { BENGALURU_SOCIETIES, searchSocieties } from '../../data/bengaluruData';
import {
  compressAndSanitizeImage,
  sanitizeOwnerName,
  sanitizeIndianPhone,
  sanitizeEmail,
  sanitizeSociety,
  sanitizeLocality,
  sanitizeSBUA,
  sanitizeCarpetArea,
  sanitizePrice,
  sanitizeDescription
} from '../../utils/formSanitizer';

interface PropertySelfCompletionProps {
  propertyId: string;
  token: string;
  onSuccess?: () => void;
  onBackToHome?: () => void;
}

// Indian currency formatter helper
function formatINRWords(val: number | string): string {
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

const COMMON_AMENITIES = [
  'Swimming Pool', 'Gymnasium', 'Clubhouse', 'Children Play Area',
  '24/7 Security', 'Power Backup', 'Lift', 'Covered Car Parking',
  'Badminton Court', 'Jogging Track', 'Tennis Court', 'Piped Gas',
  'Rainwater Harvesting', 'Park / Garden', 'Intercom', 'CCTV Surveillance'
];

export const PropertySelfCompletion: React.FC<PropertySelfCompletionProps> = ({
  propertyId,
  token,
  onSuccess,
  onBackToHome
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // STEP 1: Owner & Contact
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');

  // STEP 2: Location & Society
  const [projectName, setProjectName] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [wingTower, setWingTower] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [publicAddress, setPublicAddress] = useState('');

  // STEP 3: Configuration & Area
  const [propertyType, setPropertyType] = useState('Apartment');
  const [bhkType, setBhkType] = useState('2 BHK');
  const [superBuiltUpSqft, setSuperBuiltUpSqft] = useState<number | ''>(1200);
  const [carpetAreaSqft, setCarpetAreaSqft] = useState<number | ''>(950);
  const [bathroomsCount, setBathroomsCount] = useState<number | ''>(2);
  const [balconiesCount, setBalconiesCount] = useState<number | ''>(1);

  // STEP 4: Floor, Facing & Furnishing
  const [unitFloor, setUnitFloor] = useState<number | ''>(3);
  const [totalFloors, setTotalFloors] = useState<number | ''>(10);
  const [facing, setFacing] = useState('EAST');
  const [furnishing, setFurnishing] = useState('Semi-Furnished');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([
    '24/7 Security', 'Power Backup', 'Lift', 'Covered Car Parking'
  ]);

  // STEP 5: Commercial Terms
  const [askingPriceInr, setAskingPriceInr] = useState<number | ''>(10000000);
  const [monthlyMaintenanceInr, setMonthlyMaintenanceInr] = useState<number | ''>(3500);
  const [description, setDescription] = useState('');

  // STEP 6: Photos & Review
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotoInput, setNewPhotoInput] = useState('');

  // Fetch token-verified property data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/seller/complete/${propertyId}?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || 'Invalid or expired self-completion token.');
        }

        if (isMounted && data.property) {
          const p = data.property;
          setOwnerName(p.owner_name || '');
          setOwnerPhone(p.owner_phone || '');
          setOwnerEmail(p.owner_email || '');

          const rawLocality = p.project_locality_id || '';
          if (rawLocality.includes(',')) {
            const parts = rawLocality.split(',');
            setProjectName(p.project_name || parts[0].trim());
            setLocalityName(p.locality || parts.slice(1).join(',').trim());
          } else {
            setProjectName(p.project_name || rawLocality);
            setLocalityName(p.locality || 'Bengaluru');
          }

          setUnitNumber(p.unit_number === 'TBD' ? '' : (p.unit_number || ''));
          setWingTower(p.wing_tower || '');
          setPropertyType(p.property_type || 'Apartment');
          setBhkType(p.bhk_type || '2 BHK');
          setSuperBuiltUpSqft(p.super_built_up_sqft || 1200);
          setCarpetAreaSqft(p.carpet_area_sqft || 950);
          setUnitFloor(p.unit_floor || 1);
          setTotalFloors(p.total_floors || 10);
          setBathroomsCount(p.bathrooms_count || 2);
          setBalconiesCount(p.balconies_count || 1);
          setFacing(p.facing || 'EAST');
          setAskingPriceInr(Number(p.asking_price_inr) || 10000000);
          setMonthlyMaintenanceInr(Number(p.monthly_maintenance_inr) || 3500);
          setFurnishing(p.furnishing || 'Semi-Furnished');
          setDescription(p.description || '');
          setPublicAddress(p.public_address || '');
          if (Array.isArray(p.amenities) && p.amenities.length > 0) {
            setSelectedAmenities(p.amenities);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to access property details with this token.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (propertyId) {
      loadData();
    } else {
      setError('Missing property reference.');
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [propertyId, token]);

  const [compressingPhotos, setCompressingPhotos] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setCompressingPhotos(true);
    setStepError(null);
    try {
      const remainingSlots = 12 - photoUrls.length;
      if (remainingSlots <= 0) {
        setStepError('Maximum 12 photos allowed per property.');
        return;
      }
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const compressed: string[] = [];
      for (const file of filesToProcess) {
        try {
          const res = await compressAndSanitizeImage(file);
          compressed.push(res.dataUrl);
        } catch (imgErr: any) {
          setStepError(imgErr.message || 'Error processing photo');
        }
      }
      if (compressed.length > 0) {
        setPhotoUrls(prev => [...prev, ...compressed]);
      }
    } catch (err: any) {
      setStepError(err.message || 'Error uploading photos');
    } finally {
      setCompressingPhotos(false);
      e.target.value = '';
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddPhoto = () => {
    if (newPhotoInput.trim()) {
      setPhotoUrls(prev => [...prev, newPhotoInput.trim()]);
      setNewPhotoInput('');
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    setStepError(null);
    if (step === 1) {
      const nameRes = sanitizeOwnerName(ownerName);
      if (!nameRes.isValid) {
        setStepError(nameRes.error || 'Please enter valid owner full name.');
        return false;
      }
      const phoneRes = sanitizeIndianPhone(ownerPhone);
      if (!phoneRes.isValid) {
        setStepError(phoneRes.error || 'Valid 10-digit mobile number starting with 6, 7, 8, or 9 is required.');
        return false;
      }
      if (ownerEmail.trim()) {
        const emailRes = sanitizeEmail(ownerEmail);
        if (!emailRes.isValid) {
          setStepError(emailRes.error || 'Please enter a valid email address.');
          return false;
        }
      }
    } else if (step === 2) {
      const socRes = sanitizeSociety(projectName);
      if (!socRes.isValid) {
        setStepError(socRes.error || 'Apartment or Society name is required.');
        return false;
      }
      const locRes = sanitizeLocality(localityName);
      if (!locRes.isValid) {
        setStepError(locRes.error || 'Locality name is required.');
        return false;
      }
    } else if (step === 3) {
      const sbuaRes = sanitizeSBUA(superBuiltUpSqft);
      if (!sbuaRes.isValid) {
        setStepError(sbuaRes.error || 'Please enter valid Super Built-up Area (minimum 250 sq.ft.).');
        return false;
      }
      if (carpetAreaSqft) {
        const carpetRes = sanitizeCarpetArea(carpetAreaSqft, Number(superBuiltUpSqft));
        if (!carpetRes.isValid) {
          setStepError(carpetRes.error || 'Carpet area cannot exceed Super Built-up Area.');
          return false;
        }
      }
    } else if (step === 4) {
      if (unitFloor !== '' && totalFloors !== '' && Number(unitFloor) > Number(totalFloors)) {
        setStepError('Unit floor cannot exceed total floors in the building.');
        return false;
      }
    } else if (step === 5) {
      const priceRes = sanitizePrice(askingPriceInr, false);
      if (!priceRes.isValid) {
        setStepError(priceRes.error || 'Please enter a valid asking price (minimum ₹5 Lakhs).');
        return false;
      }
      if (description.trim()) {
        const descRes = sanitizeDescription(description);
        if (!descRes.isValid) {
          setStepError(descRes.error || 'Description exceeds character limits.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStepError(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateStep(currentStep)) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        token,
        ownerName: ownerName.trim(),
        ownerPhone: ownerPhone.trim(),
        ownerEmail: ownerEmail.trim(),
        projectName: projectName.trim(),
        localityName: localityName.trim(),
        unitNumber: unitNumber.trim() || 'TBD',
        wingTower: wingTower.trim(),
        propertyType,
        bhkType,
        superBuiltUpSqft: Number(superBuiltUpSqft) || 1200,
        carpetAreaSqft: Number(carpetAreaSqft) || 950,
        unitFloor: Number(unitFloor) || 1,
        totalFloors: Number(totalFloors) || 10,
        bathroomsCount: Number(bathroomsCount) || 2,
        balconiesCount: Number(balconiesCount) || 1,
        facing,
        furnishing,
        amenities: selectedAmenities,
        askingPriceInr: Number(askingPriceInr) || 10000000,
        monthlyMaintenanceInr: Number(monthlyMaintenanceInr) || 0,
        description: description.trim(),
        publicAddress: publicAddress.trim(),
        photos: photoUrls
      };

      const res = await fetch(`/api/seller/complete/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': (() => {
            const match = document.cookie.match(/sellmyghar_csrf=([^;]+)/);
            return match ? match[1] : '';
          })()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save property specifications.');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error saving property specifications. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center max-w-sm w-full">
          <Loader2 className="w-8 h-8 text-[#0176D3] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Verifying secure seller link...</p>
          <p className="text-xs text-slate-500 mt-1">Loading property specifications</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center max-w-md w-full">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Secure Link Invalid or Expired</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">{error}</p>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-[#0176D3] hover:bg-[#005fb2] text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
            >
              Return to Homepage
            </button>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs text-center max-w-lg w-full">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            Inventory Status: Received & In Verification
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Details Saved!</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Thank you, {ownerName || 'Owner'}! Your property details for <span className="font-semibold text-slate-900">{bhkType} in {projectName || 'Bengaluru'}</span> have been recorded in our Inventory ledger. Our verification team will review the details and reach out to you shortly.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Property Reference ID
            </div>
            <div className="text-xl font-mono font-bold text-[#0176D3]">
              {propertyId}
            </div>
          </div>

          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="w-full px-5 py-2.5 bg-[#0176D3] hover:bg-[#005fb2] text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, name: 'Contact & Owner', icon: User },
    { number: 2, name: 'Location & Society', icon: MapPin },
    { number: 3, name: 'Configuration & Area', icon: Layers },
    { number: 4, name: 'Floor & Amenities', icon: Building2 },
    { number: 5, name: 'Pricing & Terms', icon: IndianRupee },
    { number: 6, name: 'Photos & Review', icon: Camera }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-50 text-[#0176D3] rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Seller Property Specifications</h1>
                <p className="text-xs text-slate-500">Secure owner form • Ref ID: {propertyId}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-center">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Token Access
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Step {currentStep} of 6: {steps[currentStep - 1].name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {Math.round((currentStep / 6) * 100)}% Completed
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0176D3] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>

            {/* Stepper Dots (Desktop) */}
            <div className="hidden sm:grid grid-cols-6 gap-2 mt-4">
              {steps.map(s => {
                const isCurrent = s.number === currentStep;
                const isPast = s.number < currentStep;
                return (
                  <button
                    key={s.number}
                    type="button"
                    onClick={() => {
                      if (isPast) setCurrentStep(s.number);
                    }}
                    className={`flex items-center space-x-1.5 p-1.5 rounded text-left transition-colors ${
                      isCurrent
                        ? 'bg-blue-50 text-[#0176D3] font-bold'
                        : isPast
                        ? 'text-slate-600 hover:text-slate-900 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-[#0176D3] text-white'
                          : isPast
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isPast ? <Check className="w-3 h-3" /> : s.number}
                    </div>
                    <span className="text-[11px] truncate">{s.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step Error Notice */}
        {stepError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2.5 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8">
          {/* STEP 1: Contact & Owner Information */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Owner Contact Information</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm your contact details so our dedicated relationship manager can reach you for verified buyer updates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    10-Digit Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                      placeholder="e.g. ramesh.kumar@example.com"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    We will send verified buyer site-visit notifications and transaction summaries to this email.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Society */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Location & Society Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify the society and locality where your property is situated.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Apartment / Society Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. Prestige Shantiniketan, Brigade Gateway"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Locality in Bengaluru <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={localityName}
                    onChange={(e) => setLocalityName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. Whitefield, Sarjapur Road, Bellandur"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tower / Wing / Block
                  </label>
                  <input
                    type="text"
                    value={wingTower}
                    onChange={(e) => setWingTower(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. Tower 3, Block B"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flat / Unit Number
                  </label>
                  <input
                    type="text"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. 504"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Confidential: unit number is only shared with verified buyers during approved visits.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Configuration & Area Specs */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configuration & Area Specifications</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Define the bedrooms, bathrooms, and floor area measurements.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    BHK Configuration <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bhkType}
                    onChange={(e) => setBhkType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  >
                    <option value="1 BHK">1 BHK</option>
                    <option value="2 BHK">2 BHK</option>
                    <option value="3 BHK">3 BHK</option>
                    <option value="4 BHK">4 BHK</option>
                    <option value="5+ BHK">5+ BHK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Super Built-up Area (Sq.Ft.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={300}
                    max={25000}
                    value={superBuiltUpSqft}
                    onChange={(e) => setSuperBuiltUpSqft(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. 1450"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carpet Area (Sq.Ft.)
                  </label>
                  <input
                    type="number"
                    min={200}
                    max={20000}
                    value={carpetAreaSqft}
                    onChange={(e) => setCarpetAreaSqft(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. 1120"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bathrooms Count
                  </label>
                  <select
                    value={bathroomsCount}
                    onChange={(e) => setBathroomsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n} Bathroom{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Balconies Count
                  </label>
                  <select
                    value={balconiesCount}
                    onChange={(e) => setBalconiesCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  >
                    {[0, 1, 2, 3, 4].map(n => (
                      <option key={n} value={n}>{n} Balcon{n === 1 ? 'y' : 'ies'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Floor, Facing & Amenities */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Floor, Facing & Amenities</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide elevation, orientation, and community highlights.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Floor
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={unitFloor}
                    onChange={(e) => setUnitFloor(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. 5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Floors in Tower
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={totalFloors}
                    onChange={(e) => setTotalFloors(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="e.g. 14"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Main Door Facing
                  </label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  >
                    <option value="EAST">East</option>
                    <option value="NORTH">North</option>
                    <option value="NORTH_EAST">North-East</option>
                    <option value="WEST">West</option>
                    <option value="SOUTH">South</option>
                    <option value="SOUTH_EAST">South-East</option>
                    <option value="SOUTH_WEST">South-West</option>
                    <option value="NORTH_WEST">North-West</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Furnishing Status
                  </label>
                  <select
                    value={furnishing}
                    onChange={(e) => setFurnishing(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  >
                    <option value="Semi-Furnished">Semi-Furnished (Wardrobes, Modular Kitchen)</option>
                    <option value="Fully Furnished">Fully Furnished</option>
                    <option value="Unfurnished">Unfurnished</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Society Amenities
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMMON_AMENITIES.map(amenity => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`flex items-center space-x-2 p-2 rounded-lg text-xs font-medium border text-left transition-all ${
                            isSelected
                              ? 'bg-blue-50 border-[#0176D3] text-[#0176D3]'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#0176D3] border-[#0176D3] text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="truncate">{amenity}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Commercial Terms */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Commercial Terms & Pricing</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set your target selling price and property highlights.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Selling Price (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      required
                      min={500000}
                      step={50000}
                      value={askingPriceInr}
                      onChange={(e) => setAskingPriceInr(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                      placeholder="e.g. 12500000"
                    />
                  </div>
                  {askingPriceInr && (
                    <span className="text-xs font-bold text-[#0176D3] mt-1.5 block">
                      {formatINRWords(askingPriceInr)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Maintenance (₹ / Month)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min={0}
                      value={monthlyMaintenanceInr}
                      onChange={(e) => setMonthlyMaintenanceInr(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                      placeholder="e.g. 4500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Property Description & Remarks
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    placeholder="Highlight special features (e.g. corner unit, vastu compliant, garden view, high-end woodwork)..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Photos & Final Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Photos & Final Review</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add property photo links and double-check your specifications before submission.
                </p>
              </div>

              {/* Compressed Photo Upload Zone */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800">
                      Upload Photos from Device (Camera or Gallery)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Photos are automatically compressed (max 1600px) & sanitized (EXIF/GPS metadata stripped for security).
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {photoUrls.length} / 12 photos
                  </span>
                </div>

                {/* File Upload Box */}
                <label className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  compressingPhotos 
                    ? 'bg-blue-50/50 border-[#0176D3]' 
                    : 'border-slate-300 hover:border-[#0176D3] bg-white hover:bg-blue-50/20'
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={compressingPhotos || photoUrls.length >= 12}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {compressingPhotos ? (
                    <div className="flex flex-col items-center space-y-2 py-2">
                      <Loader2 className="w-6 h-6 text-[#0176D3] animate-spin" />
                      <p className="text-xs font-medium text-slate-700">Compressing & sanitizing photos...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1.5 py-1">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#0176D3]">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-800">
                        {photoUrls.length >= 12 ? 'Photo Limit Reached' : 'Click to Upload Photos'}
                      </p>
                      <p className="text-[10px] text-slate-400">JPG, PNG, WebP up to 15MB each</p>
                    </div>
                  )}
                </label>

                {/* Photo Previews Grid */}
                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-4/3 shadow-2xs">
                        <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                          Photo {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(i)}
                          className="absolute top-1 right-1 p-1.5 bg-black/70 hover:bg-rose-600 text-white rounded-md transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Web Link Input */}
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="block text-[11px] font-medium text-slate-600 mb-1.5">
                    Or paste an image web link:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newPhotoInput}
                      onChange={(e) => setNewPhotoInput(e.target.value)}
                      placeholder="https://example.com/property-photo.jpg"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary Review Card */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Summary Review
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Owner:</span>
                    <span className="font-semibold text-slate-900">{ownerName} ({ownerPhone})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Property:</span>
                    <span className="font-semibold text-slate-900">{bhkType} {propertyType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Society:</span>
                    <span className="font-semibold text-slate-900">{projectName}, {localityName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Super Built-up Area:</span>
                    <span className="font-semibold text-slate-900">{superBuiltUpSqft} sq.ft.</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Floor / Facing:</span>
                    <span className="font-semibold text-slate-900">Floor {unitFloor} of {totalFloors} • {facing}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Target Price:</span>
                    <span className="font-bold text-[#0176D3]">{formatINRWords(askingPriceInr)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons (Desktop + Mobile Sticky Bar) */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between pb-20 sm:pb-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            ) : <div />}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-lg bg-[#0176D3] hover:bg-[#005fb2] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={saving || compressingPhotos}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Details...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Property Details</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Mobile Sticky Action Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 flex items-center justify-between shadow-lg">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={saving}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div className="text-[11px] text-slate-400 font-medium">Step {currentStep} of 6</div>}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-[#0176D3] text-white text-xs font-semibold shadow-xs"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={saving || compressingPhotos}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit Details'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
