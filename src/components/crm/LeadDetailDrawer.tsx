import React from 'react';
import {
  Phone,
  MessageSquare,
  X,
  RefreshCw,
  Calendar,
  Clock,
  Trash2
} from 'lucide-react';
import { LeadStatus } from '../../core/types/entities';
import { CrmStaff, CrmProperty } from './CrmDashboard';
import {
  formatReadableDate,
  formatReadableTime,
  formatIndianCurrency
} from '../../utils/formatters';

const PIPELINE_STAGES: Array<{ key: LeadStatus; label: string; desc: string }> = [
  { key: 'NEW', label: 'NEW', desc: 'Fresh Inbound' },
  { key: 'CONTACTED', label: 'CONTACTED', desc: 'Outreach Initiated' },
  { key: 'FOLLOW_UP', label: 'FOLLOW UP', desc: 'Diligence in Progress' },
  { key: 'SITE_VISIT', label: 'SITE VISIT', desc: 'Physical Tours' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', desc: 'Offer & Pricing' },
  { key: 'CONVERTED', label: 'CONVERTED', desc: 'Deal Closed' },
  { key: 'LOST', label: 'LOST', desc: 'Inquiry Dropped' },
];

export interface LeadDetailDrawerProps {
  selectedLeadId: string;
  onClose: () => void;
  leadDetailData: any;
  leadDetailLoading: boolean;
  leadDetailError: string | null;
  onRetry: (leadId: string) => void;
  staffList: CrmStaff[];
  properties: CrmProperty[];
  handleUpdateLeadStatus: (leadId: string, status: LeadStatus) => void;
  handleAssignLead: (leadId: string, staffId: string) => void;
  handleScheduleFollowUp: (leadId: string) => void;
  handleAddCallNote: (leadId: string) => void;
  handleVerifyDocument: (docId: string, action: 'VERIFIED' | 'REJECTED', note?: string) => void | Promise<void>;
  handleSendWhatsAppReminder: (visitId: string) => void;
  setScheduleVisitForm: React.Dispatch<React.SetStateAction<any>>;
  setIsScheduleVisitOpen: (open: boolean) => void;
  setRecordOfferForm: React.Dispatch<React.SetStateAction<any>>;
  setIsRecordOfferOpen: (open: boolean) => void;
  setRejectDocModal: React.Dispatch<React.SetStateAction<any>>;
  setRejectDocReason: (reason: string) => void;
  setActiveSection: (sec: any) => void;
  setOfferSearch: (search: string) => void;
  assigneeSelect: string;
  setAssigneeSelect: (val: string) => void;
  isFollowUpPickerOpen: boolean;
  setIsFollowUpPickerOpen: (open: boolean) => void;
  newFollowUpDate: string;
  newFollowUpNote: string;
  setNewFollowUpNote: (val: string) => void;
  newCallNote: string;
  setNewCallNote: (val: string) => void;
  handleDeleteLead?: (leadId: string) => void;
}

export function LeadDetailDrawer({
  selectedLeadId,
  onClose,
  leadDetailData,
  leadDetailLoading,
  leadDetailError,
  onRetry,
  staffList,
  properties,
  handleUpdateLeadStatus,
  handleAssignLead,
  handleScheduleFollowUp,
  handleAddCallNote,
  handleVerifyDocument,
  handleSendWhatsAppReminder,
  setScheduleVisitForm,
  setIsScheduleVisitOpen,
  setRecordOfferForm,
  setIsRecordOfferOpen,
  setRejectDocModal,
  setRejectDocReason,
  setActiveSection,
  setOfferSearch,
  assigneeSelect,
  setAssigneeSelect,
  setIsFollowUpPickerOpen,
  newFollowUpDate,
  newFollowUpNote,
  setNewFollowUpNote,
  newCallNote,
  setNewCallNote,
  handleDeleteLead
}: LeadDetailDrawerProps) {
  const lead = leadDetailData?.lead || {};
  const visits: any[] = Array.isArray(leadDetailData?.visits) ? leadDetailData.visits : [];
  const documents: any[] = Array.isArray(leadDetailData?.documents) ? leadDetailData.documents : [];
  const offers: any[] = Array.isArray(leadDetailData?.offers) ? leadDetailData.offers : [];
  const auditLogs: any[] = Array.isArray(leadDetailData?.auditLogs) ? leadDetailData.auditLogs : [];
  const property = leadDetailData?.property || null;

  const rawName = String(
    lead?.displayName || 
    lead?.owner_name || 
    lead?.ownerName || 
    lead?.buyer_name || 
    lead?.name || 
    'Customer Details'
  ).trim();
  const displayName = rawName || 'Customer Details';
  const initialChar = (displayName[0] || 'C').toUpperCase();

  const rawSrc = lead?.source || lead?.attribution?.source || (typeof lead?.notes === 'string' && lead.notes.includes('99acres') ? '99acres' : (typeof lead?.notes === 'string' && lead.notes.toLowerCase().includes('magicbricks') ? 'Magicbricks' : (typeof lead?.notes === 'string' && (lead.notes.toLowerCase().includes('facebook') || lead.notes.toLowerCase().includes('meta')) ? 'Facebook Ads' : 'SellMyGhar')));
  const src = typeof rawSrc === 'string' ? rawSrc : (typeof rawSrc === 'object' && rawSrc !== null ? ((rawSrc as any).name || (rawSrc as any).source || 'SellMyGhar') : 'SellMyGhar');
  const is99 = typeof src === 'string' && src.toLowerCase().includes('99acres');
  const isMb = typeof src === 'string' && src.toLowerCase().includes('magicbricks');
  const isFb = typeof src === 'string' && (src.toLowerCase().includes('facebook') || src.toLowerCase().includes('meta') || src.toLowerCase().includes('instagram'));
  const isHousing = typeof src === 'string' && src.toLowerCase().includes('housing');
  const isWebsite = !is99 && !isMb && !isFb && !isHousing;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg lg:max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200/80 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#0073E6] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {initialChar}
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 font-['Poppins',sans-serif] max-w-[240px] truncate">
                {displayName}
              </h3>
              <div className="flex items-center flex-wrap gap-2 mt-0.5 font-['Poppins',sans-serif] text-xs text-slate-500">
                <span className="font-semibold text-slate-800">
                  {lead?.type === 'BUYER' ? 'Buyer' : 'Seller'}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">
                  {src}
                </span>
                {(lead?.lead_status === 'NEW' || lead?.stage === 'NEW') && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-600 font-semibold text-[11px]">
                      New Lead
                    </span>
                  </>
                )}
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[11px] text-slate-400">{selectedLeadId}</span>
              </div>
            </div>
          </div>

          {/* Header Quick Contact Actions */}
          <div className="flex items-center space-x-2">
            {lead?.phone && typeof lead.phone === 'string' && (
              <>
                <a
                  href={`tel:${lead.phone}`}
                  title="Call customer"
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    window.open(`https://wa.me/${String(lead.phone).replace(/[^0-9]/g, '')}`, '_blank');
                  }}
                  title="Open WhatsApp chat"
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </>
            )}
            {handleDeleteLead && (
              <button
                type="button"
                onClick={() => handleDeleteLead(selectedLeadId)}
                title="Delete Lead"
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
          {leadDetailLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0073E6]" />
              <p className="text-xs font-medium">Retrieving customer record from PostgreSQL...</p>
            </div>
          ) : leadDetailError ? (
            <div className="py-16 text-center space-y-3">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 max-w-sm mx-auto">
                <p className="font-bold text-xs">Unable to load customer details</p>
                <p className="text-[11px] mt-1">{leadDetailError}</p>
              </div>
              <button
                type="button"
                onClick={() => onRetry(selectedLeadId)}
                className="px-4 py-2 bg-[#0073E6] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer hover:bg-[#005BB5]"
              >
                Retry
              </button>
            </div>
          ) : !leadDetailData || !leadDetailData.lead ? (
            <div className="py-16 text-center text-slate-400">Customer record not found.</div>
          ) : (
            <>
              {/* 1. Quick Requirements & Contact Strip */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Budget / Expected</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {lead.expected_price_inr && !isNaN(Number(lead.expected_price_inr))
                        ? formatIndianCurrency(lead.expected_price_inr)
                        : 'Market'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">BHK Configuration</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {lead.bhk_type || lead.bhk || '2 BHK'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Society / Project</span>
                    <strong className="text-slate-900 font-bold text-sm truncate block">
                      {lead.apartment_society_name || lead.preferred_locality_or_society || lead.society || 'Sobha'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Phone Number</span>
                    <strong className="text-slate-900 font-mono text-xs block mt-0.5">
                      {lead.phone || '—'}
                    </strong>
                  </div>
                </div>

                {/* Received Time Highlight */}
                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center space-x-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#0073E6] shrink-0" />
                    <span>Lead Received:</span>
                    <strong className="text-slate-900 font-semibold">
                      {(() => {
                        const rawDate = lead.createdAt || lead.created_at || lead.attribution?.receivedAt || lead.attribution?.enquiryDate;
                        if (!rawDate) return 'Just now';
                        return `${formatReadableDate(rawDate)} at ${formatReadableTime(rawDate)}`;
                      })()}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Channel: <strong className="text-slate-800">{src}</strong>
                  </span>
                </div>
              </div>

              {/* Inbound Lead Progress & Timeline */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Inbound Lead Activity Timeline</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {selectedLeadId}
                  </span>
                </div>

                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-4">
                  {/* Step 1: Inbound Capture */}
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0073E6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <strong className="text-slate-900 font-semibold text-xs">
                          Inbound Lead Received
                        </strong>
                        <span className="text-[10px] text-slate-600 font-mono font-medium">
                          {(() => {
                            const rawDate = lead.createdAt || lead.created_at || lead.attribution?.receivedAt || lead.attribution?.enquiryDate;
                            if (!rawDate) return 'Recorded';
                            return `${formatReadableDate(rawDate)} at ${formatReadableTime(rawDate)}`;
                          })()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Captured via <span className="font-semibold text-slate-800">{src}</span>
                        {lead.attribution?.formName ? ` (${lead.attribution.formName})` : ''}
                        {lead.attribution?.campaignName ? ` • Campaign: ${lead.attribution.campaignName}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Staff Assignment */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                      lead.assigned_staff_id || lead.assignedStaffId
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      2
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <strong className="text-slate-900 font-semibold text-xs">
                          {lead.assigned_staff_id || lead.assignedStaffId
                            ? 'Relationship Manager Assigned'
                            : 'Pending RM Assignment'}
                        </strong>
                        {lead.assigned_at && (
                          <span className="text-[10px] text-slate-600 font-mono font-medium">
                            {formatReadableDate(lead.assigned_at)} at {formatReadableTime(lead.assigned_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {lead.assigned_staff_name || staffList.find(s => s.id === (lead.assigned_staff_id || lead.assignedStaffId))?.displayName
                          ? `Assigned to ${lead.assigned_staff_name || staffList.find(s => s.id === (lead.assigned_staff_id || lead.assignedStaffId))?.displayName}`
                          : 'Awaiting assignment to sales or intake relationship manager'}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Current Lifecycle Milestone */}
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <strong className="text-slate-900 font-semibold text-xs">
                          Current Stage: {lead.lead_status || lead.stage || 'NEW'}
                        </strong>
                        {lead.updated_at && (
                          <span className="text-[10px] text-slate-600 font-mono font-medium">
                            Updated {formatReadableDate(lead.updated_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {PIPELINE_STAGES.find(s => s.key === (lead.lead_status || lead.stage))?.desc || 'Lead active in pipeline'}
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Next Follow-up Milestone */}
                  {lead.next_follow_up_at && (
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0073E6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        4
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <strong className="text-slate-900 font-semibold text-xs">
                            Scheduled Follow-up
                          </strong>
                          <span className="text-[10px] font-bold text-[#0073E6] font-mono">
                            {formatReadableDate(lead.next_follow_up_at)} at {formatReadableTime(lead.next_follow_up_at)}
                          </span>
                        </div>
                        {lead.follow_up_notes && (
                          <p className="text-[11px] text-slate-600 mt-0.5 italic">
                            "{lead.follow_up_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Lead Lifecycle Stage & Relationship Manager */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Lifecycle & Assignment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Lifecycle Stage
                    </label>
                    <select
                      value={lead.lead_status || lead.stage || 'NEW'}
                      onChange={(e) => handleUpdateLeadStatus(selectedLeadId, e.target.value as LeadStatus)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 font-bold text-xs text-slate-800 shadow-2xs"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label} ({s.desc})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Assigned Relationship Manager
                    </label>
                    <select
                      value={assigneeSelect}
                      onChange={(e) => {
                        setAssigneeSelect(e.target.value);
                        handleAssignLead(selectedLeadId, e.target.value);
                      }}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 font-medium text-xs text-slate-800 shadow-2xs focus:border-[#0073E6]"
                    >
                      <option value="">Unassigned</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.displayName || s.email} • {Array.isArray(s.roles) ? s.roles.join(', ') : String(s.roles || '')}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Owns client diligence, follow-up scheduling & site tour coordination.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Schedule Next Follow-up */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Schedule Next Follow-up
                  </h4>
                  {lead.next_follow_up_at && (
                    <span className="text-[10px] font-bold text-[#0073E6] tabular-nums">
                      Due: {formatReadableDate(lead.next_follow_up_at)} at {formatReadableTime(lead.next_follow_up_at)}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFollowUpPickerOpen(true)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-left font-medium text-slate-800 hover:bg-slate-50 flex items-center justify-between shadow-2xs cursor-pointer"
                    >
                      <span className="truncate tabular-nums">
                        {newFollowUpDate
                          ? `Selected: ${formatReadableDate(newFollowUpDate)}`
                          : 'Select Date & Time Slot...'}
                      </span>
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                    </button>
                    <input
                      type="text"
                      placeholder="Instructions or call objective..."
                      value={newFollowUpNote}
                      onChange={(e) => setNewFollowUpNote(e.target.value)}
                      className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-800 shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleScheduleFollowUp(selectedLeadId)}
                    disabled={!newFollowUpDate}
                    className={`w-full py-2 font-bold rounded-xl transition-colors cursor-pointer shadow-xs text-xs ${
                      newFollowUpDate
                        ? 'bg-[#0073E6] text-white hover:bg-[#005BB5]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Confirm Follow-up Due Date
                  </button>
                </div>
              </div>

              {/* 4. Call Notes & Interaction Timeline */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Call Notes & Interactions
                </h4>
                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Log detailed notes from client conversation..."
                    value={newCallNote}
                    onChange={(e) => setNewCallNote(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-xl p-3 text-xs text-slate-800 shadow-2xs focus:border-[#0073E6] focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddCallNote(selectedLeadId)}
                    className="px-3.5 py-1.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 cursor-pointer text-xs shadow-2xs"
                  >
                    Record Call Note
                  </button>
                </div>

                {(() => {
                  const raw = typeof lead.notes === 'string' ? lead.notes : '';
                  if (!raw.trim()) {
                    return <p className="text-slate-400 italic text-[11px]">No notes recorded yet.</p>;
                  }

                  const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
                  const sourceLines: string[] = [];
                  const interactionNotes: Array<{ rawTime?: string; formattedTime?: string; author: string; text: string }> = [];

                  for (const line of lines) {
                    if (line.startsWith('[Source:') || (line.includes('[Ext ID:') && line.includes('99acres'))) {
                      sourceLines.push(line);
                    } else {
                      const match = line.match(/^\[(.*?) - (.*?)\]:\s*(.*)$/);
                      if (match) {
                        const rawTime = match[1];
                        const authorId = match[2];
                        const text = match[3];

                        let formattedTime = rawTime;
                        try {
                          const d = new Date(rawTime);
                          if (!isNaN(d.getTime())) {
                            formattedTime = d.toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            }) + ' at ' + d.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          }
                        } catch {}

                        const staff = staffList.find(s => s.id === authorId || s.email === authorId);
                        const authorName = staff?.displayName || (authorId.includes('@') ? authorId.split('@')[0] : authorId);

                        interactionNotes.push({
                          rawTime,
                          formattedTime,
                          author: authorName,
                          text
                        });
                      } else {
                        interactionNotes.push({
                          author: 'Note',
                          text: line
                        });
                      }
                    }
                  }

                  return (
                    <div className="space-y-3">
                      {/* Interaction Call Notes with Dividers and Timestamps */}
                      {interactionNotes.length > 0 ? (
                        <div className="space-y-2.5">
                          {interactionNotes.map((note, nIdx) => (
                            <div key={`note-${nIdx}`} className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px]">
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-5 h-5 rounded-full bg-blue-100/70 text-[#0073E6] flex items-center justify-center font-bold text-[10px]">
                                    {note.author && note.author[0] ? note.author[0].toUpperCase() : 'U'}
                                  </div>
                                  <strong className="text-slate-900 font-semibold">{note.author}</strong>
                                </div>
                                {note.formattedTime && (
                                  <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{note.formattedTime}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                                {note.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-[11px]">No staff call notes recorded yet.</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Lead Attribution & Platform Metadata */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between font-['Poppins',sans-serif]">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Inbound Source & Listing Metadata
                  </h4>
                  <span className="text-xs font-semibold text-slate-700">
                    {isFb 
                      ? 'Facebook Lead Ads Webhook' 
                      : isMb 
                      ? 'Magicbricks Real-Time Push API' 
                      : is99 
                      ? '99acres Real-Time Webhook' 
                      : isHousing 
                      ? 'Housing.com Portal Lead' 
                      : 'SellMyGhar Direct Portal'}
                  </span>
                </div>
                <div className={`${
                  isFb 
                    ? 'bg-blue-50/40 border-blue-200/60' 
                    : isMb 
                    ? 'bg-rose-50/40 border-rose-200/60' 
                    : is99 
                    ? 'bg-amber-50/40 border-amber-200/60' 
                    : isHousing 
                    ? 'bg-purple-50/40 border-purple-200/60' 
                    : 'bg-emerald-50/40 border-emerald-200/60'
                } rounded-2xl p-3.5 border space-y-2 text-xs`}>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        {isFb 
                          ? 'Meta Lead ID:' 
                          : isMb 
                          ? 'Magicbricks Lead ID:' 
                          : is99 
                          ? '99acres External Lead ID:' 
                          : isHousing 
                          ? 'Housing Inquiry ID:' 
                          : 'Portal Submission Ref:'}
                      </span>
                      <span className="font-mono text-slate-800 font-semibold truncate block">
                        {isFb 
                          ? (lead.attribution?.externalEnquiryId || lead.attribution?.rawPayload?.leadgen_id || 'Captured via Meta')
                          : isMb 
                          ? (lead.attribution?.externalEnquiryId || lead.attribution?.rawPayload?.LeadId || 'Captured via Magicbricks')
                          : is99 
                          ? (lead.attribution?.externalEnquiryId || lead.attribution?.rawPayload?.propertyid || 'Captured via 99acres')
                          : isHousing 
                          ? (lead.attribution?.externalEnquiryId || 'Captured via Housing')
                          : (selectedLeadId || lead.id || 'SMG-DIRECT-WEB')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        {isFb 
                          ? 'Meta Form / Campaign:' 
                          : isMb 
                          ? 'Project / Locality:' 
                          : is99 
                          ? '99acres Listing ID:' 
                          : isHousing 
                          ? 'Project / Locality:' 
                          : 'Inbound Channel:'}
                      </span>
                      <span className="font-mono text-slate-800 font-semibold truncate block">
                        {isFb 
                          ? (lead.attribution?.rawPayload?.form_id ? `Form: ${lead.attribution.rawPayload.form_id}` : (lead.society || 'Lead Ad Campaign'))
                          : isMb 
                          ? (lead.attribution?.externalListingId || lead.attribution?.rawPayload?.ProjectName || lead.attribution?.rawPayload?.Locality || lead.society || 'N/A')
                          : is99 
                          ? (lead.attribution?.externalListingId || lead.attribution?.rawPayload?.propertyid || 'N/A')
                          : isHousing 
                          ? (lead.society || lead.locality || 'Bangalore')
                          : 'Direct Web Submission (sellmyghar.in)'}
                      </span>
                    </div>
                    {is99 && lead.attribution?.rawPayload?.projectid && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Project ID:</span>
                        <span className="font-mono text-slate-800">{String(lead.attribution.rawPayload.projectid)}</span>
                      </div>
                    )}
                    {isWebsite && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">Attribution / Campaign:</span>
                        <span className="text-slate-800 font-medium">
                          {lead.attribution?.utm_source || lead.attribution?.campaign || 'Organic Direct Search'}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500 block text-[10px]">Inquiry Timestamp:</span>
                      <span className="text-slate-800 font-medium">
                        {lead.attribution?.enquiryDate 
                          ? formatReadableDate(lead.attribution.enquiryDate) 
                          : (lead.createdAt || lead.created_at ? formatReadableDate(lead.createdAt || lead.created_at) : 'Today')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>


              {/* 5. Related Site Visits */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Related Site Visits ({visits.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleVisitForm((prev: any) => ({
                        ...prev,
                        leadId: selectedLeadId,
                        clientName: lead.displayName || lead.owner_name || lead.name || lead.buyer_name || '',
                        clientPhone: lead.phone || '',
                        propertyId: lead.property_id || properties[0]?.id || ''
                      }));
                      setIsScheduleVisitOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#0073E6] hover:underline cursor-pointer"
                  >
                    + Schedule Visit
                  </button>
                </div>

                {visits.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No visits recorded for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {visits.map((v: any) => (
                      <div key={v.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 block">{formatReadableDate(v.visit_date)} at {formatReadableTime(v.visit_time)}</strong>
                          <span className="text-[10px] text-slate-500">{v.status}</span>
                        </div>
                        {v.status === 'SCHEDULED' && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReminder(v.id)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded-lg cursor-pointer"
                          >
                            WhatsApp
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Connected Property Documents (if property attached) */}
              {property && (
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Property Documents ({documents.length})
                    </h4>
                    <span className="text-[10px] text-[#0073E6] font-bold">
                      Tier: {property.verification_tier || 'LEVEL_1'}
                    </span>
                  </div>

                  {documents.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No documents uploaded for this property yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between shadow-2xs"
                        >
                          <div>
                            <strong className="text-slate-900 block truncate max-w-[200px]">{doc.file_name}</strong>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                doc.verification_status === 'VERIFIED'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : doc.verification_status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {doc.verification_status}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {doc.verification_status !== 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Verify Document
                              </button>
                            )}
                            {doc.verification_status !== 'REJECTED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectDocModal({
                                    isOpen: true,
                                    docId: doc.id,
                                    docName: doc.file_name
                                  });
                                  setRejectDocReason('');
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg cursor-pointer"
                              >
                                Reject Document
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 7. Related Purchase Offers */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Related Purchase Offers ({offers.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setRecordOfferForm((prev: any) => ({
                        ...prev,
                        leadId: selectedLeadId,
                        propertyId: lead.property_id || properties[0]?.id || '',
                        buyerName: lead.type === 'BUYER' ? (lead.displayName || lead.buyer_name || lead.owner_name || lead.name || '') : '',
                        buyerPhone: lead.type === 'BUYER' ? (lead.phone || '') : ''
                      }));
                      setIsRecordOfferOpen(true);
                    }}
                    className="text-[11px] font-bold text-[#0073E6] hover:underline cursor-pointer"
                  >
                    + Record Offer
                  </button>
                </div>

                {offers.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No purchase offers recorded for this inquiry.</p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((off: any) => (
                      <div
                        key={off.id}
                        className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <strong className="text-slate-900 font-bold text-xs">
                              {formatIndianCurrency(off.offer_amount_inr)}
                            </strong>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                off.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : off.status === 'COUNTER_OFFERED'
                                  ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60'
                                  : off.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              }`}
                            >
                              {off.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Buyer: {off.buyer_name} ({off.buyer_phone})
                          </p>
                          {off.counter_offer_amount_inr && (
                            <p className="text-[10px] text-blue-700 font-medium mt-0.5">
                              Counter: {formatIndianCurrency(off.counter_offer_amount_inr)}
                              {off.counter_offer_note && ` — ${off.counter_offer_note}`}
                            </p>
                          )}
                        </div>
                        {off.status === 'PENDING_REVIEW' && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              setActiveSection('OFFERS');
                              setOfferSearch(off.buyer_phone || off.buyer_name || '');
                            }}
                            className="px-2.5 py-1 bg-[#0073E6] text-white font-bold text-[10px] rounded-lg cursor-pointer shadow-2xs"
                          >
                            Review Offer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Immutable Lead Audit History */}
              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Audit Trail & Timeline ({auditLogs.length})
                </h4>
                {auditLogs.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">No previous audit events recorded.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {auditLogs.slice(0, 10).map((log: any) => (
                      <div
                        key={log.id}
                        className="p-2 bg-slate-50/60 rounded-lg border border-slate-100 text-[11px] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{log.action}</span>
                          <span className="text-slate-500 ml-1.5 text-[10px]">
                            by <strong className="text-slate-700 font-semibold">{log.actor_name || staffList.find(s => s.id === log.actor_user_id)?.displayName || (log.actor_user_id === 'system-webhook-99acres' ? '99acres Webhook' : (log.actor_user_id === 'system-webhook-magicbricks' ? 'Magicbricks Webhook' : (log.actor_role || log.actor_user_id)))}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {log.created_at ? formatReadableDate(log.created_at) : 'Recent'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
