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
  Eye
} from 'lucide-react';
import { PropertyListingStatus, CrmProperty } from './CrmDashboard';
import { StaffRole } from '../../core/types/auth';

interface PropertyEditorProps {
  property: CrmProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  staffRole?: StaffRole;
}

type EditorTab = 'BASIC' | 'PRICING' | 'CONTENT' | 'IMAGES' | 'ACTIVITY';

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
  staffRole
}: PropertyEditorProps) {
  const isCreate = !property || !property.id;

  const [activeTab, setActiveTab] = useState<EditorTab>('BASIC');
  const [saving, setSaving] = useState(false);
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
  const [landmarks, setLandmarks] = useState<string[]>([]);
  const [landmarkInput, setLandmarkInput] = useState('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState('');

  // Status & Media
  const [listingStatus, setListingStatus] = useState<PropertyListingStatus>('DRAFT');
  const [images, setImages] = useState<Array<{ id: string; url: string; is_featured?: boolean; created_at?: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

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
      setTitle(property.title || `${property.projectName} - ${property.bhkType}`);
      setProjectName(property.projectName || '');
      setLocalityName(property.localityName || '');
      setPropertyType(property.propertyType || 'Apartment');
      setBhkType(property.bhkType || '2BHK');
      setSuperBuiltUpSqft(property.superBuiltUpSqft || 1200);
      setCarpetAreaSqft(property.carpetAreaSqft || Math.round((property.superBuiltUpSqft || 1200) * 0.78));
      setFloorBand(property.floorBand || 'Floor 5 of 14');
      setFacing(property.facing || 'EAST');
      setPublicAddress(property.publicAddress || `${property.projectName}, ${property.localityName}`);

      setAskingPriceInr(property.askingPriceInr || 10000000);
      setMonthlyMaintenanceInr(property.monthlyMaintenanceInr || 0);
      setReserveMinimumPriceInr(property.reserveMinimumPriceInr);

      setDescription(property.description || '');
      setAmenities(property.amenities || []);
      setDeveloperName(property.developerName || property.projectName?.split(' ')[0] || '');
      setLandmarks(property.landmarks || []);
      setHighlights(property.highlights || []);

      setListingStatus(property.status || 'DRAFT');
      setImages(property.images || (property.image ? [{ id: 'img-main', url: property.image, is_featured: true }] : []));
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
      setLandmarks([]);
      setHighlights([]);

      setListingStatus('DRAFT');
      setImages([]);
      setValidationErrors(null);
    }
  }, [property, isOpen]);

  // Fetch real property activity logs
  const fetchActivity = async () => {
    if (!property?.id) return;
    setLoadingActivity(true);
    try {
      const res = await fetch(`/api/crm/properties/${property.id}/activity`);
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
  const handleSave = async () => {
    setSaving(true);
    setValidationErrors(null);
    try {
      const payload: any = {
        title: title.trim(),
        projectName: projectName.trim(),
        locality: localityName.trim(),
        propertyType,
        bhkType,
        superBuiltUpSqft: Number(superBuiltUpSqft),
        carpetAreaSqft: Number(carpetAreaSqft),
        floorBand,
        facing,
        publicAddress: publicAddress.trim(),
        askingPriceInr: Number(askingPriceInr),
        monthlyMaintenanceInr: Number(monthlyMaintenanceInr),
        description: description.trim(),
        amenities,
        developerName: developerName.trim(),
        landmarks,
        highlights,
      };

      if (reserveMinimumPriceInr !== undefined && !isNaN(Number(reserveMinimumPriceInr))) {
        payload.reserveMinimumPriceInr = Number(reserveMinimumPriceInr);
      }

      let res: Response;
      if (isCreate) {
        res = await fetch('/api/crm/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/crm/properties/${property.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Failed to save property');
        return;
      }

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

  // Status Transition: Publish
  const handlePublish = async () => {
    if (!property?.id) {
      alert('Please save the property first before publishing.');
      return;
    }
    setTransitioning(true);
    setValidationErrors(null);
    try {
      const res = await fetch(`/api/crm/properties/${property.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

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
      onSaved();
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
      const res = await fetch(`/api/crm/properties/${property.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/crm/properties/${property.id}/sold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`/api/crm/properties/${property.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  // Image Upload Handler
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
          // 1. Upload to storage
          const uploadRes = await fetch('/api/storage/upload-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileBase64: base64,
              propertyId: property.id,
              isFeatured: images.length === 0,
            }),
          });
          const uploadData = await uploadRes.json();
          if (!uploadRes.ok) {
            alert(uploadData.error || 'Failed to upload photo');
            return;
          }

          // 2. Add to property_media
          const imgUrl = uploadData.url;
          const addRes = await fetch(`/api/crm/properties/${property.id}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: imgUrl,
              isFeatured: images.length === 0,
            }),
          });
          const addData = await addRes.json();
          if (addRes.ok && addData.media) {
            setImages(prev => [...prev, addData.media]);
            showToast('Photo uploaded and verified');
            onSaved();
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

  // Add Image via Direct URL
  const handleAddImageUrl = async () => {
    if (!newImageUrl.trim()) return;
    if (!property?.id) {
      alert('Please save property first.');
      return;
    }
    setUploadingImage(true);
    try {
      const res = await fetch(`/api/crm/properties/${property.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        onSaved();
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
      const res = await fetch(`/api/crm/properties/${property.id}/images/${imageId}/primary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setImages(prev => prev.map(img => ({
          ...img,
          is_featured: img.id === imageId,
        })));
        showToast('Primary cover image updated');
        onSaved();
      }
    } catch {
      alert('Failed to set primary image');
    }
  };

  // Delete Image
  const handleDeleteImage = async (imageId: string) => {
    if (!property?.id) return;
    try {
      const res = await fetch(`/api/crm/properties/${property.id}/images/${imageId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        showToast('Image removed from gallery');
        onSaved();
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Developer / Builder Name</label>
                <input
                  type="text"
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  placeholder="e.g. Sobha Limited"
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden"
                />
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
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className={`relative rounded-xl overflow-hidden border bg-white group shadow-2xs ${
                          img.is_featured ? 'ring-2 ring-[#244B8F] border-[#244B8F]' : 'border-slate-200'
                        }`}
                      >
                        <div className="aspect-4/3 w-full overflow-hidden bg-slate-100">
                          <img src={img.url} alt="Property" className="w-full h-full object-cover" />
                        </div>
                        
                        {img.is_featured && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#244B8F] text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-white" />
                            <span>Primary</span>
                          </div>
                        )}

                        <div className="p-2 flex items-center justify-between bg-white border-t border-slate-100">
                          {!img.is_featured && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(img.id)}
                              className="text-[10px] font-bold text-[#244B8F] hover:underline cursor-pointer"
                            >
                              Set Primary
                            </button>
                          )}
                          <div className="flex-1" />
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

          {/* TAB 5: ACTIVITY TIMELINE */}
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
                {/* DRAFT or PAUSED -> PUBLISH */}
                {(listingStatus === 'DRAFT' || listingStatus === 'PAUSED') && (
                  <button
                    type="button"
                    disabled={transitioning}
                    onClick={handlePublish}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
