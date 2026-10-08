import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Building2, 
  Eye, 
  Clock, 
  DollarSign, 
  Calendar, 
  ChevronRight,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  FileText,
  Trash2
} from 'lucide-react';
import { StaffRole } from '../../core/types/auth';
import { LeadStatus, VerificationTier } from '../../core/types/entities';
import { AdminErasureQueue } from './AdminErasureQueue';
import { DocumentVerificationDesk } from './DocumentVerificationDesk';

// Mock CRM Leads across Bengaluru
interface CrmLead {
  id: string;
  ownerName: string;
  phone: string;
  society: string;
  locality: string;
  bhk: string;
  expectedPrice: string;
  stage: LeadStatus;
  assignedTo: string;
  createdAt: string;
}

const MOCK_LEADS: CrmLead[] = [
  {
    id: 'LD-8812',
    ownerName: 'Suresh Nambiar',
    phone: '+91 98450 12891',
    society: 'Prestige Falcon City',
    locality: 'Kanakapura Road',
    bhk: '3BHK',
    expectedPrice: '₹1.65 Cr',
    stage: 'VERIFICATION',
    assignedTo: 'Anil K (Verification)',
    createdAt: '2 hrs ago',
  },
  {
    id: 'LD-8813',
    ownerName: 'Deepa Hegde',
    phone: '+91 97412 88390',
    society: 'Sobha Dream Acres',
    locality: 'Panathur / Balagere',
    bhk: '2BHK',
    expectedPrice: '₹1.10 Cr',
    stage: 'NEW',
    assignedTo: 'Unassigned',
    createdAt: '35 mins ago',
  },
  {
    id: 'LD-8814',
    ownerName: 'Manish Chawla',
    phone: '+91 99801 44521',
    society: 'Brigade Cornerstone Utopia',
    locality: 'Varthur / Whitefield',
    bhk: '4BHK+',
    expectedPrice: '₹2.80 Cr',
    stage: 'PROPERTY_DETAILS',
    assignedTo: 'Sneha R (Intake)',
    createdAt: '4 hrs ago',
  },
  {
    id: 'LD-8809',
    ownerName: 'Karthik Rao',
    phone: '+91 94481 99012',
    society: 'Godrej Eternity',
    locality: 'Kanakapura Road',
    bhk: '3BHK',
    expectedPrice: '₹1.42 Cr',
    stage: 'VISIT',
    assignedTo: 'Vikram S (Closer)',
    createdAt: '1 day ago',
  }
];

export function CrmDashboard() {
  // Active Staff Role for RBAC Demonstration
  const [currentRole, setCurrentRole] = useState<StaffRole>('STAFF_INTAKE_AGENT');
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'VERIFICATION' | 'LISTINGS' | 'DEALS' | 'AUDIT' | 'ERASURE_QUEUE'>('PIPELINE');

  // Leads state
  const [leads, setLeads] = useState<CrmLead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(MOCK_LEADS[0]);

  // Lead Stage Progression
  const handleStageChange = (leadId: string, newStage: LeadStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Staff Role Switcher & Least-Privilege Enforcer Banner */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-[#172033] text-white flex items-center justify-center font-bold text-sm">
              CRM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold font-['Montserrat'] text-[#172033]">
                  SellMyGhar Operations & Staff Desk
                </span>
                <span className="text-[10px] bg-blue-100 text-[#244B8F] px-2 py-0.5 rounded font-semibold">
                  RBAC Enforced
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Data access and UI views are dynamically restricted per DPDP least-privilege standards.
              </p>
            </div>
          </div>

          {/* Active Role Selector */}
          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <span className="text-xs font-semibold text-gray-600 pl-2">Active Staff Role:</span>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as StaffRole;
                setCurrentRole(newRole);
                if (newRole === 'STAFF_VERIFICATION_AGENT') setActiveTab('VERIFICATION');
                else if (newRole === 'STAFF_LISTING_MANAGER') setActiveTab('LISTINGS');
                else if (newRole === 'STAFF_DEAL_CLOSER') setActiveTab('DEALS');
                else if (newRole === 'STAFF_SUPER_ADMIN') setActiveTab('AUDIT');
                else setActiveTab('PIPELINE');
              }}
              className="px-3 py-1.5 rounded bg-white border border-gray-300 text-xs font-semibold text-[#244B8F] focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
            >
              <option value="STAFF_INTAKE_AGENT">1. Intake / Lead Agent</option>
              <option value="STAFF_VERIFICATION_AGENT">2. Verification Agent</option>
              <option value="STAFF_LISTING_MANAGER">3. Listing Manager</option>
              <option value="STAFF_DEAL_CLOSER">4. Deal Closer & Negotiator</option>
              <option value="STAFF_SUPER_ADMIN">5. Super Admin / Compliance</option>
            </select>
          </div>
        </div>

        {/* Operational Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'PIPELINE' ? 'bg-[#244B8F] text-white' : 'text-gray-600 hover:bg-white'
            }`}
          >
            Lead Intake & Pipeline
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'VERIFICATION' ? 'bg-[#244B8F] text-white' : 'text-gray-600 hover:bg-white'
            }`}
          >
            Document Verification Queue
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LISTINGS')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'LISTINGS' ? 'bg-[#244B8F] text-white' : 'text-gray-600 hover:bg-white'
            }`}
          >
            Listing Publication Desk
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DEALS')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'DEALS' ? 'bg-[#244B8F] text-white' : 'text-gray-600 hover:bg-white'
            }`}
          >
            Visits, Offers & Deals
          </button>

          {currentRole === 'STAFF_SUPER_ADMIN' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('AUDIT')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'AUDIT' ? 'bg-[#172033] text-white' : 'text-gray-600 hover:bg-white'
                }`}
              >
                Insider Risk & Audit Trail (Admin)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ERASURE_QUEUE')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'ERASURE_QUEUE' ? 'bg-red-800 text-white' : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>DPDP Erasure Queue</span>
              </button>
            </>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: Lead Intake & Pipeline                                */}
        {/* ============================================================ */}
        {activeTab === 'PIPELINE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Lead Table */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#244B8F]" />
                  <span className="text-xs font-bold font-['Montserrat'] text-[#172033] uppercase tracking-wider">
                    Seller Lead Pipeline ({leads.length} Active Leads)
                  </span>
                </div>
                <span className="text-[11px] text-gray-500">Auto-deduplicated by Phone & Society</span>
              </div>

              <div className="divide-y divide-gray-100">
                {leads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      selectedLead?.id === lead.id ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{lead.ownerName}</span>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {lead.id}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {lead.bhk} • {lead.society}, {lead.locality}
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-gray-400 mt-1">
                        <span>Expected: <strong className="text-gray-700">{lead.expectedPrice}</strong></span>
                        <span>•</span>
                        <span>{lead.createdAt}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-semibold ${
                        lead.stage === 'NEW' ? 'bg-amber-100 text-amber-800' :
                        lead.stage === 'VERIFICATION' ? 'bg-blue-100 text-[#244B8F]' :
                        lead.stage === 'VISIT' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.stage}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-1">{lead.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Lead Detail & Triage Action Card */}
            {selectedLead && (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#244B8F] tracking-wider">Lead Details</span>
                    <h3 className="text-base font-bold text-gray-900 font-['Montserrat'] mt-0.5">
                      {selectedLead.ownerName}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-500">{selectedLead.id}</span>
                </div>

                {/* Role-Sensitive Field Masking Check */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Phone Number:</span>
                    <strong className="text-gray-900 font-mono">
                      {currentRole === 'STAFF_LISTING_MANAGER' 
                        ? '[MASKED - NO PERMISSION]' 
                        : selectedLead.phone}
                    </strong>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Society:</span>
                    <span className="font-semibold text-gray-900">{selectedLead.society}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Locality:</span>
                    <span className="text-gray-800">{selectedLead.locality}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Configuration:</span>
                    <span className="text-gray-800">{selectedLead.bhk}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Owner Expectation:</span>
                    <span className="font-bold text-[#244B8F]">{selectedLead.expectedPrice}</span>
                  </div>
                </div>

                {/* Pipeline Stage Transitions */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Advance Pipeline Stage:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStageChange(selectedLead.id, 'QUALIFIED')}
                      className="px-2.5 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium cursor-pointer"
                    >
                      Qualify Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStageChange(selectedLead.id, 'VERIFICATION')}
                      className="px-2.5 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-[#244B8F] text-xs font-semibold cursor-pointer"
                    >
                      Send to Verification
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStageChange(selectedLead.id, 'VISIT')}
                      className="px-2.5 py-1.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer"
                    >
                      Schedule Visit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStageChange(selectedLead.id, 'LOST')}
                      className="px-2.5 py-1.5 rounded bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium cursor-pointer"
                    >
                      Mark Dropped
                    </button>
                  </div>
                </div>

                {/* Follow-up Note */}
                <div className="pt-2 border-t border-gray-100">
                  <textarea
                    rows={2}
                    placeholder="Log call notes or follow-up task..."
                    className="w-full p-2.5 rounded border border-gray-300 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => alert('Call log and task recorded with timestamp.')}
                    className="mt-2 w-full py-1.5 rounded bg-[#244B8F] text-white text-xs font-semibold hover:bg-[#1B396E] cursor-pointer"
                  >
                    Save Call Log
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: Document Verification Queue                           */}
        {/* ============================================================ */}
        {activeTab === 'VERIFICATION' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
            <DocumentVerificationDesk currentRole={currentRole} />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: Listing Publication Desk                              */}
        {/* ============================================================ */}
        {activeTab === 'LISTINGS' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold font-['Montserrat'] text-[#172033]">
                  Listing Publication & Media Approval Desk
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Managed by: <strong>STAFF_LISTING_MANAGER</strong>. Notice that sensitive flat numbers and reserve prices are masked.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800">
                1 Pending Publication
              </span>
            </div>

            {/* Sanitization Inspection Card */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Sanitized Listing Attributes</span>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Project / Society:</span>
                    <strong className="text-gray-900">Prestige Falcon City</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Unit Number:</span>
                    <span className="font-mono text-amber-700 font-bold">
                      {currentRole === 'STAFF_LISTING_MANAGER' ? '[MASKED_FOR_LISTING_MANAGER]' : 'Tower 4, Flat 1102'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Computed Floor Band:</span>
                    <strong className="text-[#244B8F]">Mid-Higher Floor (Floors 9–14)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Owner Reserve Floor:</span>
                    <span className="font-mono text-gray-400 font-bold">
                      {currentRole === 'STAFF_LISTING_MANAGER' ? '[CONFIDENTIAL - HIDDEN]' : '₹1.58 Cr'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Public Pricing & Media</span>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Public Asking Price:</span>
                    <strong className="text-gray-900">₹1.65 Cr (₹8,918/sq.ft)</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Approved Photos:</span>
                    <span className="text-green-700 font-semibold">4 Photos (EXIF GPS Stripped)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="text-gray-500">Eligible Badge:</span>
                    <span className="bg-blue-100 text-[#244B8F] px-1.5 py-0.5 rounded font-semibold text-[10px]">
                      DOCS CHECKED
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  disabled={currentRole !== 'STAFF_LISTING_MANAGER' && currentRole !== 'STAFF_SUPER_ADMIN'}
                  onClick={() => alert('Listing approved and published to public marketplace! Structured JSON-LD generated.')}
                  className="px-5 py-2.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  Approve & Publish to Public Marketplace
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: Visits, Offers & Deals                                */}
        {/* ============================================================ */}
        {activeTab === 'DEALS' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold font-['Montserrat'] text-[#172033]">
                  Buyer Physical Visits & Offer Negotiations
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Managed by: <strong>STAFF_DEAL_CLOSER</strong>. Only this role and Super Admin can manage confidential offers.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-100 text-purple-800">
                1 Active Offer Under Negotiation
              </span>
            </div>

            {/* Visit Coordination Row */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500 uppercase tracking-wider">Scheduled Physical Visit</span>
                <span className="bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                  BUYER OTP VERIFIED
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Prestige Falcon City: Flat 1102</h4>
                  <p className="text-gray-600 mt-0.5">
                    Buyer: Ananya Sharma (+91 98765 43210) • Pre-approved HDFC Home Loan
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    Requested Slot: <strong className="text-gray-800">Saturday, 11:00 AM</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => alert('Owner notified via WhatsApp with confirmed slot.')}
                    className="px-3.5 py-1.5 rounded bg-[#244B8F] text-white text-xs font-semibold cursor-pointer"
                  >
                    Confirm with Owner
                  </button>
                </div>
              </div>
            </div>

            {/* Offer Negotiation Card */}
            <div className="p-4 rounded-xl border border-gray-200 bg-purple-50/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-purple-900 uppercase tracking-wider">Formal Offer Submitted</span>
                <span className="font-mono text-gray-500">Offer ID: OFF-9102</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white rounded border border-gray-200">
                  <span className="text-gray-400 block text-[10px]">Public Asking Price</span>
                  <span className="text-sm font-bold text-gray-900">₹1.65 Cr</span>
                </div>
                <div className="p-3 bg-white rounded border border-purple-200">
                  <span className="text-purple-600 block text-[10px] font-semibold">Buyer Formal Offer</span>
                  <span className="text-sm font-bold text-purple-900">₹1.60 Cr</span>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                  <span className="text-gray-400 block text-[10px]">Owner Reserve Floor</span>
                  <span className="text-sm font-bold text-emerald-800">
                    {currentRole === 'STAFF_DEAL_CLOSER' || currentRole === 'STAFF_SUPER_ADMIN' 
                      ? '₹1.58 Cr (Protected)' 
                      : '[RESTRICTED]'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-600 text-[11px]">
                  Offer is above owner's bottom reserve (₹1.58 Cr). Recommended: Counter at ₹1.62 Cr.
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={currentRole !== 'STAFF_DEAL_CLOSER' && currentRole !== 'STAFF_SUPER_ADMIN'}
                    onClick={() => alert('Counter-offer presented to owner.')}
                    className="px-3.5 py-1.5 rounded bg-purple-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-40"
                  >
                    Present to Owner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: Super Admin Insider Risk & Audit Log Desk             */}
        {/* ============================================================ */}
        {activeTab === 'AUDIT' && currentRole === 'STAFF_SUPER_ADMIN' && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h2 className="text-base font-bold font-['Montserrat'] text-[#172033]">
                    Immutable Audit Log & Privileged Insider Risk Monitor
                  </h2>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Database trigger `trg_prevent_audit_logs_mutation` strictly enforces append-only immutability.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-1 bg-red-100 text-red-800 rounded">
                CRITICAL MONITORING
              </span>
            </div>

            {/* Audit Log Stream */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg border border-red-200 bg-red-50/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-red-900 font-bold">
                    <span>[ELEVATED_INSIDER_RISK]</span>
                    <span className="text-gray-900">VIEW_RESERVE_PRICE</span>
                  </div>
                  <p className="text-gray-700 text-[11px] mt-1 font-sans">
                    Super Admin inspected confidential reserve minimum price for Property PROP-BLR-8492.
                  </p>
                  <span className="text-[10px] text-gray-400">Actor: usr-admin-01 • IP: 103.21.244.18 • 12 mins ago</span>
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-white px-2 py-0.5 rounded border border-red-200">
                  FLAGGED
                </span>
              </div>

              <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-blue-900 font-bold">
                    <span>[ROUTINE_AUDIT]</span>
                    <span className="text-gray-900">REVISE_VERIFICATION_TIER</span>
                  </div>
                  <p className="text-gray-700 text-[11px] mt-1 font-sans">
                    Verification Agent approved Sale Deed & Khata. Promoted to LEVEL_2_DOCS_REVIEWED.
                  </p>
                  <span className="text-[10px] text-gray-400">Actor: usr-verifier-04 • IP: 103.21.244.12 • 45 mins ago</span>
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-white px-2 py-0.5 rounded border border-green-200">
                  CLEAN
                </span>
              </div>

              <div className="p-3 rounded-lg border border-purple-200 bg-purple-50/40 flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-purple-900 font-bold">
                    <span>[ROUTINE_AUDIT]</span>
                    <span className="text-gray-900">APPROVE_LISTING</span>
                  </div>
                  <p className="text-gray-700 text-[11px] mt-1 font-sans">
                    Listing Manager published sgl-blr-9182 with floor band 'Mid-Higher Floor (9-14)'.
                  </p>
                  <span className="text-[10px] text-gray-400">Actor: usr-listing-02 • IP: 103.21.244.19 • 2 hrs ago</span>
                </div>
                <span className="text-[10px] font-bold text-green-700 bg-white px-2 py-0.5 rounded border border-green-200">
                  CLEAN
                </span>
              </div>
            </div>

            {/* Link to Dedicated Erasure Queue */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 font-['Montserrat']">
                  DPDP Act Data Principal Erasure Queue (Section 12)
                </h3>
                <p className="text-gray-500 text-[11px] mt-0.5">Dual-key review queue for statutory data erasure requests.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('ERASURE_QUEUE')}
                className="px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold text-xs cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Open Erasure Queue</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: DPDP Statutory Erasure Queue                          */}
        {/* ============================================================ */}
        {activeTab === 'ERASURE_QUEUE' && <AdminErasureQueue />}

      </div>
    </div>
  );
}
