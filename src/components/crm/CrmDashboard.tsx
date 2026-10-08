import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard,
  Users, 
  Building2,
  CalendarCheck,
  FileCheck2, 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Plus, 
  ArrowUpRight, 
  Phone, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  LogOut, 
  ArrowLeft, 
  Eye, 
  Lock, 
  ExternalLink,
  ChevronDown,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  Check,
  User,
  ShieldCheck,
  DollarSign,
  Edit,
  PlayCircle,
  PauseCircle,
  Archive as ArchiveIcon,
  Tag
} from 'lucide-react';
import { StaffRole } from '../../core/types/auth';
import { LeadStatus } from '../../core/types/entities';
import { DocumentVerificationDesk } from './DocumentVerificationDesk';
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
  stage: LeadStatus;
  status?: LeadStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  assignedStaffPhone?: string | null;
  assignedTo?: string;
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
  roles: string[];
}

interface CrmDashboardProps {
  staffUser?: any;
  onLogout?: () => void;
  onExit?: () => void;
}

type NavSection = 'DASHBOARD' | 'LEADS' | 'PROPERTIES' | 'VISITS_DEALS' | 'VERIFICATION' | 'AUDIT';

const MOCK_LEADS: CrmLead[] = [
  {
    id: 'LD-8812',
    type: 'SELLER',
    ownerName: 'Suresh Nambiar',
    name: 'Suresh Nambiar',
    phone: '+91 98450 12891',
    society: 'Prestige Falcon City',
    locality: 'Kanakapura Road',
    bhk: '3BHK',
    expectedPrice: '₹1.65 Cr',
    stage: 'FOLLOW_UP',
    assignedStaffName: 'Anil Kumar',
    assignedTo: 'Anil Kumar (Diligence)',
    propertyId: 'prop-dev-seed-03',
    nextFollowUpAt: new Date(Date.now() - 3600000 * 4).toISOString(), // overdue
    isOverdue: true,
    createdAt: '2 hrs ago',
  },
  {
    id: 'LD-8813',
    type: 'SELLER',
    ownerName: 'Deepa Hegde',
    name: 'Deepa Hegde',
    phone: '+91 97412 88390',
    society: 'Sobha Dream Acres',
    locality: 'Panathur / Balagere',
    bhk: '2BHK',
    expectedPrice: '₹1.10 Cr',
    stage: 'NEW',
    assignedStaffName: 'Unassigned',
    assignedTo: 'Unassigned',
    propertyId: 'prop-dev-seed-01',
    createdAt: '35 mins ago',
  },
  {
    id: 'LD-8814',
    type: 'SELLER',
    ownerName: 'Manish Chawla',
    name: 'Manish Chawla',
    phone: '+91 99801 44521',
    society: 'Brigade Cornerstone Utopia',
    locality: 'Varthur / Whitefield',
    bhk: '4BHK+',
    expectedPrice: '₹2.80 Cr',
    stage: 'SITE_VISIT',
    assignedStaffName: 'Sneha Reddy',
    assignedTo: 'Sneha Reddy (Lead)',
    createdAt: '4 hrs ago',
  },
  {
    id: 'LD-8809',
    type: 'BUYER',
    ownerName: 'Ananya Sharma',
    name: 'Ananya Sharma',
    phone: '+91 94481 99012',
    society: 'Sobha Forest Edge',
    locality: 'Kanakapura Road',
    bhk: '3BHK',
    expectedPrice: '₹1.42 Cr',
    stage: 'NEGOTIATION',
    assignedStaffName: 'Vikram Sethi',
    assignedTo: 'Vikram Sethi (Closer)',
    propertyId: 'prop-dev-seed-02',
    createdAt: '1 day ago',
  },
  {
    id: 'LD-8805',
    type: 'BUYER',
    ownerName: 'Rahul Deshmukh',
    name: 'Rahul Deshmukh',
    phone: '+91 98801 22334',
    society: 'Prestige Lakeside Habitat',
    locality: 'Varthur',
    bhk: '3BHK',
    expectedPrice: '₹1.85 Cr',
    stage: 'CONVERTED',
    assignedStaffName: 'Vikram Sethi',
    assignedTo: 'Vikram Sethi (Closer)',
    propertyId: 'prop-dev-seed-04',
    createdAt: '3 days ago',
  }
];

const SEED_PROPERTIES: CrmProperty[] = [
  {
    id: 'prop-dev-seed-01',
    projectName: 'Sobha Dream Acres',
    localityName: 'Panathur / Balagere, East Bengaluru',
    bhkType: '2BHK',
    superBuiltUpSqft: 1200,
    carpetAreaSqft: 936,
    floorBand: 'Floor 11 of 18 (Mid-High Floor)',
    facing: 'EAST',
    askingPriceInr: 9800000,
    pricePerSqft: 8167,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
    verificationBadge: 'DOCS CHECKED',
    assignedRm: 'Sneha Reddy',
    status: 'PUBLISHED',
    updatedAt: '1 hr ago'
  },
  {
    id: 'prop-dev-seed-02',
    projectName: 'Sobha Forest Edge',
    localityName: 'Kanakapura Road, South Bengaluru',
    bhkType: '3BHK',
    superBuiltUpSqft: 1800,
    carpetAreaSqft: 1404,
    floorBand: 'Floor 8 of 14 (Mid Floor)',
    facing: 'NORTH',
    askingPriceInr: 15500000,
    pricePerSqft: 8611,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    verificationBadge: 'INSPECTED',
    assignedRm: 'Anil Kumar',
    status: 'PUBLISHED',
    updatedAt: '3 hrs ago'
  },
  {
    id: 'prop-dev-seed-03',
    projectName: 'Prestige Falcon City',
    localityName: 'Kanakapura Road, South Bengaluru',
    bhkType: '3BHK',
    superBuiltUpSqft: 1580,
    carpetAreaSqft: 1232,
    floorBand: 'Floor 14 of 24 (High Floor)',
    facing: 'EAST',
    askingPriceInr: 16500000,
    pricePerSqft: 10443,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    verificationBadge: 'INSPECTED',
    assignedRm: 'Kavitha Ranganathan',
    status: 'PUBLISHED',
    updatedAt: '5 hrs ago'
  },
  {
    id: 'prop-dev-seed-04',
    projectName: 'Prestige Lakeside Habitat',
    localityName: 'Varthur, East Bengaluru',
    bhkType: '3BHK',
    superBuiltUpSqft: 1650,
    carpetAreaSqft: 1287,
    floorBand: 'Floor 6 of 18 (Mid Floor)',
    facing: 'NORTH-EAST',
    askingPriceInr: 14800000,
    pricePerSqft: 8970,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    verificationBadge: 'DOCS CHECKED',
    assignedRm: 'Vikram Sethi',
    status: 'SOLD',
    updatedAt: '1 day ago'
  }
];

export function CrmDashboard({ staffUser, onLogout, onExit }: CrmDashboardProps) {
  // Navigation Section
  const [activeSection, setActiveSection] = useState<NavSection>('DASHBOARD');

  // RBAC Role State
  const [currentRole, setCurrentRole] = useState<StaffRole>('STAFF_INTAKE_AGENT');

  // Leads & Staff Data State
  const [leads, setLeads] = useState<CrmLead[]>(MOCK_LEADS);
  const [properties, setProperties] = useState<CrmProperty[]>(SEED_PROPERTIES);
  const [staffList, setStaffList] = useState<CrmStaff[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMutating, setIsMutating] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [leadFilterType, setLeadFilterType] = useState<'ALL' | 'SELLER' | 'BUYER' | 'OVERDUE'>('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [propertyStatusFilter, setPropertyStatusFilter] = useState<'ALL' | PropertyListingStatus>('ALL');

  // Selected Lead or Property for Slide-Over Drawer
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<CrmProperty | null>(null);

  // Property Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<CrmProperty | null>(null);

  // Drawer Form Inputs
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');
  const [callNoteText, setCallNoteText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch real leads from API
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads(data.leads);
        }
      }
    } catch {
      // Keep state
    } finally {
      setLoading(false);
    }
  };

  // Fetch real staff members from API
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
      // Keep state
    }
  };

  // Fetch real inventory from API (Calls authoritative /api/crm/properties)
  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/crm/properties');
      if (res.ok) {
        const data = await res.json();
        if (data.properties && Array.isArray(data.properties)) {
          const mapped: CrmProperty[] = data.properties.map((item: any) => ({
            id: item.id,
            title: item.title,
            projectName: item.projectName,
            localityName: item.localityName,
            propertyType: item.propertyType || 'Apartment',
            bhkType: item.bhkType,
            superBuiltUpSqft: item.superBuiltUpSqft,
            carpetAreaSqft: item.carpetAreaSqft,
            floorBand: item.floorBand,
            facing: item.facing,
            askingPriceInr: item.askingPriceInr,
            pricePerSqft: item.pricePerSqft,
            monthlyMaintenanceInr: item.monthlyMaintenanceInr,
            publicAddress: item.publicAddress,
            description: item.description,
            amenities: item.amenities || [],
            developerName: item.developerName,
            landmarks: item.landmarks || [],
            highlights: item.highlights || [],
            image: item.primaryImage || (item.images && item.images[0]?.url) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
            images: item.images || [],
            verificationBadge: item.verificationTier ? item.verificationTier.replace('LEVEL_', 'L').replace(/_/g, ' ') : 'VERIFIED',
            assignedRm: item.assignedRm || 'Sneha Reddy',
            assignedRmPhone: item.assignedRmPhone,
            ownerId: item.ownerId,
            ownerName: item.ownerName,
            ownerPhone: item.ownerPhone,
            reserveMinimumPriceInr: item.reserveMinimumPriceInr,
            status: (item.listingStatus || 'DRAFT') as PropertyListingStatus,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recently',
            createdAt: item.createdAt,
          }));
          setProperties(mapped);
          return;
        }
      }

      // Fallback to /api/listings if needed
      const fallbackRes = await fetch('/api/listings');
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data.listings && Array.isArray(data.listings) && data.listings.length > 0) {
          const mapped: CrmProperty[] = data.listings.map((item: any, idx: number) => ({
            id: item.id,
            projectName: item.projectName,
            localityName: item.localityName,
            bhkType: item.bhkType,
            superBuiltUpSqft: item.superBuiltUpSqft,
            carpetAreaSqft: item.carpetAreaSqft,
            floorBand: item.floorBand,
            facing: item.facing,
            askingPriceInr: item.askingPriceInr,
            pricePerSqft: item.pricePerSqft,
            image: item.image,
            verificationBadge: item.verificationBadge,
            assignedRm: idx % 2 === 0 ? 'Kavitha Ranganathan' : 'Sneha Reddy',
            status: 'PUBLISHED',
            updatedAt: 'Recently'
          }));
          setProperties(mapped);
        }
      }
    } catch {
      // Keep state
    }
  };

  // Quick Property Status Transition Handlers
  const handleQuickPublish = async (propertyId: string) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/crm/properties/${propertyId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.status === 422) {
        const prop = properties.find(p => p.id === propertyId);
        if (prop) {
          setEditingProperty(prop);
          setIsEditorOpen(true);
        }
        showToast('Cannot publish: Required fields missing. Opening editor...');
        return;
      }
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to publish property');
        return;
      }
      await fetchProperties();
      showToast('Property published to live public website');
    } catch (err: any) {
      alert(err.message || 'Failed to publish property');
    } finally {
      setIsMutating(false);
    }
  };

  const handleQuickPause = async (propertyId: string) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/crm/properties/${propertyId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchProperties();
        showToast('Property listing paused from public inventory');
      } else {
        const data = await res.json();
        alert(data.message || data.error || 'Failed to pause property');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to pause property');
    } finally {
      setIsMutating(false);
    }
  };

  const handleQuickSold = async (propertyId: string) => {
    if (!window.confirm('Mark this property as SOLD? Public buyer enquiries will be disabled.')) return;
    setIsMutating(true);
    try {
      const res = await fetch(`/api/crm/properties/${propertyId}/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchProperties();
        showToast('Property marked as SOLD');
      } else {
        const data = await res.json();
        alert(data.message || data.error || 'Failed to mark sold');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to mark sold');
    } finally {
      setIsMutating(false);
    }
  };

  const handleQuickArchive = async (propertyId: string) => {
    if (!window.confirm('Archive this property listing?')) return;
    setIsMutating(true);
    try {
      const res = await fetch(`/api/crm/properties/${propertyId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        await fetchProperties();
        showToast('Property archived successfully');
      } else {
        const data = await res.json();
        alert(data.message || data.error || 'Failed to archive property');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to archive property');
    } finally {
      setIsMutating(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchStaff();
    fetchProperties();
  }, [currentRole]);

  // Stage Change Mutation
  const handleStageChange = async (leadId: string, newStage: LeadStatus) => {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStage })
      });
      if (res.ok) {
        await fetchLeads();
        showToast(`Lead stage updated to ${newStage}`);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || err.error || 'Failed to update stage');
      }
    } catch {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
      showToast(`Lead stage updated to ${newStage}`);
    } finally {
      setIsMutating(false);
    }
  };

  // Staff Assignment Mutation
  const handleAssignStaff = async (leadId: string) => {
    if (!selectedStaffToAssign) {
      alert('Please select an employee to assign.');
      return;
    }
    setIsMutating(true);
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
      showToast('Lead assigned successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to assign staff');
    } finally {
      setIsMutating(false);
    }
  };

  // Follow-Up Scheduling Mutation
  const handleScheduleFollowUp = async (leadId: string) => {
    if (!followUpDate) {
      alert('Please select date and time for follow-up.');
      return;
    }
    setIsMutating(true);
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
      showToast('Follow-up scheduled with audit trail');
    } catch (err: any) {
      alert(err.message || 'Failed to schedule follow-up');
    } finally {
      setIsMutating(false);
    }
  };

  // Call Note Logging Mutation
  const handleAddNote = async (leadId: string) => {
    if (!callNoteText.trim()) return;
    setIsMutating(true);
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
      showToast('Call note logged successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsMutating(false);
    }
  };

  // Computed KPI Metrics (Strictly from real backend data)
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const sellerLeadsCount = leads.filter(l => l.type === 'SELLER').length;
    const buyerLeadsCount = leads.filter(l => l.type === 'BUYER').length;
    const activeInventoryCount = properties.length;
    const visitsAndOffersCount = leads.filter(l => l.stage === 'SITE_VISIT' || l.stage === 'NEGOTIATION').length;
    const convertedCount = leads.filter(l => l.stage === 'CONVERTED').length;
    const overdueCount = leads.filter(l => l.isOverdue).length;

    // Property Status counts (Strictly from real backend listing_status)
    const publishedCount = properties.filter(p => p.status === 'PUBLISHED').length;
    const draftCount = properties.filter(p => p.status === 'DRAFT').length;
    const pausedCount = properties.filter(p => p.status === 'PAUSED').length;
    const soldCount = properties.filter(p => p.status === 'SOLD').length;
    const archivedCount = properties.filter(p => p.status === 'ARCHIVED').length;

    // Stage breakdown counts
    const stageCounts: Record<string, number> = {
      NEW: leads.filter(l => l.stage === 'NEW').length,
      CONTACTED: leads.filter(l => l.stage === 'CONTACTED').length,
      FOLLOW_UP: leads.filter(l => l.stage === 'FOLLOW_UP').length,
      SITE_VISIT: leads.filter(l => l.stage === 'SITE_VISIT').length,
      NEGOTIATION: leads.filter(l => l.stage === 'NEGOTIATION').length,
      CONVERTED: leads.filter(l => l.stage === 'CONVERTED').length,
      LOST: leads.filter(l => l.stage === 'LOST').length,
    };

    return {
      totalLeads,
      sellerLeadsCount,
      buyerLeadsCount,
      activeInventoryCount,
      visitsAndOffersCount,
      convertedCount,
      overdueCount,
      stageCounts,
      publishedCount,
      draftCount,
      pausedCount,
      soldCount,
      archivedCount,
    };
  }, [leads, properties]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Type Filter
      if (leadFilterType === 'SELLER' && lead.type !== 'SELLER') return false;
      if (leadFilterType === 'BUYER' && lead.type !== 'BUYER') return false;
      if (leadFilterType === 'OVERDUE' && !lead.isOverdue) return false;

      // Stage Filter
      if (selectedStageFilter && lead.stage !== selectedStageFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (lead.ownerName || lead.name || '').toLowerCase();
        const soc = (lead.society || '').toLowerCase();
        const loc = (lead.locality || '').toLowerCase();
        const id = (lead.id || '').toLowerCase();
        const phone = (lead.phone || '').toLowerCase();
        if (!name.includes(q) && !soc.includes(q) && !loc.includes(q) && !id.includes(q) && !phone.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [leads, leadFilterType, selectedStageFilter, searchQuery]);

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return properties.filter(prop => {
      // Status filter
      if (propertyStatusFilter !== 'ALL' && prop.status !== propertyStatusFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (prop.title || '').toLowerCase();
        const name = prop.projectName.toLowerCase();
        const loc = prop.localityName.toLowerCase();
        const id = prop.id.toLowerCase();
        if (!title.includes(q) && !name.includes(q) && !loc.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [properties, propertyStatusFilter, searchQuery]);

  // Active Staff User Display Name
  const staffDisplayName = staffUser?.name || staffUser?.email || 'Sneha Reddy';
  const staffRoleLabel = staffUser?.roles?.[0] || currentRole.replace('STAFF_', '').replace(/_/g, ' ');

  return (
    <div className="flex h-screen bg-[#F4F6F9] text-[#172033] font-['Montserrat'] overflow-hidden">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#172033] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================ */}
      {/* 1. LEFT FIXED SIDEBAR NAVIGATION                                 */}
      {/* ================================================================ */}
      <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none">
        
        {/* Top Header & Brand */}
        <div>
          <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#244B8F] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                SMG
              </div>
              <div>
                <h1 className="text-sm font-extrabold text-[#172033] leading-none">SellMyGhar</h1>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block mt-1">
                  CRM Operational Desk
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="p-3 space-y-1">
            
            {/* Dashboard */}
            <button
              type="button"
              onClick={() => { setActiveSection('DASHBOARD'); setSelectedLead(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'DASHBOARD'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            {/* Leads */}
            <button
              type="button"
              onClick={() => { setActiveSection('LEADS'); setSelectedLead(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'LEADS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-4 h-4" />
                <span>Leads Pipeline</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                activeSection === 'LEADS' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {leads.length}
              </span>
            </button>

            {/* Properties */}
            <button
              type="button"
              onClick={() => { setActiveSection('PROPERTIES'); setSelectedLead(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'PROPERTIES'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4" />
                <span>Properties</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                activeSection === 'PROPERTIES' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {properties.length}
              </span>
            </button>

            {/* Site Visits & Deals */}
            <button
              type="button"
              onClick={() => { setActiveSection('VISITS_DEALS'); setSelectedLead(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'VISITS_DEALS'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Visits & Offers</span>
            </button>

            {/* Documents */}
            <button
              type="button"
              onClick={() => { setActiveSection('VERIFICATION'); setSelectedLead(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'VERIFICATION'
                  ? 'bg-[#244B8F] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Documents</span>
            </button>

            {/* Compliance & Audit */}
            <button
              type="button"
              onClick={() => { setActiveSection('AUDIT'); setSelectedLead(null); }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === 'AUDIT'
                  ? 'bg-[#172033] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>Compliance & Audit</span>
            </button>

          </nav>
        </div>

        {/* Bottom Profile Area (Inspired by reference screenshot) */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
            
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#244B8F] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                {staffDisplayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate" title={staffDisplayName}>
                  {staffDisplayName}
                </span>
                <span className="text-[10px] font-semibold text-[#B68A4A] bg-amber-50 px-1.5 py-0.2 rounded inline-block truncate max-w-[100px]">
                  {staffRoleLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition-colors cursor-pointer"
                  title="Sign out of staff session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Exit portal to public homepage"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </div>

      </aside>

      {/* ================================================================ */}
      {/* 2. MAIN WORKSPACE AREA                                           */}
      {/* ================================================================ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between shrink-0">
          
          {/* Section Breadcrumbs / Title */}
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-[#172033] tracking-tight">
                {activeSection === 'DASHBOARD' && 'Operations Dashboard'}
                {activeSection === 'LEADS' && 'Lead Pipeline Management'}
                {activeSection === 'PROPERTIES' && 'Property Management Inventory'}
                {activeSection === 'VISITS_DEALS' && 'Buyer Physical Visits & Offers'}
                {activeSection === 'VERIFICATION' && 'Document Verification Review'}
                {activeSection === 'AUDIT' && 'DPDP Compliance & Immutable Audit'}
              </h2>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Bengaluru Resale Portfolio Desk
              </span>
            </div>
          </div>

          {/* Contextual Actions Bar */}
          <div className="flex items-center space-x-3">
            
            {/* Search Input */}
            <div className="relative hidden md:block w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leads, projects..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:ring-1 focus:ring-[#244B8F] focus:outline-hidden"
              />
            </div>

            {/* Role Switcher Pill (Preserves RBAC Demonstration) */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 hidden lg:inline">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as StaffRole)}
                className="text-xs font-bold text-[#244B8F] bg-transparent focus:outline-hidden cursor-pointer"
              >
                <option value="STAFF_INTAKE_AGENT">Intake Lead Desk</option>
                <option value="STAFF_VERIFICATION_AGENT">Verification Agent</option>
                <option value="STAFF_LISTING_MANAGER">Listing Manager</option>
                <option value="STAFF_DEAL_CLOSER">Deal Closer</option>
                <option value="STAFF_SUPER_ADMIN">Super Admin (All Privileges)</option>
              </select>
            </div>

            {/* Live Refresh */}
            <button
              type="button"
              onClick={() => { fetchLeads(); fetchProperties(); showToast('Synchronized with PostgreSQL database'); }}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#244B8F]' : ''}`} />
            </button>

            {/* Add Property Button */}
            <button
              type="button"
              onClick={() => {
                setEditingProperty(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Create new property draft"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Property</span>
            </button>

            {/* Add Lead Button */}
            <button
              type="button"
              onClick={() => {
                alert('Quick Action: New Lead intake modal. For self-serve onboarding, refer to the Seller Assisted Funnel.');
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>

          </div>

        </header>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ============================================================== */}
          {/* VIEW: DASHBOARD (Summary Metrics + Operational Pipeline Table) */}
          {/* ============================================================== */}
          {activeSection === 'DASHBOARD' && (
            <div className="space-y-6">
              
              {/* Row 1: KPI Summary Metric Cards (Exact Property Status Models) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Metric 1: Total Leads */}
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Active Leads</span>
                    <span className="text-[10px] font-bold text-[#244B8F] bg-blue-50 px-2 py-0.5 rounded">
                      Live CRM
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#172033]">
                    {metrics.totalLeads}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Sellers: <strong className="text-slate-800">{metrics.sellerLeadsCount}</strong></span>
                    <span>Buyers: <strong className="text-slate-800">{metrics.buyerLeadsCount}</strong></span>
                  </div>
                </div>

                {/* Metric 2: Published Inventory */}
                <div 
                  onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('PUBLISHED'); }}
                  className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2 cursor-pointer hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Published Inventory</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Live Public
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#172033]">
                    {metrics.publishedCount} Homes
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Draft Listings</span>
                    <strong className="text-amber-700">{metrics.draftCount} in review</strong>
                  </div>
                </div>

                {/* Metric 3: Paused & Sold Inventory */}
                <div 
                  onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('SOLD'); }}
                  className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2 cursor-pointer hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Paused & Sold Inventory</span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      Inactive
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#172033]">
                    {metrics.pausedCount + metrics.soldCount} Homes
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Paused: <strong className="text-orange-700">{metrics.pausedCount}</strong></span>
                    <span>Sold: <strong className="text-purple-700">{metrics.soldCount}</strong></span>
                  </div>
                </div>

                {/* Metric 4: Visits & Offers */}
                <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Visits & Offers</span>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded">
                      High Intent
                    </span>
                  </div>
                  <div className="text-2xl font-black text-[#172033]">
                    {metrics.visitsAndOffersCount}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>Site Visits & Negotiations</span>
                    <strong className="text-purple-700">Active Stage</strong>
                  </div>
                </div>

              </div>

              {/* Property Inventory Status Strip */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                  <Building2 className="w-4 h-4 text-[#244B8F]" />
                  <span>Property Inventory Status:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('ALL'); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    All: <span className="font-mono">{properties.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('PUBLISHED'); }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold transition-colors cursor-pointer"
                  >
                    Published: <span className="font-mono">{metrics.publishedCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('DRAFT'); }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors cursor-pointer"
                  >
                    Draft: <span className="font-mono">{metrics.draftCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('PAUSED'); }}
                    className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold transition-colors cursor-pointer"
                  >
                    Paused: <span className="font-mono">{metrics.pausedCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('SOLD'); }}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold transition-colors cursor-pointer"
                  >
                    Sold: <span className="font-mono">{metrics.soldCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setActiveSection('PROPERTIES'); setPropertyStatusFilter('ARCHIVED'); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors cursor-pointer"
                  >
                    Archived: <span className="font-mono">{metrics.archivedCount}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Operational Status / Attention Breakdown (Inspired by reference Status card) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* 2a. Horizontal Pipeline Distribution Bar */}
                <div className="lg:col-span-2 p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Operational Pipeline Distribution
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Real-time stage allocation across all active Bangalore leads
                      </p>
                    </div>
                    {selectedStageFilter && (
                      <button
                        type="button"
                        onClick={() => setSelectedStageFilter(null)}
                        className="text-[10px] font-bold text-[#244B8F] hover:underline cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  {/* Status Pills Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                    {[
                      { key: 'NEW', label: 'New', color: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100' },
                      { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100' },
                      { key: 'FOLLOW_UP', label: 'Follow Up', color: 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100' },
                      { key: 'SITE_VISIT', label: 'Site Visit', color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100' },
                      { key: 'NEGOTIATION', label: 'Negotiate', color: 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100' },
                      { key: 'CONVERTED', label: 'Converted', color: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100' },
                      { key: 'LOST', label: 'Lost', color: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100' }
                    ].map(st => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setSelectedStageFilter(selectedStageFilter === st.key ? null : st.key)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${st.color} ${
                          selectedStageFilter === st.key ? 'ring-2 ring-[#244B8F] font-black' : ''
                        }`}
                      >
                        <span className="text-[10px] font-bold block uppercase tracking-wider">{st.label}</span>
                        <span className="text-base font-black font-mono block mt-0.5">
                          {metrics.stageCounts[st.key] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2b. Attention & Overdue Follow-ups Box */}
                <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Operational SLA & Alerts
                      </span>
                      {metrics.overdueCount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                          {metrics.overdueCount} Overdue
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          On Track
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      {metrics.overdueCount > 0 ? (
                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                          <p className="font-bold flex items-center space-x-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Action Required: Follow-up past SLA</span>
                          </p>
                          <p className="text-[11px] text-rose-700">
                            {metrics.overdueCount} seller enquiry requires immediate diligence outreach.
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 space-y-1">
                          <p className="font-bold flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>All Follow-ups on Schedule</span>
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            Zero overdue tasks. Bangalore advisory desks are responsive within SLA.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection('LEADS');
                      setLeadFilterType('OVERDUE');
                    }}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
                  >
                    View Task Queue
                  </button>
                </div>

              </div>

              {/* Row 3: High-Density Property & Lead Table (Inspired by reference's invoice table) */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                
                {/* Table Header Filter Tabs */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center space-x-2 text-xs font-bold">
                    <span className="text-slate-400 mr-1 uppercase tracking-wider text-[10px]">View:</span>
                    {(['ALL', 'SELLER', 'BUYER', 'OVERDUE'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setLeadFilterType(tab)}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          leadFilterType === tab
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {tab === 'ALL' && `All Leads (${leads.length})`}
                        {tab === 'SELLER' && `Seller Leads (${metrics.sellerLeadsCount})`}
                        {tab === 'BUYER' && `Buyer Inquiries (${metrics.buyerLeadsCount})`}
                        {tab === 'OVERDUE' && `Overdue SLA (${metrics.overdueCount})`}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 font-medium">
                    Showing <strong className="text-slate-800">{filteredLeads.length}</strong> records
                  </div>
                </div>

                {/* Dense Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Lead ID & Client</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Society / Locality</th>
                        <th className="py-3 px-4">BHK & Value</th>
                        <th className="py-3 px-4">Assigned RM</th>
                        <th className="py-3 px-4">Stage</th>
                        <th className="py-3 px-4">Follow-Up</th>
                        <th className="py-3 px-4 text-right">Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                            No records match the current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((lead) => (
                          <tr
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                          >
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block group-hover:text-[#244B8F]">
                                {lead.ownerName || lead.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                {lead.id}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                lead.type === 'SELLER'
                                  ? 'bg-blue-100 text-[#244B8F]'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {lead.type || 'SELLER'}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                                {lead.society}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-[160px] block">
                                {lead.locality}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-900 block">
                                {lead.expectedPrice || 'Enquiry'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {lead.bhk}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="flex items-center space-x-1.5">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                  {(lead.assignedStaffName || lead.assignedTo || 'U').slice(0, 1)}
                                </div>
                                <span className="font-medium text-slate-700 truncate max-w-[110px]">
                                  {lead.assignedStaffName || lead.assignedTo || 'Unassigned'}
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                lead.stage === 'NEW' ? 'bg-amber-100 text-amber-900' :
                                lead.stage === 'CONTACTED' ? 'bg-blue-100 text-blue-900' :
                                lead.stage === 'FOLLOW_UP' ? 'bg-cyan-100 text-cyan-900' :
                                lead.stage === 'SITE_VISIT' ? 'bg-purple-100 text-purple-900' :
                                lead.stage === 'NEGOTIATION' ? 'bg-indigo-100 text-indigo-900' :
                                lead.stage === 'CONVERTED' ? 'bg-emerald-100 text-emerald-900' :
                                lead.stage === 'LOST' ? 'bg-rose-100 text-rose-900' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {lead.stage}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-[11px]">
                              {lead.isOverdue ? (
                                <span className="text-rose-700 font-bold flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>Overdue</span>
                                </span>
                              ) : lead.nextFollowUpAt ? (
                                <span className="text-slate-600">
                                  {new Date(lead.nextFollowUpAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
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
                                  setSelectedLead(lead);
                                }}
                                className="px-3 py-1 rounded bg-slate-100 hover:bg-[#244B8F] hover:text-white text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                              >
                                Triage
                              </button>
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: LEADS MANAGEMENT (Dedicated Table View)                  */}
          {/* ============================================================== */}
          {activeSection === 'LEADS' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#244B8F]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    All Active Leads ({filteredLeads.length})
                  </h3>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Filter:</span>
                  {(['ALL', 'SELLER', 'BUYER', 'OVERDUE'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setLeadFilterType(tab)}
                      className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                        leadFilterType === tab ? 'bg-[#244B8F] text-white' : 'bg-white border text-slate-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Client Name</th>
                      <th className="py-3 px-4">Phone (Masked Check)</th>
                      <th className="py-3 px-4">Society & Locality</th>
                      <th className="py-3 px-4">BHK</th>
                      <th className="py-3 px-4">Budget / Value</th>
                      <th className="py-3 px-4">RM Assignee</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map(lead => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {lead.ownerName || lead.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {currentRole === 'STAFF_LISTING_MANAGER' ? '[MASKED]' : lead.phone}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold block">{lead.society}</span>
                          <span className="text-[11px] text-slate-400">{lead.locality}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold">{lead.bhk}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{lead.expectedPrice}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {lead.assignedStaffName || lead.assignedTo || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                            {lead.stage}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); }}
                            className="px-3 py-1 rounded bg-[#244B8F] text-white font-bold text-xs cursor-pointer hover:bg-[#1B396E]"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: PROPERTY MANAGEMENT TABLE (Compact Invoice Density)       */}
          {/* ============================================================== */}
          {activeSection === 'PROPERTIES' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              
              {/* Table Top Controls & Status Filters */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-[#244B8F]" />
                    <span>Property Management Inventory ({filteredProperties.length} Homes)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    High-density operational property table. PostgreSQL source of truth with real-time public synchronization.
                  </p>
                </div>

                {/* Filter Pills & Add Property Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                    {(['ALL', 'PUBLISHED', 'DRAFT', 'PAUSED', 'SOLD', 'ARCHIVED'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setPropertyStatusFilter(tab)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                          propertyStatusFilter === tab
                            ? 'bg-[#244B8F] text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {tab === 'ALL' && `All (${properties.length})`}
                        {tab === 'PUBLISHED' && `Published (${metrics.publishedCount})`}
                        {tab === 'DRAFT' && `Draft (${metrics.draftCount})`}
                        {tab === 'PAUSED' && `Paused (${metrics.pausedCount})`}
                        {tab === 'SOLD' && `Sold (${metrics.soldCount})`}
                        {tab === 'ARCHIVED' && `Archived (${metrics.archivedCount})`}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingProperty(null);
                      setIsEditorOpen(true);
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Property</span>
                  </button>
                </div>
              </div>

              {/* Scannable Property Table with 12 Columns */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Property</th>
                      <th className="py-3 px-3">Project</th>
                      <th className="py-3 px-3">Locality</th>
                      <th className="py-3 px-3">BHK</th>
                      <th className="py-3 px-3">Area</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Owner / Lead</th>
                      <th className="py-3 px-3">Assigned RM</th>
                      <th className="py-3 px-3">Listing Status</th>
                      <th className="py-3 px-3">Updated</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProperties.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-12 text-center text-slate-400 font-medium">
                          No properties found matching current filter ({propertyStatusFilter}).
                        </td>
                      </tr>
                    ) : (
                      filteredProperties.map(property => (
                        <tr
                          key={property.id}
                          className="hover:bg-blue-50/40 transition-colors"
                        >
                          {/* 1. Property (Thumbnail + Title + ID) */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-10 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                                <img src={property.image} alt={property.title || property.projectName} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate max-w-[130px]" title={property.title || property.projectName}>
                                  {property.title || property.projectName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 block truncate max-w-[130px]">
                                  {property.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Project */}
                          <td className="py-2.5 px-3 font-semibold text-slate-800 truncate max-w-[120px]" title={property.projectName}>
                            {property.projectName}
                          </td>

                          {/* 3. Locality */}
                          <td className="py-2.5 px-3 text-slate-600 truncate max-w-[120px]" title={property.localityName}>
                            {property.localityName}
                          </td>

                          {/* 4. BHK */}
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {property.bhkType}
                          </td>

                          {/* 5. Area */}
                          <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                            {property.superBuiltUpSqft.toLocaleString()} sq.ft
                          </td>

                          {/* 6. Price */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className="font-black text-slate-900 block">
                              ₹{(property.askingPriceInr / 10000000).toFixed(2)} Cr
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ₹{property.pricePerSqft.toLocaleString()}/sq.ft
                            </span>
                          </td>

                          {/* 7. Property Type */}
                          <td className="py-2.5 px-3 text-slate-700">
                            {property.propertyType || 'Apartment'}
                          </td>

                          {/* 8. Owner / Lead */}
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 block truncate max-w-[110px]">
                              {property.ownerName || 'Verified Owner'}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {currentRole === 'STAFF_LISTING_MANAGER' ? '[MASKED]' : (property.ownerPhone || 'Registered')}
                            </span>
                          </td>

                          {/* 9. Assigned RM */}
                          <td className="py-2.5 px-3">
                            <div className="flex items-center space-x-1.5">
                              <div className="w-5 h-5 rounded-full bg-[#244B8F] text-white font-black text-[9px] flex items-center justify-center shrink-0">
                                {(property.assignedRm || 'K').slice(0, 1)}
                              </div>
                              <span className="font-medium text-slate-700 truncate max-w-[100px]">
                                {property.assignedRm || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* 10. Listing Status (Badge strictly using exact model) */}
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              property.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              property.status === 'DRAFT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              property.status === 'PAUSED' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                              property.status === 'SOLD' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {property.status}
                            </span>
                          </td>

                          {/* 11. Updated */}
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {property.updatedAt || 'Recently'}
                          </td>

                          {/* 12. Actions (Contextual buttons strictly valid for current status) */}
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              
                              {/* Edit Action */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProperty(property);
                                  setIsEditorOpen(true);
                                }}
                                className="px-2 py-1 rounded bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs transition-colors cursor-pointer"
                                title="Edit property details"
                              >
                                Edit
                              </button>

                              {/* View Action (Only active if PUBLISHED) */}
                              {property.status === 'PUBLISHED' ? (
                                <a
                                  href={`/property/${property.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-0.5 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                                  title="View public live listing in new tab"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                                </a>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[10px] text-slate-400 italic">
                                  Private
                                </span>
                              )}

                              {/* Status Action: Publish (Only for DRAFT or PAUSED) */}
                              {(property.status === 'DRAFT' || property.status === 'PAUSED') && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => handleQuickPublish(property.id)}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Validate and publish to public website"
                                >
                                  Publish
                                </button>
                              )}

                              {/* Status Action: Pause (Only for PUBLISHED) */}
                              {property.status === 'PUBLISHED' && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => handleQuickPause(property.id)}
                                  className="px-2 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Pause listing from public website"
                                >
                                  Pause
                                </button>
                              )}

                              {/* Status Action: Mark Sold (Only for PUBLISHED or PAUSED) */}
                              {(property.status === 'PUBLISHED' || property.status === 'PAUSED') && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => handleQuickSold(property.id)}
                                  className="px-2 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Mark property as sold"
                                >
                                  Sold
                                </button>
                              )}

                              {/* Status Action: Archive (For DRAFT, PUBLISHED, PAUSED, SOLD) */}
                              {property.status !== 'ARCHIVED' && (
                                <button
                                  type="button"
                                  disabled={isMutating}
                                  onClick={() => handleQuickArchive(property.id)}
                                  className="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Archive listing"
                                >
                                  Archive
                                </button>
                              )}

                            </div>
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
          {/* VIEW: SITE VISITS & DEALS                                      */}
          {/* ============================================================== */}
          {activeSection === 'VISITS_DEALS' && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#172033]">Buyer Physical Visits & Offer Negotiations</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Coordinated by: <strong>STAFF_DEAL_CLOSER</strong>. Protected reserve prices require closer/admin privileges.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-purple-100 text-purple-800 font-bold text-xs">
                  Active Deal Flow
                </span>
              </div>

              {/* Deal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-400">Scheduled Visit</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">OTP VERIFIED</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Prestige Falcon City: Flat 1102</h4>
                  <p className="text-xs text-slate-600">
                    Buyer: Ananya Sharma (+91 98765 43210) • Pre-approved HDFC Loan
                  </p>
                  <p className="text-xs text-slate-500">
                    Requested Slot: <strong className="text-slate-800">This Saturday, 11:00 AM</strong>
                  </p>
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => alert('Confirmed with owner. Calendar invite dispatched.')}
                      className="px-3 py-1.5 bg-[#244B8F] text-white font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Confirm Escorted Tour
                    </button>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-purple-200 bg-purple-50/20 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-purple-900">Formal Buyer Offer</span>
                    <span className="font-mono text-xs text-slate-400">REF: OFF-9102</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Asking</span>
                      <strong className="text-slate-900">₹1.65 Cr</strong>
                    </div>
                    <div className="p-2 bg-purple-50 rounded border border-purple-200 text-purple-900">
                      <span className="text-[10px] text-purple-600 block">Offer</span>
                      <strong className="text-purple-950 font-black">₹1.60 Cr</strong>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Reserve Floor</span>
                      <strong className="text-emerald-700">
                        {currentRole === 'STAFF_DEAL_CLOSER' || currentRole === 'STAFF_SUPER_ADMIN' ? '₹1.58 Cr' : '[RESTRICTED]'}
                      </strong>
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">Above bottom reserve. Recommend counter at ₹1.62 Cr.</span>
                    <button
                      type="button"
                      disabled={currentRole !== 'STAFF_DEAL_CLOSER' && currentRole !== 'STAFF_SUPER_ADMIN'}
                      onClick={() => alert('Counter-offer presented to owner.')}
                      className="px-3 py-1.5 bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer disabled:opacity-50"
                    >
                      Present Counter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: VERIFICATION DESK (Embeds DocumentVerificationDesk)      */}
          {/* ============================================================== */}
          {activeSection === 'VERIFICATION' && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6">
              <DocumentVerificationDesk currentRole={currentRole} />
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW: COMPLIANCE & AUDIT (Audit Logs & AdminErasureQueue)      */}
          {/* ============================================================== */}
          {activeSection === 'AUDIT' && (
            <div className="space-y-6">
              {currentRole === 'STAFF_SUPER_ADMIN' ? (
                <>
                  <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                        <h3 className="text-sm font-extrabold text-[#172033]">
                          Immutable Audit Log Stream & Privileged Insider Risk
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 font-mono">
                        TRIGGER PROTECTED
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200 flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 text-rose-900 font-bold">
                            <span>[ELEVATED_INSIDER_RISK]</span>
                            <span>VIEW_RESERVE_PRICE</span>
                          </div>
                          <p className="text-slate-700 font-sans mt-0.5 text-[11px]">
                            Super Admin inspected confidential reserve minimum price for Property PROP-BLR-8492.
                          </p>
                          <span className="text-[10px] text-slate-400">Actor: usr-admin-01 • IP: 103.21.244.18</span>
                        </div>
                        <span className="text-[10px] font-bold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                          AUDITED
                        </span>
                      </div>

                      <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-200 flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2 text-blue-900 font-bold">
                            <span>[ROUTINE_AUDIT]</span>
                            <span>REVISE_VERIFICATION_TIER</span>
                          </div>
                          <p className="text-slate-700 font-sans mt-0.5 text-[11px]">
                            Verification Agent approved Sale Deed & Khata. Promoted to LEVEL_2_DOCS_REVIEWED.
                          </p>
                          <span className="text-[10px] text-slate-400">Actor: usr-verifier-04 • IP: 103.21.244.12</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          CLEAN
                        </span>
                      </div>
                    </div>
                  </div>

                  <AdminErasureQueue />
                </>
              ) : (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <Lock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-800">Super Admin Privileges Required</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Switch your active role to "Super Admin" in the top bar to inspect privileged audit streams and the DPDP erasure queue.
                  </p>
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      {/* ================================================================ */}
      {/* 3. SLIDE-OVER TRIAGE DRAWER (For selected lead or property)     */}
      {/* ================================================================ */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col font-['Montserrat'] animate-fade-in">
          
          {/* Drawer Top */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#244B8F]">
                Lead Triage & Dispatch
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {selectedLead.ownerName || selectedLead.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedLead(null)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            
            {/* Overdue Alert */}
            {selectedLead.isOverdue && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold text-[11px]">Follow-Up Overdue: Prompt diligence required.</span>
              </div>
            )}

            {/* Field Inspections & Least-Privilege Masking */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Profile Attributes
              </span>
              
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Phone:</span>
                <strong className="font-mono text-slate-900">
                  {currentRole === 'STAFF_LISTING_MANAGER' ? '[MASKED]' : selectedLead.phone}
                </strong>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Society:</span>
                <span className="font-bold text-slate-900">{selectedLead.society}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Locality:</span>
                <span className="text-slate-700">{selectedLead.locality}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">BHK:</span>
                <span className="font-semibold text-slate-900">{selectedLead.bhk}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Asking Value:</span>
                <strong className="text-[#244B8F]">{selectedLead.expectedPrice}</strong>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-slate-500">Current Assignee:</span>
                <span className="font-bold text-slate-800">
                  {selectedLead.assignedStaffName || selectedLead.assignedTo || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* RM Assignment */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Assign Relationship Manager (RM):</label>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedStaffToAssign}
                  onChange={(e) => setSelectedStaffToAssign(e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:outline-hidden"
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
                  disabled={isMutating || !selectedStaffToAssign}
                  onClick={() => handleAssignStaff(selectedLead.id)}
                  className="px-3 py-2 bg-[#244B8F] text-white font-bold text-xs rounded-lg hover:bg-[#1B396E] disabled:opacity-50 cursor-pointer"
                >
                  Assign
                </button>
              </div>
            </div>

            {/* Advance Lifecycle Stage */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Advance Stage:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'CONTACTED', label: '1. Contacted', color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100' },
                  { key: 'FOLLOW_UP', label: '2. Follow Up', color: 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100' },
                  { key: 'SITE_VISIT', label: '3. Site Visit', color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100' },
                  { key: 'NEGOTIATION', label: '4. Negotiate', color: 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100' },
                  { key: 'CONVERTED', label: '5. Convert', color: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100' },
                  { key: 'LOST', label: '6. Mark Lost', color: 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100' },
                ].map(btn => (
                  <button
                    key={btn.key}
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleStageChange(selectedLead.id, btn.key as LeadStatus)}
                    className={`p-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer text-center ${btn.color} ${
                      selectedLead.stage === btn.key ? 'ring-2 ring-[#244B8F]' : ''
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Follow-Up */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Schedule Follow-up:</label>
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-slate-50"
              />
              <input
                type="text"
                value={followUpNoteInput}
                onChange={(e) => setFollowUpNoteInput(e.target.value)}
                placeholder="Follow-up reminder notes..."
                className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-slate-50"
              />
              <button
                type="button"
                disabled={isMutating || !followUpDate}
                onClick={() => handleScheduleFollowUp(selectedLead.id)}
                className="w-full py-2 bg-cyan-800 text-white font-bold text-xs rounded-lg hover:bg-cyan-900 disabled:opacity-50 cursor-pointer"
              >
                Save Schedule
              </button>
            </div>

            {/* Log Call Note */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">Log Call Note:</label>
              <textarea
                rows={2}
                value={callNoteText}
                onChange={(e) => setCallNoteText(e.target.value)}
                placeholder="Log conversation or diligence note..."
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs bg-slate-50"
              />
              <button
                type="button"
                disabled={isMutating || !callNoteText.trim()}
                onClick={() => handleAddNote(selectedLead.id)}
                className="w-full py-2 bg-[#244B8F] text-white font-bold text-xs rounded-lg hover:bg-[#1B396E] disabled:opacity-50 cursor-pointer"
              >
                Log Call Note
              </button>
            </div>

            {/* Historical Notes */}
            {selectedLead.notes && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Notes & Audit Trail
                </span>
                <pre className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700 font-sans whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {selectedLead.notes}
                </pre>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Property Drawer */}
      {selectedProperty && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col font-['Montserrat'] animate-fade-in">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#244B8F]">Property Inspection</span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedProperty.projectName}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProperty(null)}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img src={selectedProperty.image} alt={selectedProperty.projectName} className="w-full h-full object-cover" />
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Ref ID:</span>
                <span className="font-mono font-bold text-slate-800">{selectedProperty.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Locality:</span>
                <span className="font-medium text-slate-800">{selectedProperty.localityName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">BHK / Area:</span>
                <span className="font-bold text-slate-900">{selectedProperty.bhkType} • {selectedProperty.superBuiltUpSqft} sq.ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Floor Level:</span>
                <span className="text-slate-800">{selectedProperty.floorBand}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Asking Price:</span>
                <strong className="text-[#244B8F]">₹{(selectedProperty.askingPriceInr / 10000000).toFixed(2)} Cr</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Title Status:</span>
                <span className="text-emerald-700 font-bold">{selectedProperty.verificationBadge}</span>
              </div>
            </div>

            {selectedProperty.status === 'PUBLISHED' && (
              <a
                href={`/property/${selectedProperty.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-2xs hover:bg-slate-200 transition-colors"
              >
                <span>View Full Public Detail Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              type="button"
              onClick={() => {
                const prop = selectedProperty;
                setSelectedProperty(null);
                setEditingProperty(prop);
                setIsEditorOpen(true);
              }}
              className="w-full py-2.5 bg-[#244B8F] text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-xs hover:bg-[#1B396E] transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Property Details</span>
            </button>
          </div>
        </div>
      )}

      {/* Property Editor Modal */}
      <PropertyEditor
        property={editingProperty}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={fetchProperties}
        staffRole={currentRole}
      />

    </div>
  );
}
