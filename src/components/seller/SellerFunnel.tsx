import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  FileText, 
  Lock, 
  AlertCircle,
  HelpCircle,
  Clock,
  Eye,
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import { BHKType, KhataType, OccupancyStatus, PropertyFacing } from '../../core/types/entities';

// Curated Bengaluru Localities
const BENGALURU_LOCALITIES = [
  { id: 'kanakapura-road', name: 'Kanakapura Road, South Bengaluru' },
  { id: 'whitefield', name: 'Whitefield / ITPL, East Bengaluru' },
  { id: 'sarjapur-road', name: 'Sarjapur Road, South-East Bengaluru' },
  { id: 'bellandur-outer-ring-road', name: 'Bellandur / ORR, South-East Bengaluru' },
  { id: 'thanisandra-hebbal', name: 'Thanisandra / Hebbal, North Bengaluru' },
  { id: 'panathur-balagere', name: 'Panathur / Balagere, East Bengaluru' },
  { id: 'electronic-city', name: 'Electronic City Phases 1 & 2' },
  { id: 'bannerghatta-road', name: 'Bannerghatta Road, South Bengaluru' },
];

export function SellerFunnel() {
  // Current active step in seller onboarding: 1 to 6
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // STEP 1 STATE: Initial Lead Data
  const [leadData, setLeadData] = useState({
    ownerName: '',
    phone: '',
    societyName: '',
    localityId: 'kanakapura-road',
    bhkType: '3BHK' as BHKType,
    expectedPriceLakhs: '',
    dpdpConsent: false,
    marketingConsent: false,
  });

  // STEP 2 STATE: OTP
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(60);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // STEP 3 STATE: Detailed Private Property Info
  const [propertyData, setPropertyData] = useState({
    unitNumber: 'Tower 4, Flat 1102',
    wingTower: 'Tower 4',
    unitFloor: 11,
    totalFloors: 18,
    bhkType: '3BHK' as BHKType,
    superBuiltUpSqft: 1850,
    carpetAreaSqft: 1420,
    balconies: 2,
    bathrooms: 3,
    facing: 'EAST' as PropertyFacing,
    coveredParking: 1,
    khataType: 'A_KHATA' as KhataType,
    occupancyStatus: 'VACANT' as OccupancyStatus,
    askingPriceCrores: '1.65',
    reservePriceCrores: '1.58', // Bottom line confidential
  });

  // STEP 4 STATE: Documents
  const [uploadedDocs, setUploadedDocs] = useState<{ type: string; name: string; size: string; status: string }[]>([
    { type: 'Sale Deed (Registered)', name: 'registered_sale_deed_2018.pdf', size: '4.2 MB', status: 'UPLOADED_PENDING_REVIEW' }
  ]);

  // STEP 1 SUBMIT
  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validation
    if (!leadData.ownerName.trim()) {
      setErrorMessage('Please enter your full name as on property records.');
      return;
    }
    const cleanPhone = leadData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
      return;
    }
    if (!leadData.societyName.trim()) {
      setErrorMessage('Please enter your Apartment complex or Society name.');
      return;
    }
    if (!leadData.dpdpConsent) {
      setErrorMessage('You must review and accept the statutory privacy notice under the DPDP Act.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(2);
    }, 600);
  };

  // STEP 2 SUBMIT: OTP Verification
  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (otpValue !== '123456') {
      setErrorMessage('Invalid verification code. For this sandbox test, use code: 123456');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsOtpVerified(true);
      setCurrentStep(3);
    }, 500);
  };

  // STEP 3 SUBMIT: Property Details
  const handlePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!propertyData.unitNumber.trim()) {
      setErrorMessage('Flat / Unit number is required for confidential title verification.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(4);
    }, 500);
  };

  // STEP 4: Document upload simulation
  const handleMockUpload = (docType: string) => {
    setUploadedDocs(prev => [
      ...prev,
      {
        type: docType,
        name: `${docType.toLowerCase().replace(/[\s()]+/g, '_')}_verified.pdf`,
        size: '2.8 MB',
        status: 'UPLOADED_PENDING_REVIEW'
      }
    ]);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Brand Header */}
        <header className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#244B8F] flex items-center justify-center text-white font-bold text-xl">
              SG
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#172033] font-['Montserrat'] block">
                SellMyGhar
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Bengaluru Apartment Resale Platform
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-medium text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
            <Lock className="w-3.5 h-3.5 text-[#244B8F]" />
            <span>Private & DPDP Protected</span>
          </div>
        </header>

        {/* Progress Bar & Stage Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            <span>Step {currentStep} of 6: {
              currentStep === 1 ? 'Basic Enquiry' :
              currentStep === 2 ? 'Phone Verification' :
              currentStep === 3 ? 'Property Specifications' :
              currentStep === 4 ? 'Document Upload' :
              currentStep === 5 ? 'Verification Status' : 'Public Listing Preview'
            }</span>
            <span>{Math.round((currentStep / 6) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#244B8F] transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div role="alert" className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: Top-of-Funnel Seller Enquiry Form                     */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#172033] font-['Montserrat'] mb-2">
                Sell your Bengaluru apartment with genuine, verified buyers
              </h1>
              <p className="text-sm text-gray-600 leading-relaxed">
                No unsolicited broker spam. We inspect, market, and coordinate visits only with qualified buyers.
              </p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-5">
              <div>
                <label htmlFor="ownerName" className="block text-sm font-semibold text-[#172033] mb-1.5">
                  Your Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="ownerName"
                  type="text"
                  required
                  placeholder="e.g., Rajesh Kumar"
                  value={leadData.ownerName}
                  onChange={(e) => setLeadData({ ...leadData, ownerName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent bg-white"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-[#172033] mb-1.5">
                  Mobile Number (for OTP verification) <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-sm font-medium text-gray-500">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                    className="w-full pl-14 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Your number is strictly confidential and never shared publicly.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="societyName" className="block text-sm font-semibold text-[#172033] mb-1.5">
                    Apartment / Complex Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="societyName"
                    type="text"
                    required
                    placeholder="e.g., Prestige Falcon City"
                    value={leadData.societyName}
                    onChange={(e) => setLeadData({ ...leadData, societyName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="locality" className="block text-sm font-semibold text-[#172033] mb-1.5">
                    Locality in Bengaluru <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="locality"
                    value={leadData.localityId}
                    onChange={(e) => setLeadData({ ...leadData, localityId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent bg-white"
                  >
                    {BENGALURU_LOCALITIES.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bhkType" className="block text-sm font-semibold text-[#172033] mb-1.5">
                    Apartment Type <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="bhkType"
                    value={leadData.bhkType}
                    onChange={(e) => setLeadData({ ...leadData, bhkType: e.target.value as BHKType })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent bg-white"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK+">4 BHK+</option>
                    <option value="PENTHOUSE">Penthouse</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="expectedPrice" className="block text-sm font-semibold text-[#172033] mb-1.5">
                    Expected Price (₹ Lakhs, Optional)
                  </label>
                  <input
                    id="expectedPrice"
                    type="number"
                    placeholder="e.g., 165 (for 1.65 Cr)"
                    value={leadData.expectedPriceLakhs}
                    onChange={(e) => setLeadData({ ...leadData, expectedPriceLakhs: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#244B8F] focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* DPDP Statutory Consent Box (Separate, Unchecked by Default) */}
              <div className="pt-3 border-t border-gray-100 space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadData.dpdpConsent}
                    onChange={(e) => setLeadData({ ...leadData, dpdpConsent: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#244B8F] focus:ring-[#244B8F]"
                  />
                  <span className="text-xs text-gray-700 leading-normal">
                    I consent to SellMyGhar contacting me regarding the resale of my apartment and processing my data as per the{' '}
                    <a href="/privacy-policy" target="_blank" className="text-[#244B8F] underline font-medium">
                      DPDP Privacy Notice
                    </a>. I understand I can withdraw consent at any time. <span className="text-red-600">*</span>
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadData.marketingConsent}
                    onChange={(e) => setLeadData({ ...leadData, marketingConsent: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#244B8F] focus:ring-[#244B8F]"
                  />
                  <span className="text-xs text-gray-500 leading-normal">
                    (Optional) Keep me informed about Bengaluru real estate market price trends and resale quarterly insights.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 flex items-center justify-center space-x-2 py-3.5 px-6 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors duration-150 shadow-xs cursor-pointer"
              >
                <span>{isLoading ? 'Submitting...' : 'Continue to Phone Verification'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: Mobile Number OTP Verification                       */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <div className="text-center max-w-md mx-auto mb-6">
              <div className="w-12 h-12 bg-blue-50 text-[#244B8F] rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mb-1">
                Verify Your Mobile Number
              </h2>
              <p className="text-sm text-gray-600">
                We sent a 6-digit code to <span className="font-semibold text-gray-900">+91 {leadData.phone}</span>.
              </p>
              <div className="mt-2 text-xs bg-amber-50 text-amber-900 p-2 rounded border border-amber-200">
                Sandbox Test Mode: Enter code <strong>123456</strong>
              </div>
            </div>

            <form onSubmit={handleOtpVerify} className="max-w-md mx-auto space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-center text-[#172033] mb-2">
                  Enter 6-digit OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="123456"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-2xl font-mono py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValue.length !== 6}
                className="w-full py-3.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage('New OTP dispatched via SMS.')}
                  className="text-[#244B8F] font-semibold hover:underline cursor-pointer"
                >
                  Resend OTP (30s)
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: Detailed Property Specifications (Private Records)   */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mb-1">
                  Apartment Details & Pricing
                </h2>
                <p className="text-xs text-gray-600">
                  Unit numbers and bottom-line pricing are kept strictly private.
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Phone Verified
              </span>
            </div>

            <form onSubmit={handlePropertySubmit} className="space-y-5">
              {/* Sensitive Private Identifiers */}
              <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#244B8F] mb-3">
                  <Lock className="w-4 h-4" />
                  <span>Confidential Unit Identifiers (Never Public)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tower / Wing <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={propertyData.wingTower}
                      onChange={(e) => setPropertyData({ ...propertyData, wingTower: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Exact Flat / Unit Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={propertyData.unitNumber}
                      onChange={(e) => setPropertyData({ ...propertyData, unitNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Floor and Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Floor</label>
                  <input
                    type="number"
                    value={propertyData.unitFloor}
                    onChange={(e) => setPropertyData({ ...propertyData, unitFloor: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Floors</label>
                  <input
                    type="number"
                    value={propertyData.totalFloors}
                    onChange={(e) => setPropertyData({ ...propertyData, totalFloors: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">SBUA (sq.ft)</label>
                  <input
                    type="number"
                    value={propertyData.superBuiltUpSqft}
                    onChange={(e) => setPropertyData({ ...propertyData, superBuiltUpSqft: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Carpet (sq.ft)</label>
                  <input
                    type="number"
                    value={propertyData.carpetAreaSqft}
                    onChange={(e) => setPropertyData({ ...propertyData, carpetAreaSqft: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  />
                </div>
              </div>

              {/* Legal & Katha status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Khata Type</label>
                  <select
                    value={propertyData.khataType}
                    onChange={(e) => setPropertyData({ ...propertyData, khataType: e.target.value as KhataType })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  >
                    <option value="A_KHATA">A Khata (BBMP)</option>
                    <option value="E_KHATA">E-Khata</option>
                    <option value="B_KHATA">B Khata</option>
                    <option value="PANCHAYAT">Panchayat 11B</option>
                    <option value="NOT_SURE">Need Legal Help</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Occupancy</label>
                  <select
                    value={propertyData.occupancyStatus}
                    onChange={(e) => setPropertyData({ ...propertyData, occupancyStatus: e.target.value as OccupancyStatus })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  >
                    <option value="VACANT">Vacant (Ready to move)</option>
                    <option value="SELF_OCCUPIED">Self-Occupied</option>
                    <option value="TENANT_OCCUPIED">Tenant Occupied</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Main Door Facing</label>
                  <select
                    value={propertyData.facing}
                    onChange={(e) => setPropertyData({ ...propertyData, facing: e.target.value as PropertyFacing })}
                    className="w-full px-3 py-2 rounded border border-gray-300 text-sm bg-white"
                  >
                    <option value="EAST">East</option>
                    <option value="NORTH">North</option>
                    <option value="NORTH_EAST">North-East</option>
                    <option value="WEST">West</option>
                    <option value="SOUTH">South</option>
                  </select>
                </div>
              </div>

              {/* Pricing Strategy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Public Asking Price (₹ Crores) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyData.askingPriceCrores}
                    onChange={(e) => setPropertyData({ ...propertyData, askingPriceCrores: e.target.value })}
                    className="w-full px-4 py-2.5 rounded border border-gray-300 text-sm bg-white font-semibold"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">Visible on the public listing.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>Reserve Floor Price (₹ Crores)</span>
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">Confidential</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyData.reservePriceCrores}
                    onChange={(e) => setPropertyData({ ...propertyData, reservePriceCrores: e.target.value })}
                    className="w-full px-4 py-2.5 rounded border border-gray-300 text-sm bg-white font-semibold text-gray-800"
                  />
                  <span className="text-[11px] text-gray-500 mt-1 block">Your bottom line. Kept private to protect negotiations.</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-3 px-6 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors duration-150 cursor-pointer"
                >
                  Save & Proceed to Documents
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: Secure Private Document Upload                       */}
        {/* ============================================================ */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#244B8F] mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Private Cloud Storage (Google Cloud Mumbai asia-south1)</span>
              </div>
              <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mb-1">
                Upload Ownership Documents for Verification
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                Documents are stored in a private bucket with AES-256 encryption. They are accessible only to our legal verification team and are never published online.
              </p>
            </div>

            {/* Document Checklist */}
            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-[#244B8F]" />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Registered Sale Deed</span>
                    <span className="text-xs text-gray-500">Proves current ownership & registration number</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMockUpload('Registered Sale Deed')}
                  className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-gray-300 hover:bg-gray-100 text-[#244B8F] cursor-pointer"
                >
                  Upload PDF
                </button>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-[#244B8F]" />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Latest Khata Certificate / Extract</span>
                    <span className="text-xs text-gray-500">BBMP A-Khata or E-Khata certificate</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMockUpload('Latest Khata Certificate')}
                  className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-gray-300 hover:bg-gray-100 text-[#244B8F] cursor-pointer"
                >
                  Upload PDF
                </button>
              </div>

              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-[#244B8F]" />
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Encumbrance Certificate (EC)</span>
                    <span className="text-xs text-gray-500">From Kaveri Online Services (Nil encumbrance)</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleMockUpload('Encumbrance Certificate')}
                  className="text-xs font-semibold px-3 py-1.5 rounded bg-white border border-gray-300 hover:bg-gray-100 text-[#244B8F] cursor-pointer"
                >
                  Upload PDF
                </button>
              </div>
            </div>

            {/* Uploaded File List */}
            {uploadedDocs.length > 0 && (
              <div className="mb-6 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Uploaded & Encrypted ({uploadedDocs.length} files)
                </h3>
                <div className="space-y-2">
                  {uploadedDocs.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-blue-50/50 border border-blue-100 text-xs">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">{doc.name}</span>
                        <span className="text-gray-500">({doc.size})</span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Pending Title Review
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="py-3 px-6 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors duration-150 cursor-pointer"
              >
                Submit for Verification
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 5: Verification Pipeline Status (Owner Dashboard)        */}
        {/* ============================================================ */}
        {currentStep === 5 && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 sm:p-8">
            <div className="text-center max-w-md mx-auto mb-8">
              <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-[#172033] font-['Montserrat'] mb-1">
                Property Submitted Successfully
              </h2>
              <p className="text-xs text-gray-600">
                Property ID: <span className="font-mono font-semibold">PROP-BLR-8492</span> • Assigned to Bengaluru South Operations Team
              </p>
            </div>

            {/* The 4-Tier Verification Ladder */}
            <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 space-y-4 mb-6">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Verification Pipeline Status
              </h3>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-900 block">Level 1: Phone & Identity Verified</span>
                    <span className="text-xs text-gray-500">OTP verified + Owner self-declaration recorded.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-[#244B8F] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold animate-pulse">
                    2
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-[#244B8F] block">Level 2: Title Document Review (In Progress)</span>
                    <span className="text-xs text-gray-600">Our legal desk is verifying the Sale Deed, Khata certificate, and Kaveri EC.</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 opacity-60">
                  <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    3
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-800 block">Level 3: Physical Site Inspection</span>
                    <span className="text-xs text-gray-500">SellMyGhar relationship manager coordinates on-site visit & professional photography.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start space-x-3 text-xs text-blue-900 mb-6">
              <Clock className="w-4 h-4 text-[#244B8F] shrink-0 mt-0.5" />
              <div>
                <strong>What happens next?</strong> A dedicated SellMyGhar manager will call you within 4 business hours to confirm your title verification and schedule photography.
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Back to Documents
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="py-3 px-6 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold text-sm transition-colors duration-150 flex items-center space-x-2 cursor-pointer"
              >
                <span>View Public Listing Projection</span>
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 6: Public Listing Projection Preview (The Output)       */}
        {/* ============================================================ */}
        {currentStep === 6 && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between text-xs">
              <span className="font-mono">PUBLIC PREVIEW (Sanitized for Buyers)</span>
              <span className="bg-green-600 text-white font-semibold px-2 py-0.5 rounded text-[10px]">
                Zero Private PII Leaked
              </span>
            </div>

            <div className="p-6 sm:p-8">
              {/* Sanitization Security Audit Box */}
              <div className="mb-6 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Sanitization Verification Passed:</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  • Flat number <strong>"{propertyData.unitNumber}"</strong> was stripped and replaced with floor band: <strong>"Mid-Higher Floor (Floor 9-14)"</strong>.
                  <br />• Reserve floor price of <strong>₹{propertyData.reservePriceCrores} Cr</strong> is confidential and excluded from public payloads.
                  <br />• Owner phone number and private deed URLs are completely omitted.
                </p>
              </div>

              {/* Sample Public Listing Card */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                <div className="h-48 sm:h-64 bg-gray-800 relative flex items-center justify-center text-white">
                  <img 
                    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80" 
                    alt="Sanitized living room" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#244B8F] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xs">
                    DOCS CHECKED
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    4 Photos Verified
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#172033] font-['Montserrat']">
                        {propertyData.bhkType} Apartment in {leadData.societyName}
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Kanakapura Road, South Bengaluru • Mid-Higher Floor (Floor 9–14)
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#244B8F] font-['Montserrat']">
                        ₹{propertyData.askingPriceCrores} Cr
                      </div>
                      <div className="text-[11px] text-gray-500">
                        ₹{Math.round((parseFloat(propertyData.askingPriceCrores) * 10000000) / propertyData.superBuiltUpSqft).toLocaleString('en-IN')}/sq.ft
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-3 border-y border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Super Area</span>
                      <span className="font-semibold text-gray-900">{propertyData.superBuiltUpSqft} sq.ft</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Carpet Area</span>
                      <span className="font-semibold text-gray-900">{propertyData.carpetAreaSqft} sq.ft</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase">Facing</span>
                      <span className="font-semibold text-gray-900">{propertyData.facing}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                    <span>A Khata (BBMP) • 1 Covered Car Park • Vacant Possession</span>
                    <button
                      type="button"
                      onClick={() => alert('In Stage 4, this triggers the Buyer Enquiry and Visit Booking flow!')}
                      className="px-4 py-2 rounded bg-[#244B8F] hover:bg-[#1B396E] text-white font-semibold cursor-pointer"
                    >
                      Book Physical Visit
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-[#244B8F] hover:underline cursor-pointer"
                >
                  ← Restart Funnel Demo
                </button>
                <span className="text-xs text-gray-500">
                  Ready for Stage 4: Public Discovery & Buyer Workflow
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
