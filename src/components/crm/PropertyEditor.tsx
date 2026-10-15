import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  DollarSign,
  FileText,
  Image as ImageIcon,
  History,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Trash2,
  Star,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  Archive,
  Check,
  Tag,
  ShieldCheck,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { PropertyListingStatus, CrmProperty } from './CrmDashboard';
import { StaffRole } from '../../core/types/auth';
import { getDistinctCommunityPhoto } from '../../utils/propertyImages';

interface PropertyEditorProps {
  property: CrmProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onUpdate?: () => void;
  staffRole?: StaffRole;
}

type EditorTab = 'BASIC' | 'PRICING' | 'CONTENT' | 'IMAGES' | 'FLOOR_PLAN' | 'ACTIVITY';

const COMMON_AMENITIES = [
  'Swimming Pool',
  'Clubhouse',
  'Gymnasium',
  '24/7 Security',
  'Power Backup',
  'Children Play Area',
  'Landscaped Gardens',
  'Covered Parking',
  'Jogging Track',
  'Tennis Court',
  'High-Speed Elevators',
  'EV Charging Station'
];

export function PropertyEditor({
  property,
  isOpen,
  onClose,
  onSaved,
  onUpdate,
  staffRole
}: PropertyEditorProps) {
  const isCreate = !property || !property.id;

  const [activeTab, setActiveTab] = useState<EditorTab>('BASIC');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [bhkType, setBhkType] = useState('2BHK');
  const [superBuiltUpSqft, setSuperBuiltUpSqft] = useState(1200);
  const [carpetAreaSqft, setCarpetAreaSqft] = useState(936);
  const [floorBand, setFloorBand] = useState('Floor 5 of 14 (Mid Floor)');
  const [facing, setFacing] = useState('EAST');
  const [publicAddress, setPublicAddress] = useState('');

  // Pricing
  const [askingPriceInr, setAskingPriceInr] = useState(10000000);
  const [monthlyMaintenanceInr, setMonthlyMaintenanceInr] = useState(4500);
  const [reserveMinimumPriceInr, setReserveMinimumPriceInr] = useState<number | undefined>(undefined);

  // Content
  const [description, setDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [developerName, setDeveloperName] = useState('');
  const [developerLogoUrl, setDeveloperLogoUrl] = useState('');
  const [developerReraId, setDeveloperReraId] = useState('');
  const [developerLaunchYear, setDeveloperLaunchYear] = useState<number | undefined>(undefined);
  const [landmarks, setLandmarks] = useState<string[]>([]);
  const [landmarkInput, setLandmarkInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');

  // Status & Media
  const [listingStatus, setListingStatus] = useState<PropertyListingStatus>('DRAFT');
  const [images, setImages] = useState<Array<{ id: string; url: string; is_featured?: boolean; created_at?: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Floor Plan State
  const [floorPlanUrl, setFloorPlanUrl] = useState('');
  const [floorPlanTitle, setFloorPlanTitle] = useState('Architectural Layout Plan');

  // Validation feedback
  const [validationErrors, setValidationErrors] = useState<{
    missingFields: string[];
    message?: string;
  } | null>(null);

  // Activity timeline
  const [activityLogs, setActivityLogs] = useState<Array<{
    id: string;
    action: string;
    actorRole: string;
    timestamp: string;
    details: any;
  }>>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync form when property changes or opens
  useEffect(() => {
    if (property) {
      const derivedProject = property.projectName || (property as any).project_locality_id || '';
      const derivedLocality = property.localityName || (property as any).locality_name || (property as any).project_locality_id || '';
      const derivedBhk = property.bhkType || (property as any).bhk_type || '2BHK';
      const derivedTitle = property.title || (derivedProject ? `${derivedProject} - ${derivedBhk}` : (property.publicAddress || 'Residential Property'));
      setTitle(derivedTitle);
      setProjectName(derivedProject);
      setLocalityName(derivedLocality);
      setPropertyType(property.propertyType || (property as any).property_type || 'Apartment');
      setBhkType(derivedBhk);
      setSuperBuiltUpSqft(property.superBuiltUpSqft || (property as any).super_built_up_sqft || 1200);
      const sft = property.superBuiltUpSqft || (property as any).super_built_up_sqft || 1200;
      setCarpetAreaSqft(property.carpetAreaSqft || (property as any).carpet_area_sqft || Math.round(sft * 0.78));
      setFloorBand(property.floorBand || (property as any).floor_band || 'Floor 5 of 14');
      setFacing(property.facing || 'EAST');
      setPublicAddress(property.publicAddress || (property as any).public_address || `${derivedProject}, ${derivedLocality}`.replace(/^,\s*|,\s*$/g, ''));

      setAskingPriceInr(property.askingPriceInr || (property as any).asking_price_inr || 10000000);
      setMonthlyMaintenanceInr(property.monthlyMaintenanceInr || (property as any).monthly_maintenance_inr || 0);
      setReserveMinimumPriceInr(property.reserveMinimumPriceInr || (property as any).reserve_minimum_price_inr);

      setDescription(property.description || '');
      setAmenities(property.amenities || []);
      setDeveloperName(property.developerName || (property as any).developer_name || derivedProject.split(' ')[0] || '');
      setDeveloperLogoUrl((property as any).developerLogoUrl || (property as any).developer_logo_url || '');
      setDeveloperReraId((property as any).developerReraId || (property as any).developer_rera_id || '');
      setDeveloperLaunchYear((property as any).developerLaunchYear || (property as any).developer_launch_year || undefined);
      setLandmarks(property.landmarks || []);
      setHighlights(property.highlights || []);

      setListingStatus(property.status || (property as any).listing_status || 'DRAFT');
      setImages(property.images || (property.image ? [{ id: 'img-main', url: property.image, is_featured: true }] : []));
      setFloorPlanUrl((property as any).floorPlanUrl || (property as any).floor_plan_url || '');
      setFloorPlanTitle(`${derivedBhk} Architectural Layout Plan`);
      setValidationErrors(null);
    } else {
      // Defaults for Create Property
      setTitle('');
      setProjectName('');
      setLocalityName('');
      setPropertyType('Apartment');
      setBhkType('2BHK');
      setSuperBuiltUpSqft(1200);
      setCarpetAreaSqft(936);
      setFloorBand('Floor 5 of 14 (Mid Floor)');
      setFacing('EAST');
      setPublicAddress('');

      setAskingPriceInr(10000000);
      setMonthlyMaintenanceInr(4500);
      setReserveMinimumPriceInr(undefined);

      setDescription('');
      setAmenities(['24/7 Security', 'Power Backup', 'Clubhouse']);
      setDeveloperName('');
      setDeveloperLogoUrl('');
      setDeveloperReraId('');
      setDeveloperLaunchYear(undefined);
      setLandmarks([]);
      setHighlights([]);

      setListingStatus('DRAFT');
      setImages([]);
      setValidationErrors(null);
    }
  }, [property, isOpen]);

  // Staff Authorization and Session Helper
  const getCrmHeaders = (extraHeaders: Record<string, string> = {}): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extraHeaders };
    try {
      const stored = sessionStorage.getItem('sellmyghar_staff_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed?.token || parsed?.user?.token;
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {}
    return headers;
  };

  const crmFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = getCrmHeaders(init?.headers as Record<string, string> || {});
    return fetch(url, {
      ...init,
      headers,
      credentials: 'include',
    });
  };

  // Fetch real property activity logs
  const fetchActivity = async () => {
    if (!property?.id) return;
    setLoadingActivity(true);
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/activity`);
      if (res.ok) {
        const data = await res.json();
        if (data.activity && Array.isArray(data.activity)) {
          setActivityLogs(data.activity);
        }
      }
    } catch {
      // Keep state
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ACTIVITY' && property?.id) {
      fetchActivity();
    }
  }, [activeTab, property?.id]);

  if (!isOpen) return null;

  // Save / Update Property
  const getPayload = () => {
    const finalTitle = title.trim() || (projectName.trim() ? `${projectName.trim()} - ${bhkType}` : (publicAddress.trim() || 'Residential Property'));
    const payload: any = {
      title: finalTitle,
      projectName: projectName.trim(),
      locality: localityName.trim(),
      propertyType,
      bhkType,
      superBuiltUpSqft: Number(superBuiltUpSqft) || 1200,
      carpetAreaSqft: Number(carpetAreaSqft) || 936,
      floorBand,
      facing,
      publicAddress: publicAddress.trim() || `${projectName.trim()}, ${localityName.trim()}`.replace(/^,\s*|,\s*$/g, ''),
      askingPriceInr: Number(askingPriceInr) || 0,
      monthlyMaintenanceInr: Number(monthlyMaintenanceInr) || 0,
      description: description.trim(),
      amenities,
      developerName: developerName.trim(),
      developerLogoUrl: developerLogoUrl.trim() || undefined,
      developerReraId: developerReraId.trim() || undefined,
      developerLaunchYear: developerLaunchYear ? Number(developerLaunchYear) : undefined,
      landmarks,
      highlights,
      floorPlanUrl: floorPlanUrl.trim() || undefined,
      floorPlans: floorPlanUrl.trim() ? [
        {
          id: 'fp-1',
          title: floorPlanTitle.trim() || `${bhkType} Architectural Layout Plan`,
          carpetAreaSqft: Number(carpetAreaSqft),
          superBuiltUpSqft: Number(superBuiltUpSqft),
          imageUrl: floorPlanUrl.trim(),
          tag: 'Verified Layout'
        }
      ] : undefined,
    };

    if (reserveMinimumPriceInr !== undefined && !isNaN(Number(reserveMinimumPriceInr))) {
      payload.reserveMinimumPriceInr = Number(reserveMinimumPriceInr);
    }
    return payload;
  };

  const handleSaveInternal = async () => {
    const payload = getPayload();
    let res: Response;
    if (isCreate) {
      res = await crmFetch('/api/crm/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } else {
      res = await crmFetch(`/api/crm/properties/${property.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Failed to save property changes');
    }
    return data;
  };

  // Save / Update Property
  const handleSave = async () => {
    setSaving(true);
    setValidationErrors(null);
    try {
      await handleSaveInternal();
      showToast(isCreate ? 'Property created as DRAFT in PostgreSQL' : 'Property changes saved successfully');
      onSaved();
      if (isCreate) {
        onClose();
      }
    } catch (err: any) {
      alert(err.message || 'Network error while saving property');
    } finally {
      setSaving(false);
    }
  };

  // Status Transition: Approve (Legal Verification & Automated Confirmation Email)
  const handleApprove = async () => {
    if (!property?.id) return;
    setApproving(true);
    try {
      await handleSaveInternal();
      const res = await crmFetch(`/api/crm/properties/${property.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to approve property');
        return;
      }
      showToast('Property verified and approved! Automated confirmation email dispatched to owner.');
      if (onUpdate) onUpdate();
      else onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to approve property');
    } finally {
      setApproving(false);
    }
  };

  // Combined Status Transition: Approve & List (1-Click legal approval + live publication)
  const handleApproveAndPublish = async () => {
    if (!property?.id) return;
    setApproving(true);
    setTransitioning(true);
    setValidationErrors(null);
    try {
      // 0. Auto-save current form values before publishing
      await handleSaveInternal();

      // 1. Approve
      const approveRes = await crmFetch(`/api/crm/properties/${property.id}/approve`, {
        method: 'POST',
      });
      const approveData = await approveRes.json().catch(() => ({}));
      if (!approveRes.ok) {
        throw new Error(approveData.message || approveData.error || 'Failed to approve property');
      }

      // 2. Publish with payload
      const payload = getPayload();
      const publishRes = await crmFetch(`/api/crm/properties/${property.id}/publish`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const publishData = await publishRes.json().catch(() => ({}));
      if (publishRes.status === 422) {
        setValidationErrors({
          missingFields: publishData.missingFields || [],
          message: publishData.message || 'Cannot publish property. Minimum public data required.',
        });
        showToast('Approved! But publication requires missing fields');
        return;
      }
      if (!publishRes.ok) {
        throw new Error(publishData.message || publishData.error || 'Property was approved, but failed to publish live.');
      }

      setListingStatus('PUBLISHED');
      showToast('Property verified, approved & published live on market!');
      if (onUpdate) onUpdate();
      else onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to approve and list property');
    } finally {
      setApproving(false);
      setTransitioning(false);
    }
  };

  // Status Transition: Publish
  const handlePublish = async () => {
    if (!property?.id) {
      alert('Please save the property first before publishing.');
      return;
    }
    setTransitioning(true);
    setValidationErrors(null);
    try {
      // 0. Auto-save current form values before publishing
      await handleSaveInternal();

      const payload = getPayload();
      const res = await crmFetch(`/api/crm/properties/${property.id}/publish`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 422) {
        setValidationErrors({
          missingFields: data.missingFields || [],
          message: data.message || 'Cannot publish property. Minimum public data required.',
        });
        showToast('Validation failed: Required public fields are missing');
        return;
      }

      if (!res.ok) {
        alert(data.message || data.error || 'Failed to publish property');
        return;
      }

      setListingStatus('PUBLISHED');
      showToast('Property published successfully to public website');
      if (onUpdate) onUpdate();
      else onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to publish property');
    } finally {
      setTransitioning(false);
    }
  };

  // Status Transition: Pause
  const handlePause = async () => {
    if (!property?.id) return;
    setTransitioning(true);
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/pause`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to pause property');
        return;
      }
      setListingStatus('PAUSED');
      showToast('Property listing paused (removed from public inventory)');
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to pause property');
    } finally {
      setTransitioning(false);
    }
  };

  // Status Transition: Mark Sold
  const handleMarkSold = async () => {
    if (!property?.id) return;
    const confirmSold = window.confirm('Are you sure you want to mark this property as SOLD? Public buyer enquiries will be disabled.');
    if (!confirmSold) return;

    setTransitioning(true);
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/sold`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to mark property as sold');
        return;
      }
      setListingStatus('SOLD');
      showToast('Property marked as SOLD');
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to mark sold');
    } finally {
      setTransitioning(false);
    }
  };

  // Status Transition: Archive
  const handleArchive = async () => {
    if (!property?.id) return;
    const confirmArchive = window.confirm('Are you sure you want to archive this property listing?');
    if (!confirmArchive) return;

    setTransitioning(true);
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/archive`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to archive property');
        return;
      }
      setListingStatus('ARCHIVED');
      showToast('Property archived successfully');
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Failed to archive property');
    } finally {
      setTransitioning(false);
    }
  };

  // Image Upload Handler (Direct secure single-layer upload with ClamAV & Supabase)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!property?.id) {
      alert('Please save the property first before uploading photos.');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await crmFetch(`/api/crm/properties/${property.id}/images`, {
            method: 'POST',
            body: JSON.stringify({
              fileName: file.name,
              fileBase64: base64,
              isFeatured: images.length === 0,
            }),
          });
          const data = await res.json();
          if (res.ok && data.media) {
            setImages(prev => [...prev, data.media]);
            showToast('Photo verified with ClamAV and uploaded to gallery');
            if (onUpdate) onUpdate();
          } else {
            alert(data.message || data.error || 'Failed to upload photo');
          }
        } catch (innerErr: any) {
          alert(innerErr.message || 'Upload processing failed');
        } finally {
          setUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(err.message || 'Failed to read file');
      setUploadingImage(false);
    }
  };

  // Move / Reorder Image
  const handleMoveImage = async (index: number, direction: 'LEFT' | 'RIGHT') => {
    if (!property?.id) return;
    const targetIndex = direction === 'LEFT' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const updated = [...images];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setImages(updated);

    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/images/reorder`, {
        method: 'POST',
        body: JSON.stringify({ imageIds: updated.map(img => img.id) }),
      });
      if (res.ok) {
        showToast('Gallery image ordering saved');
        if (onUpdate) onUpdate();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save image order');
      }
    } catch {
      alert('Network error while reordering images');
    }
  };

  // Add Image via Direct URL
  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;
    if (!property?.id) {
      alert('Please save property first.');
      return;
    }
    setUploadingImage(true);
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/images`, {
        method: 'POST',
        body: JSON.stringify({
          url: newImageUrl.trim(),
          isFeatured: images.length === 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.media) {
        setImages(prev => [...prev, data.media]);
        setNewImageUrl('');
        showToast('Image added to gallery');
        if (onUpdate) onUpdate();
      } else {
        alert(data.error || 'Failed to add image');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Set Primary Image
  const handleSetPrimary = async (imageId: string) => {
    if (!property?.id) return;
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/images/${imageId}/primary`, {
        method: 'POST',
      });
      if (res.ok) {
        setImages(prev => prev.map(img => ({
          ...img,
          is_featured: img.id === imageId,
        })));
        showToast('Primary cover image updated');
        if (onUpdate) onUpdate();
      }
    } catch {
      alert('Failed to set primary image');
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!property?.id) return;
    try {
      const res = await crmFetch(`/api/crm/properties/${property.id}/images/${imageId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        showToast('Image removed from gallery');
        if (onUpdate) onUpdate();
      }
    } catch {
      alert('Failed to delete image');
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (amenities.includes(amenity)) {
      setAmenities(amenities.filter(a => a !== amenity));
    } else {
      setAmenities([...amenities, amenity]);
    }
  };

  const addLandmark = () => {
    if (landmarkInput.trim() && !landmarks.includes(landmarkInput.trim())) {
      setLandmarks([...landmarks, landmarkInput.trim()]);
      setLandmarkInput('');
    }
  };

  const removeLandmark = (item: string) => {
    setLandmarks(landmarks.filter(l => l !== item));
  };

  const addHighlight = () => {
    if (highlightInput.trim() && !highlights.includes(highlightInput.trim())) {
      setHighlights([...highlights, highlightInput.trim()]);
      setHighlightInput('');
    }
  };

  const removeHighlight = (item: string) => {
    setHighlights(highlights.filter(h => h !== item));
  };

  const pricePerSqftComputed = superBuiltUpSqft > 0 ? Math.round(askingPriceInr / superBuiltUpSqft) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-['Montserrat'] animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-60 bg-[#172033] text-white px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#244B8F] text-white flex items-center justify-center font-black text-sm shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#244B8F]">
                  {isCreate ? 'Create Property Inventory' : `Edit Property • ${property.id}`}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  listingStatus === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  listingStatus === 'DRAFT' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  listingStatus === 'PAUSED' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                  listingStatus === 'SOLD' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                  'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {listingStatus}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[#172033] mt-0.5">
                {title || (isCreate ? 'New Listing Draft' : property.projectName)}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isCreate && listingStatus === 'PUBLISHED' && (
              <a
                href={`/property/${property.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                title="View public live listing in new tab"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Public</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Validation Failure Callout Banner */}
        {validationErrors && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationErrors.message || 'Cannot publish property. Minimum public data required.'}</span>
            </div>
            {validationErrors.missingFields && validationErrors.missingFields.length > 0 && (
              <div className="pt-1">
                <span className="font-semibold text-[11px] block text-rose-800">Missing Required Fields:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {validationErrors.missingFields.map((field) => (
                    <span
                      key={field}
                      className="px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-300 font-mono text-[10px] font-bold"
                    >
                      {field.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 bg-white flex items-center space-x-2 text-xs font-bold shrink-0">
          {[
            { key: 'BASIC', label: 'Basic Info', icon: Building2 },
            { key: 'PRICING', label: 'Pricing', icon: DollarSign },
            { key: 'CONTENT', label: 'Content & Details', icon: FileText },
            { key: 'IMAGES', label: `Images (${images.length})`, icon: ImageIcon },
            { key: 'FLOOR_PLAN', label: 'Floor Plan', icon: LayoutGrid },
            ...(!isCreate ? [{ key: 'ACTIVITY', label: 'Activity Timeline', icon: History }] : []),
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as EditorTab)}
                className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'border-[#244B8F] text-[#244B8F]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-slate-50/40">
          
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'BASIC' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Listing Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sobha Dream Acres - High Floor 2BHK"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Public headline shown on listing cards.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Project / Society Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Prestige Falcon City"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Locality / Micro-Market <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={localityName}
                    onChange={(e) => setLocalityName(e.target.value)}
                    placeholder="e.g. Panathur / Balagere, East Bengaluru"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Public Location / Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={publicAddress}
                    onChange={(e) => setPublicAddress(e.target.value)}
                    placeholder="e.g. Kanakapura Road, South Bengaluru"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Never includes confidential unit or flat numbers.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Property Type</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  >
                    <option value="Apartment">Apartment</option>
                    <option value="Villa">Villa / Row House</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Plot">Residential Plot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">BHK Configuration</label>
                  <select
                    value={bhkType}
                    onChange={(e) => setBhkType(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="4BHK+">4 BHK+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Super Built-Up Area (SBUA sq.ft) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={superBuiltUpSqft}
                    onChange={(e) => setSuperBuiltUpSqft(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Carpet Area (sq.ft)</label>
                  <input
                    type="number"
                    value={carpetAreaSqft}
                    onChange={(e) => setCarpetAreaSqft(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Floor Band</label>
                  <input
                    type="text"
                    value={floorBand}
                    onChange={(e) => setFloorBand(e.target.value)}
                    placeholder="e.g. Floor 8 of 14 (Mid Floor)"
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facing</label>
                  <select
                    value={facing}
                    onChange={(e) => setFacing(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  >
                    <option value="EAST">EAST</option>
                    <option value="NORTH">NORTH</option>
                    <option value="WEST">WEST</option>
                    <option value="SOUTH">SOUTH</option>
                    <option value="NORTH-EAST">NORTH-EAST</option>
                    <option value="SOUTH-EAST">SOUTH-EAST</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING */}
          {activeTab === 'PRICING' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Asking Price (INR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={askingPriceInr}
                    onChange={(e) => setAskingPriceInr(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden text-sm"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Formatted: <strong>₹{(askingPriceInr / 10000000).toFixed(2)} Cr</strong></span>
                    <span>Rate: <strong>₹{pricePerSqftComputed.toLocaleString()} / sq.ft</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Monthly Maintenance (INR)
                  </label>
                  <input
                    type="number"
                    value={monthlyMaintenanceInr}
                    onChange={(e) => setMonthlyMaintenanceInr(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Estimated society maintenance per month.</span>
                </div>

                {/* Confidential Reserve Price: Only visible to Super Admin or Deal Closer */}
                {(staffRole === 'STAFF_SUPER_ADMIN' || staffRole === 'STAFF_DEAL_CLOSER') && (
                  <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-700" />
                        <span>Confidential Owner Reserve Minimum Price (INR)</span>
                      </span>
                      <span className="text-[10px] font-mono bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded font-bold">
                        RESTRICTED ACCESS
                      </span>
                    </div>
                    <input
                      type="number"
                      value={reserveMinimumPriceInr || ''}
                      onChange={(e) => setReserveMinimumPriceInr(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 9500000"
                      className="w-full p-2.5 rounded-lg border border-purple-300 bg-white font-bold text-purple-950 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-purple-700 mt-1 block">
                      Protected floor price for deal negotiation. Never exposed to buyers or public endpoints.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTENT & DETAILS */}
          {activeTab === 'CONTENT' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Property Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed property highlights, views, sunlight orientation, modular fittings, and society amenities..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-sans text-xs focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Required before publishing to the public catalog.
                </span>
              </div>

              {/* Developer & Brand Details Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#244B8F]" />
                    <span>Developer & Project Brand Details</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Public Builder Profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Developer / Builder Name</label>
                    <input
                      type="text"
                      value={developerName}
                      onChange={(e) => setDeveloperName(e.target.value)}
                      placeholder="e.g. Sobha Limited / Prestige Group"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Developer Logo URL</label>
                    <div className="flex items-center space-x-2">
                      {developerLogoUrl ? (
                        <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
                          <img
                            src={developerLogoUrl}
                            alt="Developer Logo"
                            className="max-h-full max-w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-lg border border-dashed border-slate-300 bg-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <input
                        type="url"
                        value={developerLogoUrl}
                        onChange={(e) => setDeveloperLogoUrl(e.target.value)}
                        placeholder="https://.../logo.png"
                        className="flex-1 p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Statutory RERA ID</label>
                    <input
                      type="text"
                      value={developerReraId}
                      onChange={(e) => setDeveloperReraId(e.target.value)}
                      placeholder="e.g. PRM/KA/RERA/1251/310/PR/2026/001"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Launch Year</label>
                    <input
                      type="number"
                      value={developerLaunchYear || ''}
                      onChange={(e) => setDeveloperLaunchYear(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 2021"
                      className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Society & Home Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_AMENITIES.map((amenity) => {
                    const isSelected = amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#244B8F] text-[#244B8F] font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] truncate">{amenity}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Landmarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nearby Landmarks & Connectivity</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={landmarkInput}
                    onChange={(e) => setLandmarkInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLandmark())}
                    placeholder="e.g. 5 mins from Varthur Kodi Metro"
                    className="flex-1 p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addLandmark}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {landmarks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {landmarks.map((l) => (
                      <span key={l} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px]">
                        <span>{l}</span>
                        <button type="button" onClick={() => removeLandmark(l)} className="hover:text-rose-600 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Highlights */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Key Property Highlights</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                    placeholder="e.g. Vastu Compliant East Facing Unit"
                    className="flex-1 p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {highlights.map((h) => (
                      <span key={h} className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-50 text-[#244B8F] text-[11px] font-semibold">
                        <span>{h}</span>
                        <button type="button" onClick={() => removeHighlight(h)} className="hover:text-rose-600 cursor-pointer">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: IMAGES & GALLERY */}
          {activeTab === 'IMAGES' && (
            <div className="space-y-5">
              {/* Image Upload Box */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-center space-y-2">
                <Upload className="w-6 h-6 text-[#244B8F]" />
                <div>
                  <label className="inline-block px-4 py-2 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs transition-colors">
                    {uploadingImage ? 'Scanning & Uploading...' : 'Upload Property Photo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploadingImage || isCreate}
                      className="hidden"
                    />
                  </label>
                  {isCreate && (
                    <span className="text-[11px] text-amber-600 block mt-1">
                      Save property as draft first before uploading images.
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  JPEG, PNG, WebP up to 10MB. Automatically checked by ClamAV and saved to Supabase Storage.
                </p>

                {/* Direct URL input fallback */}
                <div className="w-full max-w-md pt-3 border-t border-slate-100 flex items-center space-x-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste direct image URL..."
                    disabled={isCreate}
                    className="flex-1 p-2 rounded-lg border border-slate-200 text-xs bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    disabled={!newImageUrl.trim() || isCreate || uploadingImage}
                    className="px-3 py-2 bg-slate-800 text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Uploaded Gallery ({images.length} photos)
                </h4>
                {images.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                    No images uploaded yet. At least 1 primary image is required to publish.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img, index) => (
                      <div
                        key={img.id}
                        className={`relative rounded-xl overflow-hidden border bg-white group shadow-2xs ${
                          img.is_featured ? 'ring-2 ring-[#244B8F] border-[#244B8F]' : 'border-slate-200'
                        }`}
                      >
                        <div className="aspect-4/3 w-full overflow-hidden bg-slate-100">
                          <img 
                            src={img.url} 
                            alt="Property" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.dataset.hasFallback) {
                                target.dataset.hasFallback = 'true';
                                target.src = getDistinctCommunityPhoto(`${property?.id || ''}-img-${img.id}`, 800);
                              }
                            }}
                          />
                        </div>
                        
                        {img.is_featured && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#244B8F] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-white" />
                            <span>Primary</span>
                          </div>
                        )}

                        <div className="p-2 flex items-center justify-between bg-white border-t border-slate-100">
                          <div className="flex items-center space-x-0.5">
                            {!img.is_featured && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimary(img.id)}
                                className="text-[10px] font-bold text-[#244B8F] hover:underline cursor-pointer mr-1"
                              >
                                Primary
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'LEFT')}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-25 cursor-pointer"
                              title="Move Left"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveImage(index, 'RIGHT')}
                              disabled={index === images.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-25 cursor-pointer"
                              title="Move Right"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FLOOR PLAN (Added for architectural 2D/3D layouts) */}
          {activeTab === 'FLOOR_PLAN' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Architectural Floor Plan</h3>
                    <p className="text-[11px] text-slate-500">
                      Upload or link high-resolution architectural layout showing room dimensions and vastu orientation.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-[#244B8F] rounded-full border border-blue-200">
                    Client-Visible Feature
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Floor Plan Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={floorPlanUrl}
                        onChange={(e) => setFloorPlanUrl(e.target.value)}
                        placeholder="https://example.com/floorplans/unit-layout.png"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#244B8F] focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setFloorPlanUrl('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer shrink-0"
                      >
                        Sample Plan
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Floor Plan Title & Description
                    </label>
                    <input
                      type="text"
                      value={floorPlanTitle}
                      onChange={(e) => setFloorPlanTitle(e.target.value)}
                      placeholder="e.g. 3 BHK Architectural Layout (Zero Dead Space)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:border-[#244B8F] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Floor Plan Preview */}
                {floorPlanUrl ? (
                  <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Floor Plan Preview:</span>
                      <button
                        type="button"
                        onClick={() => setFloorPlanUrl('')}
                        className="text-rose-600 hover:underline text-[11px] cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="max-h-72 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2">
                      <img
                        src={floorPlanUrl}
                        alt="Floor plan preview"
                        className="max-h-64 object-contain mx-auto"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2 bg-slate-50/50">
                    <LayoutGrid className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No Floor Plan Linked Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Provide a URL or click "Sample Plan" to attach a 2D/3D floor layout for this apartment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVITY TIMELINE */}
          {activeTab === 'ACTIVITY' && !isCreate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Immutable Property Audit Trail
                </span>
                <button
                  type="button"
                  onClick={fetchActivity}
                  disabled={loadingActivity}
                  className="text-xs font-bold text-[#244B8F] hover:underline cursor-pointer flex items-center space-x-1"
                >
                  {loadingActivity && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Refresh</span>
                </button>
              </div>

              {loadingActivity ? (
                <div className="p-8 text-center text-slate-400">Loading activity timeline...</div>
              ) : activityLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
                  No audit activity logged for this property yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-start justify-between text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            log.action === 'PROPERTY_PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                            log.action === 'PROPERTY_PAUSED' ? 'bg-orange-100 text-orange-800' :
                            log.action === 'PROPERTY_SOLD' ? 'bg-purple-100 text-purple-800' :
                            log.action === 'PROPERTY_ARCHIVED' ? 'bg-slate-100 text-slate-700' :
                            'bg-blue-50 text-[#244B8F]'
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-slate-400 text-[10px]">by {log.actorRole || 'STAFF'}</span>
                        </div>
                        {log.details && (
                          <pre className="text-[10px] text-slate-600 font-mono bg-slate-50 p-1.5 rounded max-w-lg truncate">
                            {JSON.stringify(log.details)}
                          </pre>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          {/* Status Transitions (Only shown when editing an existing property) */}
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            {!isCreate && (
              <>
                {/* Approve Listing (Triggers legal approval + automated notification to owner) */}
                <button
                  type="button"
                  disabled={approving || transitioning}
                  onClick={handleApprove}
                  className="px-3 py-1.5 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Approve legal documents and dispatch confirmation email to owner"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{approving ? 'Approving...' : 'Approve & Notify Owner'}</span>
                </button>

                {/* 1-Click Approve & List live on public portal */}
                {(listingStatus === 'DRAFT' || listingStatus === 'PAUSED' || !listingStatus) && (
                  <button
                    type="button"
                    disabled={approving || transitioning}
                    onClick={handleApproveAndPublish}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Verify title diligence and list live on public portal in one step"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{(approving || transitioning) ? 'Publishing...' : 'Approve & List'}</span>
                  </button>
                )}

                {/* DRAFT or PAUSED -> PUBLISH */}
                {(listingStatus === 'DRAFT' || listingStatus === 'PAUSED') && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={handlePublish}
                    className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Publish Listing</span>
                  </button>
                )}

                {/* PUBLISHED -> PAUSE */}
                {listingStatus === 'PUBLISHED' && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={handlePause}
                    className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>Pause Listing</span>
                  </button>
                )}

                {/* PUBLISHED or PAUSED -> MARK SOLD */}
                {(listingStatus === 'PUBLISHED' || listingStatus === 'PAUSED') && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={handleMarkSold}
                    className="px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Mark Sold</span>
                  </button>
                )}

                {/* DRAFT, PUBLISHED, PAUSED -> ARCHIVE */}
                {listingStatus !== 'ARCHIVED' && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={handleArchive}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archive</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Form Save & Cancel */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{isCreate ? 'Create Property Draft' : 'Save Changes'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
