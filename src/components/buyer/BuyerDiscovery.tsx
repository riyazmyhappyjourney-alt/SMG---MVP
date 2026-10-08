import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  MapPin, 
  SlidersHorizontal, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  X, 
  Compass, 
  Maximize2,
  Phone,
  Info
} from 'lucide-react';
import { PublicListingProjection, BHKType } from '../../core/types/entities';

// Mock Verified Curated Bengaluru Listings (Sanitized Projections from Stage 1 & 3)
const INITIAL_LISTINGS: PublicListingProjection[] = [
  {
    id: 'sgl-blr-9182',
    slug: '3bhk-prestige-falcon-city-kanakapura-road',
    project_name: 'Prestige Falcon City',
    locality_name: 'Kanakapura Road, South Bengaluru',
    bhk_type: '3BHK',
    super_built_up_sqft: 1850,
    carpet_area_sqft: 1420,
    floor_band: 'Mid-Higher Floor (Floors 9–14)',
    facing: 'EAST',
    bathrooms_count: 3,
    car_parks_count: 1,
    asking_price_inr: 16500000, // 1.65 Cr
    price_per_sqft_inr: 8918,
    photos: [
      {
        id: 'p1',
        cdn_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        caption: 'Well-lit living hall with balcony',
        is_cover: true,
        order: 1
      },
      {
        id: 'p2',
        cdn_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Master bedroom with wooden flooring',
        is_cover: false,
        order: 2
      }
    ],
    amenities: ['Clubhouse', 'Swimming Pool', 'EV Charging', 'Metro Walkable (500m)'],
    public_verification_badge: 'DOCS_CHECKED',
    status: 'ACTIVE',
    published_at: '2026-09-28T10:00:00Z',
  },
  {
    id: 'sgl-blr-4219',
    slug: '2bhk-sobha-dream-acres-panathur-balagere',
    project_name: 'Sobha Dream Acres',
    locality_name: 'Panathur / Balagere, East Bengaluru',
    bhk_type: '2BHK',
    super_built_up_sqft: 1205,
    carpet_area_sqft: 890,
    floor_band: 'Lower Floor (Floors 2–5)',
    facing: 'NORTH',
    bathrooms_count: 2,
    car_parks_count: 1,
    asking_price_inr: 10800000, // 1.08 Cr
    price_per_sqft_inr: 8962,
    photos: [
      {
        id: 'p3',
        cdn_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        caption: 'Modular kitchen and utility',
        is_cover: true,
        order: 1
      }
    ],
    amenities: ['Tennis Court', 'Clubhouse', 'Power Backup', 'Piped Gas'],
    public_verification_badge: 'INSPECTED',
    status: 'ACTIVE',
    published_at: '2026-09-29T14:30:00Z',
  },
  {
    id: 'sgl-blr-3081',
    slug: '3bhk-godrej-eternity-kanakapura-road',
    project_name: 'Godrej Eternity',
    locality_name: 'Kanakapura Road, South Bengaluru',
    bhk_type: '3BHK',
    super_built_up_sqft: 1620,
    carpet_area_sqft: 1230,
    floor_band: 'Top Floor (Floor 4/4 Low-Rise)',
    facing: 'NORTH_EAST',
    bathrooms_count: 3,
    car_parks_count: 2,
    asking_price_inr: 14200000, // 1.42 Cr
    price_per_sqft_inr: 8765,
    photos: [
      {
        id: 'p4',
        cdn_url: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        caption: 'Low-rise balcony view',
        is_cover: true,
        order: 1
      }
    ],
    amenities: ['Courtyard Garden', 'Gymnasium', 'Security 24/7', 'Solar Water'],
    public_verification_badge: 'OWNER_VERIFIED',
    status: 'ACTIVE',
    published_at: '2026-09-27T08:00:00Z',
  },
  {
    id: 'sgl-blr-7712',
    slug: '4bhk-brigade-cornerstone-utopia-varthur',
    project_name: 'Brigade Cornerstone Utopia',
    locality_name: 'Varthur / Whitefield, East Bengaluru',
    bhk_type: '4BHK+',
    super_built_up_sqft: 2450,
    carpet_area_sqft: 1890,
    floor_band: 'High Floor (Floors 16–22)',
    facing: 'EAST',
    bathrooms_count: 4,
    car_parks_count: 2,
    asking_price_inr: 28500000, // 2.85 Cr
    price_per_sqft_inr: 11632,
    photos: [
      {
        id: 'p5',
        cdn_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        caption: 'Spacious 4BHK panoramic layout',
        is_cover: true,
        order: 1
      }
    ],
    amenities: ['Multiplex', 'Integrated Retail', 'Olympic Pool', 'Tennis Academy'],
    public_verification_badge: 'DOCS_CHECKED',
    status: 'ACTIVE',
    published_at: '2026-09-29T16:00:00Z',
  }
];

export function BuyerDiscovery() {
  // Search & Filter State
  const [selectedBhk, setSelectedBhk] = useState<string>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<string>('ALL');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');
  const [maxBudgetLakhs, setMaxBudgetLakhs] = useState<number>(300);

  // Active Selected Listing for Detail Modal & Visit Booking
  const [activeListing, setActiveListing] = useState<PublicListingProjection | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);

  // Visit Booking Form State
  const [bookingStep, setBookingStep] = useState<'DETAILS' | 'OTP'>('DETAILS');
  const [buyerOtp, setBuyerOtp] = useState('');
  const [bookingData, setBookingData] = useState({
    buyerName: '',
    buyerPhone: '',
    selectedSlot: 'Saturday, 11:00 AM',
    fundingMode: 'PRE_APPROVED_LOAN' as const,
    buyingTimeline: 'IMMEDIATE_30_DAYS' as const,
    consentDpdp: false,
  });

  const [bookingSuccessRef, setBookingSuccessRef] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter computation
  const filteredListings = INITIAL_LISTINGS.filter(l => {
    if (selectedBhk !== 'ALL' && l.bhk_type !== selectedBhk) return false;
    if (selectedBadge !== 'ALL' && l.public_verification_badge !== selectedBadge) return false;
    if (selectedLocality !== 'ALL' && !l.locality_name.toLowerCase().includes(selectedLocality.toLowerCase())) return false;
    if ((l.asking_price_inr / 100000) > maxBudgetLakhs) return false;
    return true;
  });

  const handleVisitDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!bookingData.buyerName.trim()) {
      setBookingError('Please enter your full name.');
      return;
    }
    const cleanPhone = bookingData.buyerPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      setBookingError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!bookingData.consentDpdp) {
      setBookingError('You must provide consent for visit coordination under the DPDP Act.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingStep('OTP');
    }, 400);
  };

  const handleOtpConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (buyerOtp !== '123456') {
      setBookingError('Invalid verification code. For this sandbox test, enter code: 123456');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const mockRef = `VST-${Math.floor(1000 + Math.random() * 9000)}`;
      setBookingSuccessRef(mockRef);
    }, 500);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
    setBookingStep('DETAILS');
    setBuyerOtp('');
    setBookingSuccessRef(null);
    setBookingError(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#244B8F] block mb-1">
                Bengaluru Resale Marketplace
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-['Montserrat'] text-[#172033]">
                Verified Resale Apartments in Bengaluru
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Direct owner listings with audited title documents, transparent pricing, and zero fake broker listings.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-gray-700 bg-white px-3.5 py-2 rounded-lg border border-gray-200 shadow-xs shrink-0 self-start">
              <ShieldCheck className="w-4 h-4 text-[#244B8F]" />
              <span>{filteredListings.length} Verified Apartments Available</span>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 sm:p-5 mb-8">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter by Requirements</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* BHK Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Apartment Size (BHK)</label>
              <div className="flex flex-wrap gap-1.5">
                {['ALL', '2BHK', '3BHK', '4BHK+'].map(bhk => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => setSelectedBhk(bhk)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                      selectedBhk === bhk
                        ? 'bg-[#244B8F] text-white font-semibold'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {bhk}
                  </button>
                ))}
              </div>
            </div>

            {/* Locality Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Bengaluru Zone</label>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
              >
                <option value="ALL">All Bengaluru Zones</option>
                <option value="Kanakapura">South Bengaluru (Kanakapura Rd)</option>
                <option value="East">East Bengaluru (Panathur / Varthur)</option>
                <option value="North">North Bengaluru (Hebbal / Thanisandra)</option>
              </select>
            </div>

            {/* Verification Badge Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Verification Level</label>
              <select
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
              >
                <option value="ALL">All Verification Badges</option>
                <option value="DOCS_CHECKED">Docs Checked (Title & EC)</option>
                <option value="INSPECTED">Physically Inspected</option>
                <option value="OWNER_VERIFIED">Owner Verified</option>
              </select>
            </div>

            {/* Max Budget Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                <span>Max Budget:</span>
                <span className="text-[#244B8F]">₹{(maxBudgetLakhs / 100).toFixed(2)} Cr</span>
              </div>
              <input
                type="range"
                min="80"
                max="350"
                step="10"
                value={maxBudgetLakhs}
                onChange={(e) => setMaxBudgetLakhs(parseInt(e.target.value))}
                className="w-full accent-[#244B8F] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Listing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {filteredListings.map(listing => (
            <div 
              key={listing.id}
              className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Image & Badge Header */}
              <div className="relative h-56 bg-gray-900 overflow-hidden">
                <img 
                  src={listing.photos[0]?.cdn_url} 
                  alt={listing.project_name}
                  className="w-full h-full object-cover"
                />
                {/* Verification Badge with Legal Disclaimers Flag */}
                <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-[#244B8F] text-white text-xs font-semibold px-2.5 py-1 rounded shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{listing.public_verification_badge.replace('_', ' ')}</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[11px] px-2 py-0.5 rounded">
                  {listing.floor_band}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold font-['Montserrat'] text-[#172033]">
                        {listing.bhk_type} Apartment in {listing.project_name}
                      </h2>
                      <div className="flex items-center text-xs text-gray-600 mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
                        <span>{listing.locality_name}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold font-['Montserrat'] text-[#244B8F]">
                        ₹{(listing.asking_price_inr / 10000000).toFixed(2)} Cr
                      </div>
                      <div className="text-[11px] text-gray-500">
                        ₹{listing.price_per_sqft_inr.toLocaleString('en-IN')}/sq.ft
                      </div>
                    </div>
                  </div>

                  {/* Sanitized Specification Pills */}
                  <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-gray-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">Super Built-up</span>
                      <span className="font-semibold text-gray-800">{listing.super_built_up_sqft} sq.ft</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">Carpet Area</span>
                      <span className="font-semibold text-gray-800">{listing.carpet_area_sqft} sq.ft</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 block">Facing</span>
                      <span className="font-semibold text-gray-800">{listing.facing}</span>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {listing.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {amenity}
                      </span>
                    ))}
                    {listing.amenities.length > 3 && (
                      <span className="text-[11px] text-gray-500 px-1 py-0.5">
                        +{listing.amenities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    ID: <strong className="font-mono text-gray-700">{listing.id}</strong>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveListing(listing);
                        setIsBookingModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Physical Visit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Badges Statutory Definition & Transparency Footer */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-[#172033] font-['Montserrat']">
            <Info className="w-4 h-4 text-[#244B8F]" />
            <span>SellMyGhar Verification Standards & Buyer Transparency Notice</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <span className="font-semibold text-gray-900 block mb-1">OWNER VERIFIED</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Owner mobile OTP verified, self-declaration of ownership registered, and direct seller communication established.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <span className="font-semibold text-gray-900 block mb-1">DOCS CHECKED</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Registered Sale Deed, BBMP Khata, and Kaveri Encumbrance Certificate cross-checked by operational legal desk for title consistency.
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <span className="font-semibold text-gray-900 block mb-1">INSPECTED</span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Physical property inspection conducted by a SellMyGhar manager. Flat layout, amenities, and vacant possession status visually confirmed.
              </p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 italic pt-1">
            * Disclaimer: SellMyGhar assists in verification and facilitation. Buyers are advised to engage independent legal counsel for conveyancing prior to sub-registrar deed execution.
          </p>
        </div>

        {/* ============================================================ */}
        {/* MODAL: Buyer Visit Booking Sheet                             */}
        {/* ============================================================ */}
        {isBookingModalOpen && activeListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div 
              role="dialog" 
              aria-modal="true" 
              className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gray-50 border-b border-gray-200 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#244B8F] block">
                    Property Visit Coordination
                  </span>
                  <h3 className="text-base font-bold font-['Montserrat'] text-[#172033] mt-0.5">
                    Schedule Visit to {activeListing.project_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeListing.bhk_type} • {activeListing.floor_band} • ₹{(activeListing.asking_price_inr / 10000000).toFixed(2)} Cr
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {bookingSuccessRef ? (
                  <div className="text-center py-4 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 font-['Montserrat']">
                        Visit Request Submitted
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Booking Reference: <strong className="font-mono text-[#244B8F]">{bookingSuccessRef}</strong>
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 text-left">
                      <strong>Next Step:</strong> A SellMyGhar manager will coordinate with the apartment owner to confirm keys/access for <strong>{bookingData.selectedSlot}</strong>, and will contact you via WhatsApp / Call.
                    </div>
                    <button
                      type="button"
                      onClick={closeBookingModal}
                      className="w-full py-2.5 rounded-lg bg-[#244B8F] text-white text-xs font-semibold hover:bg-[#1B396E] cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                ) : bookingStep === 'DETAILS' ? (
                  <form onSubmit={handleVisitDetailsSubmit} className="space-y-4">
                    {bookingError && (
                      <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{bookingError}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Your Full Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Ananya Sharma"
                        value={bookingData.buyerName}
                        onChange={(e) => setBookingData({ ...bookingData, buyerName: e.target.value })}
                        className="w-full px-3 py-2 rounded border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Mobile Number (for Visit Verification & Coordination) <span className="text-red-600">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-semibold">+91</span>
                        <input
                          type="tel"
                          maxLength={10}
                          required
                          placeholder="9876543210"
                          value={bookingData.buyerPhone}
                          onChange={(e) => setBookingData({ ...bookingData, buyerPhone: e.target.value })}
                          className="w-full pl-11 pr-3 py-2 rounded border border-gray-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 mt-0.5 block">
                        Requires OTP verification to ensure owner safety before visits are confirmed.
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Preferred Visit Slot
                        </label>
                        <select
                          value={bookingData.selectedSlot}
                          onChange={(e) => setBookingData({ ...bookingData, selectedSlot: e.target.value })}
                          className="w-full px-3 py-2 rounded border border-gray-300 text-xs bg-white"
                        >
                          <option value="Saturday, 11:00 AM">Saturday, 11:00 AM</option>
                          <option value="Saturday, 4:00 PM">Saturday, 4:00 PM</option>
                          <option value="Sunday, 11:00 AM">Sunday, 11:00 AM</option>
                          <option value="Sunday, 4:00 PM">Sunday, 4:00 PM</option>
                          <option value="Weekday Evening">Weekday Evening (5 PM+)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Funding Status
                        </label>
                        <select
                          value={bookingData.fundingMode}
                          onChange={(e) => setBookingData({ ...bookingData, fundingMode: e.target.value as any })}
                          className="w-full px-3 py-2 rounded border border-gray-300 text-xs bg-white"
                        >
                          <option value="PRE_APPROVED_LOAN">Pre-approved Loan</option>
                          <option value="SELF_FUNDED">Self-Funded / Cash</option>
                          <option value="NEED_LOAN_ASSISTANCE">Need Loan Advice</option>
                          <option value="EXPLORING">Early Exploring</option>
                        </select>
                      </div>
                    </div>

                    {/* DPDP Act Statutory Consent Checkbox */}
                    <div className="pt-2 border-t border-gray-100">
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bookingData.consentDpdp}
                          onChange={(e) => setBookingData({ ...bookingData, consentDpdp: e.target.checked })}
                          className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[#244B8F] focus:ring-[#244B8F]"
                        />
                        <span className="text-[11px] text-gray-600 leading-tight">
                          I consent to SellMyGhar coordinating this property visit with the verified owner under our{' '}
                          <a href="/privacy-policy" target="_blank" className="text-[#244B8F] underline">
                            DPDP Privacy Notice
                          </a>. <span className="text-red-600">*</span>
                        </span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <span>{isSubmitting ? 'Sending OTP...' : 'Continue to Phone OTP Verification'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleOtpConfirm} className="space-y-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#244B8F] flex items-center justify-center mx-auto mb-2">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 font-['Montserrat']">
                        Verify Buyer Mobile Number
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Sent 6-digit OTP to <strong>+91 {bookingData.buyerPhone}</strong>
                      </p>
                      <div className="mt-2 text-[11px] bg-amber-50 text-amber-900 p-1.5 rounded border border-amber-200">
                        Sandbox Code: <strong>123456</strong>
                      </div>
                    </div>

                    {bookingError && (
                      <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-800 text-xs">
                        {bookingError}
                      </div>
                    )}

                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      placeholder="123456"
                      value={buyerOtp}
                      onChange={(e) => setBuyerOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-48 mx-auto text-center tracking-widest text-xl font-mono py-2 px-3 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
                    />

                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setBookingStep('DETAILS')}
                        className="w-1/3 py-2 rounded border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 cursor-pointer"
                      >
                        Edit Number
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || buyerOtp.length !== 6}
                        className="w-2/3 py-2 rounded bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Confirming...' : 'Verify OTP & Book Visit'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
