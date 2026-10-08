import React, { useState, useEffect } from 'react';
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
  Trash2,
  RefreshCw
} from 'lucide-react';
import { StaffRole } from '../../core/types/auth';
import { LeadStatus, VerificationTier } from '../../core/types/entities';
import { AdminErasureQueue } from './AdminErasureQueue';
import { DocumentVerificationDesk } from './DocumentVerificationDesk';

export interface CrmLead {
  id: string;
  type?: string;
  ownerName: string;
  name?: string;
  phone: string;
  society: string;
  locality: string;
  bhk: string;
  expectedPrice: string;
  stage: LeadStatus;
  status?: LeadStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  assignedTo: string;
  propertyId?: string | null;
  nextFollowUpAt?: string | null;
  followUpNotes?: string | null;
  notes?: string | null;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CrmStaff {
  id: string;
  displayName: string;
  name?: string;
  email: string;
  roles: string[];
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

  // Leads and Staff state
  const [leads, setLeads] = useState<CrmLead[]>(MOCK_LEADS);
  const [staffList, setStaffList] = useState<CrmStaff[]>([]);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(MOCK_LEADS[0]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states for selected lead
  const [callNoteText, setCallNoteText] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');

  const fetchLeads = async () => {
    setLoadingLeads(true);
    try {
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads(data.leads);
          setSelectedLead(prev => (prev ? data.leads.find((l: any) => l.id === prev.id) || data.leads[0] : data.leads[0]));
        }
      }
    } catch {
      // Keep mock fallback
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/crm/staff');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      }
    } catch {
      // Keep empty
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStaff();
  }, [currentRole]);

  // Lead Stage Progression
  const handleStageChange = async (leadId: string, newStage: LeadStatus) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage })
      });
      if (res.ok) {
        await fetchLeads();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || err.error || 'Failed to update stage');
      }
    } catch {
      // Fallback local update
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, stage: newStage } : null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Staff Assignment
  const handleAssignStaff = async (leadId: string) => {
    if (!selectedStaffToAssign) {
      alert('Please select a staff member to assign.');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: selectedStaffToAssign })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to assign staff');
        return;
      }
      await fetchLeads();
      alert(`Lead assigned successfully.`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign staff');
    } finally {
      setIsUpdating(false);
    }
  };

  // Follow-up Scheduling
  const handleScheduleFollowUp = async (leadId: string) => {
    if (!followUpDate) {
      alert('Please select a date and time for follow-up.');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpAt: new Date(followUpDate).toISOString(),
          followUpNotes: followUpNoteInput || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to schedule follow-up');
        return;
      }
      await fetchLeads();
      setFollowUpDate('');
      setFollowUpNoteInput('');
      alert('Follow-up scheduled successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule follow-up');
    } finally {
      setIsUpdating(false);
    }
  };

  // Note Logging
  const handleAddNote = async (leadId: string) => {
    if (!callNoteText.trim()) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: callNoteText.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to add note');
        return;
      }
      await fetchLeads();
      setCallNoteText('');
      alert('Call note recorded with audit trail.');
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsUpdating(false);
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
                    Seller & Buyer Lead Pipeline ({leads.length} Leads)
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-[11px] text-gray-500">Auto-deduplicated</span>
                  <button
                    type="button"
                    onClick={fetchLeads}
                    disabled={loadingLeads}
                    className="p-1 rounded hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                    title="Refresh leads from database"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingLeads ? 'animate-spin text-[#244B8F]' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-100 max-h-[680px] overflow-y-auto">
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
                        <span className="text-sm font-bold text-gray-900">{lead.ownerName || lead.name}</span>
                        <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {lead.id}
                        </span>
                        {lead.type && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            lead.type === 'SELLER' ? 'bg-blue-100 text-[#244B8F]' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {lead.type}
                          </span>
                        )}
                        {lead.isOverdue && (
                          <span className="text-[9px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded animate-pulse">
                            ⚠️ OVERDUE
                          </span>
                        )}
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
                        lead.stage === 'CONTACTED' ? 'bg-blue-100 text-[#244B8F]' :
                        lead.stage === 'FOLLOW_UP' ? 'bg-cyan-100 text-cyan-800' :
                        lead.stage === 'SITE_VISIT' ? 'bg-purple-100 text-purple-800' :
                        lead.stage === 'NEGOTIATION' ? 'bg-indigo-100 text-indigo-800' :
                        lead.stage === 'CONVERTED' ? 'bg-emerald-100 text-emerald-800' :
                        lead.stage === 'LOST' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.stage}
                      </span>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        {lead.assignedTo || lead.assignedStaffName || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Lead Detail & Triage Action Card */}
            {selectedLead && (
              <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-5 space-y-4 max-h-[800px] overflow-y-auto">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#244B8F] tracking-wider">Lead Details</span>
                    <h3 className="text-base font-bold text-gray-900 font-['Montserrat'] mt-0.5">
                      {selectedLead.ownerName || selectedLead.name}
                    </h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-gray-500">{selectedLead.id}</span>
                </div>

                {/* Overdue Alert Banner */}
                {selectedLead.isOverdue && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-center space-x-2 text-xs text-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <span className="font-bold">Follow-Up Overdue:</span> Scheduled follow-up was due on{' '}
                      {selectedLead.nextFollowUpAt ? new Date(selectedLead.nextFollowUpAt).toLocaleString('en-IN') : 'earlier date'}.
                    </div>
                  </div>
                )}

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
                    <span className="text-gray-500">Expected Value:</span>
                    <span className="font-bold text-[#244B8F]">{selectedLead.expectedPrice}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Current Assignee:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedLead.assignedTo || selectedLead.assignedStaffName || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {/* Employee Assignment Dropdown */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Assign Lead to Staff (RM):
                  </label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedStaffToAssign}
                      onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                      className="flex-1 p-2 rounded border border-gray-300 text-xs bg-white text-gray-800"
                    >
                      <option value="">Select Employee...</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.displayName || s.name} ({s.roles?.[0] || 'Staff'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isUpdating || !selectedStaffToAssign}
                      onClick={() => handleAssignStaff(selectedLead.id)}
                      className="px-3 py-2 rounded bg-[#244B8F] text-white text-xs font-semibold hover:bg-[#1B396E] disabled:opacity-50 cursor-pointer"
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Pipeline Stage Transitions (6 Core Operational Stages) */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Advance Operational Stage:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedLead.id, 'CONTACTED')}
                      className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer border ${
                        selectedLead.stage === 'CONTACTED' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-[#244B8F] border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      1. Contacted
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedLead.id, 'FOLLOW_UP')}
                      className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer border ${
                        selectedLead.stage === 'FOLLOW_UP' ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100'
                      }`}
                    >
                      2. Follow Up
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedLead.id, 'SITE_VISIT')}
                      className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer border ${
                        selectedLead.stage === 'SITE_VISIT' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      3. Site Visit
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedLead.id, 'NEGOTIATION')}
                      className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer border ${
                        selectedLead.stage === 'NEGOTIATION' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                      }`}
                    >
                      4. Negotiation
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedLead.id, 'CONVERTED')}
                      className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer border ${
                        selectedLead.stage === 'CONVERTED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      5. Convert Deal
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleStageChange(selectedLead.id, 'LOST')}
                      className={`px-2 py-1.5 rounded text-xs font-medium cursor-pointer border ${
                        selectedLead.stage === 'LOST' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      6. Mark Lost
                    </button>
                  </div>
                </div>

                {/* Follow-up Scheduler */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">
                    Schedule Next Follow-Up:
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2 rounded border border-gray-300 text-xs bg-white text-gray-800"
                  />
                  <input
                    type="text"
                    value={followUpNoteInput}
                    onChange={(e) => setFollowUpNoteInput(e.target.value)}
                    placeholder="Task reminder notes (optional)..."
                    className="w-full p-2 rounded border border-gray-300 text-xs bg-white text-gray-800"
                  />
                  <button
                    type="button"
                    disabled={isUpdating || !followUpDate}
                    onClick={() => handleScheduleFollowUp(selectedLead.id)}
                    className="w-full py-1.5 rounded bg-cyan-700 text-white text-xs font-semibold hover:bg-cyan-800 disabled:opacity-50 cursor-pointer"
                  >
                    Schedule Follow-Up Task
                  </button>
                </div>

                {/* Call Log / Note */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Log Call & Diligence Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={callNoteText}
                    onChange={(e) => setCallNoteText(e.target.value)}
                    placeholder="Log conversation details, buyer terms, or verification note..."
                    className="w-full p-2.5 rounded border border-gray-300 text-xs bg-white text-gray-800"
                  />
                  <button
                    type="button"
                    disabled={isUpdating || !callNoteText.trim()}
                    onClick={() => handleAddNote(selectedLead.id)}
                    className="mt-2 w-full py-1.5 rounded bg-[#244B8F] text-white text-xs font-semibold hover:bg-[#1B396E] disabled:opacity-50 cursor-pointer"
                  >
                    Save Call Log
                  </button>
                </div>

                {/* Existing Notes History */}
                {selectedLead.notes && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Activity & Note History:</span>
                    <pre className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded text-[11px] font-sans text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {selectedLead.notes}
                    </pre>
                  </div>
                )}
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
