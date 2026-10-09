import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  Tag,
  Clock,
  Calendar,
  ShieldCheck,
  BarChart3,
  ShieldAlert,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  ChevronDown,
  LogOut,
  ArrowLeft,
  ExternalLink,
  Edit,
  Copy,
  Check,
  MapPin,
  User,
  DollarSign,
  Layers,
  Lock,
  AlertCircle,
  Eye,
  PlayCircle,
  PauseCircle,
  Archive,
  ArrowUpRight,
  Send,
  HelpCircle,
  TrendingUp,
  FileCheck2,
  Info,
  Download,
  UserPlus
} from 'lucide-react';
import { StaffRole } from '../../core/types/auth';
import { LeadStatus } from '../../core/types/entities';
import { AdminErasureQueue } from './AdminErasureQueue';
import { PropertyEditor } from './PropertyEditor';

export type PropertyListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'SOLD' | 'ARCHIVED';

export interface CrmLead {
  id: string;
  type?: 'SELLER' | 'BUYER' | string;
  ownerName: string;
  name?: string;
  phone: string;
  society: string;
  locality: string;
  bhk: string;
  expectedPrice: string;
  expectedPriceRaw?: number | null;
  listingIntent?: string;
  stage: LeadStatus;
  status?: LeadStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  assignedStaffPhone?: string | null;
  assignedTo?: string;
  assignedAt?: string | null;
  propertyId?: string | null;
  nextFollowUpAt?: string | null;
  followUpNotes?: string | null;
  notes?: string | null;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CrmProperty {
  id: string;
  title?: string;
  projectName: string;
  localityName: string;
  propertyType?: string;
  bhkType: string;
  superBuiltUpSqft: number;
  carpetAreaSqft: number;
  floorBand: string;
  facing: string;
  askingPriceInr: number;
  pricePerSqft: number;
  monthlyMaintenanceInr?: number;
  publicAddress?: string;
  description?: string;
  amenities?: string[];
  developerName?: string;
  landmarks?: string[];
  highlights?: string[];
  image: string;
  images?: Array<{ id: string; url: string; is_featured?: boolean; created_at?: string }>;
  verificationBadge: string;
  assignedRm?: string;
  assignedRmPhone?: string | null;
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  reserveMinimumPriceInr?: number;
  status: PropertyListingStatus;
  updatedAt?: string;
  createdAt?: string;
}

export interface CrmStaff {
  id: string;
  displayName: string;
  name?: string;
  email: string;
  phone?: string;
  roles: string[];
}

export interface CrmVisit {
  id: string;
  property_id: string;
  lead_id?: string | null;
  client_name: string;
  client_phone: string;
  visit_date: string;
  visit_time: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_phone?: string | null;
  property_title?: string | null;
  property_locality?: string | null;
  property_price?: number | null;
  notes?: string | null;
  whatsapp_reminder_sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmOffer {
  id: string;
  property_id: string;
  lead_id?: string | null;
  buyer_name: string;
  buyer_phone: string;
  offer_amount_inr: number;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFERED';
  notes?: string | null;
  counter_offer_amount_inr?: number | null;
  property_title?: string | null;
  property_locality?: string | null;
  asking_price_inr?: number | null;
  reserve_minimum_price_inr?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CrmTask {
  id: string;
  name: string;
  phone: string;
  society: string;
  locality: string;
  lead_status: string;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  next_follow_up_at: string;
  follow_up_notes?: string | null;
}

export interface CrmAuditLog {
  id: string;
  actor_user_id?: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_entity: string;
  target_entity_id: string;
  client_ip: string;
  diff_summary: any;
  created_at: string;
}

interface CrmDashboardProps {
  staffUser?: any;
  onLogout?: () => void;
  onExit?: () => void;
}

export type NavSection =
  | 'OVERVIEW'
  | 'LEADS'
  | 'PROPERTIES'
  | 'VISITS'
  | 'OFFERS'
  | 'TASKS'
  | 'CALENDAR'
  | 'TEAM'
  | 'REPORTS'
  | 'AUDIT'
  | 'SETTINGS';

const PIPELINE_STAGES: Array<{ key: LeadStatus; label: string; desc: string }> = [
  { key: 'NEW', label: 'NEW', desc: 'Fresh Inbound' },
  { key: 'CONTACTED', label: 'CONTACTED', desc: 'Outreach Initiated' },
  { key: 'FOLLOW_UP', label: 'FOLLOW UP', desc: 'Diligence in Progress' },
  { key: 'SITE_VISIT', label: 'SITE VISIT', desc: 'Physical Tours' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', desc: 'Offer & Pricing' },
  { key: 'CONVERTED', label: 'CONVERTED', desc: 'Deal Closed' },
  { key: 'LOST', label: 'LOST', desc: 'Inquiry Dropped' },
];

export function CrmDashboard({ staffUser, onLogout, onExit }: CrmDashboardProps) {
  // Navigation State
  const [activeSection, setActiveSection] = useState<NavSection>('OVERVIEW');

  // RBAC State - Current user and role switcher
  const [currentRole, setCurrentRole] = useState<StaffRole>(() => {
    if (staffUser?.roles && staffUser.roles.length > 0) {
      const match = staffUser.roles.find((r: string) => r.startsWith('STAFF_'));
      if (match) return match as StaffRole;
    }
    return 'STAFF_SUPER_ADMIN';
  });

  // Global Data State
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [properties, setProperties] = useState<CrmProperty[]>([]);
  const [visits, setVisits] = useState<CrmVisit[]>([]);
  const [offers, setOffers] = useState<CrmOffer[]>([]);
  const [tasks, setTasks] = useState<{ overdue: CrmTask[]; dueToday: CrmTask[]; upcoming: CrmTask[] }>({
    overdue: [],
    dueToday: [],
    upcoming: []
  });
  const [staffList, setStaffList] = useState<CrmStaff[]>([]);
  const [auditLogs, setAuditLogs] = useState<CrmAuditLog[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [reportsData, setReportsData] = useState<any>(null);

  // Loading & Sync States
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Search
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('ALL');
  const [leadAssignFilter, setLeadAssignFilter] = useState<string>('ALL');
  const [leadTypeFilter, setLeadTypeFilter] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');
  const [leadFollowUpFilter, setLeadFollowUpFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'>('ALL');

  const [propStatusFilter, setPropStatusFilter] = useState<string>('ALL');
  const [propBhkFilter, setPropBhkFilter] = useState<string>('ALL');

  const [visitStatusFilter, setVisitStatusFilter] = useState<string>('ALL');
  const [offerStatusFilter, setOfferStatusFilter] = useState<string>('ALL');

  // Selected Records for Drawers
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [leadDetailData, setLeadDetailData] = useState<any>(null);
  const [leadDetailLoading, setLeadDetailLoading] = useState<boolean>(false);
  const [leadDetailError, setLeadDetailError] = useState<string | null>(null);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertyDetailData, setPropertyDetailData] = useState<any>(null);
  const [propertyDetailLoading, setPropertyDetailLoading] = useState<boolean>(false);
  const [propertyDetailError, setPropertyDetailError] = useState<string | null>(null);

  // Super Admin: Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [addUserForm, setAddUserForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'STAFF_INTAKE_AGENT' as StaffRole,
    initialPassword: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // Modals
  const [isPropertyEditorOpen, setIsPropertyEditorOpen] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<CrmProperty | null>(null);

  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState<boolean>(false);
  const [scheduleVisitForm, setScheduleVisitForm] = useState({
    propertyId: '',
    leadId: '',
    clientName: '',
    clientPhone: '',
    visitDate: 'Tomorrow',
    visitTime: '11:00 AM',
    assignedStaffId: '',
    notes: ''
  });

  const [isRecordOfferOpen, setIsRecordOfferOpen] = useState<boolean>(false);
  const [recordOfferForm, setRecordOfferForm] = useState({
    propertyId: '',
    leadId: '',
    buyerName: '',
    buyerPhone: '',
    offerAmountInr: '',
    notes: ''
  });

  const [counterOfferTarget, setCounterOfferTarget] = useState<CrmOffer | null>(null);
  const [counterOfferAmount, setCounterOfferAmount] = useState<string>('');
  const [counterOfferNote, setCounterOfferNote] = useState<string>('');

  // Drawer Action Inputs
  const [assigneeSelect, setAssigneeSelect] = useState<string>('');
  const [newFollowUpDate, setNewFollowUpDate] = useState<string>('');
  const [newFollowUpNote, setNewFollowUpNote] = useState<string>('');
  const [newCallNote, setNewCallNote] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Data Fetching Functions
  // -------------------------------------------------------------
  const loadOverviewMetrics = async () => {
    try {
      const res = await fetch('/api/crm/overview-metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setOverviewMetrics(data);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadLeads = async () => {
    try {
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          setLeads(data.leads);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/crm/properties');
      if (res.ok) {
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          const mapped: CrmProperty[] = data.properties.map((p: any) => ({
            id: p.id,
            title: p.title || p.projectName,
            projectName: p.projectName,
            localityName: p.localityName || p.locality,
            propertyType: p.propertyType || 'Apartment',
            bhkType: p.bhkType,
            superBuiltUpSqft: p.superBuiltUpSqft || p.super_built_up_sqft,
            carpetAreaSqft: p.carpetAreaSqft || p.carpet_area_sqft,
            floorBand: p.floorBand || 'Mid Floor',
            facing: p.facing || 'East',
            askingPriceInr: p.askingPriceInr || p.asking_price_inr,
            pricePerSqft: p.pricePerSqft || Math.round((p.askingPriceInr || 10000000) / (p.superBuiltUpSqft || 1000)),
            monthlyMaintenanceInr: p.monthlyMaintenanceInr,
            publicAddress: p.publicAddress,
            description: p.description,
            amenities: p.amenities || [],
            developerName: p.developerName,
            landmarks: p.landmarks || [],
            highlights: p.highlights || [],
            image: p.primaryImage || (p.images && p.images[0]?.url) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            images: p.images || [],
            verificationBadge: p.verificationTier ? p.verificationTier.replace('LEVEL_', 'L').replace(/_/g, ' ') : 'VERIFIED',
            assignedRm: p.assignedRm || 'Sneha Reddy',
            assignedRmPhone: p.assignedRmPhone,
            ownerId: p.ownerId,
            ownerName: p.ownerName,
            ownerPhone: p.ownerPhone,
            reserveMinimumPriceInr: p.reserveMinimumPriceInr,
            status: (p.listingStatus || 'PUBLISHED') as PropertyListingStatus,
            updatedAt: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Recently',
            createdAt: p.createdAt
          }));
          setProperties(mapped);
          return;
        }
      }

      // Fallback
      const fallbackRes = await fetch('/api/listings');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data.listings && Array.isArray(data.listings)) {
          const mapped: CrmProperty[] = data.listings.map((item: any) => ({
            id: item.id,
            title: item.title,
            projectName: item.societyName,
            localityName: item.localityName,
            bhkType: item.bhkType,
            superBuiltUpSqft: item.superBuiltUpSqft,
            carpetAreaSqft: item.carpetAreaSqft,
            floorBand: item.floorBand,
            facing: item.facing,
            askingPriceInr: item.askingPriceInr,
            pricePerSqft: item.pricePerSqft,
            image: item.images?.[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            images: item.images?.map((url: string, i: number) => ({ id: `img-${i}`, url, is_featured: i === 0 })) || [],
            verificationBadge: 'VERIFIED',
            status: 'PUBLISHED' as PropertyListingStatus,
            updatedAt: 'Recently'
          }));
          setProperties(mapped);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadVisits = async () => {
    try {
      const res = await fetch('/api/crm/visits');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.visits)) {
          setVisits(data.visits);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadOffers = async () => {
    try {
      const res = await fetch('/api/crm/offers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.offers)) {
          setOffers(data.offers);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/crm/tasks');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTasks({
            overdue: data.overdue || [],
            dueToday: data.dueToday || [],
            upcoming: data.upcoming || []
          });
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadStaff = async () => {
    try {
      const res = await fetch('/api/crm/staff');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.staff)) {
          setStaffList(data.staff);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/crm/audit-logs');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadReports = async () => {
    try {
      const res = await fetch('/api/crm/reports');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reports) {
          setReportsData(data.reports);
        }
      }
    } catch {
      // Fallback
    }
  };

  // Full refresh
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadOverviewMetrics(),
      loadLeads(),
      loadProperties(),
      loadVisits(),
      loadOffers(),
      loadTasks(),
      loadStaff(),
      loadAuditLogs(),
      loadReports()
    ]);
    setIsRefreshing(false);
    setLoading(false);
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Load Lead Detail when selected
  useEffect(() => {
    if (!selectedLeadId) {
      setLeadDetailData(null);
      setLeadDetailError(null);
      return;
    }
    setLeadDetailLoading(true);
    setLeadDetailError(null);
    fetch(`/api/crm/leads/${selectedLeadId}/details`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setLeadDetailData(data);
          setAssigneeSelect(data.lead.assigned_staff_id || '');
        } else {
          setLeadDetailError(data.message || data.error || 'Failed to load lead details from PostgreSQL');
        }
      })
      .catch((err) => {
        setLeadDetailError(err.message || 'Network error retrieving lead details');
      })
      .finally(() => setLeadDetailLoading(false));
  }, [selectedLeadId]);

  // Load Property Detail when selected (Fixes loading bug properly: handles 200, 404, network error)
  useEffect(() => {
    if (!selectedPropertyId) {
      setPropertyDetailData(null);
      setPropertyDetailError(null);
      return;
    }
    setPropertyDetailLoading(true);
    setPropertyDetailError(null);
    fetch(`/api/crm/properties/${selectedPropertyId}/details`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setPropertyDetailData(data);
        } else {
          setPropertyDetailError(data.message || data.error || 'Property details not found or inaccessible');
        }
      })
      .catch((err) => {
        setPropertyDetailError(err.message || 'Network error retrieving property details');
      })
      .finally(() => setPropertyDetailLoading(false));
  }, [selectedPropertyId]);

  // -------------------------------------------------------------
  // Operational Action Handlers
  // -------------------------------------------------------------

  // 1. Update Lead Status
  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Lead status updated to ${newStatus}`, 'success');
        refreshAll();
        if (selectedLeadId === leadId) {
          setSelectedLeadId(null);
          setTimeout(() => setSelectedLeadId(leadId), 50);
        }
      } else {
        showToast(data.message || 'Failed to update lead status', 'error');
      }
    } catch {
      showToast('Network error updating status', 'error');
    }
  };

  // 2. Assign Lead to Staff
  const handleAssignLead = async (leadId: string, staffId: string) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedStaffId: staffId || null })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Lead assignment updated', 'success');
        refreshAll();
        if (selectedLeadId === leadId) {
          setSelectedLeadId(null);
          setTimeout(() => setSelectedLeadId(leadId), 50);
        }
      } else {
        showToast(data.message || 'Failed to assign lead', 'error');
      }
    } catch {
      showToast('Network error assigning lead', 'error');
    }
  };

  // 3. Schedule Follow Up
  const handleScheduleFollowUp = async (leadId: string) => {
    if (!newFollowUpDate) {
      showToast('Please select a follow-up date and time', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpAt: new Date(newFollowUpDate).toISOString(),
          followUpNotes: newFollowUpNote || 'Scheduled follow-up call'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Follow-up scheduled successfully', 'success');
        setNewFollowUpDate('');
        setNewFollowUpNote('');
        refreshAll();
        if (selectedLeadId === leadId) {
          setSelectedLeadId(null);
          setTimeout(() => setSelectedLeadId(leadId), 50);
        }
      } else {
        showToast(data.message || 'Failed to schedule follow-up', 'error');
      }
    } catch {
      showToast('Network error scheduling follow-up', 'error');
    }
  };

  // 4. Add Lead Call Note
  const handleAddCallNote = async (leadId: string) => {
    if (!newCallNote.trim()) {
      showToast('Please type a note before saving', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newCallNote.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Call note recorded in audit ledger', 'success');
        setNewCallNote('');
        refreshAll();
        if (selectedLeadId === leadId) {
          setSelectedLeadId(null);
          setTimeout(() => setSelectedLeadId(leadId), 50);
        }
      } else {
        showToast(data.message || 'Failed to record note', 'error');
      }
    } catch {
      showToast('Network error recording note', 'error');
    }
  };

  // 5. Schedule Visit Submit
  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleVisitForm.propertyId || !scheduleVisitForm.clientName || !scheduleVisitForm.clientPhone) {
      showToast('Property, client name, and phone are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/crm/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleVisitForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Site visit scheduled successfully', 'success');
        setIsScheduleVisitOpen(false);
        setScheduleVisitForm({
          propertyId: '',
          leadId: '',
          clientName: '',
          clientPhone: '',
          visitDate: 'Tomorrow',
          visitTime: '11:00 AM',
          assignedStaffId: '',
          notes: ''
        });
        refreshAll();
      } else {
        showToast(data.message || 'Failed to schedule visit', 'error');
      }
    } catch {
      showToast('Network error scheduling visit', 'error');
    }
  };

  // 6. Update Visit Status
  const handleUpdateVisitStatus = async (visitId: string, status: string) => {
    try {
      const res = await fetch(`/api/crm/visits/${visitId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Visit marked as ${status}`, 'success');
        refreshAll();
      } else {
        showToast(data.message || 'Failed to update visit status', 'error');
      }
    } catch {
      showToast('Network error updating visit', 'error');
    }
  };

  // 7. Send WhatsApp Reminder (Truthful Backend Dispatcher)
  const handleSendWhatsAppReminder = async (visitId: string) => {
    try {
      const res = await fetch(`/api/crm/visits/${visitId}/whatsapp-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.configured === false) {
        // Truthful feedback: provider is unconfigured in environment
        showToast(data.message, 'info');
      } else if (res.ok && data.success) {
        showToast(data.message || 'WhatsApp reminder dispatched to client', 'success');
        refreshAll();
      } else {
        showToast(data.message || 'WhatsApp dispatch could not proceed', 'error');
      }
    } catch {
      showToast('Network error sending reminder', 'error');
    }
  };

  // 8. Record Offer Submit
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordOfferForm.propertyId || !recordOfferForm.buyerName || !recordOfferForm.buyerPhone || !recordOfferForm.offerAmountInr) {
      showToast('Property, buyer name, phone, and offer amount are required', 'error');
      return;
    }
    try {
      const res = await fetch('/api/crm/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...recordOfferForm,
          offerAmountInr: Number(recordOfferForm.offerAmountInr)
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Formal offer recorded successfully', 'success');
        setIsRecordOfferOpen(false);
        setRecordOfferForm({
          propertyId: '',
          leadId: '',
          buyerName: '',
          buyerPhone: '',
          offerAmountInr: '',
          notes: ''
        });
        refreshAll();
      } else {
        showToast(data.message || 'Failed to record offer', 'error');
      }
    } catch {
      showToast('Network error recording offer', 'error');
    }
  };

  // 9. Update Offer Status
  const handleUpdateOfferStatus = async (offerId: string, status: string, counterAmount?: number) => {
    try {
      const res = await fetch(`/api/crm/offers/${offerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          counterOfferAmountInr: counterAmount,
          notes: counterOfferNote || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Offer marked as ${status}`, 'success');
        setCounterOfferTarget(null);
        setCounterOfferAmount('');
        setCounterOfferNote('');
        refreshAll();
      } else {
        showToast(data.message || 'Failed to update offer status', 'error');
      }
    } catch {
      showToast('Network error updating offer', 'error');
    }
  };

  // 10. Verify or Reject Document (Persists to PostgreSQL and updates Seller Dashboard)
  const handleVerifyDocument = async (docId: string, action: 'VERIFIED' | 'REJECTED', note?: string) => {
    try {
      const res = await fetch(`/api/crm/documents/${docId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          note: note || (action === 'VERIFIED' ? 'Title stamps verified by legal desk' : 'Discrepancy flagged')
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Document marked as ${action} and recorded in audit log`, 'success');
        refreshAll();
        if (selectedPropertyId) {
          const pid = selectedPropertyId;
          setSelectedPropertyId(null);
          setTimeout(() => setSelectedPropertyId(pid), 50);
        }
        if (selectedLeadId) {
          const lid = selectedLeadId;
          setSelectedLeadId(null);
          setTimeout(() => setSelectedLeadId(lid), 50);
        }
      } else {
        showToast(data.message || 'Failed to update document status', 'error');
      }
    } catch {
      showToast('Network error updating document', 'error');
    }
  };

  // 11. Property Status Toggle
  const handleUpdatePropertyListingStatus = async (propertyId: string, newStatus: PropertyListingStatus) => {
    try {
      const res = await fetch(`/api/crm/properties/${propertyId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Property listing status updated to ${newStatus}`, 'success');
        refreshAll();
      } else {
        showToast(data.message || 'Failed to update property status', 'error');
      }
    } catch {
      showToast('Network error updating property status', 'error');
    }
  };

  // 12. Super Admin: Provision Staff User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserForm.fullName || !addUserForm.email || !addUserForm.phone || !addUserForm.initialPassword) {
      showToast('All fields are required', 'error');
      return;
    }
    if (!addUserForm.email.toLowerCase().endsWith('@sellmyghar.in')) {
      showToast('Email must end with @sellmyghar.in', 'error');
      return;
    }
    if (addUserForm.initialPassword.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/crm/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Staff account created for ${data.user.displayName}`, 'success');
        setIsAddUserOpen(false);
        setAddUserForm({
          fullName: '',
          email: '',
          phone: '',
          role: 'STAFF_INTAKE_AGENT',
          initialPassword: ''
        });
        refreshAll();
      } else {
        showToast(data.message || 'Failed to create staff account', 'error');
      }
    } catch {
      showToast('Network error creating user', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // 13. Super Admin: Update Staff Role
  const handleUpdateUserRole = async (userId: string, newRole: StaffRole) => {
    try {
      const res = await fetch(`/api/crm/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Role updated successfully', 'success');
        refreshAll();
      } else {
        showToast(data.message || 'Failed to update role', 'error');
      }
    } catch {
      showToast('Network error updating role', 'error');
    }
  };

  // 14. Export Permitted Reports as CSV
  const handleExportCsv = async (reportType: 'leads' | 'visits' | 'offers') => {
    try {
      let url = `/api/crm/reports/export-csv?type=${reportType}`;
      if (reportType === 'leads' && leadStatusFilter !== 'ALL') {
        url += `&status=${leadStatusFilter}`;
      }
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.message || 'Export failed', 'error');
        return;
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sellmyghar_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      showToast(`Exported ${reportType} report to CSV`, 'success');
    } catch {
      showToast('Network error downloading CSV', 'error');
    }
  };

  // -------------------------------------------------------------
  // Filtered Lists & Memos
  // -------------------------------------------------------------
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Global Search
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const match =
          (lead.ownerName || '').toLowerCase().includes(q) ||
          (lead.phone || '').toLowerCase().includes(q) ||
          (lead.society || '').toLowerCase().includes(q) ||
          (lead.locality || '').toLowerCase().includes(q) ||
          (lead.id || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      // Stage Filter
      if (leadStatusFilter !== 'ALL' && lead.stage !== leadStatusFilter) {
        return false;
      }

      // Assign Filter
      if (leadAssignFilter === 'ME') {
        if (lead.assignedStaffId !== (staffUser?.uid || 'usr-admin-compliance-01')) return false;
      } else if (leadAssignFilter === 'UNASSIGNED') {
        if (lead.assignedStaffId) return false;
      } else if (leadAssignFilter !== 'ALL') {
        if (lead.assignedStaffId !== leadAssignFilter) return false;
      }

      // Type Filter
      if (leadTypeFilter !== 'ALL' && lead.type !== leadTypeFilter) {
        return false;
      }

      // Follow-up Filter
      if (leadFollowUpFilter === 'OVERDUE' && !lead.isOverdue) return false;
      if (leadFollowUpFilter === 'TODAY') {
        if (!lead.nextFollowUpAt) return false;
        const d = new Date(lead.nextFollowUpAt);
        const today = new Date();
        if (d.toDateString() !== today.toDateString()) return false;
      }

      return true;
    });
  }, [leads, globalSearch, leadStatusFilter, leadAssignFilter, leadTypeFilter, leadFollowUpFilter, staffUser]);

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const match =
          (prop.projectName || '').toLowerCase().includes(q) ||
          (prop.localityName || '').toLowerCase().includes(q) ||
          (prop.title || '').toLowerCase().includes(q) ||
          (prop.developerName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (propStatusFilter !== 'ALL' && prop.status !== propStatusFilter) {
        return false;
      }

      if (propBhkFilter !== 'ALL' && !prop.bhkType.includes(propBhkFilter)) {
        return false;
      }

      return true;
    });
  }, [properties, globalSearch, propStatusFilter, propBhkFilter]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const match =
          (v.client_name || '').toLowerCase().includes(q) ||
          (v.client_phone || '').toLowerCase().includes(q) ||
          (v.property_title || '').toLowerCase().includes(q) ||
          (v.property_locality || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (visitStatusFilter !== 'ALL' && v.status !== visitStatusFilter) {
        return false;
      }

      return true;
    });
  }, [visits, globalSearch, visitStatusFilter]);

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      if (globalSearch.trim()) {
        const q = globalSearch.toLowerCase();
        const match =
          (o.buyer_name || '').toLowerCase().includes(q) ||
          (o.buyer_phone || '').toLowerCase().includes(q) ||
          (o.property_title || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (offerStatusFilter !== 'ALL' && o.status !== offerStatusFilter) {
        return false;
      }

      return true;
    });
  }, [offers, globalSearch, offerStatusFilter]);

  // Permission Checks
  const canSeeTeam = currentRole === 'STAFF_SUPER_ADMIN' || currentRole === 'STAFF_LISTING_MANAGER';
  const canSeeAudit = currentRole === 'STAFF_SUPER_ADMIN';
  const canSeeReservePrice = currentRole === 'STAFF_SUPER_ADMIN' || currentRole === 'STAFF_DEAL_CLOSER';

  return (
    <div className="flex h-screen bg-[#F4F6F9] text-[#172033] font-['Poppins',sans-serif] overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-blue-50 text-blue-900 border-blue-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* LEFT NAVIGATION SIDEBAR (CRMate composition)                    */}
      {/* ============================================================== */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-2xs z-20">
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#244B8F] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                SG
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-[#172033]">SellMyGhar</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Operations CRM</p>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              v2.6
            </span>
          </div>

          {/* Navigation Items (11 Sections) */}
          <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            {/* 1. Overview */}
            <button
              type="button"
              onClick={() => setActiveSection('OVERVIEW')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'OVERVIEW'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </div>
            </button>

            {/* 2. Leads */}
            <button
              type="button"
              onClick={() => setActiveSection('LEADS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'LEADS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Leads</span>
              </div>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  activeSection === 'LEADS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {leads.length}
              </span>
            </button>

            {/* 3. Properties */}
            <button
              type="button"
              onClick={() => setActiveSection('PROPERTIES')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'PROPERTIES'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4 h-4 shrink-0" />
                <span>Properties</span>
              </div>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  activeSection === 'PROPERTIES' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {properties.length}
              </span>
            </button>

            {/* 4. Visits */}
            <button
              type="button"
              onClick={() => setActiveSection('VISITS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'VISITS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <CalendarCheck className="w-4 h-4 shrink-0" />
                <span>Visits</span>
              </div>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  activeSection === 'VISITS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {visits.filter(v => v.status === 'SCHEDULED').length}
              </span>
            </button>

            {/* 5. Offers */}
            <button
              type="button"
              onClick={() => setActiveSection('OFFERS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'OFFERS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Tag className="w-4 h-4 shrink-0" />
                <span>Offers</span>
              </div>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  activeSection === 'OFFERS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {offers.filter(o => o.status === 'PENDING_REVIEW').length}
              </span>
            </button>

            {/* 6. Tasks and Follow-ups */}
            <button
              type="button"
              onClick={() => setActiveSection('TASKS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'TASKS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Tasks & Follow-ups</span>
              </div>
              {tasks.overdue.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                    activeSection === 'TASKS' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {tasks.overdue.length}
                </span>
              )}
            </button>

            {/* 7. Calendar */}
            <button
              type="button"
              onClick={() => setActiveSection('CALENDAR')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'CALENDAR'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Calendar className="w-4 h-4 shrink-0" />
                <span>Calendar</span>
              </div>
            </button>

            {/* 8. Team (Visible according to permissions) */}
            {canSeeTeam && (
              <button
                type="button"
                onClick={() => setActiveSection('TEAM')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'TEAM'
                    ? 'bg-[#244B8F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Team Directory</span>
                </div>
              </button>
            )}

            {/* 9. Reports */}
            <button
              type="button"
              onClick={() => setActiveSection('REPORTS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'REPORTS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Reports</span>
              </div>
            </button>

            {/* 10. Audit Logs (Visible according to permissions) */}
            {canSeeAudit && (
              <button
                type="button"
                onClick={() => setActiveSection('AUDIT')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeSection === 'AUDIT'
                    ? 'bg-[#244B8F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </div>
              </button>
            )}

            {/* 11. Settings */}
            <button
              type="button"
              onClick={() => setActiveSection('SETTINGS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeSection === 'SETTINGS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4 shrink-0" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: Current Operator Profile & Actions */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 space-y-2">
          {/* Quick Role Switcher for Dev / Operations Testing */}
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span className="font-bold uppercase tracking-wider">Role Preview</span>
              <span className="font-mono text-slate-400">Dev RBAC</span>
            </div>
            <select
              value={currentRole}
              onChange={(e) => {
                const newRole = e.target.value as StaffRole;
                setCurrentRole(newRole);
                showToast(`Role switched to ${newRole}`, 'info');
              }}
              className="w-full text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-hidden"
            >
              <option value="STAFF_SUPER_ADMIN">Compliance Super Admin</option>
              <option value="STAFF_DEAL_CLOSER">Senior Deal Closer</option>
              <option value="STAFF_VERIFICATION_AGENT">Title Verification Agent</option>
              <option value="STAFF_INTAKE_AGENT">Lead Intake Agent</option>
              <option value="STAFF_LISTING_MANAGER">Listing Manager</option>
            </select>
          </div>

          {/* User Profile Info */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#172033] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(staffUser?.displayName || 'Admin')[0]}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {staffUser?.displayName || 'Operations Staff'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {staffUser?.email || 'staff@sellmyghar.in'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Log out from CRM"
                  className="p-1.5 rounded-md hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN VIEWPORT (Compact header + Content body)                   */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-10">
          {/* Breadcrumb & Section Title */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">SellMyGhar</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold capitalize">
              {activeSection.toLowerCase().replace('_', ' ')}
            </span>
          </div>

          {/* Search, Refresh & Global Actions */}
          <div className="flex items-center space-x-3">
            {/* Global Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search leads, properties, clients..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#244B8F] focus:outline-hidden w-64 transition-all"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Refresh / Sync Button */}
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              title={`Last synced: ${lastSyncTime}`}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-[11px] text-slate-500 font-normal hidden sm:inline">{lastSyncTime}</span>
            </button>

            {/* Quick Action: Schedule Visit */}
            <button
              type="button"
              onClick={() => setIsScheduleVisitOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Schedule Visit</span>
            </button>

            {/* Quick Action: Record Offer */}
            <button
              type="button"
              onClick={() => setIsRecordOfferOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-slate-600" />
              <span>Record Offer</span>
            </button>

            {/* Primary Action: Add Property */}
            <button
              type="button"
              onClick={() => {
                setEditingProperty(null);
                setIsPropertyEditorOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Property</span>
            </button>

            {/* Exit to Public Site */}
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                title="View Public Marketplace"
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Content Body (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ============================================================== */}
          {/* VIEW 1: OVERVIEW DASHBOARD                                     */}
          {/* ============================================================== */}
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Page Title & KPI Bar */}
              <div>
                <h2 className="text-lg font-extrabold text-[#172033]">Overview</h2>
              </div>

              {/* 6 Clickable Real KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* 1. New Leads */}
                <div
                  onClick={() => {
                    setLeadStatusFilter('NEW');
                    setActiveSection('LEADS');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#244B8F] transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#244B8F]">
                    New Leads
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.newLeads ?? leads.filter(l => l.stage === 'NEW').length}
                  </div>
                  <span className="text-[11px] text-[#244B8F] font-semibold flex items-center mt-1">
                    View New <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 2. Follow-ups Required */}
                <div
                  onClick={() => {
                    setLeadStatusFilter('FOLLOW_UP');
                    setActiveSection('LEADS');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#244B8F] transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#244B8F]">
                    Follow-ups Due
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.followUpNeeded ?? leads.filter(l => l.stage === 'FOLLOW_UP').length}
                  </div>
                  <span className="text-[11px] text-[#244B8F] font-semibold flex items-center mt-1">
                    View Queue <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 3. Active Properties */}
                <div
                  onClick={() => {
                    setPropStatusFilter('PUBLISHED');
                    setActiveSection('PROPERTIES');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600">
                    Active Properties
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.activeProperties ?? properties.filter(p => p.status === 'PUBLISHED').length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center mt-1">
                    View Inventory <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 4. Visits Scheduled */}
                <div
                  onClick={() => {
                    setVisitStatusFilter('SCHEDULED');
                    setActiveSection('VISITS');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600">
                    Visits Scheduled
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.visitsScheduled ?? visits.filter(v => v.status === 'SCHEDULED').length}
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center mt-1">
                    View Schedule <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 5. Offers Awaiting Action */}
                <div
                  onClick={() => {
                    setOfferStatusFilter('PENDING_REVIEW');
                    setActiveSection('OFFERS');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-500 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600">
                    Pending Offers
                  </span>
                  <div className="text-2xl font-black text-purple-900 mt-1">
                    {overviewMetrics?.metrics?.offersAwaitingAction ?? offers.filter(o => o.status === 'PENDING_REVIEW').length}
                  </div>
                  <span className="text-[11px] text-purple-600 font-semibold flex items-center mt-1">
                    Review Offers <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 6. Converted Leads */}
                <div
                  onClick={() => {
                    setLeadStatusFilter('CONVERTED');
                    setActiveSection('LEADS');
                  }}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-600 transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600">
                    Converted Deals
                  </span>
                  <div className="text-2xl font-black text-emerald-800 mt-1">
                    {overviewMetrics?.metrics?.convertedLeads ?? leads.filter(l => l.stage === 'CONVERTED').length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center mt-1">
                    Closed Deals <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>

              {/* Lead Pipeline Section (renamed from Operational Pipelines Distribution) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Lead Pipeline</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Authoritative lifecycle progression across verified seller leads and buyer enquiries.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('LEADS')}
                    className="text-xs font-bold text-[#244B8F] hover:underline flex items-center cursor-pointer"
                  >
                    View All Leads ({leads.length}) <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>

                {/* Pipeline Stage Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {PIPELINE_STAGES.map((stage) => {
                    const count = overviewMetrics?.pipeline?.[stage.key] ?? leads.filter(l => l.stage === stage.key).length;
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => {
                          setLeadStatusFilter(stage.key);
                          setActiveSection('LEADS');
                        }}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer hover:shadow-xs ${
                          stage.key === 'CONVERTED'
                            ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400'
                            : stage.key === 'LOST'
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-500'
                            : 'bg-white border-slate-200 hover:border-[#244B8F]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          <span>{stage.label}</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">{count}</div>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{stage.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Today's Work Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Today's Scheduled Visits & Overdue Follow-ups */}
                <div className="space-y-4">
                  {/* Scheduled Visits */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <CalendarCheck className="w-4 h-4 text-[#244B8F]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Scheduled Visits
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('VISITS')}
                        className="text-[11px] font-bold text-[#244B8F] hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {visits.filter(v => v.status === 'SCHEDULED').length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                          No visits scheduled currently.
                        </div>
                      ) : (
                        visits.filter(v => v.status === 'SCHEDULED').slice(0, 3).map((visit) => (
                          <div
                            key={visit.id}
                            className="p-3 bg-slate-50/60 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-900 truncate">{visit.client_name}</p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {visit.property_title || 'Unit viewing'} • {visit.visit_date} at {visit.visit_time}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Staff: {visit.assigned_staff_name || 'Unassigned'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReminder(visit.id)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[#244B8F] font-bold text-[10px] rounded-md shrink-0 cursor-pointer"
                            >
                              WhatsApp
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Overdue Follow-ups */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-rose-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Overdue Follow-ups
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('TASKS')}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Action Tasks
                      </button>
                    </div>

                    <div className="space-y-2">
                      {tasks.overdue.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                          All follow-ups are up to date.
                        </div>
                      ) : (
                        tasks.overdue.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedLeadId(task.id)}
                            className="p-3 bg-rose-50/40 rounded-lg border border-rose-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-50/70 transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-rose-950 truncate">{task.name}</p>
                              <p className="text-[11px] text-slate-600 truncate">{task.society || task.locality}</p>
                              <p className="text-[10px] text-rose-700 font-medium">
                                Instruction: {task.follow_up_notes || 'Overdue client call'}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 shrink-0">
                              OVERDUE
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Offers Awaiting Action & Recently Updated Assigned Leads */}
                <div className="space-y-4">
                  {/* Offers Awaiting Action */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-purple-700" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Offers Awaiting Action
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('OFFERS')}
                        className="text-[11px] font-bold text-purple-700 hover:underline"
                      >
                        View Offers
                      </button>
                    </div>

                    <div className="space-y-2">
                      {offers.filter(o => o.status === 'PENDING_REVIEW').length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                          No pending offers requiring review.
                        </div>
                      ) : (
                        offers.filter(o => o.status === 'PENDING_REVIEW').slice(0, 3).map((offer) => (
                          <div
                            key={offer.id}
                            className="p-3 bg-purple-50/40 rounded-lg border border-purple-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-purple-950 truncate">{offer.buyer_name}</p>
                              <p className="text-[11px] text-slate-600 truncate">
                                {offer.property_title || 'Property'} • Offer: ₹{(offer.offer_amount_inr / 10000000).toFixed(2)} Cr
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Contact: {offer.buyer_phone}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveSection('OFFERS')}
                              className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold text-[10px] rounded-md shrink-0 cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recently Updated Leads */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-700" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Recently Updated Leads
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('LEADS')}
                        className="text-[11px] font-bold text-[#244B8F] hover:underline"
                      >
                        All Leads
                      </button>
                    </div>

                    <div className="space-y-2">
                      {leads.slice(0, 3).map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="p-3 bg-slate-50/60 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 truncate">{lead.ownerName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{lead.society || lead.locality}</p>
                            <p className="text-[10px] text-slate-400">
                              Assigned: {lead.assignedStaffName || 'Unassigned'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#244B8F] shrink-0">
                            {lead.stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: LEADS LIST & MANAGEMENT                                */}
          {/* ============================================================== */}
          {activeSection === 'LEADS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Leads</h2>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-semibold">
                    Showing {filteredLeads.length} of {leads.length} leads
                  </span>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('leads')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
                {/* Stage Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Stage:</span>
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL">All Stages</option>
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                {/* Assignment Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Assignment:</span>
                  <select
                    value={leadAssignFilter}
                    onChange={(e) => setLeadAssignFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL">All Staff</option>
                    <option value="ME">Assigned to Me</option>
                    <option value="UNASSIGNED">Unassigned Only</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>{s.displayName}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Type:</span>
                  <select
                    value={leadTypeFilter}
                    onChange={(e) => setLeadTypeFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL">All Inquiries</option>
                    <option value="SELLER">Seller Leads</option>
                    <option value="BUYER">Buyer Enquiries</option>
                  </select>
                </div>

                {/* Follow-up Filter */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Follow-up:</span>
                  <select
                    value={leadFollowUpFilter}
                    onChange={(e) => setLeadFollowUpFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL">All Tasks</option>
                    <option value="OVERDUE">Overdue Only</option>
                    <option value="TODAY">Due Today</option>
                  </select>
                </div>

                {(leadStatusFilter !== 'ALL' || leadAssignFilter !== 'ALL' || leadTypeFilter !== 'ALL' || leadFollowUpFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setLeadStatusFilter('ALL');
                      setLeadAssignFilter('ALL');
                      setLeadTypeFilter('ALL');
                      setLeadFollowUpFilter('ALL');
                    }}
                    className="text-slate-500 hover:text-slate-800 text-xs font-semibold ml-auto underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Leads Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Client / Inquiry</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Property / Locality</th>
                      <th className="py-3 px-4">BHK & Budget</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4">Assigned Staff</th>
                      <th className="py-3 px-4">Follow-up</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No leads match the specified filters.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{lead.ownerName}</div>
                            <div className="text-[10px] text-slate-400 font-mono font-normal">{lead.phone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                lead.type === 'SELLER'
                                  ? 'bg-blue-100 text-[#244B8F]'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {lead.type || 'SELLER'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <div className="font-semibold text-slate-800 truncate max-w-[160px]">
                              {lead.society || 'Residential'}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[160px]">
                              {lead.locality}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <div className="font-bold">{lead.bhk}</div>
                            <div className="text-[11px] text-slate-500">{lead.expectedPrice}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                lead.stage === 'NEW'
                                  ? 'bg-blue-100 text-[#244B8F]'
                                  : lead.stage === 'CONTACTED'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : lead.stage === 'FOLLOW_UP'
                                  ? 'bg-amber-100 text-amber-800'
                                  : lead.stage === 'SITE_VISIT'
                                  ? 'bg-purple-100 text-purple-800'
                                  : lead.stage === 'NEGOTIATION'
                                  ? 'bg-pink-100 text-pink-800'
                                  : lead.stage === 'CONVERTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {lead.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {lead.assignedStaffName || (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {lead.nextFollowUpAt ? (
                              <span
                                className={`text-[11px] font-medium ${
                                  lead.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                                }`}
                              >
                                {new Date(lead.nextFollowUpAt).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeadId(lead.id);
                              }}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-[#244B8F] hover:text-white text-slate-700 font-bold text-[10px] transition-colors"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: PROPERTIES INVENTORY                                   */}
          {/* ============================================================== */}
          {activeSection === 'PROPERTIES' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Properties</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProperty(null);
                      setIsPropertyEditorOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] text-white text-xs font-bold shadow-xs hover:bg-[#1B396E] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Property Listing</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">Listing Status:</span>
                  <select
                    value={propStatusFilter}
                    onChange={(e) => setPropStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PAUSED">Paused</option>
                    <option value="SOLD">Sold</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-400 text-[11px] font-semibold">BHK:</span>
                  <select
                    value={propBhkFilter}
                    onChange={(e) => setPropBhkFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="ALL">All BHK</option>
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK">4 BHK+</option>
                  </select>
                </div>
              </div>

              {/* Properties Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Property / Project</th>
                      <th className="py-3 px-4">Locality</th>
                      <th className="py-3 px-4">BHK & Area</th>
                      <th className="py-3 px-4">Asking Price</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Assigned RM</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                          No properties found in inventory.
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map((prop) => (
                        <tr
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={prop.image}
                                alt={prop.projectName}
                                className="w-10 h-10 rounded-md object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{prop.projectName}</p>
                                <p className="text-[10px] text-slate-400 truncate">{prop.title || prop.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                            {prop.localityName}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <div className="font-bold">{prop.bhkType}</div>
                            <div className="text-[10px] text-slate-400">{prop.superBuiltUpSqft} sq.ft</div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            ₹{(prop.askingPriceInr / 10000000).toFixed(2)} Cr
                            <div className="text-[10px] text-slate-400 font-normal">
                              ₹{prop.pricePerSqft}/sqft
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#244B8F]">
                              {prop.verificationBadge}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                prop.status === 'PUBLISHED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : prop.status === 'PAUSED'
                                  ? 'bg-amber-100 text-amber-800'
                                  : prop.status === 'SOLD'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {prop.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {prop.assignedRm || 'Unassigned'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProperty(prop);
                                setIsPropertyEditorOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold rounded-md transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPropertyId(prop.id);
                              }}
                              className="px-2.5 py-1 bg-[#244B8F] text-white text-[10px] font-bold rounded-md hover:bg-[#1B396E] transition-colors"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: VISITS & WHATSAPP REMINDERS                            */}
          {/* ============================================================== */}
          {activeSection === 'VISITS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Visits</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('visits')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduleVisitOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] text-white text-xs font-bold shadow-xs hover:bg-[#1B396E] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Visit</span>
                  </button>
                </div>
              </div>

              {/* Status Filters */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Status:</span>
                <select
                  value={visitStatusFilter}
                  onChange={(e) => setVisitStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">All Visits</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>

              {/* Visits List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVisits.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No site visits match the filter criteria.
                  </div>
                ) : (
                  filteredVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              visit.status === 'SCHEDULED'
                                ? 'bg-blue-100 text-[#244B8F]'
                                : visit.status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {visit.status}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {visit.visit_date} • {visit.visit_time}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-slate-900">
                          {visit.client_name}
                        </h4>
                        <p className="text-xs text-slate-600 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{visit.client_phone}</span>
                        </p>
                        <p className="text-xs text-slate-500 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{visit.property_title || visit.property_locality || 'Property Inspection'}</span>
                        </p>
                        {visit.notes && (
                          <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-600 border border-slate-200/80">
                            {visit.notes}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Assigned Staff: <strong>{visit.assigned_staff_name || 'Unassigned'}</strong>
                        </p>
                      </div>

                      {/* Visit Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {visit.status === 'SCHEDULED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReminder(visit.id)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Send WhatsApp reminder via backend (validates stored phone and DPDP consent)"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-700" />
                              <span>WhatsApp Reminder</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateVisitStatus(visit.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Mark Done
                            </button>
                          </>
                        )}
                        {visit.status === 'COMPLETED' && (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Tour Completed
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: FORMAL OFFERS & NEGOTIATIONS                           */}
          {/* ============================================================== */}
          {activeSection === 'OFFERS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Offers</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('offers')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecordOfferOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] text-white text-xs font-bold shadow-xs hover:bg-[#1B396E] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Offer</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Offer Status:</span>
                <select
                  value={offerStatusFilter}
                  onChange={(e) => setOfferStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">All Offers</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="COUNTER_OFFERED">Counter-Offered</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Offers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOffers.length === 0 ? (
                  <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No offers recorded under this filter.
                  </div>
                ) : (
                  filteredOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              offer.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : offer.status === 'COUNTER_OFFERED'
                                ? 'bg-purple-100 text-purple-800'
                                : offer.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {offer.status}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{offer.id}</span>
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{offer.property_title || 'Apartment Unit'}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Buyer: <strong>{offer.buyer_name}</strong> ({offer.buyer_phone})
                          </p>
                        </div>

                        {/* Financial Comparison Grid */}
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Asking</span>
                            <strong className="text-slate-900">
                              {offer.asking_price_inr ? `₹${(offer.asking_price_inr / 10000000).toFixed(2)} Cr` : '—'}
                            </strong>
                          </div>

                          <div className="p-2 bg-purple-50 rounded border border-purple-200 text-purple-900">
                            <span className="text-[10px] text-purple-600 block">Offer</span>
                            <strong className="text-purple-950 font-black">
                              ₹{(offer.offer_amount_inr / 10000000).toFixed(2)} Cr
                            </strong>
                          </div>

                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Reserve Floor</span>
                            <strong className="text-emerald-700">
                              {canSeeReservePrice
                                ? offer.reserve_minimum_price_inr
                                  ? `₹${(offer.reserve_minimum_price_inr / 10000000).toFixed(2)} Cr`
                                  : 'Protected'
                                : '[RESTRICTED]'}
                            </strong>
                          </div>
                        </div>

                        {offer.notes && (
                          <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-600 border border-slate-200/80">
                            {offer.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {offer.status === 'PENDING_REVIEW' && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCounterOfferTarget(offer);
                              setCounterOfferAmount('');
                              setCounterOfferNote('');
                            }}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Counter-Offer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            Accept Offer
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: TASKS & FOLLOW-UPS                                     */}
          {/* ============================================================== */}
          {activeSection === 'TASKS' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[#172033]">Tasks</h2>
              </div>

              {/* Three Categorized Follow-up Queues */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Overdue Follow-ups */}
                <div className="bg-white rounded-xl border border-rose-200 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" /> Overdue Queue
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                      {tasks.overdue.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {tasks.overdue.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">Zero overdue tasks.</p>
                    ) : (
                      tasks.overdue.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedLeadId(task.id)}
                          className="p-3 rounded-lg border border-rose-200 bg-rose-50/30 text-xs space-y-1.5 cursor-pointer hover:bg-rose-50/60 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900">{task.name}</strong>
                            <span className="text-[10px] text-rose-700 font-bold">OVERDUE</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{task.phone} • {task.society}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {task.follow_up_notes || 'Call scheduled'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Due Today */}
                <div className="bg-white rounded-xl border border-amber-200 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" /> Due Today
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {tasks.dueToday.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {tasks.dueToday.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No follow-ups due today.</p>
                    ) : (
                      tasks.dueToday.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedLeadId(task.id)}
                          className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 text-xs space-y-1.5 cursor-pointer hover:bg-amber-50/60 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900">{task.name}</strong>
                            <span className="text-[10px] text-amber-700 font-bold">TODAY</span>
                          </div>
                          <p className="text-[11px] text-slate-600">{task.phone} • {task.society}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {task.follow_up_notes || 'Scheduled diligence check'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Upcoming */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-600" /> Upcoming Queue
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {tasks.upcoming.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {tasks.upcoming.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-4">No upcoming scheduled tasks.</p>
                    ) : (
                      tasks.upcoming.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedLeadId(task.id)}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 text-xs space-y-1.5 cursor-pointer hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900">{task.name}</strong>
                            <span className="text-[10px] text-slate-500">
                              {new Date(task.next_follow_up_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{task.phone} • {task.society}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">
                            {task.follow_up_notes || 'Follow-up call'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 7: CALENDAR AGENDA                                        */}
          {/* ============================================================== */}
          {activeSection === 'CALENDAR' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[#172033]">Calendar</h2>
              </div>

              {/* Combined Agenda Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Scheduled Agenda</h3>
                <div className="space-y-3">
                  {visits.length === 0 && tasks.dueToday.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">No scheduled events on the operational calendar.</p>
                  ) : (
                    <>
                      {visits.map((v) => (
                        <div
                          key={v.id}
                          className="p-4 rounded-lg border border-blue-200 bg-blue-50/30 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-[#244B8F] text-white flex flex-col items-center justify-center font-bold text-[10px]">
                              <span>VISIT</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{v.client_name} • Physical Site Tour</h4>
                              <p className="text-slate-500">{v.property_title || 'Unit Tour'} ({v.property_locality})</p>
                              <p className="text-[10px] text-slate-400">Time: {v.visit_date} at {v.visit_time}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppReminder(v.id)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-[#244B8F] font-bold text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                          >
                            Send WhatsApp
                          </button>
                        </div>
                      ))}

                      {tasks.dueToday.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedLeadId(t.id)}
                          className="p-4 rounded-lg border border-amber-200 bg-amber-50/30 flex items-center justify-between text-xs cursor-pointer hover:bg-amber-50/60"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex flex-col items-center justify-center font-bold text-[10px]">
                              <span>CALL</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{t.name} • Diligence Follow-up Call</h4>
                              <p className="text-slate-500">{t.society} ({t.locality})</p>
                              <p className="text-[10px] text-amber-700 font-semibold">{t.follow_up_notes || 'Scheduled today'}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-white border border-amber-300 text-amber-800 font-bold rounded text-[11px]">
                            Open Lead
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 8: TEAM DIRECTORY                                         */}
          {/* ============================================================== */}
          {activeSection === 'TEAM' && canSeeTeam && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Team</h2>
                </div>
                {currentRole === 'STAFF_SUPER_ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] text-white text-xs font-bold shadow-xs hover:bg-[#1B396E] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Staff Member</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList.map((staff) => (
                  <div
                    key={staff.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#172033] text-white flex items-center justify-center font-bold text-sm">
                        {staff.displayName[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{staff.displayName}</h4>
                        <p className="text-xs text-slate-400 truncate">{staff.email}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {staff.roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {role.replace('STAFF_', '')}
                          </span>
                        ))}
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between">
                        <span>Assigned Leads:</span>
                        <strong className="text-slate-900">
                          {leads.filter(l => l.assignedStaffId === staff.id).length}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 9: REPORTS & OPERATIONAL ANALYTICS                        */}
          {/* ============================================================== */}
          {activeSection === 'REPORTS' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Reports</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('leads')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Export Leads CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('visits')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Export Visits CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('offers')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Export Offers CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
                  <div className="text-3xl font-black text-slate-900 mt-1">
                    {reportsData?.totalLeads ?? leads.length}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Verified seller & buyer inquiries</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversion Rate</span>
                  <div className="text-3xl font-black text-emerald-800 mt-1">
                    {reportsData?.overallConversionRate ?? '0.0'}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Converted leads / Total leads</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Site Visits</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">
                    {reportsData?.totalVisits ?? visits.length}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Completed & scheduled viewings</p>
                </div>
              </div>

              {/* Pipeline Stage Distribution Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Lead Stage Breakdown</h3>
                <div className="space-y-3">
                  {PIPELINE_STAGES.map(stage => {
                    const count = reportsData?.stageCounts?.[stage.key] ?? leads.filter(l => l.stage === stage.key).length;
                    const pct = leads.length > 0 ? ((count / leads.length) * 100).toFixed(1) : '0';
                    return (
                      <div key={stage.key} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>{stage.label}</span>
                          <span className="text-slate-500">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#244B8F] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 10: AUDIT LOGS (Super Admin Compliance)                   */}
          {/* ============================================================== */}
          {activeSection === 'AUDIT' && canSeeAudit && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-[#172033]">Audit Logs</h2>
              </div>

              {/* Audit Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs divide-y divide-slate-200">
                  <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor Role</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">IP Address</th>
                      <th className="py-3 px-4">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 font-mono text-[11px]">
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-800">
                            {log.actor_role}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {log.target_entity}:{log.target_entity_id?.slice(0, 10)}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{log.client_ip}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {typeof log.diff_summary === 'object'
                              ? JSON.stringify(log.diff_summary)
                              : String(log.diff_summary || '—')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* DPDP Section 12 Erasure Queue */}
              <div className="pt-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">DPDP Section 12 Erasure Queue</h3>
                <AdminErasureQueue />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 11: SETTINGS                                              */}
          {/* ============================================================== */}
          {activeSection === 'SETTINGS' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#172033]">Settings</h2>
                </div>
                {currentRole === 'STAFF_SUPER_ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] text-white text-xs font-bold shadow-xs hover:bg-[#1B396E] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Provision Staff User</span>
                  </button>
                )}
              </div>

              {/* Operator Profile */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Operator</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Name</span>
                    <strong className="text-slate-900">{staffUser?.displayName || 'Operations Staff'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Email</span>
                    <strong className="text-slate-900">{staffUser?.email || 'staff@sellmyghar.in'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Active Role</span>
                    <strong className="text-slate-900">{currentRole}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Session Status</span>
                    <strong className="text-emerald-700">Authenticated (HTTP-Only Cookie)</strong>
                  </div>
                </div>
              </div>

              {/* WhatsApp Gateway Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      WhatsApp Business API Integration
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    UNCONFIGURED
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Automated site visit reminders require valid <code>WHATSAPP_API_TOKEN</code> and <code>WHATSAPP_PHONE_NUMBER_ID</code> environment credentials.
                </p>
                <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200 font-mono">
                  WHATSAPP_API_TOKEN: [MISSING IN ENVIRONMENT]<br />
                  WHATSAPP_PHONE_NUMBER_ID: [MISSING IN ENVIRONMENT]
                </div>
                <p className="text-[11px] text-slate-400">
                  When unconfigured, reminder actions gracefully report status and log administrative audit events without simulating message delivery.
                </p>
              </div>

              {/* Database & Security Posture */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Architecture</h3>
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Fail-Closed Credential Enforcement</span>
                    <strong className="text-emerald-700">ACTIVE</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>DPDP Act Section 12 Compliance Gating</span>
                    <strong className="text-emerald-700">ACTIVE</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>PostgreSQL Row-Level Security</span>
                    <strong className="text-emerald-700">ENABLED</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Reserve Floor Confidentiality Protection</span>
                    <strong className="text-emerald-700">ENFORCED</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER: DEDICATED INDIVIDUAL LEAD DETAILS            */}
      {/* ============================================================== */}
      {selectedLeadId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/30 backdrop-blur-2xs transition-opacity">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{selectedLeadId}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#244B8F]">
                    {leadDetailData?.lead?.type || 'SELLER'}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {leadDetailData?.lead?.owner_name || leadDetailData?.lead?.ownerName || 'Lead Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {leadDetailLoading ? (
                <div className="py-12 text-center text-slate-400">Loading lead details from PostgreSQL...</div>
              ) : leadDetailError ? (
                <div className="py-12 text-center space-y-3">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 max-w-sm mx-auto">
                    <p className="font-bold text-xs">Unable to load lead details</p>
                    <p className="text-[11px] mt-1">{leadDetailError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedLeadId) {
                        const lid = selectedLeadId;
                        setSelectedLeadId(null);
                        setTimeout(() => setSelectedLeadId(lid), 50);
                      }
                    }}
                    className="px-3 py-1.5 bg-[#244B8F] text-white rounded-md font-bold text-xs"
                  >
                    Retry
                  </button>
                </div>
              ) : !leadDetailData ? (
                <div className="py-12 text-center text-slate-400">Lead record not found.</div>
              ) : (
                <>
                  {/* Client Contact & Requirement */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Client Information</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Phone</span>
                        <strong className="text-slate-900 font-mono">{leadDetailData.lead.phone}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Expected Budget</span>
                        <strong className="text-slate-900">
                          {leadDetailData.lead.expected_price_inr
                            ? `₹${(Number(leadDetailData.lead.expected_price_inr) / 10000000).toFixed(2)} Cr`
                            : 'Market'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Society / Project</span>
                        <strong className="text-slate-900">{leadDetailData.lead.apartment_society_name || 'Sobha'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">BHK Configuration</span>
                        <strong className="text-slate-900">{leadDetailData.lead.bhk_type}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Stage Transition Control */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Lead Lifecycle Stage
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={leadDetailData.lead.lead_status}
                        onChange={(e) => handleUpdateLeadStatus(selectedLeadId, e.target.value as LeadStatus)}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-bold text-xs text-slate-800"
                      >
                        {PIPELINE_STAGES.map(s => (
                          <option key={s.key} value={s.key}>{s.label} ({s.desc})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Assign Staff Member */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                      Assigned Relationship Manager
                    </label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={assigneeSelect}
                        onChange={(e) => {
                          setAssigneeSelect(e.target.value);
                          handleAssignLead(selectedLeadId, e.target.value);
                        }}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium text-xs text-slate-800"
                      >
                        <option value="">Unassigned</option>
                        {staffList.map(s => (
                          <option key={s.id} value={s.id}>{s.displayName} ({s.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Schedule Follow Up */}
                  <div className="space-y-2 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Schedule Next Follow-up
                    </h4>
                    <div className="space-y-2">
                      <input
                        type="datetime-local"
                        value={newFollowUpDate}
                        onChange={(e) => setNewFollowUpDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                      />
                      <input
                        type="text"
                        placeholder="Follow-up instructions or call objectives..."
                        value={newFollowUpNote}
                        onChange={(e) => setNewFollowUpNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleScheduleFollowUp(selectedLeadId)}
                        className="w-full py-2 bg-[#244B8F] text-white font-bold rounded-lg hover:bg-[#1B396E] transition-colors cursor-pointer"
                      >
                        Set Follow-up Due Date
                      </button>
                    </div>
                  </div>

                  {/* Call Notes & Interaction Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Call Notes & Interactions
                    </h4>
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Log notes from client call..."
                        value={newCallNote}
                        onChange={(e) => setNewCallNote(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCallNote(selectedLeadId)}
                        className="px-3 py-1.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 cursor-pointer text-xs"
                      >
                        Record Call Note
                      </button>
                    </div>

                    {leadDetailData.lead.notes && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-sans">
                        {leadDetailData.lead.notes}
                      </div>
                    )}
                  </div>

                  {/* Connected Property Documents (if property attached) */}
                  {leadDetailData.property && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                          Property Documents ({leadDetailData.documents.length})
                        </h4>
                        <span className="text-[10px] text-[#244B8F] font-bold">
                          Tier: {leadDetailData.property.verification_tier || 'LEVEL_1'}
                        </span>
                      </div>

                      {leadDetailData.documents.length === 0 ? (
                        <p className="text-slate-400 italic text-[11px]">No documents uploaded for this property yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {leadDetailData.documents.map((doc: any) => (
                            <div
                              key={doc.id}
                              className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between"
                            >
                              <div>
                                <strong className="text-slate-900 block truncate max-w-[200px]">{doc.file_name}</strong>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    doc.verification_status === 'VERIFIED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : doc.verification_status === 'REJECTED'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {doc.verification_status}
                                </span>
                              </div>

                              {doc.verification_status !== 'VERIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyDocument(doc.id, 'VERIFIED')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer"
                                >
                                  Verify Document
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Visits for this Lead */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                        Related Site Visits ({leadDetailData.visits.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleVisitForm(prev => ({
                            ...prev,
                            leadId: selectedLeadId,
                            clientName: leadDetailData.lead.owner_name || '',
                            clientPhone: leadDetailData.lead.phone || '',
                            propertyId: leadDetailData.lead.property_id || properties[0]?.id || ''
                          }));
                          setIsScheduleVisitOpen(true);
                        }}
                        className="text-[10px] font-bold text-[#244B8F] hover:underline cursor-pointer"
                      >
                        + Schedule Visit
                      </button>
                    </div>

                    {leadDetailData.visits.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No visits recorded for this lead.</p>
                    ) : (
                      <div className="space-y-2">
                        {leadDetailData.visits.map((v: any) => (
                          <div key={v.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900 block">{v.visit_date} at {v.visit_time}</strong>
                              <span className="text-[10px] text-slate-500">{v.status}</span>
                            </div>
                            {v.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppReminder(v.id)}
                                className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded"
                              >
                                WhatsApp
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLeadId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER: DEDICATED PROPERTY DETAILS                   */}
      {/* ============================================================== */}
      {selectedPropertyId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/30 backdrop-blur-2xs transition-opacity">
          <div className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">{selectedPropertyId}</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {propertyDetailData?.property?.title || propertyDetailData?.property?.projectName || 'Property Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPropertyId(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {propertyDetailLoading || !propertyDetailData ? (
                <div className="py-12 text-center text-slate-400">Loading property specifications...</div>
              ) : (
                <>
                  {/* Property Specs */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Specifications</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Asking Price</span>
                        <strong className="text-slate-900 font-bold">
                          ₹{(Number(propertyDetailData.property.asking_price_inr || propertyDetailData.property.askingPriceInr) / 10000000).toFixed(2)} Cr
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Reserve Minimum Floor</span>
                        <strong className="text-emerald-700">
                          {canSeeReservePrice
                            ? propertyDetailData.property.reserve_minimum_price_inr
                              ? `₹${(Number(propertyDetailData.property.reserve_minimum_price_inr) / 10000000).toFixed(2)} Cr`
                              : 'Owner Bottom Line'
                            : '[RESTRICTED]'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">BHK & Super Built-up</span>
                        <strong className="text-slate-900">
                          {propertyDetailData.property.bhk_type} • {propertyDetailData.property.super_built_up_sqft} sq.ft
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Facing & Floor</span>
                        <strong className="text-slate-900">
                          {propertyDetailData.property.facing} • {propertyDetailData.property.floor_band || 'Mid Floor'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Verification Status & Document Review */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                        Title Verification Documents ({propertyDetailData.documents.length})
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#244B8F]">
                        {propertyDetailData.property.verification_tier || 'LEVEL_1_DECLARED'}
                      </span>
                    </div>

                    {propertyDetailData.documents.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No documents uploaded for review.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {propertyDetailData.documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-slate-900 block truncate max-w-[220px]">{doc.file_name}</strong>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  doc.verification_status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : doc.verification_status === 'REJECTED'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
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
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded cursor-pointer"
                                >
                                  Verify
                                </button>
                              )}
                              {doc.verification_status !== 'REJECTED' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyDocument(doc.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded cursor-pointer"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected Visits */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Scheduled Visits ({propertyDetailData.visits.length})
                    </h4>
                    {propertyDetailData.visits.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No visits scheduled for this property.</p>
                    ) : (
                      <div className="space-y-2">
                        {propertyDetailData.visits.map((v: any) => (
                          <div key={v.id} className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{v.client_name}</strong>
                              <p className="text-[10px] text-slate-500">{v.visit_date} at {v.visit_time}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-[#244B8F]">
                              {v.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connected Offers */}
                  <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Recorded Buyer Offers ({propertyDetailData.offers.length})
                    </h4>
                    {propertyDetailData.offers.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No offers submitted for this property.</p>
                    ) : (
                      <div className="space-y-2">
                        {propertyDetailData.offers.map((o: any) => (
                          <div key={o.id} className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-200 flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{o.buyer_name}</strong>
                              <p className="text-[10px] text-purple-900 font-bold">
                                ₹{(Number(o.offer_amount_inr) / 10000000).toFixed(2)} Cr
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                              {o.status}
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
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  const p = properties.find(x => x.id === selectedPropertyId);
                  if (p) {
                    setEditingProperty(p);
                    setIsPropertyEditorOpen(true);
                  }
                }}
                className="px-3 py-1.5 bg-[#244B8F] text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Edit in PropertyEditor
              </button>
              <button
                type="button"
                onClick={() => setSelectedPropertyId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SCHEDULE VISIT                                          */}
      {/* ============================================================== */}
      {isScheduleVisitOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-[#244B8F]" />
                <span>Schedule Buyer Site Visit</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleVisitOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Property *
                </label>
                <select
                  required
                  value={scheduleVisitForm.propertyId}
                  onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, propertyId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 text-xs"
                >
                  <option value="">Select a property from inventory</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.projectName} ({p.localityName})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Hegde"
                    value={scheduleVisitForm.clientName}
                    onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, clientName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Client Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={scheduleVisitForm.clientPhone}
                    onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, clientPhone: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Visit Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow / 12 Oct"
                    value={scheduleVisitForm.visitDate}
                    onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, visitDate: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Visit Slot
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 11:30 AM"
                    value={scheduleVisitForm.visitTime}
                    onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, visitTime: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Staff Escort
                </label>
                <select
                  value={scheduleVisitForm.assignedStaffId}
                  onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, assignedStaffId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 text-xs"
                >
                  <option value="">Current Staff Member</option>
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Inspection Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific buyer focus, key handover instructions..."
                  value={scheduleVisitForm.notes}
                  onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, notes: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleVisitOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#244B8F] text-white font-bold hover:bg-[#1B396E] cursor-pointer"
                >
                  Confirm Site Visit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RECORD FORMAL OFFER                                     */}
      {/* ============================================================== */}
      {isRecordOfferOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-purple-700" />
                <span>Record Formal Buyer Offer</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordOfferOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Property *
                </label>
                <select
                  required
                  value={recordOfferForm.propertyId}
                  onChange={(e) => setRecordOfferForm({ ...recordOfferForm, propertyId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-900 text-xs"
                >
                  <option value="">Select target property</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.projectName} (Asking: ₹{(p.askingPriceInr / 10000000).toFixed(2)} Cr)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Buyer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Mehra"
                    value={recordOfferForm.buyerName}
                    onChange={(e) => setRecordOfferForm({ ...recordOfferForm, buyerName: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Buyer Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 00111"
                    value={recordOfferForm.buyerPhone}
                    onChange={(e) => setRecordOfferForm({ ...recordOfferForm, buyerPhone: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Offer Amount (INR) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 14000000 for 1.40 Cr"
                  value={recordOfferForm.offerAmountInr}
                  onChange={(e) => setRecordOfferForm({ ...recordOfferForm, offerAmountInr: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
                />
                {recordOfferForm.offerAmountInr && (
                  <span className="text-[11px] text-purple-700 font-bold mt-1 block">
                    = ₹{(Number(recordOfferForm.offerAmountInr) / 10000000).toFixed(2)} Cr
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Terms & Commercial Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Token advance offered, loan sanction bank..."
                  value={recordOfferForm.notes}
                  onChange={(e) => setRecordOfferForm({ ...recordOfferForm, notes: e.target.value })}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordOfferOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-700 text-white font-bold hover:bg-purple-800 cursor-pointer"
                >
                  Record Offer in Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRESENT COUNTER-OFFER                                   */}
      {/* ============================================================== */}
      {counterOfferTarget && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">
              Present Counter-Offer to Buyer
            </h3>
            <p className="text-slate-500 text-[11px]">
              Buyer Offer: ₹{(counterOfferTarget.offer_amount_inr / 10000000).toFixed(2)} Cr
            </p>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Counter Amount (INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 14200000 for 1.42 Cr"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Counter Rationale / Terms
              </label>
              <textarea
                rows={2}
                placeholder="Seller approved concession limit..."
                value={counterOfferNote}
                onChange={(e) => setCounterOfferNote(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCounterOfferTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOfferStatus(counterOfferTarget.id, 'COUNTER_OFFERED', Number(counterOfferAmount) || undefined)}
                className="px-4 py-1.5 rounded-lg bg-purple-700 text-white font-bold hover:bg-purple-800 cursor-pointer"
              >
                Submit Counter-Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PROPERTY EDITOR MODAL                                          */}
      {/* ============================================================== */}
      {isPropertyEditorOpen && (
        <PropertyEditor
          property={editingProperty}
          isOpen={isPropertyEditorOpen}
          onClose={() => {
            setIsPropertyEditorOpen(false);
            setEditingProperty(null);
          }}
          onSaved={() => {
            setIsPropertyEditorOpen(false);
            setEditingProperty(null);
            refreshAll();
          }}
          staffRole={currentRole}
        />
      )}
    </div>
  );
}
