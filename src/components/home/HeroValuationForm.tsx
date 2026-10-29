import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Phone, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft,
  ShieldCheck, 
  Clock, 
  FileText, 
  Users, 
  Calendar,
  MessageSquare,
  Search
} from 'lucide-react';
import { searchSocieties, SocietyItem } from '../../data/bengaluruData';
import { trackEvent } from '../../utils/analytics';

interface HeroValuationFormProps {
  onSuccess?: (leadData: any) => void;
  className?: string;
}

export const HeroValuationForm: React.FC<HeroValuationFormProps> = ({ 
  onSuccess,
  className = '' 
}) => {
  // Current active step: 1 = Property Details, 2 = Contact Details, 3 = Thank You
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Property Details
  const [bhkType, setBhkType] = useState<string>('3 BHK');
  const [societySearch, setSocietySearch] = useState<string>('');
  const [selectedSociety, setSelectedSociety] = useState<SocietyItem | null>(null);
  const [societySuggestions, setSocietySuggestions] = useState<SocietyItem[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [propertyType, setPropertyType] = useState<'Apartment' | 'Villa' | 'Penthouse'>('Apartment');
  const [currentStatus, setCurrentStatus] = useState<'Occupied' | 'Vacant' | 'Under Construction'>('Occupied');

  // Step 2: Contact Details
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [preferredCallTime, setPreferredCallTime] = useState<string>('Anytime');
  const [termsAgreed, setTermsAgreed] = useState<boolean>(true);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<{
    referenceId: string;
    name: string;
    society: string;
    bhk: string;
    phone: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle society search autocomplete
  useEffect(() => {
    if (societySearch.trim().length >= 2) {
      const results = searchSocieties(societySearch);
      setSocietySuggestions(results.slice(0, 6));
      setIsDropdownOpen(results.length > 0);
    } else {
      setSocietySuggestions([]);
      setIsDropdownOpen(false);
    }
  }, [societySearch]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSociety = (society: SocietyItem) => {
    setSelectedSociety(society);
    setSocietySearch(`${society.name}, ${society.locality}`);
    setIsDropdownOpen(false);
  };

  // Step 1 validation
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedSociety = societySearch.trim();
    if (!trimmedSociety || trimmedSociety.length < 2) {
      setErrorMessage('Please enter your Apartment or Society name.');
      return;
    }

    trackEvent('VALUATION_FORM_STEP1_COMPLETE', {
      bhk: bhkType,
      society: trimmedSociety,
      type: propertyType,
      status: currentStatus
    });

    setStep(2);
  };

  // Step 2 final submission
  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!termsAgreed) {
      setErrorMessage('Please agree to the Terms & Conditions to proceed.');
      return;
    }

    setLoading(true);

    try {
      const normalizedBhk = bhkType.replace(/\s+/g, '');
      const societyVal = selectedSociety ? selectedSociety.name : societySearch.split(',')[0].trim();
      const localityVal = selectedSociety ? selectedSociety.locality : (societySearch.split(',')[1]?.trim() || 'Bengaluru');

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          phone: cleanPhone,
          email: email.trim() || undefined,
          societyName: societyVal,
          locality: localityVal,
          localityOrSociety: `${societyVal}, ${localityVal}`,
          bhkType: normalizedBhk,
          intent: 'SELL',
          notes: `Resale Valuation Request • Type: ${propertyType} • Status: ${currentStatus} • Preferred Call Time: ${preferredCallTime} • Source: Homepage Hero Form`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request. Please try again.');
      }

      const refId = data.referenceId || data.leadId || `SMG-VAL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      setSubmittedLead({
        referenceId: refId,
        name: trimmedName,
        society: societyVal,
        bhk: bhkType,
        phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
      });

      trackEvent('VALUATION_FORM_SUBMITTED', {
        referenceId: refId,
        bhk: bhkType,
        society: societyVal,
        locality: localityVal
      });

      if (onSuccess) {
        onSuccess(data);
      }

      setStep(3);
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please call our RM desk directly at +91 8217873708.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setStep(1);
    setSocietySearch('');
    setSelectedSociety(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setSubmittedLead(null);
    setErrorMessage(null);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-7 text-slate-800 transition-all ${className}`}>
      
      {/* Header Info */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
            Get Your Free Resale Valuation
          </h3>
          {step < 3 && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-sky-50 text-[#0073E6] border border-sky-100 rounded-full">
              Step {step} of 2
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {step === 1 && 'Tell us about your apartment. It takes less than a minute.'}
          {step === 2 && 'Where can our property experts reach you with your valuation?'}
          {step === 3 && 'Request received successfully.'}
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ================= STEP 1: PROPERTY DETAILS ================= */}
      {step === 1 && (
        <form onSubmit={handleProceedToStep2} className="space-y-4">
          
          {/* 1. BHK Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select BHK Configuration <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'].map((bhk) => (
                <button
                  type="button"
                  key={bhk}
                  onClick={() => setBhkType(bhk)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                    bhkType === bhk
                      ? 'bg-[#0073E6] text-white border-[#0073E6] shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {bhk}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Apartment / Society Autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Apartment / Society Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={societySearch}
                onChange={(e) => {
                  setSocietySearch(e.target.value);
                  setSelectedSociety(null);
                }}
                onFocus={() => {
                  if (societySuggestions.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="e.g. Prestige Shantiniketan, Sobha Dream Acres..."
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6] transition-all"
              />
            </div>

            {/* Suggestions Dropdown */}
            {isDropdownOpen && societySuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {societySuggestions.map((soc) => (
                  <button
                    type="button"
                    key={soc.id}
                    onClick={() => handleSelectSociety(soc)}
                    className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-sky-50 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 group-hover:text-[#0073E6]">{soc.name}</span>
                      <span className="text-[11px] text-slate-500 block">{soc.locality} • {soc.zone} Zone</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 group-hover:text-[#0073E6]">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Apartment Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Property Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Apartment', 'Villa', 'Penthouse'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setPropertyType(t)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                    propertyType === t
                      ? 'bg-sky-50 text-[#0073E6] border-[#0073E6] font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Current Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Current Occupancy Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Occupied', 'Vacant', 'Under Construction'] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setCurrentStatus(s)}
                  className={`py-2 px-1 text-[11px] sm:text-xs font-semibold rounded-xl border text-center transition-all ${
                    currentStatus === s
                      ? 'bg-sky-50 text-[#0073E6] border-[#0073E6] font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Step 1 Next Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Your property details are safe with us. No obligation.</span>
          </div>

        </form>
      )}

      {/* ================= STEP 2: CONTACT DETAILS ================= */}
      {step === 2 && (
        <form onSubmit={handleSubmitFinal} className="space-y-4">
          
          {/* Summary Pill of Step 1 */}
          <div className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <div className="truncate pr-2">
              <span className="font-bold text-slate-800">{bhkType} {propertyType}</span>
              <span className="text-slate-500 block truncate">{societySearch}</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[#0073E6] hover:underline text-xs font-bold shrink-0 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Edit</span>
            </button>
          </div>

          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6] transition-all"
              />
            </div>
          </div>

          {/* 2. Mobile Number with +91 Prefix */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex">
              <div className="flex items-center space-x-1.5 px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-xs font-bold text-slate-700 shrink-0">
                <span className="text-base leading-none">🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-r-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6] transition-all"
              />
            </div>
          </div>

          {/* 3. Email (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6] transition-all"
            />
          </div>

          {/* 4. Preferred Time for Call */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Preferred Time for Call
            </label>
            <select
              value={preferredCallTime}
              onChange={(e) => setPreferredCallTime(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6] transition-all"
            >
              <option value="Anytime">Anytime (Quickest Response)</option>
              <option value="Morning (9 AM - 12 PM)">Morning (9 AM – 12 PM)</option>
              <option value="Afternoon (12 PM - 4 PM)">Afternoon (12 PM – 4 PM)</option>
              <option value="Evening (4 PM - 8 PM)">Evening (4 PM – 8 PM)</option>
            </select>
          </div>

          {/* User Requested Terms & Condition Clause */}
          <div className="pt-1">
            <label className="flex items-start space-x-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-[#0073E6] focus:ring-[#0073E6]"
              />
              <span className="leading-relaxed">
                By clicking <strong className="text-slate-800">Get My Free Valuation</strong>, you agree to our{' '}
                <a href="#/terms" target="_blank" rel="noreferrer" className="text-[#0073E6] hover:underline font-semibold">
                  Terms and Conditions
                </a>{' '}
                and privacy policy.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="space-y-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0073E6] hover:bg-[#005BB5] disabled:bg-slate-300 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Details...</span>
                </>
              ) : (
                <>
                  <span>Get My Free Valuation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors"
            >
              ← Back to Property Details
            </button>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>No spam calls. Only relevant property discussions.</span>
          </div>

        </form>
      )}

      {/* ================= STEP 3: THANK YOU & NEXT STEPS ================= */}
      {/* (User explicitly requested: "instead of Estimated value make ours as Thank You Our Team will Help You with estimted valuation") */}
      {step === 3 && submittedLead && (
        <div className="space-y-4 py-2 text-center sm:text-left">
          
          <div className="flex items-center justify-center sm:justify-start space-x-3 mb-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900">
                Thank You, {submittedLead.name}!
              </h4>
              <p className="text-xs font-mono text-slate-500">
                Ref ID: <strong className="text-[#0073E6]">{submittedLead.referenceId}</strong>
              </p>
            </div>
          </div>

          {/* User Requested Explicit Message Card */}
          <div className="p-4 bg-gradient-to-br from-sky-50 to-blue-50/60 border border-sky-100 rounded-2xl text-left space-y-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0073E6] block">
              Valuation Request Logged
            </span>
            <p className="text-sm font-bold text-slate-900 leading-snug">
              Our Team will Help You with your estimated valuation for {submittedLead.bhk} in {submittedLead.society}.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Based on recent registry data and active buyer demand, our senior relationship manager is preparing a customized valuation report.
            </p>
          </div>

          {/* What Happens Next? (From Reference Wireframe) */}
          <div className="pt-1 text-left space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              What Happens Next?
            </h5>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-[#0073E6] shrink-0 mt-0.5" />
                <span>Our property expert will call you within 30 minutes to discuss details.</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>You will receive a detailed market valuation report based on Sub-Registrar circle rates.</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Users className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>We will discuss genuine, pre-screened buyer options looking in your community.</span>
              </div>
              <div className="flex items-start space-x-2.5">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Optionally, we can schedule a free in-person property inspection.</span>
              </div>
            </div>
          </div>

          {/* Direct RM Desk Contact Actions */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="tel:+918217873708"
              className="py-2.5 px-3 bg-[#0073E6] hover:bg-[#005BB5] text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call RM: +91 8217873708</span>
            </a>
            <a
              href={`https://wa.me/918217873708?text=${encodeURIComponent(`Hello SellMyGhar Desk, I submitted my flat valuation request (Ref: ${submittedLead.referenceId}) for ${submittedLead.society}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full text-center py-1.5 text-xs text-slate-400 hover:text-slate-700 font-semibold transition-colors"
          >
            Submit Another Apartment
          </button>

        </div>
      )}

    </div>
  );
};
