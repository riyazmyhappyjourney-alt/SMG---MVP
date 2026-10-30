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
  UserPlus,
  Trash2,
  UserX,
  FileText,
  Printer,
  Bell,
  Menu
} from 'lucide-react';
import { StaffRole, CrmModule, ALL_CRM_MODULES, resolveLegacyModulePermissions } from '../../core/types/auth';
import { LeadStatus } from '../../core/types/entities';
import { AdminErasureQueue } from './AdminErasureQueue';
import { PropertyEditor } from './PropertyEditor';
import { PropertyBrochureModal } from './PropertyBrochureModal';
import { CalendarModule } from './CalendarModule';
import { TasksKanbanModule } from './TasksKanbanModule';
import { HeroCmsManager } from './HeroCmsManager';
import { PartnerLogosManager } from './PartnerLogosManager';
import { PublicationEmailManager } from './PublicationEmailManager';
import { PropertySuggestionsManager } from './PropertySuggestionsManager';
import { CareerCmsManager } from './CareerCmsManager';
import { ManualLeadModal } from './ManualLeadModal';
import { DateTimePicker } from '../common/DateTimePicker';
import { getCsrfTokenFromCookie } from '../../utils/safeApi';
import {
  formatIndianCurrency,
  formatIndianNumberFull,
  formatPhoneNumber,
  formatReadableDate,
  formatReadableTime
} from '../../utils/formatters';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

export type PropertyListingStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'SOLD' | 'ARCHIVED';

export interface CrmLead {
  id: string;
  type?: 'SELLER' | 'BUYER' | string;
  ownerName: string;
  name?: string;
  displayName?: string;
  buyer_name?: string;
  client_name?: string;
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
  source?: string;
  attribution?: any;
  externalEnquiryId?: string | null;
  externalListingId?: string | null;
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
  developerLogoUrl?: string;
  developerReraId?: string;
  developerLaunchYear?: number;
  landmarks?: string[];
  highlights?: string[];
  image: string;
  images?: Array<{ id: string; url: string; is_featured?: boolean; created_at?: string }>;
  verificationBadge: string;
  verificationTier?: string;
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
  modules?: CrmModule[];
  isActive?: boolean;
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

function parseUrlLeadId(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get('leadId') || searchParams.get('lead') || searchParams.get('id');
    if (fromSearch) return fromSearch;

    const hash = window.location.hash || '';
    if (hash.includes('?')) {
      const hashParams = new URLSearchParams(hash.split('?')[1]);
      const fromHash = hashParams.get('leadId') || hashParams.get('lead') || hashParams.get('id');
      if (fromHash) return fromHash;
    }
  } catch {}
  return null;
}

export function CrmDashboard({ staffUser, onLogout, onExit }: CrmDashboardProps) {
  // Navigation State
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    return parseUrlLeadId() ? 'LEADS' : 'OVERVIEW';
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'SECURITY' | 'HERO_CMS' | 'PARTNER_CMS' | 'CAREERS_CMS' | 'EMAIL_TEMPLATE' | 'SUGGESTIONS_CSV'>('SECURITY');

  const handleSelectSection = useCallback((section: NavSection) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  }, []);

  // RBAC State - Current user and role switcher
  const [currentRole, setCurrentRole] = useState<StaffRole>(() => {
    if (staffUser?.roles && staffUser.roles.length > 0) {
      const match = staffUser.roles.find((r: string) => r.startsWith('STAFF_'));
      if (match) return match as StaffRole;
    }
    return 'STAFF_SUPER_ADMIN';
  });

  const getStaffToken = useCallback(() => {
    try {
      const stored = sessionStorage.getItem('sellmyghar_staff_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.token || parsed?.user?.token || staffUser?.token || '';
      }
    } catch {}
    return staffUser?.token || '';
  }, [staffUser]);

  const crmFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getStaffToken();
    const headers = new Headers(init?.headers || {});
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const method = (init?.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrf = getCsrfTokenFromCookie();
      if (csrf && !headers.has('X-CSRF-Token')) {
        headers.set('X-CSRF-Token', csrf);
      }
    }
    return fetch(input, {
      credentials: 'include',
      ...init,
      headers,
    });
  }, [getStaffToken]);

  // Proactively synchronize server session with active staff identity in dev/testing
  useEffect(() => {
    const syncStaffSession = async () => {
      try {
        const res = await fetch('/api/dev/switch-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: currentRole || 'STAFF_SUPER_ADMIN' }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.token) {
            const currentSession = sessionStorage.getItem('sellmyghar_staff_session');
            const parsed = currentSession ? JSON.parse(currentSession) : {};
            sessionStorage.setItem('sellmyghar_staff_session', JSON.stringify({
              ...parsed,
              token: data.token,
              user: data.user || parsed.user,
            }));
          }
        }
      } catch {
        // Dev sync fallback
      }
    };
    syncStaffSession();
  }, [currentRole]);

  // All approved employees have access to all standard CRM operational modules
  const userModules = useMemo<CrmModule[]>(() => {
    return [
      'OVERVIEW',
      'LEADS',
      'PROPERTIES',
      'VISITS',
      'OFFERS',
      'TASKS',
      'CALENDAR',
      'REPORTS',
      'TEAM',
      'AUDIT_LOGS',
      'SETTINGS'
    ];
  }, []);

  const hasAccess = useCallback((_mod: CrmModule): boolean => {
    return true; // All approved employees have full access to standard CRM workflows
  }, []);

  // Auto-fallback if the current section is restricted for this user
  useEffect(() => {
    const sectionToModuleMap: Record<NavSection, CrmModule> = {
      OVERVIEW: 'OVERVIEW',
      LEADS: 'LEADS',
      PROPERTIES: 'PROPERTIES',
      VISITS: 'VISITS',
      OFFERS: 'OFFERS',
      TASKS: 'TASKS',
      CALENDAR: 'CALENDAR',
      TEAM: 'TEAM',
      REPORTS: 'REPORTS',
      AUDIT: 'AUDIT_LOGS',
      SETTINGS: 'SETTINGS',
    };
    const requiredModule = sectionToModuleMap[activeSection];
    if (requiredModule && !hasAccess(requiredModule)) {
      const allowedSections: NavSection[] = [
        'OVERVIEW', 'LEADS', 'PROPERTIES', 'VISITS', 'OFFERS', 'TASKS', 'CALENDAR', 'TEAM', 'REPORTS', 'AUDIT', 'SETTINGS'
      ];
      const fallback = allowedSections.find(s => hasAccess(sectionToModuleMap[s]));
      if (fallback) {
        setActiveSection(fallback);
      }
    }
  }, [activeSection, hasAccess]);

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
  const [staffSearchQuery, setStaffSearchQuery] = useState<string>('');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');
  const [auditLogs, setAuditLogs] = useState<CrmAuditLog[]>([]);
  const [overviewMetrics, setOverviewMetrics] = useState<any>(null);
  const [reportsData, setReportsData] = useState<any>(null);

  // Loading & Sync States
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // CRM Notification Centre State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('smg_crm_read_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const getRelativeTimeString = useCallback((dateStr?: string | null): string => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }, []);

  const crmNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'PROPERTY' | 'LEAD' | 'VISIT';
      title: string;
      description: string;
      timestamp: string;
      targetSection: 'PROPERTIES' | 'LEADS' | 'VISITS';
      targetId?: string;
    }> = [];

    (properties || []).slice(0, 10).forEach(p => {
      list.push({
        id: `notif-prop-${p.id}`,
        type: 'PROPERTY',
        title: `Property Intake: ${p.bhkType || ''} in ${p.projectName || p.localityName || p.title || 'Apartment'}`,
        description: `Status: ${p.status || 'DRAFT'} • ₹${(p.askingPriceInr || 0).toLocaleString('en-IN')}`,
        timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
        targetSection: 'PROPERTIES',
        targetId: p.id
      });
    });

    (leads || []).slice(0, 10).forEach(l => {
      list.push({
        id: `notif-lead-${l.id}`,
        type: 'LEAD',
        title: `Lead Inquiry: ${l.name}`,
        description: `${l.listingIntent || 'Buyer'} • ${l.locality || 'Bengaluru'} • ${l.stage || l.status || 'NEW'}`,
        timestamp: l.createdAt || new Date().toISOString(),
        targetSection: 'LEADS',
        targetId: l.id
      });
    });

    (visits || []).slice(0, 5).forEach(v => {
      list.push({
        id: `notif-visit-${v.id}`,
        type: 'VISIT',
        title: `Site Visit: ${v.client_name}`,
        description: `${v.visit_date} at ${v.visit_time} • ${v.property_title || 'Property'}`,
        timestamp: v.created_at || new Date().toISOString(),
        targetSection: 'VISITS',
        targetId: v.property_id
      });
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 15);
  }, [properties, leads, visits]);

  const unreadNotificationCount = useMemo(() => {
    return crmNotifications.filter(n => !readNotificationIds.includes(n.id)).length;
  }, [crmNotifications, readNotificationIds]);

  const markNotificationAsRead = useCallback((id: string) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try { localStorage.setItem('smg_crm_read_notifications', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    const allIds = crmNotifications.map(n => n.id);
    setReadNotificationIds(allIds);
    try { localStorage.setItem('smg_crm_read_notifications', JSON.stringify(allIds)); } catch {}
  }, [crmNotifications]);

  // Filters & Search
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [leadSearch, setLeadSearch] = useState<string>('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('ALL');
  const [leadAssignFilter, setLeadAssignFilter] = useState<string>('ALL');
  const [leadTypeFilter, setLeadTypeFilter] = useState<'ALL' | 'SELLER' | 'BUYER'>('ALL');
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>('ALL');
  const [leadFollowUpFilter, setLeadFollowUpFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'>('ALL');

  const [propSearch, setPropSearch] = useState<string>('');
  const [propStatusFilter, setPropStatusFilter] = useState<string>('ALL');
  const [propBhkFilter, setPropBhkFilter] = useState<string>('ALL');

  const [visitSearch, setVisitSearch] = useState<string>('');
  const [visitStatusFilter, setVisitStatusFilter] = useState<string>('ALL');

  const [offerSearch, setOfferSearch] = useState<string>('');
  const [offerStatusFilter, setOfferStatusFilter] = useState<string>('ALL');

  // Tasks Filter
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'OVERDUE' | 'TODAY' | 'UPCOMING'>('ALL');
  const [taskSearch, setTaskSearch] = useState<string>('');

  // Selected Records for Drawers
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(() => {
    return parseUrlLeadId();
  });
  const [leadDetailData, setLeadDetailData] = useState<any>(null);
  const [leadDetailLoading, setLeadDetailLoading] = useState<boolean>(false);
  const [leadDetailError, setLeadDetailError] = useState<string | null>(null);

  // Deep-link support: Automatically select lead and switch to LEADS section if leadId is in URL
  useEffect(() => {
    const handleUrlDeepLink = () => {
      const deepLeadId = parseUrlLeadId();
      if (deepLeadId) {
        setActiveSection('LEADS');
        setSelectedLeadId(deepLeadId);
      }
    };
    handleUrlDeepLink();
    window.addEventListener('hashchange', handleUrlDeepLink);
    window.addEventListener('popstate', handleUrlDeepLink);
    return () => {
      window.removeEventListener('hashchange', handleUrlDeepLink);
      window.removeEventListener('popstate', handleUrlDeepLink);
    };
  }, []);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [propertyDetailData, setPropertyDetailData] = useState<any>(null);
  const [propertyDetailLoading, setPropertyDetailLoading] = useState<boolean>(false);
  const [propertyDetailError, setPropertyDetailError] = useState<string | null>(null);
  const [isBrochureModalOpen, setIsBrochureModalOpen] = useState<boolean>(false);

  // Manual Lead & 99acres Entry Modal State
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState<boolean>(false);
  const [addLeadInitialSource, setAddLeadInitialSource] = useState<string>('99acres');
  const [addLeadInitialType, setAddLeadInitialType] = useState<'BUYER' | 'SELLER'>('BUYER');

  const handleOpenAddLead = useCallback((source = '99acres', type: 'BUYER' | 'SELLER' = 'BUYER') => {
    setAddLeadInitialSource(source);
    setAddLeadInitialType(type);
    setIsAddLeadModalOpen(true);
  }, []);

  // Employee Administration: Add Employee Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [addUserForm, setAddUserForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    initialPassword: string;
    modules: CrmModule[];
  }>({
    fullName: '',
    email: '',
    phone: '',
    initialPassword: '',
    modules: ['LEADS', 'PROPERTIES', 'VISITS', 'OFFERS', 'TASKS', 'CALENDAR', 'REPORTS'],
  });
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);

  // Employee Administration: Edit Employee Modal State
  const [editingStaffUser, setEditingStaffUser] = useState<CrmStaff | null>(null);
  const [editUserForm, setEditUserForm] = useState<{
    displayName: string;
    phone: string;
    isActive: boolean;
  }>({
    displayName: '',
    phone: '',
    isActive: true
  });
  const [isUpdatingUser, setIsUpdatingUser] = useState<boolean>(false);

  // Employee Administration: Confirmation Dialog State (Deactivate / Remove Employee)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'DEACTIVATE' | 'ACTIVATE' | 'REMOVE';
    targetStaff: CrmStaff | null;
  }>({
    isOpen: false,
    type: 'DEACTIVATE',
    targetStaff: null
  });
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Modals
  const [isPropertyEditorOpen, setIsPropertyEditorOpen] = useState<boolean>(false);
  const [editingProperty, setEditingProperty] = useState<CrmProperty | null>(null);

  const [isScheduleVisitOpen, setIsScheduleVisitOpen] = useState<boolean>(false);
  const [scheduleVisitForm, setScheduleVisitForm] = useState({
    propertyId: '',
    leadId: '',
    clientName: '',
    clientPhone: '',
    visitDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    visitTime: '11:00',
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

  // Document Rejection Reason Modal State
  const [rejectDocModal, setRejectDocModal] = useState<{ isOpen: boolean; docId: string; docName: string } | null>(null);
  const [rejectDocReason, setRejectDocReason] = useState<string>('');

  // Custom DateTimePicker Trigger States
  const [isFollowUpPickerOpen, setIsFollowUpPickerOpen] = useState<boolean>(false);
  const [isVisitPickerOpen, setIsVisitPickerOpen] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // -------------------------------------------------------------
  // Data Fetching Functions
  // -------------------------------------------------------------
  const loadOverviewMetrics = async () => {
    try {
      const res = await crmFetch('/api/crm/overview-metrics');
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
      const res = await crmFetch('/api/crm/leads');
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
      const res = await crmFetch('/api/crm/properties');
      if (res.ok) {
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          const mapped: CrmProperty[] = data.properties.map((p: any) => {
            const primaryImg = p.primaryImage || (p.images && p.images[0]?.url) || p.image || getDistinctCommunityPhoto(p.id || p.projectName);
            return {
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
              image: primaryImg,
              images: (p.images && p.images.length > 0) ? p.images : [{ id: 'img-0', url: primaryImg, is_featured: true }],
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
            };
          });
          const uniqueProps = Array.from(new Map(mapped.map((p: CrmProperty) => [p.id, p])).values());
          setProperties(uniqueProps);
          return;

        }
      }

      // Fallback
      const fallbackRes = await crmFetch('/api/listings');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data.listings && Array.isArray(data.listings)) {
          const mapped: CrmProperty[] = data.listings.map((item: any, idx: number) => {
            const primaryImg = item.image || (Array.isArray(item.images) && item.images[0]) || getDistinctCommunityPhoto(item.id || item.projectName || String(idx));
            return {
              id: item.id,
              title: item.title || item.projectName,
              projectName: item.projectName || item.societyName,
              localityName: item.localityName,
              bhkType: item.bhkType,
              superBuiltUpSqft: item.superBuiltUpSqft,
              carpetAreaSqft: item.carpetAreaSqft,
              floorBand: item.floorBand,
              facing: item.facing,
              askingPriceInr: item.askingPriceInr,
              pricePerSqft: item.pricePerSqft,
              image: primaryImg,
              images: Array.isArray(item.images) && item.images.length > 0
                ? item.images.map((url: any, i: number) => ({ id: `img-${i}`, url: typeof url === 'string' ? url : url.url, is_featured: i === 0 }))
                : [{ id: 'img-0', url: primaryImg, is_featured: true }],
              verificationBadge: item.verificationBadge || 'VERIFIED',
              status: 'PUBLISHED' as PropertyListingStatus,
              updatedAt: 'Recently'
            };
          });
          setProperties(mapped);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadVisits = async () => {
    try {
      const res = await crmFetch('/api/crm/visits');
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
      const res = await crmFetch('/api/crm/offers');
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
      const res = await crmFetch('/api/crm/tasks');
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
      const res = await crmFetch('/api/crm/staff');
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
      const res = await crmFetch('/api/crm/audit-logs');
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
      const res = await crmFetch('/api/crm/reports');
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
    crmFetch(`/api/crm/leads/${selectedLeadId}/details`)
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
    crmFetch(`/api/crm/properties/${selectedPropertyId}/details`)
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
      const res = await crmFetch(`/api/crm/leads/${leadId}/status`, {
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
      const res = await crmFetch(`/api/crm/leads/${leadId}/assign`, {
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
      const res = await crmFetch(`/api/crm/leads/${leadId}/follow-up`, {
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

  const handleScheduleFollowUpWithDateTime = async (leadId: string, dateStr: string, timeStr: string, note?: string) => {
    try {
      let hours = 11;
      let minutes = 0;
      if (timeStr) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0], 10) || 11;
        const minPart = parts[1]?.slice(0, 2);
        minutes = parseInt(minPart, 10) || 0;
        if (timeStr.toUpperCase().includes('PM') && hours < 12) hours += 12;
        if (timeStr.toUpperCase().includes('AM') && hours === 12) hours = 0;
      }
      const [y, m, d] = dateStr.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d, hours, minutes, 0);

      const res = await crmFetch(`/api/crm/leads/${leadId}/follow-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpAt: targetDate.toISOString(),
          followUpNotes: note || newFollowUpNote || 'Scheduled diligence follow-up call'
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
      const res = await crmFetch(`/api/crm/leads/${leadId}/notes`, {
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
      const res = await crmFetch('/api/crm/visits', {
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
          visitDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          visitTime: '11:00',
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
      const res = await crmFetch(`/api/crm/visits/${visitId}/status`, {
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
      const res = await crmFetch(`/api/crm/visits/${visitId}/whatsapp-reminder`, {
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
      const res = await crmFetch('/api/crm/offers', {
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
      const res = await crmFetch(`/api/crm/offers/${offerId}/status`, {
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
      const res = await crmFetch(`/api/crm/documents/${docId}/status`, {
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
      const res = await crmFetch(`/api/crm/properties/${propertyId}/status`, {
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

  // 12. Employee Administration: Provision Staff User
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
      const res = await crmFetch('/api/crm/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addUserForm.fullName.trim(),
          email: addUserForm.email.trim().toLowerCase(),
          phone: addUserForm.phone.trim(),
          initialPassword: addUserForm.initialPassword,
          modules: ['OVERVIEW', ...addUserForm.modules],
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Staff account created for ${data.user?.displayName || addUserForm.fullName}`, 'success');
        setIsAddUserOpen(false);
        setAddUserForm({
          fullName: '',
          email: '',
          phone: '',
          initialPassword: '',
          modules: ['LEADS', 'PROPERTIES', 'VISITS', 'OFFERS', 'TASKS', 'CALENDAR', 'REPORTS'],
        });
        refreshAll();
      } else {
        showToast(data.message || data.error || 'Failed to create staff account', 'error');
      }
    } catch {
      showToast('Network error creating user', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // 13. Employee Administration: Edit Staff Details
  const handleOpenEditUser = (staff: CrmStaff) => {
    setEditingStaffUser(staff);
    setEditUserForm({
      displayName: staff.displayName || staff.name || '',
      phone: staff.phone || '',
      isActive: staff.isActive !== false
    });
  };

  const handleSaveUserPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaffUser) return;
    setIsUpdatingUser(true);
    try {
      const res = await crmFetch(`/api/crm/users/${editingStaffUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editUserForm.displayName,
          phone: editUserForm.phone,
          isActive: editUserForm.isActive
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Updated details for ${editUserForm.displayName}`, 'success');
        setEditingStaffUser(null);
        refreshAll();
      } else {
        showToast(data.message || data.error || 'Failed to update employee details', 'error');
      }
    } catch {
      showToast('Network error updating employee details', 'error');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // 13b. Employee Administration: Execute Confirmed Action (Deactivate / Reactivate / Remove)
  const handleExecuteConfirmAction = async () => {
    if (!confirmDialog.targetStaff) return;
    const { type, targetStaff } = confirmDialog;
    setIsProcessingAction(true);
    try {
      if (type === 'REMOVE') {
        const res = await crmFetch(`/api/crm/users/${targetStaff.id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(data.message || `Employee ${targetStaff.displayName} removed`, 'success');
          setConfirmDialog({ isOpen: false, type: 'DEACTIVATE', targetStaff: null });
          refreshAll();
        } else {
          showToast(data.message || data.error || 'Failed to remove employee', 'error');
        }
      } else {
        const willBeActive = type === 'ACTIVATE';
        const res = await crmFetch(`/api/crm/users/${targetStaff.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: willBeActive })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Employee ${targetStaff.displayName} ${willBeActive ? 'activated' : 'deactivated (active sessions terminated)'}`, 'success');
          setConfirmDialog({ isOpen: false, type: 'DEACTIVATE', targetStaff: null });
          refreshAll();
        } else {
          showToast(data.message || data.error || 'Failed to update employee status', 'error');
        }
      }
    } catch {
      showToast('Network error processing employee action', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Legacy role update alias
  const handleUpdateUserRole = async (userId: string, newRole: StaffRole) => {
    try {
      const res = await crmFetch(`/api/crm/users/${userId}/role`, {
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
  const handleExportCsv = async (reportType: 'leads' | 'visits' | 'offers' | 'properties') => {
    try {
      let url = `/api/crm/reports/export-csv?type=${reportType}`;
      if (reportType === 'leads' && leadStatusFilter !== 'ALL') {
        url += `&status=${leadStatusFilter}`;
      } else if (reportType === 'visits' && visitStatusFilter !== 'ALL') {
        url += `&status=${visitStatusFilter}`;
      } else if (reportType === 'properties' && propStatusFilter !== 'ALL') {
        url += `&status=${propStatusFilter}`;
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
      const q = (leadSearch.trim() || globalSearch.trim()).toLowerCase();
      if (q) {
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

      // Source Filter
      if (leadSourceFilter !== 'ALL') {
        const rawSrc = (lead.source || lead.attribution?.source || (lead.notes?.includes('99acres') ? '99acres' : 'SellMyGhar')).toLowerCase();
        if (!rawSrc.includes(leadSourceFilter.toLowerCase())) {
          return false;
        }
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
  }, [leads, leadSearch, globalSearch, leadStatusFilter, leadAssignFilter, leadTypeFilter, leadSourceFilter, leadFollowUpFilter, staffUser]);

  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      const q = (propSearch.trim() || globalSearch.trim()).toLowerCase();
      if (q) {
        const match =
          (prop.projectName || '').toLowerCase().includes(q) ||
          (prop.localityName || '').toLowerCase().includes(q) ||
          (prop.title || '').toLowerCase().includes(q) ||
          (prop.developerName || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      if (propStatusFilter === 'VERIFIED') {
        const isVerified = Boolean(
          (prop.verificationBadge && prop.verificationBadge !== 'NONE') ||
          prop.verificationTier === 'LEVEL_2_DOCS_REVIEWED' ||
          prop.verificationTier === 'LEVEL_3_PHYSICALLY_INSPECTED' ||
          (prop as any).verification_tier === 'LEVEL_2_DOCS_REVIEWED' ||
          (prop as any).verification_tier === 'LEVEL_3_PHYSICALLY_INSPECTED'
        );
        if (!isVerified) return false;
      } else if (propStatusFilter !== 'ALL' && prop.status !== propStatusFilter) {
        return false;
      }

      if (propBhkFilter !== 'ALL' && !prop.bhkType.includes(propBhkFilter)) {
        return false;
      }

      return true;
    });
  }, [properties, propSearch, globalSearch, propStatusFilter, propBhkFilter]);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const q = (visitSearch.trim() || globalSearch.trim()).toLowerCase();
      if (q) {
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
  }, [visits, visitSearch, globalSearch, visitStatusFilter]);

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const q = (offerSearch.trim() || globalSearch.trim()).toLowerCase();
      if (q) {
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
  }, [offers, offerSearch, globalSearch, offerStatusFilter]);

  const filteredTasks = useMemo(() => {
    const overdueTagged = tasks.overdue.map(t => ({ ...t, queueType: 'OVERDUE' as const }));
    const todayTagged = tasks.dueToday.map(t => ({ ...t, queueType: 'TODAY' as const }));
    const upcomingTagged = tasks.upcoming.map(t => ({ ...t, queueType: 'UPCOMING' as const }));

    let combined = [...overdueTagged, ...todayTagged, ...upcomingTagged];

    if (taskFilter === 'OVERDUE') {
      combined = combined.filter(t => t.queueType === 'OVERDUE');
    } else if (taskFilter === 'TODAY') {
      combined = combined.filter(t => t.queueType === 'TODAY');
    } else if (taskFilter === 'UPCOMING') {
      combined = combined.filter(t => t.queueType === 'UPCOMING');
    }

    const q = (taskSearch.trim() || globalSearch.trim()).toLowerCase();
    if (q) {
      combined = combined.filter(t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.phone || '').toLowerCase().includes(q) ||
        (t.society || '').toLowerCase().includes(q) ||
        (t.locality || '').toLowerCase().includes(q) ||
        (t.follow_up_notes || '').toLowerCase().includes(q) ||
        (t.assigned_staff_name || '').toLowerCase().includes(q)
      );
    }

    return combined;
  }, [tasks, taskFilter, taskSearch, globalSearch]);

  // Operational Permissions (Standard Full Access for all approved employees)
  const canSeeTeam = true;
  const canSeeAudit = true;
  const canSeeReservePrice = true;


  return (
    <div className="flex h-screen bg-[#F4F6F9] text-[#172033] font-['Poppins',sans-serif] overflow-hidden select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center space-x-2 transition-all duration-200 ${
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

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================== */}
      {/* LEFT NAVIGATION SIDEBAR                                         */}
      {/* ============================================================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 shadow-2xl md:shadow-2xs transition-transform duration-300 md:static md:w-64 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="SellMyGhar"
                className="h-9 w-auto object-contain"
              />
              <div className="border-l border-slate-200/90 pl-2.5">
                <h1 className="font-extrabold text-xs tracking-tight text-[#172033] uppercase">CRM Portal</h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">Operations</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/80">
                v2.6
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 md:hidden rounded-lg hover:bg-slate-100 cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Items (11 Sections) */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {/* 1. Overview */}
            {hasAccess('OVERVIEW') && (
              <button
                type="button"
                onClick={() => handleSelectSection('OVERVIEW')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'OVERVIEW'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview</span>
                </div>
              </button>
            )}

            {/* 2. Leads */}
            {hasAccess('LEADS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('LEADS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'LEADS'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Leads</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    activeSection === 'LEADS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {leads.length}
                </span>
              </button>
            )}

            {/* 3. Properties */}
            {hasAccess('PROPERTIES') && (
              <button
                type="button"
                onClick={() => handleSelectSection('PROPERTIES')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'PROPERTIES'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Properties</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    activeSection === 'PROPERTIES' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {properties.length}
                </span>
              </button>
            )}

            {/* 4. Visits */}
            {hasAccess('VISITS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('VISITS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'VISITS'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CalendarCheck className="w-4 h-4 shrink-0" />
                  <span>Visits</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    activeSection === 'VISITS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {visits.filter(v => v.status === 'SCHEDULED').length}
                </span>
              </button>
            )}

            {/* 5. Offers */}
            {hasAccess('OFFERS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('OFFERS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'OFFERS'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>Offers</span>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    activeSection === 'OFFERS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {offers.filter(o => o.status === 'PENDING_REVIEW').length}
                </span>
              </button>
            )}

            {/* 6. Tasks */}
            {hasAccess('TASKS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('TASKS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'TASKS'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Tasks</span>
                </div>
                {tasks.overdue.length > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      activeSection === 'TASKS' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {tasks.overdue.length}
                  </span>
                )}
              </button>
            )}

            {/* 7. Calendar */}
            {hasAccess('CALENDAR') && (
              <button
                type="button"
                onClick={() => handleSelectSection('CALENDAR')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'CALENDAR'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Calendar</span>
                </div>
              </button>
            )}

            {/* 8. Team */}
            {hasAccess('TEAM') && (
              <button
                type="button"
                onClick={() => handleSelectSection('TEAM')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'TEAM'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Team</span>
                </div>
              </button>
            )}

            {/* 9. Reports */}
            {hasAccess('REPORTS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('REPORTS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'REPORTS'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Reports</span>
                </div>
              </button>
            )}

            {/* 10. Audit Logs */}
            {hasAccess('AUDIT_LOGS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('AUDIT')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'AUDIT'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Audit Logs</span>
                </div>
              </button>
            )}

            {/* 11. Settings */}
            {hasAccess('SETTINGS') && (
              <button
                type="button"
                onClick={() => handleSelectSection('SETTINGS')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeSection === 'SETTINGS'
                    ? 'bg-[#0073E6] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer: Employee Profile & Logout */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 space-y-2">

          {/* User Profile */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#172033] text-white flex items-center justify-center text-xs font-bold shrink-0">
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

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Log out from CRM"
                className="p-1.5 rounded-lg hover:bg-slate-200/80 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN VIEWPORT                                                   */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Compact Aligned Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between shrink-0 z-10">
          {/* Breadcrumb / Title & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 md:hidden cursor-pointer shrink-0"
              aria-label="Open CRM Navigation Menu"
              title="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
              <span className="text-slate-400 font-medium hidden sm:inline">SellMyGhar /</span>
              <span className="text-slate-900 font-bold capitalize truncate">
                {activeSection.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Search, Refresh & Global Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
            {/* Global Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search CRM..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-8 sm:pl-9 pr-6 sm:pr-8 py-1.5 sm:py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0073E6] focus:outline-hidden w-28 sm:w-56 focus:w-44 sm:focus:w-72 transition-all"
              />
              {globalSearch && (
                <button
                  type="button"
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Refresh / Sync */}
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              title={`Last synced: ${lastSyncTime}`}
              className="inline-flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-[11px] text-slate-500 font-normal hidden lg:inline">{lastSyncTime}</span>
            </button>

            {/* Notification Centre Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(prev => !prev)}
                title="Operational Notifications"
                aria-label={`Notifications (${unreadNotificationCount} unread)`}
                className="relative p-1.5 sm:p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#0073E6] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadNotificationCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#0073E6]">
                          {unreadNotificationCount} new
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] font-semibold text-[#0073E6] hover:text-[#005BB5] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {crmNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No recent operational notifications.
                      </div>
                    ) : (
                      crmNotifications.map(item => {
                        const isRead = readNotificationIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              markNotificationAsRead(item.id);
                              setActiveSection(item.targetSection);
                              if (item.targetSection === 'PROPERTIES' && item.targetId) {
                                setSelectedPropertyId(item.targetId);
                              } else if (item.targetSection === 'LEADS' && item.targetId) {
                                setSelectedLeadId(item.targetId);
                              }
                              setIsNotificationsOpen(false);
                            }}
                            className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                              isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/30 hover:bg-blue-50/60'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              item.type === 'PROPERTY' ? 'bg-amber-100 text-amber-700' :
                              item.type === 'LEAD' ? 'bg-blue-100 text-[#0073E6]' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.type === 'PROPERTY' && <Building2 className="w-4 h-4" />}
                              {item.type === 'LEAD' && <Users className="w-4 h-4" />}
                              {item.type === 'VISIT' && <CalendarCheck className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className={`text-xs truncate ${isRead ? 'font-medium text-slate-700' : 'font-bold text-[#172033]'}`}>
                                  {item.title}
                                </div>
                                {!isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#0073E6] shrink-0 ml-1.5" />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate mb-1">
                                {item.description}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {getRelativeTimeString(item.timestamp)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action: Schedule Visit */}
            <button
              type="button"
              onClick={() => setIsScheduleVisitOpen(true)}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-slate-600" />
              <span>Schedule Visit</span>
            </button>

            {/* Quick Action: Record Offer */}
            <button
              type="button"
              onClick={() => setIsRecordOfferOpen(true)}
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
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
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Property</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* Exit to Public Site */}
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                title="View Public Marketplace"
                className="p-1.5 sm:p-2 rounded-xl border border-slate-200/80 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* ============================================================== */}
          {/* VIEW 1: OVERVIEW DASHBOARD                                     */}
          {/* ============================================================== */}
          {activeSection === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Page Title */}
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#172033]">Overview</h2>
              </div>

              {/* 6 Clickable Real KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {/* 1. New Leads */}
                <div
                  onClick={() => {
                    setLeadStatusFilter('NEW');
                    setActiveSection('LEADS');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-[#0073E6] transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#0073E6]">
                    New Leads
                  </span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.newLeads ?? leads.filter(l => l.stage === 'NEW').length}
                  </div>
                  <span className="text-[11px] text-[#0073E6] font-semibold flex items-center mt-1">
                    View New <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 2. Follow-ups Due */}
                <div
                  onClick={() => {
                    setLeadStatusFilter('FOLLOW_UP');
                    setActiveSection('LEADS');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-[#0073E6] transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#0073E6]">
                    Follow-ups Due
                  </span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.followUpNeeded ?? leads.filter(l => l.stage === 'FOLLOW_UP').length}
                  </div>
                  <span className="text-[11px] text-[#0073E6] font-semibold flex items-center mt-1">
                    View Queue <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 3. Active Properties */}
                <div
                  onClick={() => {
                    setPropStatusFilter('PUBLISHED');
                    setActiveSection('PROPERTIES');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-600 transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600">
                    Active Properties
                  </span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
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
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-blue-600 transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600">
                    Visits Scheduled
                  </span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.visitsScheduled ?? visits.filter(v => v.status === 'SCHEDULED').length}
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center mt-1">
                    View Schedule <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 5. Pending Offers */}
                <div
                  onClick={() => {
                    setOfferStatusFilter('PENDING_REVIEW');
                    setActiveSection('OFFERS');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-[#0073E6] transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#0073E6]">
                    Pending Offers
                  </span>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {overviewMetrics?.metrics?.offersAwaitingAction ?? offers.filter(o => o.status === 'PENDING_REVIEW').length}
                  </div>
                  <span className="text-[11px] text-[#0073E6] font-semibold flex items-center mt-1">
                    Review Offers <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>

                {/* 6. Converted Deals */}
                <div
                  onClick={() => {
                    setLeadStatusFilter('CONVERTED');
                    setActiveSection('LEADS');
                  }}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-600 transition-all cursor-pointer shadow-xs group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-600">
                    Converted Deals
                  </span>
                  <div className="text-2xl font-bold text-emerald-800 mt-1">
                    {overviewMetrics?.metrics?.convertedLeads ?? leads.filter(l => l.stage === 'CONVERTED').length}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center mt-1">
                    Closed Deals <ChevronRight className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </div>

              {/* Lead Pipeline Progression Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Lead Pipeline</h3>
                  <button
                    type="button"
                    onClick={() => setActiveSection('LEADS')}
                    className="text-xs font-bold text-[#0073E6] hover:underline flex items-center cursor-pointer"
                  >
                    View All Leads ({leads.length}) <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>

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
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer hover:shadow-2xs ${
                          stage.key === 'CONVERTED'
                            ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-400'
                            : stage.key === 'LOST'
                            ? 'bg-slate-50 border-slate-200 hover:border-slate-400 text-slate-500'
                            : 'bg-white border-slate-200/80 hover:border-[#0073E6]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          <span>{stage.label}</span>
                        </div>
                        <div className="text-xl font-bold text-slate-900">{count}</div>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{stage.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2-Column Operations Work Queues */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Scheduled Visits & Overdue Follow-ups */}
                <div className="space-y-4">
                  {/* Scheduled Visits */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <CalendarCheck className="w-4 h-4 text-[#0073E6]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Scheduled Visits
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('VISITS')}
                        className="text-[11px] font-bold text-[#0073E6] hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    <div className="space-y-2">
                      {visits.filter(v => v.status === 'SCHEDULED').length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                          No visits scheduled currently.
                        </div>
                      ) : (
                        visits.filter(v => v.status === 'SCHEDULED').slice(0, 3).map((visit) => (
                          <div
                            key={visit.id}
                            className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-900 truncate">{visit.client_name}</p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {visit.property_title || 'Unit viewing'} • {formatReadableDate(visit.visit_date)} at {formatReadableTime(visit.visit_time)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Staff: {visit.assigned_staff_name || 'Unassigned'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppReminder(visit.id)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[#0073E6] font-bold text-[10px] rounded-lg shrink-0 cursor-pointer"
                            >
                              WhatsApp
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Overdue Follow-ups */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
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
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                          All follow-ups are up to date.
                        </div>
                      ) : (
                        tasks.overdue.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedLeadId(task.id)}
                            className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-rose-50/70 transition-colors"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-rose-950 truncate">{task.name}</p>
                              <p className="text-[11px] text-slate-600 truncate">{task.society || task.locality}</p>
                              <p className="text-[10px] text-rose-700 font-medium">
                                Instruction: {task.follow_up_notes || 'Overdue client call'}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900 shrink-0">
                              OVERDUE
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Offers Awaiting Action & Recently Updated Leads */}
                <div className="space-y-4">
                  {/* Offers Awaiting Action */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <Tag className="w-4 h-4 text-[#0073E6]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          Offers Awaiting Action
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveSection('OFFERS')}
                        className="text-[11px] font-bold text-[#0073E6] hover:underline"
                      >
                        View Offers
                      </button>
                    </div>

                    <div className="space-y-2">
                      {offers.filter(o => o.status === 'PENDING_REVIEW').length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                          No pending offers requiring review.
                        </div>
                      ) : (
                        offers.filter(o => o.status === 'PENDING_REVIEW').slice(0, 3).map((offer) => (
                          <div
                            key={offer.id}
                            className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-900 truncate">{offer.buyer_name}</p>
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
                              className="px-2.5 py-1 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-[10px] rounded-lg shrink-0 cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recently Updated Leads */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
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
                        className="text-[11px] font-bold text-[#0073E6] hover:underline"
                      >
                        All Leads
                      </button>
                    </div>

                    <div className="space-y-2">
                      {leads.slice(0, 3).map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100/60 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-900 truncate">{lead.ownerName}</p>
                            <p className="text-[11px] text-slate-500 truncate">{lead.society || lead.locality}</p>
                            <p className="text-[10px] text-slate-400">
                              Assigned: {lead.assignedStaffName || 'Unassigned'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#0073E6] shrink-0">
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
              {/* Module Header & Operational Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#172033]">Leads & Inquiries</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('leads')}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span className="hidden sm:inline">Export Leads CSV</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddLead('99acres', 'BUYER')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/90 text-amber-900 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                    title="Quickly record an inbound lead from 99acres.com"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                    <span>Add 99acres Lead</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenAddLead('SellMyGhar Portal', 'BUYER')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#0073E6] hover:bg-[#005bb5] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Lead</span>
                  </button>
                </div>
              </div>

              {/* Operational KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div
                  onClick={() => setLeadStatusFilter('ALL')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    leadStatusFilter === 'ALL'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Pipeline</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{leads.length}</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">All active inquiries</span>
                </div>

                <div
                  onClick={() => setLeadStatusFilter('NEW')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    leadStatusFilter === 'NEW'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">New Registrations</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    {leads.filter(l => l.stage === 'NEW').length}
                  </div>
                  <span className="text-[10px] text-[#0073E6] font-semibold mt-0.5 block">Fresh inbound</span>
                </div>

                <div
                  onClick={() => setLeadStatusFilter('CONTACTED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    leadStatusFilter === 'CONTACTED'
                      ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contacted</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">
                    {leads.filter(l => l.stage === 'CONTACTED').length}
                  </div>
                  <span className="text-[10px] text-indigo-700 font-semibold mt-0.5 block">Initial outreach</span>
                </div>

                <div
                  onClick={() => setLeadStatusFilter('FOLLOW_UP')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    leadStatusFilter === 'FOLLOW_UP'
                      ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">In Follow-up</span>
                  <div className="text-2xl font-bold text-amber-900 mt-0.5">
                    {leads.filter(l => l.stage === 'FOLLOW_UP').length}
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Active diligence</span>
                </div>

                <div
                  onClick={() => setLeadStatusFilter('SITE_VISIT')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    leadStatusFilter === 'SITE_VISIT'
                      ? 'bg-sky-50/50 border-sky-500 ring-1 ring-sky-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Site Visits</span>
                  <div className="text-2xl font-bold text-sky-900 mt-0.5">
                    {leads.filter(l => l.stage === 'SITE_VISIT').length}
                  </div>
                  <span className="text-[10px] text-sky-700 font-semibold mt-0.5 block">Physical tours</span>
                </div>

                <div
                  onClick={() => setLeadStatusFilter('CONVERTED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    leadStatusFilter === 'CONVERTED'
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Converted</span>
                  <div className="text-2xl font-bold text-emerald-800 mt-0.5">
                    {leads.filter(l => l.stage === 'CONVERTED').length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Deals closed</span>
                </div>
              </div>

              {/* Dedicated Search & Filter Control Bar */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads by client name, phone, society, locality..."
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0073E6] focus:outline-hidden"
                  />
                  {leadSearch && (
                    <button
                      type="button"
                      onClick={() => setLeadSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Stage:</span>
                    <select
                      value={leadStatusFilter}
                      onChange={(e) => setLeadStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Stages</option>
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Assigned:</span>
                    <select
                      value={leadAssignFilter}
                      onChange={(e) => setLeadAssignFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Staff</option>
                      <option value="ME">Assigned to Me</option>
                      <option value="UNASSIGNED">Unassigned Only</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.displayName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Type:</span>
                    <select
                      value={leadTypeFilter}
                      onChange={(e) => setLeadTypeFilter(e.target.value as any)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Inquiries</option>
                      <option value="SELLER">Seller Leads</option>
                      <option value="BUYER">Buyer Enquiries</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Source:</span>
                    <select
                      value={leadSourceFilter}
                      onChange={(e) => setLeadSourceFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Sources</option>
                      <option value="99acres">99acres</option>
                      <option value="SellMyGhar">SellMyGhar</option>
                      <option value="Website">Website</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Follow-up:</span>
                    <select
                      value={leadFollowUpFilter}
                      onChange={(e) => setLeadFollowUpFilter(e.target.value as any)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Tasks</option>
                      <option value="OVERDUE">Overdue Only</option>
                      <option value="TODAY">Due Today</option>
                    </select>
                  </div>

                  {(leadStatusFilter !== 'ALL' || leadAssignFilter !== 'ALL' || leadTypeFilter !== 'ALL' || leadSourceFilter !== 'ALL' || leadFollowUpFilter !== 'ALL' || leadSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setLeadStatusFilter('ALL');
                        setLeadAssignFilter('ALL');
                        setLeadTypeFilter('ALL');
                        setLeadSourceFilter('ALL');
                        setLeadFollowUpFilter('ALL');
                        setLeadSearch('');
                      }}
                      className="text-[#0073E6] hover:underline text-xs font-bold px-2 py-1 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Leads Table Container */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Client / Contact</th>
                      <th className="py-3.5 px-4">Inquiry Type</th>
                      <th className="py-3.5 px-4">Lead Source</th>
                      <th className="py-3.5 px-4">Property / Society</th>
                      <th className="py-3.5 px-4">BHK & Budget</th>
                      <th className="py-3.5 px-4">Lifecycle Stage</th>
                      <th className="py-3.5 px-4">Relationship Manager</th>
                      <th className="py-3.5 px-4">Follow-up Due</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-slate-400 text-xs">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                          <p className="font-semibold text-slate-700">No leads match the specified filter criteria.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your filters or search query to see all records.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => {
                        const clientName = lead.displayName || lead.ownerName || lead.name || lead.buyer_name || lead.client_name || 'Client';
                        const isNewLead = lead.stage === 'NEW';

                        return (
                          <tr
                            key={lead.id}
                            onClick={() => setSelectedLeadId(lead.id)}
                            className={`transition-colors cursor-pointer group ${
                              isNewLead
                                ? 'bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-l-[#0073E6]'
                                : 'hover:bg-slate-50/70'
                            }`}
                          >
                            {/* Client / Contact */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${
                                  isNewLead
                                    ? 'bg-[#0073E6] text-white border-[#0073E6]'
                                    : 'bg-blue-50 border-blue-200/60 text-[#0073E6]'
                                }`}>
                                  {clientName[0] || 'L'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors truncate">
                                    {clientName}
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-mono">
                                    {lead.phone}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Inquiry Type */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  lead.type === 'SELLER'
                                    ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                }`}
                              >
                                {lead.type || 'SELLER'}
                              </span>
                            </td>

                            {/* Lead Source */}
                            <td className="py-3.5 px-4">
                              {(() => {
                                const rawSrc = lead.source || lead.attribution?.source || (lead.notes?.includes('99acres') ? '99acres' : (lead.type === 'SELLER' ? 'SellMyGhar' : 'Website Portal'));
                                const is99 = rawSrc.toLowerCase().includes('99acres');
                                const isWa = rawSrc.toLowerCase().includes('whatsapp');
                                return (
                                  <span
                                    className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-2xs ${
                                      is99
                                        ? 'bg-amber-50 text-amber-900 border border-amber-300/80'
                                        : isWa
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-blue-50 text-[#0073E6] border border-blue-200/60'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${is99 ? 'bg-amber-500' : isWa ? 'bg-emerald-500' : 'bg-[#0073E6]'}`}></span>
                                    <span>{rawSrc}</span>
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Property & Locality */}
                            <td className="py-3.5 px-4 text-slate-700">
                              <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                                {lead.society || 'Residential Unit'}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {lead.locality}
                              </div>
                            </td>

                            {/* BHK & Budget */}
                            <td className="py-3.5 px-4 text-slate-700">
                              <div className="font-bold text-slate-900">{lead.bhk || '2 BHK'}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{lead.expectedPrice || 'Market'}</div>
                            </td>

                            {/* Lifecycle Stage */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  isNewLead
                                    ? 'bg-[#0073E6] text-white font-extrabold tracking-wide shadow-xs'
                                    : lead.stage === 'CONTACTED'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : lead.stage === 'FOLLOW_UP'
                                    ? 'bg-amber-50 text-amber-800'
                                    : lead.stage === 'SITE_VISIT'
                                    ? 'bg-sky-50 text-sky-800'
                                    : lead.stage === 'NEGOTIATION'
                                    ? 'bg-purple-50 text-purple-800'
                                    : lead.stage === 'CONVERTED'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {lead.stage}
                              </span>
                            </td>

                          {/* Assigned Staff */}
                          <td className="py-3.5 px-4 text-slate-600">
                            {lead.assignedStaffName ? (
                              <span className="font-medium text-slate-800">{lead.assignedStaffName}</span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Follow-up Due */}
                          <td className="py-3.5 px-4">
                            {lead.nextFollowUpAt ? (
                              <div>
                                <span
                                  className={`text-[11px] font-semibold ${
                                    lead.isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'
                                  }`}
                                >
                                  {new Date(lead.nextFollowUpAt).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                {lead.isOverdue && (
                                  <span className="block text-[10px] text-rose-600 font-bold">OVERDUE</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLeadId(lead.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#0073E6] hover:bg-[#005BB5] text-white font-semibold text-[11px] transition-colors cursor-pointer shadow-2xs inline-flex items-center space-x-1"
                            >
                              <span>Manage Lead</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>

                {/* Table Footer / Pagination */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>
                      Showing <strong className="text-slate-800 tabular-nums">{filteredLeads.length}</strong> of{' '}
                      <strong className="text-slate-800 tabular-nums">{leads.length}</strong> lead inquiries
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Page 1 of 1</span>
                    <div className="inline-flex rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold cursor-not-allowed">
                        Previous
                      </button>
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold border-l border-slate-200/80 cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 3: PROPERTIES INVENTORY                                   */}
          {/* ============================================================== */}
          {activeSection === 'PROPERTIES' && (
            <div className="space-y-4">
              {/* Module Header & Operational Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#172033]">Properties Inventory</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('properties')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProperty(null);
                      setIsPropertyEditorOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0073E6] text-white text-xs font-bold shadow-xs hover:bg-[#005BB5] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Property Listing</span>
                  </button>
                </div>
              </div>

              {/* Operational KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setPropStatusFilter('ALL')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    propStatusFilter === 'ALL'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Portfolio</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{properties.length}</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Managed units</span>
                </div>

                <div
                  onClick={() => setPropStatusFilter('PUBLISHED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    propStatusFilter === 'PUBLISHED'
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Published Active</span>
                  <div className="text-2xl font-bold text-emerald-800 mt-0.5">
                    {properties.filter(p => p.status === 'PUBLISHED').length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Live on marketplace</span>
                </div>

                <div
                  onClick={() => setPropStatusFilter(propStatusFilter === 'VERIFIED' ? 'ALL' : 'VERIFIED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    propStatusFilter === 'VERIFIED'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Verified Tier</span>
                  <div className="text-2xl font-bold text-[#0073E6] mt-0.5">
                    {properties.filter(p => (p.verificationBadge && p.verificationBadge !== 'NONE') || p.verificationTier === 'LEVEL_2_DOCS_REVIEWED' || p.verificationTier === 'LEVEL_3_PHYSICALLY_INSPECTED').length}
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Level 1 & 2 audited</span>
                </div>

                <div
                  onClick={() => setPropStatusFilter('SOLD')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    propStatusFilter === 'SOLD'
                      ? 'bg-slate-100 border-slate-500 ring-1 ring-slate-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Closed / Sold</span>
                  <div className="text-2xl font-bold text-slate-800 mt-0.5">
                    {properties.filter(p => p.status === 'SOLD').length}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Completed deals</span>
                </div>
              </div>

              {/* Dedicated Search & Filter Control Bar */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search properties by project, title, locality, developer..."
                    value={propSearch}
                    onChange={(e) => setPropSearch(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0073E6] focus:outline-hidden"
                  />
                  {propSearch && (
                    <button
                      type="button"
                      onClick={() => setPropSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
                    <select
                      value={propStatusFilter}
                      onChange={(e) => setPropStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="VERIFIED">Verified Tier</option>
                      <option value="DRAFT">Draft</option>
                      <option value="PAUSED">Paused</option>
                      <option value="SOLD">Sold</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">BHK:</span>
                    <select
                      value={propBhkFilter}
                      onChange={(e) => setPropBhkFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All BHK</option>
                      <option value="1BHK">1 BHK</option>
                      <option value="2BHK">2 BHK</option>
                      <option value="3BHK">3 BHK</option>
                      <option value="4BHK">4 BHK+</option>
                    </select>
                  </div>

                  {(propStatusFilter !== 'ALL' || propBhkFilter !== 'ALL' || propSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setPropStatusFilter('ALL');
                        setPropBhkFilter('ALL');
                        setPropSearch('');
                      }}
                      className="text-[#0073E6] hover:underline text-xs font-bold px-2 py-1 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Properties Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Property / Project</th>
                      <th className="py-3.5 px-4">Locality</th>
                      <th className="py-3.5 px-4">BHK & Area</th>
                      <th className="py-3.5 px-4">Asking Price</th>
                      <th className="py-3.5 px-4">Verification</th>
                      <th className="py-3.5 px-4">Listing Status</th>
                      <th className="py-3.5 px-4">Assigned RM</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700">No properties match your filter criteria.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the status filter or clearing your search term.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map((prop) => (
                        <tr
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <img
                                src={prop.image}
                                alt={prop.projectName}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200/80 shrink-0 shadow-2xs"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.dataset.hasFallback) {
                                    target.dataset.hasFallback = 'true';
                                    target.src = getDistinctCommunityPhoto(prop.id || prop.projectName, 800);
                                  }
                                }}
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors truncate">
                                  {prop.projectName}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{prop.title || prop.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 truncate max-w-[150px]">
                            {prop.localityName}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-bold text-slate-900">{prop.bhkType}</div>
                            <div className="text-[10px] text-slate-400">{prop.superBuiltUpSqft} sq.ft</div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            ₹{(prop.askingPriceInr / 10000000).toFixed(2)} Cr
                            <div className="text-[10px] text-slate-400 font-normal">
                              ₹{prop.pricePerSqft}/sqft
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0073E6] border border-blue-200/60">
                              {prop.verificationBadge}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                prop.status === 'PUBLISHED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : prop.status === 'PAUSED'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                  : prop.status === 'SOLD'
                                  ? 'bg-slate-100 text-slate-800 border border-slate-200/60'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                              }`}
                            >
                              {prop.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {prop.assignedRm ? (
                              <span className="font-medium text-slate-800">{prop.assignedRm}</span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProperty(prop);
                                setIsPropertyEditorOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPropertyId(prop.id);
                                setIsBrochureModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center space-x-1"
                              title="Generate Editorial A4 Property Presentation Brochure"
                            >
                              <FileText className="w-3 h-3 text-[#B68A4A]" />
                              <span>Brochure</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPropertyId(prop.id);
                              }}
                              className="px-2.5 py-1 bg-[#0073E6] text-white text-[11px] font-bold rounded-lg hover:bg-[#005BB5] transition-colors cursor-pointer shadow-2xs"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Table Footer / Pagination */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>
                      Showing <strong className="text-slate-800 tabular-nums">{filteredProperties.length}</strong> of{' '}
                      <strong className="text-slate-800 tabular-nums">{properties.length}</strong> property listings
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Page 1 of 1</span>
                    <div className="inline-flex rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold cursor-not-allowed">
                        Previous
                      </button>
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold border-l border-slate-200/80 cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 4: VISITS & WHATSAPP REMINDERS                            */}
          {/* ============================================================== */}
          {activeSection === 'VISITS' && (
            <div className="space-y-4">
              {/* Module Header & Operational Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#172033]">Site Visits & Escorts</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('visits')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduleVisitOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0073E6] text-white text-xs font-bold shadow-xs hover:bg-[#005BB5] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Schedule Visit</span>
                  </button>
                </div>
              </div>

              {/* Operational KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setVisitStatusFilter('ALL')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    visitStatusFilter === 'ALL'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Scheduled</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{visits.length}</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">All tour bookings</span>
                </div>

                <div
                  onClick={() => setVisitStatusFilter('SCHEDULED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    visitStatusFilter === 'SCHEDULED'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Upcoming / Active</span>
                  <div className="text-2xl font-bold text-[#0073E6] mt-0.5">
                    {visits.filter(v => v.status === 'SCHEDULED').length}
                  </div>
                  <span className="text-[10px] text-[#0073E6] font-semibold mt-0.5 block">Pending execution</span>
                </div>

                <div
                  onClick={() => setVisitStatusFilter('COMPLETED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    visitStatusFilter === 'COMPLETED'
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed Tours</span>
                  <div className="text-2xl font-bold text-emerald-800 mt-0.5">
                    {visits.filter(v => v.status === 'COMPLETED').length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Verified viewings</span>
                </div>

                <div
                  onClick={() => setVisitStatusFilter('CANCELLED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    visitStatusFilter === 'CANCELLED'
                      ? 'bg-slate-100 border-slate-500 ring-1 ring-slate-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cancelled</span>
                  <div className="text-2xl font-bold text-slate-700 mt-0.5">
                    {visits.filter(v => v.status === 'CANCELLED' || v.status === 'RESCHEDULED').length}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Rescheduled or void</span>
                </div>
              </div>

              {/* Dedicated Search & Filter Control Bar */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search visits by client name, phone, property title, locality..."
                    value={visitSearch}
                    onChange={(e) => setVisitSearch(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0073E6] focus:outline-hidden"
                  />
                  {visitSearch && (
                    <button
                      type="button"
                      onClick={() => setVisitSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
                    <select
                      value={visitStatusFilter}
                      onChange={(e) => setVisitStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Visits</option>
                      <option value="SCHEDULED">Scheduled</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                    </select>
                  </div>

                  {(visitStatusFilter !== 'ALL' || visitSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setVisitStatusFilter('ALL');
                        setVisitSearch('');
                      }}
                      className="text-[#0073E6] hover:underline text-xs font-bold px-2 py-1 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Visits Data Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Client Name</th>
                      <th className="py-3.5 px-4">Contact Phone</th>
                      <th className="py-3.5 px-4">Target Property</th>
                      <th className="py-3.5 px-4">Scheduled Date & Time</th>
                      <th className="py-3.5 px-4">Assigned Escort</th>
                      <th className="py-3.5 px-4">Visit Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVisits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-xs">
                          <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700">No site visits match the filter criteria.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the status filter or clearing your search term.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredVisits.map((visit) => (
                        <tr key={visit.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200/60 text-[#0073E6] flex items-center justify-center font-bold text-xs shrink-0">
                                {visit.client_name ? visit.client_name[0] : 'V'}
                              </div>
                              <span className="font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors">{visit.client_name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {visit.client_phone}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-semibold text-slate-900">{visit.property_title || 'Unit viewing'}</div>
                            <div className="text-[10px] text-slate-400">{visit.property_locality}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{formatReadableDate(visit.visit_date)}</span>
                            <span className="text-slate-500 ml-1.5 font-medium tabular-nums">{formatReadableTime(visit.visit_time)}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {visit.assigned_staff_name ? (
                              <span className="font-medium text-slate-800">{visit.assigned_staff_name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                visit.status === 'SCHEDULED'
                                  ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60'
                                  : visit.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                              }`}
                            >
                              {visit.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {visit.status === 'SCHEDULED' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsAppReminder(visit.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-lg transition-colors cursor-pointer border border-emerald-200/60 shadow-2xs"
                                >
                                  WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateVisitStatus(visit.id, 'COMPLETED')}
                                  className="px-2.5 py-1 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                                >
                                  Mark Done
                                </button>
                              </>
                            )}
                            {visit.status === 'COMPLETED' && (
                              <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Visited
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Table Footer / Pagination */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>
                      Showing <strong className="text-slate-800 tabular-nums">{filteredVisits.length}</strong> of{' '}
                      <strong className="text-slate-800 tabular-nums">{visits.length}</strong> site visits
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Page 1 of 1</span>
                    <div className="inline-flex rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold cursor-not-allowed">
                        Previous
                      </button>
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold border-l border-slate-200/80 cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 5: FORMAL OFFERS & NEGOTIATIONS                           */}
          {/* ============================================================== */}
          {activeSection === 'OFFERS' && (
            <div className="space-y-4">
              {/* Module Header & Operational Context */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#172033]">Offers & Negotiations</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('offers')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRecordOfferOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0073E6] text-white text-xs font-bold shadow-xs hover:bg-[#005BB5] cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Offer</span>
                  </button>
                </div>
              </div>

              {/* Operational KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div
                  onClick={() => setOfferStatusFilter('ALL')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    offerStatusFilter === 'ALL'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Offers</span>
                  <div className="text-2xl font-bold text-slate-900 mt-0.5">{offers.length}</div>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">All proposals</span>
                </div>

                <div
                  onClick={() => setOfferStatusFilter('PENDING_REVIEW')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    offerStatusFilter === 'PENDING_REVIEW'
                      ? 'bg-amber-50/50 border-amber-500 ring-1 ring-amber-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending Diligence</span>
                  <div className="text-2xl font-bold text-amber-800 mt-0.5">
                    {offers.filter(o => o.status === 'PENDING_REVIEW').length}
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Awaiting review</span>
                </div>

                <div
                  onClick={() => setOfferStatusFilter('COUNTER_OFFERED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    offerStatusFilter === 'COUNTER_OFFERED'
                      ? 'bg-blue-50/50 border-[#0073E6] ring-1 ring-[#0073E6]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">In Negotiation</span>
                  <div className="text-2xl font-bold text-[#0073E6] mt-0.5">
                    {offers.filter(o => o.status === 'COUNTER_OFFERED').length}
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Counter-offered</span>
                </div>

                <div
                  onClick={() => setOfferStatusFilter('ACCEPTED')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    offerStatusFilter === 'ACCEPTED'
                      ? 'bg-emerald-50/50 border-emerald-500 ring-1 ring-emerald-500/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Accepted Deals</span>
                  <div className="text-2xl font-bold text-emerald-800 mt-0.5">
                    {offers.filter(o => o.status === 'ACCEPTED').length}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Agreement reached</span>
                </div>
              </div>

              {/* Dedicated Search & Filter Control Bar */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search offers by buyer name, phone, property title..."
                    value={offerSearch}
                    onChange={(e) => setOfferSearch(e.target.value)}
                    className="w-full bg-slate-50/70 border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[#0073E6] focus:outline-hidden"
                  />
                  {offerSearch && (
                    <button
                      type="button"
                      onClick={() => setOfferSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="text-slate-400 text-[11px] font-semibold">Status:</span>
                    <select
                      value={offerStatusFilter}
                      onChange={(e) => setOfferStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="ALL">All Offers</option>
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="COUNTER_OFFERED">Counter-Offered</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  {(offerStatusFilter !== 'ALL' || offerSearch) && (
                    <button
                      type="button"
                      onClick={() => {
                        setOfferStatusFilter('ALL');
                        setOfferSearch('');
                      }}
                      className="text-[#0073E6] hover:underline text-xs font-bold px-2 py-1 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Offers Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Property Unit</th>
                      <th className="py-3.5 px-4">Buyer Contact</th>
                      <th className="py-3.5 px-4">Asking Price</th>
                      <th className="py-3.5 px-4">Buyer Offer</th>
                      <th className="py-3.5 px-4">Owner Min Price</th>
                      <th className="py-3.5 px-4">Offer Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOffers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400 text-xs">
                          <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-semibold text-slate-700">No offers recorded under this filter.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the status filter or clearing your search query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredOffers.map((offer) => (
                        <tr key={offer.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors truncate max-w-[200px]">
                              {offer.property_title || 'Apartment Unit'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{offer.id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{offer.buyer_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{offer.buyer_phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {offer.asking_price_inr ? `₹${(offer.asking_price_inr / 10000000).toFixed(2)} Cr` : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            ₹{(offer.offer_amount_inr / 10000000).toFixed(2)} Cr
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-emerald-700">
                              {canSeeReservePrice
                                ? offer.reserve_minimum_price_inr
                                  ? `₹${(offer.reserve_minimum_price_inr / 10000000).toFixed(2)} Cr`
                                  : 'Protected'
                                : '[RESTRICTED]'}
                            </strong>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                offer.status === 'ACCEPTED'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  : offer.status === 'COUNTER_OFFERED'
                                  ? 'bg-blue-50 text-[#0073E6] border border-blue-200/60'
                                  : offer.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200/60'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                              }`}
                            >
                              {offer.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {offer.status === 'PENDING_REVIEW' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOfferStatus(offer.id, 'REJECTED')}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg cursor-pointer shadow-2xs"
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
                                  className="px-2.5 py-1 bg-[#0073E6] hover:bg-[#005BB5] text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-2xs"
                                >
                                  Counter
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOfferStatus(offer.id, 'ACCEPTED')}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-2xs"
                                >
                                  Accept
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Table Footer / Pagination */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>
                      Showing <strong className="text-slate-800 tabular-nums">{filteredOffers.length}</strong> of{' '}
                      <strong className="text-slate-800 tabular-nums">{offers.length}</strong> purchase offers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Page 1 of 1</span>
                    <div className="inline-flex rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold cursor-not-allowed">
                        Previous
                      </button>
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold border-l border-slate-200/80 cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 6: TASKS & FOLLOW-UPS (WORKBENCH & KANBAN)                 */}
          {/* ============================================================== */}
          {activeSection === 'TASKS' && (
            <TasksKanbanModule
              tasks={tasks}
              leads={leads}
              onOpenLead={(id) => setSelectedLeadId(id)}
              onRescheduleLead={async (leadId, dateStr, timeStr) => {
                await handleScheduleFollowUpWithDateTime(leadId, dateStr, timeStr);
              }}
              onMarkLeadContacted={async (leadId) => {
                await handleUpdateLeadStatus(leadId, 'CONTACTED');
              }}
            />
          )}

          {/* ============================================================== */}
          {/* VIEW 7: CALENDAR MODULE (MONTH, WEEK, DAY, AGENDA)             */}
          {/* ============================================================== */}
          {activeSection === 'CALENDAR' && (
            <CalendarModule
              visits={visits}
              tasks={tasks}
              staffList={staffList}
              onOpenLead={(id) => setSelectedLeadId(id)}
              onOpenProperty={(id) => setSelectedPropertyId(id)}
              onScheduleVisit={() => setIsScheduleVisitOpen(true)}
              onSendWhatsAppReminder={handleSendWhatsAppReminder}
              onUpdateVisitStatus={handleUpdateVisitStatus}
            />
          )}

          {/* ============================================================== */}
          {/* VIEW 8: EMPLOYEE DIRECTORY & ADMINISTRATION                    */}
          {/* ============================================================== */}
          {/* ============================================================== */}
          {/* VIEW 8: RELATIONSHIP MANAGERS & OPERATIONS DIRECTORY           */}
          {/* ============================================================== */}
          {activeSection === 'TEAM' && canSeeTeam && (() => {
            const activeStaffCount = staffList.filter(s => s.isActive !== false).length;
            const scheduledVisitsCount = visits.filter(v => v.status === 'SCHEDULED').length;
            const filteredStaff = staffList.filter((staff) => {
              if (staffStatusFilter === 'ACTIVE' && staff.isActive === false) return false;
              if (staffStatusFilter === 'DEACTIVATED' && staff.isActive !== false) return false;
              if (staffSearchQuery.trim()) {
                const q = staffSearchQuery.toLowerCase();
                const nameMatches = (staff.displayName || '').toLowerCase().includes(q);
                const emailMatches = (staff.email || '').toLowerCase().includes(q);
                const phoneMatches = (staff.phone || '').toLowerCase().includes(q);
                return nameMatches || emailMatches || phoneMatches;
              }
              return true;
            });

            return (
              <div className="space-y-4">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-[#172033] font-['Montserrat']">
                      Relationship Managers & Staff Directory
                    </h2>
                    <p className="text-xs text-slate-500 font-['Poppins'] mt-0.5">
                      Institutional directory, operational assignments, and account authorization desk.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0073E6] text-white text-xs font-bold shadow-xs hover:bg-[#005BB5] transition-colors cursor-pointer shrink-0 font-['Montserrat']"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Staff Member</span>
                  </button>
                </div>

                {/* Institutional KPI Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                      Registered Staff
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums font-['Montserrat']">
                      {staffList.length}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Total operations team</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                      Active RMs
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums font-['Montserrat']">
                      {activeStaffCount}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Authorized for CRM</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                      Managed Leads
                    </span>
                    <div className="text-xl font-extrabold text-[#0073E6] mt-0.5 tabular-nums font-['Montserrat']">
                      {leads.length}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Active client pipelines</span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-['Montserrat']">
                      Scheduled Tours
                    </span>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5 tabular-nums font-['Montserrat']">
                      {scheduledVisitsCount}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Escorted site visits</span>
                  </div>
                </div>

                {/* Operations Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      placeholder="Filter by name, corporate email, or mobile..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#0073E6] focus:border-[#0073E6]"
                    />
                  </div>
                  <div className="flex items-center space-x-1 shrink-0 text-xs font-['Montserrat']">
                    <button
                      type="button"
                      onClick={() => setStaffStatusFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        staffStatusFilter === 'ALL'
                          ? 'bg-[#172033] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All ({staffList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffStatusFilter('ACTIVE')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        staffStatusFilter === 'ACTIVE'
                          ? 'bg-[#0073E6] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Active ({activeStaffCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStaffStatusFilter('DEACTIVATED')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        staffStatusFilter === 'DEACTIVATED'
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Deactivated ({staffList.length - activeStaffCount})
                    </button>
                  </div>
                </div>

                {/* High-density Institutional Table */}
                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-['Montserrat']">
                      <tr>
                        <th className="py-3 px-4">Relationship Manager</th>
                        <th className="py-3 px-4">Corporate Email</th>
                        <th className="py-3 px-4">Direct Contact</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Assigned Leads</th>
                        <th className="py-3 px-4 text-right">Desk Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStaff.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-700">No team members match your criteria.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your search query or status filter.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStaff.map((staff) => {
                          const currentUserId = staffUser?.id || staffUser?.uid;
                          const isSelf = staff.id === currentUserId;
                          const isLastActive = activeStaffCount <= 1 && staff.isActive !== false;
                          const initials = (staff.displayName || staff.email || 'RM')
                            .split(' ')
                            .map((p) => p[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-7 h-7 rounded-lg bg-[#172033] text-white flex items-center justify-center font-bold text-[11px] shrink-0 font-['Montserrat']">
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 block truncate font-['Montserrat']">
                                      {staff.displayName}
                                    </span>
                                    {isSelf && (
                                      <span className="text-[10px] text-[#0073E6] font-bold block">
                                        (Current Account)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                                {staff.email}
                              </td>
                              <td className="py-3 px-4 text-slate-600 font-mono tabular-nums text-[11px]">
                                {staff.phone || '—'}
                              </td>
                              <td className="py-3 px-4">
                                {staff.isActive !== false ? (
                                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>Active</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                    <span>Deactivated</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                                {leads.filter(l => l.assignedStaffId === staff.id).length}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditUser(staff)}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                                    title="Edit employee details"
                                  >
                                    Edit
                                  </button>

                                  {staff.isActive !== false ? (
                                    <button
                                      type="button"
                                      disabled={isSelf || isLastActive}
                                      onClick={() => setConfirmDialog({ isOpen: true, type: 'DEACTIVATE', targetStaff: staff })}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-50 text-amber-800 rounded-lg transition-colors cursor-pointer border border-amber-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                      title={isSelf ? 'Cannot deactivate yourself' : isLastActive ? 'Cannot deactivate the last active employee' : 'Deactivate employee account'}
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDialog({ isOpen: true, type: 'ACTIVATE', targetStaff: staff })}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 rounded-lg transition-colors cursor-pointer border border-emerald-200 shadow-2xs"
                                      title="Reactivate employee account"
                                    >
                                      Activate
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={isSelf || isLastActive}
                                    onClick={() => setConfirmDialog({ isOpen: true, type: 'REMOVE', targetStaff: staff })}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-rose-50 text-rose-700 rounded-lg transition-colors cursor-pointer border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                    title={isSelf ? 'Cannot remove yourself' : isLastActive ? 'Cannot remove the last active employee' : 'Permanently remove employee'}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {/* Table Footer / Summary */}
                  <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-medium">
                    <div>
                      Showing <strong className="text-slate-800 tabular-nums">{filteredStaff.length}</strong> of{' '}
                      <strong className="text-slate-800 tabular-nums">{staffList.length}</strong> team members
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Standard operational permissions active across all authenticated staff.
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* VIEW 9: REPORTS & OPERATIONAL ANALYTICS                        */}
          {/* ============================================================== */}
          {activeSection === 'REPORTS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#172033]">Reports & Analytics</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsv('leads')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Leads CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('visits')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Visits CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('offers')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Offers CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExportCsv('properties')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>Properties CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
                  <div className="text-3xl font-bold text-slate-900 mt-1">
                    {reportsData?.totalLeads ?? leads.length}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Verified seller & buyer inquiries</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conversion Rate</span>
                  <div className="text-3xl font-bold text-emerald-800 mt-1">
                    {reportsData?.overallConversionRate ?? '0.0'}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Converted leads / Total leads</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Site Visits</span>
                  <div className="text-3xl font-bold text-blue-900 mt-1">
                    {reportsData?.totalVisits ?? visits.length}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Completed & scheduled viewings</p>
                </div>
              </div>

              {/* Pipeline Stage Distribution Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
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
                            className="bg-[#0073E6] h-2 rounded-full transition-all duration-300"
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
          {/* VIEW 10: AUDIT LOGS                                            */}
          {/* ============================================================== */}
          {activeSection === 'AUDIT' && canSeeAudit && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#172033]">Security & Audit Logs</h2>
              </div>

              {/* Audit Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">Actor Role</th>
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Target Entity</th>
                      <th className="py-3.5 px-4">IP Address</th>
                      <th className="py-3.5 px-4">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-sans">
                          No audit log entries recorded.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60">
                          <td className="py-3.5 px-4 text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {log.actor_role}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {log.target_entity}:{log.target_entity_id?.slice(0, 10)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">{log.client_ip}</td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate font-sans">
                            {typeof log.diff_summary === 'object'
                              ? JSON.stringify(log.diff_summary)
                              : String(log.diff_summary || '—')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Table Footer / Pagination */}
                <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>
                      Showing <strong className="text-slate-800 tabular-nums">{auditLogs.length}</strong> immutable audit records
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">Page 1 of 1</span>
                    <div className="inline-flex rounded-lg border border-slate-200/80 shadow-2xs overflow-hidden">
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold cursor-not-allowed">
                        Previous
                      </button>
                      <button disabled className="px-2.5 py-1 bg-white text-slate-300 text-xs font-semibold border-l border-slate-200/80 cursor-not-allowed">
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* DPDP Section 12 Erasure Queue */}
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-900 mb-3">DPDP Section 12 Erasure Queue</h3>
                <AdminErasureQueue />
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 11: SETTINGS                                              */}
          {/* ============================================================== */}
          {activeSection === 'SETTINGS' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#172033]">Settings & Content Operations</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Configure system security, hero banners, and notification email templates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0073E6] text-white text-xs font-bold shadow-xs hover:bg-[#005BB5] cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Employee Account</span>
                </button>
              </div>

              {/* Sub-Tab Navigation Switcher */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setSettingsTab('SECURITY')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'SECURITY'
                      ? 'bg-[#0073E6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  System & Security
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('HERO_CMS')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'HERO_CMS'
                      ? 'bg-[#0073E6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Hero Banner CMS
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('PARTNER_CMS')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'PARTNER_CMS'
                      ? 'bg-[#0073E6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Partner Logos CMS
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('CAREERS_CMS')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'CAREERS_CMS'
                      ? 'bg-[#0073E6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Careers & Talent CMS
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('EMAIL_TEMPLATE')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'EMAIL_TEMPLATE'
                      ? 'bg-[#0073E6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Publication Email & SMTP
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsTab('SUGGESTIONS_CSV')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settingsTab === 'SUGGESTIONS_CSV'
                      ? 'bg-[#0073E6] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Property Suggestions (CSV)
                </button>
              </div>

              {settingsTab === 'HERO_CMS' && (
                <HeroCmsManager />
              )}

              {settingsTab === 'PARTNER_CMS' && (
                <PartnerLogosManager />
              )}

              {settingsTab === 'CAREERS_CMS' && (
                <CareerCmsManager />
              )}

              {settingsTab === 'EMAIL_TEMPLATE' && (
                <PublicationEmailManager />
              )}

              {settingsTab === 'SUGGESTIONS_CSV' && (
                <PropertySuggestionsManager />
              )}

              {settingsTab === 'SECURITY' && (
                <div className="space-y-6">
                  {/* Operator Profile */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
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
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          WhatsApp Business API Integration
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        UNCONFIGURED
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Automated site visit reminders require valid <code>WHATSAPP_API_TOKEN</code> and <code>WHATSAPP_PHONE_NUMBER_ID</code> environment credentials.
                    </p>
                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-200 font-mono">
                      WHATSAPP_API_TOKEN: [MISSING IN ENVIRONMENT]<br />
                      WHATSAPP_PHONE_NUMBER_ID: [MISSING IN ENVIRONMENT]
                    </div>
                    <p className="text-[11px] text-slate-400">
                      When unconfigured, reminder actions gracefully report status and log administrative audit events without simulating message delivery.
                    </p>
                  </div>

                  {/* Database & Security Posture */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
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
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER: REDESIGNED CUSTOMER DETAIL WORKFLOW         */}
      {/* ============================================================== */}
      {selectedLeadId && (
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedLeadId(null)}
        >
          <div 
            className="w-full max-w-lg lg:max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200/80 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-full bg-[#0073E6] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {((leadDetailData?.lead?.displayName || leadDetailData?.lead?.owner_name || leadDetailData?.lead?.ownerName || leadDetailData?.lead?.buyer_name || leadDetailData?.lead?.name || 'C'))[0]}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-[#172033]">
                      {leadDetailData?.lead?.displayName || leadDetailData?.lead?.owner_name || leadDetailData?.lead?.ownerName || leadDetailData?.lead?.buyer_name || leadDetailData?.lead?.name || 'Customer Details'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0073E6]">
                      {leadDetailData?.lead?.type || 'SELLER'}
                    </span>
                    {(() => {
                      const src = leadDetailData?.lead?.source || leadDetailData?.lead?.attribution?.source || (leadDetailData?.lead?.notes?.includes('99acres') ? '99acres' : 'SellMyGhar');
                      const is99 = src.toLowerCase().includes('99acres');
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${is99 ? 'bg-amber-50 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'}`}>
                          {src}
                        </span>
                      );
                    })()}
                    {(leadDetailData?.lead?.lead_status === 'NEW' || leadDetailData?.lead?.stage === 'NEW') && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0073E6] text-white shadow-xs">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{selectedLeadId}</span>
                </div>
              </div>

              {/* Header Quick Contact Actions */}
              <div className="flex items-center space-x-2">
                {leadDetailData?.lead?.phone && (
                  <>
                    <a
                      href={`tel:${leadDetailData.lead.phone}`}
                      title="Call customer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`https://wa.me/${leadDetailData.lead.phone.replace(/[^0-9]/g, '')}`, '_blank');
                      }}
                      title="Open WhatsApp chat"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLeadId(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body - Fluid Workflow without nested cards */}
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
                    onClick={() => {
                      if (selectedLeadId) {
                        const lid = selectedLeadId;
                        setSelectedLeadId(null);
                        setTimeout(() => setSelectedLeadId(lid), 50);
                      }
                    }}
                    className="px-4 py-2 bg-[#0073E6] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer hover:bg-[#005BB5]"
                  >
                    Retry
                  </button>
                </div>
              ) : !leadDetailData ? (
                <div className="py-16 text-center text-slate-400">Customer record not found.</div>
              ) : (
                <>
                  {/* 1. Quick Requirements & Contact Strip */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Budget / Expected</span>
                        <strong className="text-slate-900 font-bold text-sm">
                          {leadDetailData.lead.expected_price_inr
                            ? `₹${(Number(leadDetailData.lead.expected_price_inr) / 10000000).toFixed(2)} Cr`
                            : 'Market'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">BHK Configuration</span>
                        <strong className="text-slate-900 font-bold text-sm">
                          {leadDetailData.lead.bhk_type || '2 BHK'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Society / Project</span>
                        <strong className="text-slate-900 font-bold text-sm truncate block">
                          {leadDetailData.lead.apartment_society_name || 'Sobha'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Phone Number</span>
                        <strong className="text-slate-900 font-mono text-xs block mt-0.5">
                          {leadDetailData.lead.phone}
                        </strong>
                      </div>
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
                          value={leadDetailData.lead.lead_status}
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
                              {s.displayName || s.email} • {s.roles?.join(', ')}
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
                      {leadDetailData.lead.next_follow_up_at && (
                        <span className="text-[10px] font-bold text-[#0073E6] tabular-nums">
                          Due: {formatReadableDate(leadDetailData.lead.next_follow_up_at)} at {formatReadableTime(leadDetailData.lead.next_follow_up_at)}
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
                      const raw = leadDetailData.lead.notes || '';
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
                          {/* Structured Inbound Ingestion Payload Table */}
                          {sourceLines.map((sLine, sIdx) => {
                            const parts = sLine.split('|').map((p: string) => p.trim());
                            const kvList: Array<{ label: string; value: string }> = [];
                            for (const p of parts) {
                              if (p.includes(':')) {
                                const idx = p.indexOf(':');
                                const k = p.substring(0, idx).replace(/[\[\]]/g, '').trim();
                                const v = p.substring(idx + 1).replace(/[\[\]]/g, '').trim();
                                kvList.push({ label: k, value: v });
                              }
                            }

                            return (
                              <div key={`src-${sIdx}`} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 shadow-2xs">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                                  <span className="flex items-center space-x-1.5">
                                    <Layers className="w-3 h-3 text-[#0073E6]" />
                                    <span>Inbound Ingestion Payload</span>
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold">
                                    External Webhook
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                  {kvList.map((kv, kIdx) => (
                                    <div key={kIdx} className={`bg-white p-2 rounded-lg border border-slate-100 ${kv.label.toLowerCase() === 'message' ? 'sm:col-span-2' : ''}`}>
                                      <span className="text-[10px] font-medium text-slate-400 block">{kv.label}</span>
                                      <span className="font-semibold text-slate-800 break-words">{kv.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}

                          {/* Interaction Call Notes with Dividers and Timestamps */}
                          {interactionNotes.length > 0 && (
                            <div className="space-y-2.5">
                              {interactionNotes.map((note, nIdx) => (
                                <div key={`note-${nIdx}`} className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
                                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px]">
                                    <div className="flex items-center space-x-1.5">
                                      <div className="w-5 h-5 rounded-full bg-blue-100/70 text-[#0073E6] flex items-center justify-center font-bold text-[10px]">
                                        {note.author[0] || 'U'}
                                      </div>
                                      <strong className="text-slate-900 font-semibold">{note.author}</strong>
                                    </div>
                                    {note.formattedTime && (
                                      <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
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
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lead Attribution & Platform Metadata */}
                  {(leadDetailData.lead.attribution || (leadDetailData.lead.notes && leadDetailData.lead.notes.includes('99acres'))) && (
                    <div className="border-t border-slate-100 pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Inbound Source & Listing Metadata
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          99acres Real-Time Webhook
                        </span>
                      </div>
                      <div className="bg-amber-50/40 rounded-2xl p-3.5 border border-amber-200/60 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">99acres External Lead ID:</span>
                            <span className="font-mono text-slate-800 font-semibold">{leadDetailData.lead.attribution?.externalEnquiryId || leadDetailData.lead.attribution?.rawPayload?.lead_id || 'Captured via Webhook'}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">99acres Listing ID:</span>
                            <span className="font-mono text-slate-800 font-semibold">{leadDetailData.lead.attribution?.externalListingId || leadDetailData.lead.attribution?.rawPayload?.propertyid || 'M95305496'}</span>
                          </div>
                          {leadDetailData.lead.attribution?.rawPayload?.projectid && (
                            <div>
                              <span className="text-slate-500 block text-[10px]">Project ID:</span>
                              <span className="font-mono text-slate-800">{leadDetailData.lead.attribution.rawPayload.projectid}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-500 block text-[10px]">Inquiry Timestamp:</span>
                            <span className="text-slate-800 font-medium">{leadDetailData.lead.attribution?.enquiryDate ? new Date(leadDetailData.lead.attribution.enquiryDate).toLocaleString() : 'Today'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matching Property Suggestions for Buyer */}
                  {leadDetailData.lead.type === 'BUYER' && (
                    <div className="border-t border-slate-100 pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#0073E6]" />
                          <span>Matching Property Suggestions</span>
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Suggested for {leadDetailData.lead.bhk_type || '3 BHK'}
                        </span>
                      </div>

                      {(() => {
                        const targetBhk = (leadDetailData.lead.bhk_type || '').toLowerCase().replace(/\s+/g, '');
                        const matching = properties.filter(p => {
                          if (p.listing_status === 'SOLD' || p.status === 'SOLD') return false;
                          if (targetBhk && p.bhkType && p.bhkType.toLowerCase().replace(/\s+/g, '').includes(targetBhk.replace('bhk', ''))) return true;
                          return false;
                        }).slice(0, 3);

                        const displayList = matching.length > 0 ? matching : properties.slice(0, 3);

                        if (displayList.length === 0) {
                          return <p className="text-slate-400 italic text-[11px]">No active inventory available to suggest.</p>;
                        }

                        return (
                          <div className="space-y-2">
                            {displayList.map(prop => {
                              const askingCr = prop.askingPriceInr ? (prop.askingPriceInr / 10000000).toFixed(2) : null;
                              const shareText = encodeURIComponent(`Hello ${leadDetailData.lead.displayName || leadDetailData.lead.buyer_name || 'there'}, here is a verified apartment matching your requirement:\n*${prop.projectName || prop.title || 'Apartment'}*\n${prop.bhkType || 'Apartment'} • ₹${askingCr} Cr\nLocality: ${prop.localityName || 'Bengaluru'}\nVerified by SellMyGhar.`);
                              return (
                                <div key={prop.id} className="p-3 bg-white rounded-xl border border-slate-200/80 hover:border-[#0073E6] transition-all shadow-2xs flex items-center justify-between">
                                  <div className="min-w-0 pr-2">
                                    <div className="flex items-center space-x-2">
                                      <strong className="text-slate-900 truncate block text-xs">{prop.projectName || prop.title || 'Resale Apartment'}</strong>
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-[#0073E6]">{prop.bhkType}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      {prop.localityName || 'Bengaluru'} • {askingCr ? `₹${askingCr} Cr` : 'Market Price'}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0">
                                    <a
                                      href={`https://wa.me/${(leadDetailData.lead.phone || '').replace(/[^0-9]/g, '')}?text=${shareText}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[10px] transition-colors inline-flex items-center space-x-1"
                                    >
                                      <span>WhatsApp</span>
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* 5. Related Site Visits */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Related Site Visits ({leadDetailData.visits.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleVisitForm(prev => ({
                            ...prev,
                            leadId: selectedLeadId,
                            clientName: leadDetailData.lead.displayName || leadDetailData.lead.owner_name || leadDetailData.lead.name || leadDetailData.lead.buyer_name || '',
                            clientPhone: leadDetailData.lead.phone || '',
                            propertyId: leadDetailData.lead.property_id || properties[0]?.id || ''
                          }));
                          setIsScheduleVisitOpen(true);
                        }}
                        className="text-[11px] font-bold text-[#0073E6] hover:underline cursor-pointer"
                      >
                        + Schedule Visit
                      </button>
                    </div>

                    {leadDetailData.visits.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No visits recorded for this customer.</p>
                    ) : (
                      <div className="space-y-2">
                        {leadDetailData.visits.map((v: any) => (
                          <div key={v.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900 block">{formatReadableDate(v.visit_date)} at {formatReadableTime(v.visit_time)}</strong>
                              <span className="text-[10px] text-slate-500">{v.status}</span>
                            </div>
                            {v.status === 'SCHEDULED' && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppReminder(v.id)}
                                className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[10px] rounded-lg"
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
                  {leadDetailData.property && (
                    <div className="border-t border-slate-100 pt-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Property Documents ({leadDetailData.documents.length})
                        </h4>
                        <span className="text-[10px] text-[#0073E6] font-bold">
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
                        Related Purchase Offers ({leadDetailData.offers ? leadDetailData.offers.length : 0})
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordOfferForm(prev => ({
                            ...prev,
                            leadId: selectedLeadId,
                            propertyId: leadDetailData.lead.property_id || properties[0]?.id || '',
                            buyerName: leadDetailData.lead.type === 'BUYER' ? (leadDetailData.lead.displayName || leadDetailData.lead.buyer_name || leadDetailData.lead.owner_name || leadDetailData.lead.name || '') : '',
                            buyerPhone: leadDetailData.lead.type === 'BUYER' ? (leadDetailData.lead.phone || '') : ''
                          }));
                          setIsRecordOfferOpen(true);
                        }}
                        className="text-[11px] font-bold text-[#0073E6] hover:underline cursor-pointer"
                      >
                        + Record Offer
                      </button>
                    </div>

                    {!leadDetailData.offers || leadDetailData.offers.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No purchase offers recorded for this inquiry.</p>
                    ) : (
                      <div className="space-y-2">
                        {leadDetailData.offers.map((off: any) => (
                          <div
                            key={off.id}
                            className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <strong className="text-slate-900 font-bold text-xs">
                                  ₹{(Number(off.offer_amount_inr) / 10000000).toFixed(2)} Cr
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
                                  Counter: ₹{(Number(off.counter_offer_amount_inr) / 10000000).toFixed(2)} Cr
                                  {off.counter_offer_note && ` — ${off.counter_offer_note}`}
                                </p>
                              )}
                            </div>
                            {off.status === 'PENDING_REVIEW' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLeadId(null);
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
                      Audit Trail & Timeline ({leadDetailData.auditLogs ? leadDetailData.auditLogs.length : 0})
                    </h4>
                    {!leadDetailData.auditLogs || leadDetailData.auditLogs.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No previous audit events recorded.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {leadDetailData.auditLogs.slice(0, 10).map((log: any) => (
                          <div
                            key={log.id}
                            className="p-2 bg-slate-50/60 rounded-lg border border-slate-100 text-[11px] flex items-center justify-between"
                          >
                            <div>
                              <span className="font-semibold text-slate-800">{log.action}</span>
                              <span className="text-slate-500 ml-1.5 text-[10px]">
                                by <strong className="text-slate-700 font-semibold">{log.actor_name || staffList.find(s => s.id === log.actor_user_id)?.displayName || (log.actor_user_id === 'system-webhook-99acres' ? '99acres Webhook' : (log.actor_role || log.actor_user_id))}</strong>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(log.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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
                onClick={() => setSelectedLeadId(null)}
                className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
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
        <div 
          className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
          onClick={() => setSelectedPropertyId(null)}
        >
          <div 
            className="w-full max-w-lg lg:max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200/80 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-white shrink-0">
              <div>
                <span className="font-mono text-[10px] text-slate-400">{selectedPropertyId}</span>
                <h3 className="text-base font-bold text-[#172033] mt-0.5">
                  {propertyDetailData?.property?.title || propertyDetailData?.property?.projectName || 'Property Specifications'}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBrochureModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer transition-all font-['Montserrat']"
                  title="Generate Editorial A4 Property Presentation Brochure"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Brochure</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPropertyId(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs">
              {propertyDetailLoading ? (
                <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#0073E6]" />
                  <p className="text-xs font-medium">Loading property specifications...</p>
                </div>
              ) : propertyDetailError ? (
                <div className="py-16 text-center space-y-3">
                  <p className="text-rose-600 font-semibold">{propertyDetailError}</p>
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/dev/switch-role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: currentRole || 'STAFF_SUPER_ADMIN' }),
                          });
                          const data = await res.json();
                          if (data.token) {
                            const cur = sessionStorage.getItem('sellmyghar_staff_session');
                            const parsed = cur ? JSON.parse(cur) : {};
                            sessionStorage.setItem('sellmyghar_staff_session', JSON.stringify({
                              ...parsed,
                              token: data.token,
                              user: data.user || parsed.user,
                            }));
                          }
                          showToast('Staff credentials refreshed', 'success');
                        } catch {}
                        if (selectedPropertyId) {
                          const pid = selectedPropertyId;
                          setSelectedPropertyId(null);
                          setTimeout(() => setSelectedPropertyId(pid), 50);
                        }
                      }}
                      className="px-4 py-2 bg-[#0073E6] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer hover:bg-[#005BB5]"
                    >
                      Authenticate &amp; Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPropertyId) {
                          const pid = selectedPropertyId;
                          setSelectedPropertyId(null);
                          setTimeout(() => setSelectedPropertyId(pid), 50);
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : !propertyDetailData || !propertyDetailData.property ? (
                <div className="py-16 text-center text-slate-400">Property specifications not found.</div>
              ) : (
                <>
                  {/* Property Specifications Strip */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Asking Price</span>
                        <strong className="text-slate-900 font-bold text-sm">
                          ₹{(Number(propertyDetailData.property.asking_price_inr || propertyDetailData.property.askingPriceInr) / 10000000).toFixed(2)} Cr
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Owner Min Price</span>
                        <strong className="text-emerald-700 font-bold text-sm">
                          {canSeeReservePrice
                            ? propertyDetailData.property.reserve_minimum_price_inr
                              ? `₹${(Number(propertyDetailData.property.reserve_minimum_price_inr) / 10000000).toFixed(2)} Cr`
                              : 'Owner Bottom Line'
                            : '[RESTRICTED]'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">BHK & Super Built-up</span>
                        <strong className="text-slate-900 font-bold text-sm">
                          {propertyDetailData.property.bhk_type} • {propertyDetailData.property.super_built_up_sqft} sq.ft
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">Facing & Floor</span>
                        <strong className="text-slate-900 font-bold text-sm">
                          {propertyDetailData.property.facing} • {propertyDetailData.property.floor_band || 'Mid Floor'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Owner & Linked Lead Connection */}
                  {(propertyDetailData.owner || propertyDetailData.linkedLead) && (
                    <div className="border-t border-slate-100 pt-5 space-y-3">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Owner & Linked Seller Lead
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {propertyDetailData.owner && (
                          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                            <span className="text-slate-400 text-[10px] block font-medium">Property Owner</span>
                            <strong className="text-slate-900 font-bold block">{propertyDetailData.owner.display_name}</strong>
                            <span className="text-slate-500 font-mono text-[10px]">{propertyDetailData.owner.phone}</span>
                          </div>
                        )}
                        {propertyDetailData.linkedLead && (
                          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                            <span className="text-slate-400 text-[10px] block font-medium">Linked Seller Lead</span>
                            <strong className="text-slate-900 font-bold block">{propertyDetailData.linkedLead.owner_name}</strong>
                            <span className="text-slate-500 text-[10px]">
                              Status: {propertyDetailData.linkedLead.lead_status}
                              {propertyDetailData.linkedLead.assigned_staff_name && ` • Staff: ${propertyDetailData.linkedLead.assigned_staff_name}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Verification Documents Review */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Title Verification Documents ({(propertyDetailData.documents || []).length})
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0073E6]">
                          {propertyDetailData.property.verification_tier || 'LEVEL_1_DECLARED'}
                        </span>
                        {propertyDetailData.property.verification_tier !== 'LEVEL_2_DOCS_REVIEWED' && propertyDetailData.property.verification_tier !== 'LEVEL_3_PHYSICALLY_INSPECTED' && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await crmFetch(`/api/crm/properties/${selectedPropertyId}/status`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'VERIFIED' })
                                });
                                const data = await res.json();
                                if (res.ok && data.success) {
                                  showToast('Property advanced to Verified Tier (Level 2 Due Diligence)', 'success');
                                  setPropertyDetailData((prev: any) => prev ? {
                                    ...prev,
                                    property: { ...prev.property, verification_tier: 'LEVEL_2_DOCS_REVIEWED', crm_status: 'APPROVED' }
                                  } : prev);
                                  refreshAll();
                                } else {
                                  showToast(data.message || 'Verification update failed', 'error');
                                }
                              } catch {
                                showToast('Network error during verification', 'error');
                              }
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg cursor-pointer flex items-center space-x-1"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Verify Property</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Verification Model Explanatory Banner */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-[11px]">
                        <Info className="w-3.5 h-3.5 text-[#0073E6]" />
                        <span>Title Verification Framework</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                          <strong className="text-slate-800 block">L1: Declared</strong>
                          Seller-uploaded deed copies.
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                          <strong className="text-blue-900 block">L2: Due Diligence</strong>
                          Verified tax receipts & EC review.
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                          <strong className="text-emerald-900 block">L3: Certified</strong>
                          Advocate clearance certificate.
                        </div>
                      </div>
                    </div>

                    {(propertyDetailData.documents || []).length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No documents uploaded for review.</p>
                    ) : (
                      <div className="space-y-2">
                        {(propertyDetailData.documents || []).map((doc: any) => (
                          <div
                            key={doc.id}
                            className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-2 shadow-2xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <strong className="text-slate-900 text-xs block truncate max-w-[220px]">
                                  {doc.file_name}
                                </strong>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Category: {doc.doc_type || 'Title Deed'} • Uploaded: {formatReadableDate(doc.created_at)}
                                </span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
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

                            {doc.discrepancy_note && (
                              <div className="p-2 bg-rose-50/70 border border-rose-200/60 rounded-lg text-[10px] text-rose-800">
                                <strong>Discrepancy Note:</strong> {doc.discrepancy_note}
                              </div>
                            )}

                            <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-100">
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

                  {/* Scheduled Visits for this Property */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Scheduled Visits ({(propertyDetailData.visits || []).length})
                    </h4>
                    {(propertyDetailData.visits || []).length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No visits scheduled for this property.</p>
                    ) : (
                      <div className="space-y-2">
                        {(propertyDetailData.visits || []).map((v: any) => (
                          <div key={v.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{v.client_name}</strong>
                              <p className="text-[10px] text-slate-500">{formatReadableDate(v.visit_date)} at {formatReadableTime(v.visit_time)}</p>
                              {v.assigned_staff_name && (
                                <p className="text-[10px] text-slate-400">Assigned: {v.assigned_staff_name}</p>
                              )}
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#0073E6]">
                              {v.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recorded Buyer Offers */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Recorded Buyer Offers ({(propertyDetailData.offers || []).length})
                    </h4>
                    {(propertyDetailData.offers || []).length === 0 ? (
                      <p className="text-slate-400 italic text-[11px]">No offers submitted for this property.</p>
                    ) : (
                      <div className="space-y-2">
                        {(propertyDetailData.offers || []).map((o: any) => (
                          <div key={o.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                            <div>
                              <strong className="text-slate-900">{o.buyer_name}</strong>
                              <p className="text-[10px] text-[#0073E6] font-bold">
                                ₹{(Number(o.offer_amount_inr) / 10000000).toFixed(2)} Cr
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              o.status === 'ACCEPTED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : o.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-800'
                                : 'bg-blue-50 text-[#0073E6]'
                            }`}>
                              {o.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Related Purchase Orders & Deals */}
                  <div className="border-t border-slate-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Related Purchase Orders & Deals
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                        {(propertyDetailData.offers || []).filter((o: any) => ['ACCEPTED', 'IN_ESCROW'].includes(o.status)).length} Executed
                      </span>
                    </div>

                    {(propertyDetailData.offers || []).filter((o: any) => ['ACCEPTED', 'IN_ESCROW'].includes(o.status)).length === 0 ? (
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs text-slate-500 space-y-1">
                        <p className="font-semibold text-slate-700">No formal purchase order or deal contract executed yet.</p>
                        <p className="text-[11px] text-slate-400">
                          Purchase orders are automatically established upon formal closing and acceptance of a buyer purchase offer.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(propertyDetailData.offers || [])
                          .filter((o: any) => ['ACCEPTED', 'IN_ESCROW'].includes(o.status))
                          .map((po: any) => (
                            <div key={po.id} className="p-3 bg-blue-50/40 rounded-xl border border-blue-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#0073E6] text-[11px]">
                                  PO-SMG-{po.id.slice(-6).toUpperCase()}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {po.status === 'ACCEPTED' ? 'AGREED PURCHASE ORDER' : po.status}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-700">
                                <span>Buyer: <strong>{po.buyer_name}</strong></span>
                                <span className="font-bold text-slate-900 tabular-nums">
                                  {formatIndianCurrency(po.offer_amount_inr)}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400">
                                Created: {formatReadableDate(po.created_at)}
                              </p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsBrochureModalOpen(true)}
                className="px-4 py-2 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs font-['Montserrat']"
                title="Generate Editorial A4 Property Presentation Brochure"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Property Brochure</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = properties.find(x => x.id === selectedPropertyId);
                  if (p) {
                    setEditingProperty(p);
                    setIsPropertyEditorOpen(true);
                  }
                }}
                className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer hover:bg-slate-900"
              >
                Edit in PropertyEditor
              </button>
              <button
                type="button"
                onClick={() => setSelectedPropertyId(null)}
                className="px-4 py-2 bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-[#0073E6]" />
                <span>Schedule Buyer Site Visit</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleVisitOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Property *
                </label>
                <select
                  required
                  value={scheduleVisitForm.propertyId}
                  onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, propertyId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Visit Schedule (Date & Time) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsVisitPickerOpen(true)}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-[#0073E6] rounded-xl px-3 py-2 text-xs text-left font-semibold text-slate-800 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
                >
                  <span className="tabular-nums">
                    {scheduleVisitForm.visitDate
                      ? `${formatReadableDate(scheduleVisitForm.visitDate)} ${scheduleVisitForm.visitTime ? `at ${scheduleVisitForm.visitTime}` : ''}`
                      : 'Select Slot via Calendar Grid...'}
                  </span>
                  <Calendar className="w-4 h-4 text-[#0073E6] shrink-0" />
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium mb-0.5">Date</span>
                    <input
                      type="date"
                      required
                      value={scheduleVisitForm.visitDate}
                      onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, visitDate: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium mb-0.5">Time Slot</span>
                    <input
                      type="time"
                      required
                      value={scheduleVisitForm.visitTime}
                      onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, visitTime: e.target.value })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign Staff Escort
                </label>
                <select
                  value={scheduleVisitForm.assignedStaffId}
                  onChange={(e) => setScheduleVisitForm({ ...scheduleVisitForm, assignedStaffId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs"
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleVisitOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0073E6] text-white font-bold hover:bg-[#005BB5] cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Tag className="w-4 h-4 text-[#0073E6]" />
                <span>Record Formal Buyer Offer</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordOfferOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Property *
                </label>
                <select
                  required
                  value={recordOfferForm.propertyId}
                  onChange={(e) => setRecordOfferForm({ ...recordOfferForm, propertyId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 text-xs"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
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
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
                />
                {recordOfferForm.offerAmountInr && (
                  <span className="text-[11px] text-[#0073E6] font-bold mt-1 block">
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordOfferOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0073E6] text-white font-bold hover:bg-[#005BB5] cursor-pointer shadow-xs"
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
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-6 space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900">
              Present Counter-Offer to Buyer
            </h3>
            <p className="text-slate-500 text-[11px]">
              Buyer Offer: ₹{(counterOfferTarget.offer_amount_inr / 10000000).toFixed(2)} Cr
            </p>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Counter Amount (INR)
              </label>
              <input
                type="number"
                placeholder="e.g. 14200000 for 1.42 Cr"
                value={counterOfferAmount}
                onChange={(e) => setCounterOfferAmount(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                Counter Rationale / Terms
              </label>
              <textarea
                rows={2}
                placeholder="Seller approved concession limit..."
                value={counterOfferNote}
                onChange={(e) => setCounterOfferNote(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setCounterOfferTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateOfferStatus(counterOfferTarget.id, 'COUNTER_OFFERED', Number(counterOfferAmount) || undefined)}
                className="px-5 py-2 rounded-xl bg-[#0073E6] text-white font-bold hover:bg-[#005BB5] cursor-pointer shadow-xs"
              >
                Submit Counter-Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* MODAL: PROVISION EMPLOYEE ACCOUNT                              */}
      {/* ============================================================== */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-[#0073E6]" />
                <span>Add Employee Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={addUserForm.fullName}
                  onChange={(e) => setAddUserForm({ ...addUserForm, fullName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Corporate Email (@sellmyghar.in) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter email ID"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Must strictly belong to @sellmyghar.in domain</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 12345"
                  value={addUserForm.phone}
                  onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Password (Min 8 Characters) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••••••"
                  value={addUserForm.initialPassword}
                  onChange={(e) => setAddUserForm({ ...addUserForm, initialPassword: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                />
              </div>

              {/* Module Permissions Selection */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Module Permissions
                  </label>
                  <div className="flex items-center space-x-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() =>
                        setAddUserForm((prev) => ({
                          ...prev,
                          modules: [
                            'LEADS',
                            'PROPERTIES',
                            'VISITS',
                            'OFFERS',
                            'TASKS',
                            'CALENDAR',
                            'REPORTS',
                            'TEAM',
                            'AUDIT_LOGS',
                            'SETTINGS',
                          ],
                        }))
                      }
                      className="text-[#0073E6] hover:underline font-bold cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setAddUserForm((prev) => ({ ...prev, modules: [] }))}
                      className="text-slate-500 hover:underline font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">
                  Select which CRM sections this staff member is authorized to access:
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  {[
                    { key: 'LEADS' as CrmModule, label: 'Leads Pipeline' },
                    { key: 'PROPERTIES' as CrmModule, label: 'Properties & Inventory' },
                    { key: 'VISITS' as CrmModule, label: 'Site Visits & Tours' },
                    { key: 'OFFERS' as CrmModule, label: 'Offers & Negotiations' },
                    { key: 'TASKS' as CrmModule, label: 'Tasks & Workbench' },
                    { key: 'CALENDAR' as CrmModule, label: 'Calendar Schedule' },
                    { key: 'REPORTS' as CrmModule, label: 'Reports & Analytics' },
                    { key: 'TEAM' as CrmModule, label: 'Team Directory' },
                    { key: 'AUDIT_LOGS' as CrmModule, label: 'Audit Logs' },
                    { key: 'SETTINGS' as CrmModule, label: 'System Settings' },
                  ].map(({ key, label }) => {
                    const isChecked = addUserForm.modules.includes(key);
                    return (
                      <label
                        key={key}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-blue-50/80 border-[#0073E6]/40 text-blue-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            setAddUserForm((prev) => ({
                              ...prev,
                              modules: isChecked
                                ? prev.modules.filter((m) => m !== key)
                                : [...prev.modules, key],
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded text-[#0073E6] focus:ring-[#0073E6]"
                        />
                        <span className="truncate">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 rounded-xl bg-[#0073E6] text-white font-bold hover:bg-[#005BB5] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isCreatingUser ? 'Creating Account...' : 'Provision Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT EMPLOYEE DETAILS                                   */}
      {/* ============================================================== */}
      {editingStaffUser && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Edit className="w-4 h-4 text-[#0073E6]" />
                <span>Edit Employee: {editingStaffUser.displayName || editingStaffUser.email}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingStaffUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserPermissions} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Corporate Email
                </label>
                <input
                  type="email"
                  disabled
                  value={editingStaffUser.email}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editUserForm.displayName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, displayName: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                />
              </div>

              {/* Active Account Status Switch */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-slate-900 block">Account Status</span>
                  <span className="text-[10px] text-slate-500">
                    {editUserForm.isActive ? 'Active — Full CRM access enabled' : 'Deactivated — Login and active sessions revoked'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editUserForm.isActive}
                    onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0073E6]"></div>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingStaffUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="px-5 py-2 rounded-xl bg-[#0073E6] text-white font-bold hover:bg-[#005BB5] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isUpdatingUser ? 'Saving Changes...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRM EMPLOYEE ACTION (DEACTIVATE / ACTIVATE / REMOVE)*/}
      {/* ============================================================== */}
      {confirmDialog.isOpen && confirmDialog.targetStaff && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                confirmDialog.type === 'REMOVE' 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                  : confirmDialog.type === 'DEACTIVATE'
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {confirmDialog.type === 'REMOVE' ? (
                  <Trash2 className="w-5 h-5" />
                ) : confirmDialog.type === 'DEACTIVATE' ? (
                  <UserX className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-slate-900">
                  {confirmDialog.type === 'REMOVE'
                    ? 'Remove Employee from CRM?'
                    : confirmDialog.type === 'DEACTIVATE'
                    ? 'Deactivate Employee Account?'
                    : 'Activate Employee Account?'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {confirmDialog.type === 'REMOVE' ? (
                    <>
                      Are you sure you want to remove <strong className="text-slate-900">{confirmDialog.targetStaff.displayName || confirmDialog.targetStaff.email}</strong>?
                      Their CRM login credentials and active sessions will be terminated immediately.
                    </>
                  ) : confirmDialog.type === 'DEACTIVATE' ? (
                    <>
                      Are you sure you want to deactivate <strong className="text-slate-900">{confirmDialog.targetStaff.displayName || confirmDialog.targetStaff.email}</strong>?
                      Their active sessions will be terminated immediately and CRM sign-in will be blocked.
                    </>
                  ) : (
                    <>
                      Reactivate CRM access for <strong className="text-slate-900">{confirmDialog.targetStaff.displayName || confirmDialog.targetStaff.email}</strong>?
                      They will immediately regain standard access to all operational CRM workflows.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Operational Continuity Guarantee</span>
              <p>All past leads, properties, offers, visits, and audit trail records associated with this employee will remain permanently preserved.</p>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={() => setConfirmDialog({ isOpen: false, type: 'DEACTIVATE', targetStaff: null })}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-50 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingAction}
                onClick={handleExecuteConfirmAction}
                className={`px-5 py-2 rounded-xl text-white font-bold cursor-pointer shadow-xs disabled:opacity-50 text-xs ${
                  confirmDialog.type === 'REMOVE'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmDialog.type === 'DEACTIVATE'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#0073E6] hover:bg-[#005BB5]'
                }`}
              >
                {isProcessingAction
                  ? 'Processing...'
                  : confirmDialog.type === 'REMOVE'
                  ? 'Confirm Removal'
                  : confirmDialog.type === 'DEACTIVATE'
                  ? 'Confirm Deactivation'
                  : 'Confirm Activation'}
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
          onUpdate={() => {
            refreshAll();
          }}
          staffRole={currentRole}
        />
      )}

      {/* MODAL: FOLLOW-UP DATE & TIME PICKER                            */}
      {/* ============================================================== */}
      {isFollowUpPickerOpen && (
        <DateTimePicker
          isOpen={isFollowUpPickerOpen}
          onClose={() => setIsFollowUpPickerOpen(false)}
          title="Schedule Next Follow-Up"
          initialDate={newFollowUpDate ? newFollowUpDate.split('T')[0] : undefined}
          onConfirm={(_dateStr, _timeStr, combinedIso) => {
            setNewFollowUpDate(combinedIso);
            setIsFollowUpPickerOpen(false);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: SITE VISIT DATE & TIME PICKER                           */}
      {/* ============================================================== */}
      {isVisitPickerOpen && (
        <DateTimePicker
          isOpen={isVisitPickerOpen}
          onClose={() => setIsVisitPickerOpen(false)}
          title="Select Site Visit Slot"
          initialDate={scheduleVisitForm.visitDate || undefined}
          initialTime={scheduleVisitForm.visitTime || undefined}
          onConfirm={(dateStr, timeStr) => {
            setScheduleVisitForm(prev => ({
              ...prev,
              visitDate: dateStr,
              visitTime: timeStr
            }));
            setIsVisitPickerOpen(false);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: REJECT DOCUMENT REASON                                  */}
      {/* ============================================================== */}
      {rejectDocModal?.isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/80 bg-rose-50/50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-rose-950 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Property Document</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectDocModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <p className="text-slate-700 font-medium mb-1">
                  Document: <strong className="text-slate-900">{rejectDocModal.docName}</strong>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Provide a mandatory discrepancy note explaining why this title document cannot be legally verified.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Discrepancy / Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Encumbrance Certificate missing for period 2018-2022, unnotarized power of attorney, stamp mismatch..."
                  value={rejectDocReason}
                  onChange={(e) => setRejectDocReason(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-rose-500"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectDocModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rejectDocReason.trim()}
                  onClick={() => {
                    handleVerifyDocument(rejectDocModal.docId, 'REJECTED', rejectDocReason.trim());
                    setRejectDocModal(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold cursor-pointer shadow-xs"
                >
                  Confirm Document Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PROPERTY PRESENTATION PDF GENERATOR STUDIO             */}
      {/* ============================================================== */}
      {isBrochureModalOpen && propertyDetailData && (
        <PropertyBrochureModal
          isOpen={isBrochureModalOpen}
          onClose={() => setIsBrochureModalOpen(false)}
          propertyData={propertyDetailData}
          currentUser={staffUser}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL: MANUAL & 99ACRES LEAD INTAKE                            */}
      {/* ============================================================== */}
      {isAddLeadModalOpen && (
        <ManualLeadModal
          isOpen={isAddLeadModalOpen}
          onClose={() => setIsAddLeadModalOpen(false)}
          initialSource={addLeadInitialSource}
          initialType={addLeadInitialType}
          staffList={staffList}
          properties={properties}
          crmFetch={crmFetch}
          onLeadCreated={(newLeadId) => {
            loadLeads();
            setSelectedLeadId(newLeadId);
            showToast('Lead created successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}
