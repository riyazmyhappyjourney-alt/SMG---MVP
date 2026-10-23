import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { CrmStaff, CrmProperty } from './CrmDashboard';
import { LeadStatus } from '../../core/types/entities';

interface ManualLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: string;
  initialType?: 'BUYER' | 'SELLER';
  staffList: CrmStaff[];
  properties: CrmProperty[];
  onLeadCreated: (newLeadId: string) => void;
  crmFetch: (url: string, options?: any) => Promise<Response>;
}

interface DuplicateMatch {
  id: string;
  leadType: string;
  name: string;
  phone: string;
  stage: string;
  society?: string;
  locality?: string;
  assignedStaffName?: string;
  source?: string;
  externalEnquiryId?: string;
  createdAt?: string;
}

export const ManualLeadModal: React.FC<ManualLeadModalProps> = ({
  isOpen,
  onClose,
  initialSource = '99acres',
  initialType = 'BUYER',
  staffList,
  properties,
  onLeadCreated,
  crmFetch
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [leadType, setLeadType] = useState<'BUYER' | 'SELLER'>(initialType);
  const [source, setSource] = useState(initialSource);
  const [externalEnquiryId, setExternalEnquiryId] = useState('');
  const [externalListingId, setExternalListingId] = useState('');
  const [enquiryDate, setEnquiryDate] = useState(() => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm for datetime-local
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [message, setMessage] = useState('');

  // Property & Requirements State
  const [propertyId, setPropertyId] = useState('');
  const [society, setSociety] = useState('');
  const [locality, setLocality] = useState('');
  const [budget, setBudget] = useState('');
  const [bhk, setBhk] = useState('3 BHK');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // Assignment & Follow-up State
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [initialStage, setInitialStage] = useState<LeadStatus>('NEW');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Submission & Validation State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Duplicate Check State
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const duplicateTimeoutRef = useRef<any>(null);

  // Reset form when modal opens or initialSource changes
  useEffect(() => {
    if (isOpen) {
      setSource(initialSource);
      setLeadType(initialType);
      setError(null);
      setDuplicateMatches([]);
      setDuplicateAcknowledged(false);
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setEnquiryDate(now.toISOString().slice(0, 16));
    }
  }, [isOpen, initialSource, initialType]);

  // Sync society & locality if inventory property is selected
  useEffect(() => {
    if (propertyId) {
      const selected = properties.find((p) => p.id === propertyId);
      if (selected) {
        if (selected.society) setSociety(selected.society);
        if (selected.locality) setLocality(selected.locality);
        if (selected.bhk) setBhk(selected.bhk);
        if (selected.askingPriceRaw) setBudget(String(selected.askingPriceRaw));
      }
    }
  }, [propertyId, properties]);

  // Live Debounced Duplicate Check
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanExtId = externalEnquiryId.trim();

    if (!cleanPhone && !cleanExtId) {
      setDuplicateMatches([]);
      return;
    }

    if (duplicateTimeoutRef.current) {
      clearTimeout(duplicateTimeoutRef.current);
    }

    duplicateTimeoutRef.current = setTimeout(async () => {
      setDuplicateCheckLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (cleanPhone.length >= 10) queryParams.set('phone', cleanPhone);
        if (cleanExtId) queryParams.set('externalEnquiryId', cleanExtId);

        if (!queryParams.toString()) {
          setDuplicateMatches([]);
          setDuplicateCheckLoading(false);
          return;
        }

        const res = await crmFetch(`/api/crm/leads/check-duplicate?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.matches)) {
            setDuplicateMatches(data.matches);
          }
        }
      } catch (err) {
        // duplicate check network failure shouldn't block user
      } finally {
        setDuplicateCheckLoading(false);
      }
    }, 400);

    return () => {
      if (duplicateTimeoutRef.current) {
        clearTimeout(duplicateTimeoutRef.current);
      }
    };
  }, [phone, externalEnquiryId, crmFetch]);

  // Formatted Budget Helper
  const formattedBudget = useMemo(() => {
    const val = parseInt(budget.replace(/\D/g, ''), 10);
    if (!val || isNaN(val)) return '';
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(2)} Crore`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹ ${val.toLocaleString('en-IN')}`;
  }, [budget]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (duplicateMatches.length > 0 && !duplicateAcknowledged) {
      setError('A matching lead was found. Please review the duplicate alert above before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: cleanPhone,
        email: email.trim() || undefined,
        leadType,
        source: source.trim() || '99acres',
        externalEnquiryId: externalEnquiryId.trim() || undefined,
        externalListingId: externalListingId.trim() || undefined,
        enquiryDate: enquiryDate ? new Date(enquiryDate).toISOString() : new Date().toISOString(),
        message: message.trim() || undefined,
        propertyId: propertyId || undefined,
        society: society.trim() || undefined,
        locality: locality.trim() || undefined,
        budget: budget ? parseInt(budget.replace(/\D/g, ''), 10) : undefined,
        bhk,
        additionalRequirements: additionalRequirements.trim() || undefined,
        assignedStaffId: assignedStaffId || undefined,
        initialStage,
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined,
        followUpNotes: followUpNotes.trim() || undefined,
      };

      const res = await crmFetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create lead in CRM.');
      }

      // Close and trigger navigation to new lead
      onClose();
      if (data.leadId) {
        onLeadCreated(data.leadId);
      }
    } catch (err: any) {
      setError(err.message || 'Error creating lead. Please check network and permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto font-['Montserrat']">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
              source === '99acres' ? 'bg-[#0073E6]/10 text-[#0073E6]' : 'bg-slate-100 text-slate-700'
            }`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  {source === '99acres' ? 'Add 99acres Lead' : 'Manual Lead Intake'}
                </h3>
                {source === '99acres' && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#0073E6] border border-blue-200 uppercase tracking-wide">
                    99acres
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Record an external inquiry or manual contact into the central SellMyGhar pipeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Duplicate Detection Alert */}
          {duplicateMatches.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Existing Lead Match Detected ({duplicateMatches.length})</span>
                </div>
                {duplicateCheckLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                )}
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                A contact with this mobile number or external inquiry ID already exists in the CRM. You can inspect the existing lead or confirm below to proceed with a separate inquiry without overwriting existing records.
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {duplicateMatches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/90 border border-amber-200 text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{m.name}</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="font-mono text-slate-600">{m.phone}</span>
                      <span className="text-slate-500 mx-1.5">•</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {m.leadType}
                      </span>
                      {m.society && (
                        <span className="text-slate-500 ml-1.5">({m.society})</span>
                      )}
                      <span className="text-slate-400 ml-1.5">RM: {m.assignedStaffName || 'Unassigned'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLeadCreated(m.id);
                      }}
                      className="px-2.5 py-1 rounded bg-[#0073E6] text-white font-bold hover:bg-[#005bb5] transition-colors shrink-0 ml-2 cursor-pointer flex items-center space-x-1"
                    >
                      <span>View Lead</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-amber-200/60">
                <input
                  id="ack-duplicate"
                  type="checkbox"
                  checked={duplicateAcknowledged}
                  onChange={(e) => setDuplicateAcknowledged(e.target.checked)}
                  className="rounded text-[#0073E6] focus:ring-[#0073E6] cursor-pointer"
                />
                <label htmlFor="ack-duplicate" className="text-[11px] font-semibold text-amber-950 cursor-pointer select-none">
                  I acknowledge this is a new separate enquiry from this contact (do not merge or overwrite existing lead)
                </label>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 1: LEAD INFORMATION                                    */}
          {/* ============================================================== */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                1. Lead Information
              </span>
              <div className="flex items-center space-x-1.5 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setLeadType('BUYER')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                    leadType === 'BUYER'
                      ? 'bg-white text-[#0073E6] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Buyer Enquiry
                </button>
                <button
                  type="button"
                  onClick={() => setLeadType('SELLER')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                    leadType === 'SELLER'
                      ? 'bg-white text-[#0073E6] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Seller Listing
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={leadType === 'BUYER' ? 'e.g. Ramesh Kumar' : 'e.g. Anita Deshmukh (Owner)'}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 text-xs font-semibold text-slate-600 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={14}
                    className="w-full pl-3 pr-3 py-2 text-xs border border-slate-200 rounded-r-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Lead Source */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lead Source <span className="text-rose-500">*</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                >
                  <option value="99acres">99acres.com</option>
                  <option value="Housing.com">Housing.com</option>
                  <option value="MagicBricks">MagicBricks</option>
                  <option value="SellMyGhar Portal">SellMyGhar Direct Portal</option>
                  <option value="Phone Call">Direct Phone Call / WhatsApp</option>
                  <option value="Referral">Client Referral / Corporate</option>
                  <option value="Other">Other External Source</option>
                </select>
              </div>

              {/* External Enquiry ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  External Enquiry ID <span className="text-slate-400 font-normal">(e.g. 99acres Lead ID)</span>
                </label>
                <input
                  type="text"
                  value={externalEnquiryId}
                  onChange={(e) => setExternalEnquiryId(e.target.value)}
                  placeholder="e.g. 99A-LEAD-994821"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all font-mono"
                />
              </div>

              {/* Enquiry Date & Time */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enquiry Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={enquiryDate}
                  onChange={(e) => setEnquiryDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Message / Initial Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Enquiry Message / Client Note
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Paste the inquiry message from 99acres or summarize the initial client conversation..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 2: PROPERTY & REQUIREMENTS                             */}
          {/* ============================================================== */}
          <div className="space-y-3.5">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                2. Property & Requirements
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Linked Property from Inventory */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Link to SellMyGhar Inventory Property <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                >
                  <option value="">-- None / General Inbound Inquiry --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.society ? `${p.society} - ` : ''}{p.locality || 'Bengaluru'} ({p.bhk || 'Apartment'}) - {p.askingPrice || 'Price on Request'} [{p.id}]
                    </option>
                  ))}
                </select>
              </div>

              {/* External 99acres Listing ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  External 99acres Listing ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={externalListingId}
                  onChange={(e) => setExternalListingId(e.target.value)}
                  placeholder="e.g. 99A-P-449102"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all font-mono"
                />
              </div>

              {/* Preferred BHK */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {leadType === 'BUYER' ? 'Preferred BHK' : 'Unit BHK Type'}
                </label>
                <select
                  value={bhk}
                  onChange={(e) => setBhk(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="2.5 BHK">2.5 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="3.5 BHK">3.5 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="4+ BHK">4+ BHK / Penthouse</option>
                  <option value="Villa">Villa / Row House</option>
                  <option value="Plot">Residential Plot</option>
                </select>
              </div>

              {/* Apartment / Society */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {leadType === 'BUYER' ? 'Target Society / Project' : 'Apartment / Society Name'}
                </label>
                <input
                  type="text"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  placeholder="e.g. Prestige Shantiniketan / Sobha Dream Acres"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                />
              </div>

              {/* Locality */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Locality / Micro-Market
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Whitefield, Sarjapur Road, Hebbal"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                />
              </div>

              {/* Budget / Asking Price */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    {leadType === 'BUYER' ? 'Budget Target (INR)' : 'Expected Asking Price (INR)'}
                  </label>
                  {formattedBudget && (
                    <span className="text-[10px] font-bold text-[#0073E6] bg-blue-50 px-1.5 py-0.5 rounded">
                      {formattedBudget}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400 select-none">
                    ₹
                  </span>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 15000000"
                    className="w-full pl-7 pr-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Additional Requirements */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Additional Requirements
                </label>
                <input
                  type="text"
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="e.g. East facing, 2 car parking, high floor"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION 3: ASSIGNMENT & FOLLOW-UP                               */}
          {/* ============================================================== */}
          <div className="space-y-3.5">
            <div className="border-b border-slate-100 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                3. Assignment & Next Action
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Assign Relationship Manager */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Relationship Manager (RM)
                </label>
                <select
                  value={assignedStaffId}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                >
                  <option value="">-- Unassigned (General Desk Queue) --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role.replace('STAFF_', '')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Stage */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Pipeline Stage
                </label>
                <select
                  value={initialStage}
                  onChange={(e) => setInitialStage(e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                >
                  <option value="NEW">New Lead (Uncontacted)</option>
                  <option value="CONTACTED">Contacted (RM reached out)</option>
                  <option value="FOLLOW_UP">Follow Up (Discussion in progress)</option>
                  <option value="SITE_VISIT">Site Visit Scheduled</option>
                </select>
              </div>

              {/* Next Follow-Up Date */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Next Follow-up Date & Time <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={nextFollowUpAt}
                  onChange={(e) => setNextFollowUpAt(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                />
              </div>

              {/* Initial Follow-Up Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Follow-up Action Note
                </label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Schedule discovery call tomorrow at 11:30 AM"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0073E6] focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-[#0073E6] hover:bg-[#005bb5] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Lead...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Create {source === '99acres' ? '99acres' : ''} Lead</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
