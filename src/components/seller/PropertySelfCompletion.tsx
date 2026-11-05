import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Home,
  Check
} from 'lucide-react';

interface PropertySelfCompletionProps {
  propertyId: string;
  token: string;
  onSuccess?: () => void;
  onBackToHome?: () => void;
}

export const PropertySelfCompletion: React.FC<PropertySelfCompletionProps> = ({
  propertyId,
  token,
  onSuccess,
  onBackToHome
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Editable property fields (matching internal PropertyEditor schema, excluding staff-only fields)
  const [title, setTitle] = useState('');
  const [projectName, setProjectName] = useState('');
  const [localityName, setLocalityName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [wingTower, setWingTower] = useState('');
  const [propertyType, setPropertyType] = useState('Apartment');
  const [bhkType, setBhkType] = useState('2 BHK');
  const [superBuiltUpSqft, setSuperBuiltUpSqft] = useState<number | ''>(1200);
  const [carpetAreaSqft, setCarpetAreaSqft] = useState<number | ''>(950);
  const [unitFloor, setUnitFloor] = useState<number | ''>(3);
  const [totalFloors, setTotalFloors] = useState<number | ''>(10);
  const [bathroomsCount, setBathroomsCount] = useState<number | ''>(2);
  const [balconiesCount, setBalconiesCount] = useState<number | ''>(1);
  const [facing, setFacing] = useState('EAST');
  const [askingPriceInr, setAskingPriceInr] = useState<number | ''>(10000000);
  const [monthlyMaintenanceInr, setMonthlyMaintenanceInr] = useState<number | ''>(3500);
  const [furnishing, setFurnishing] = useState('Semi-Furnished');
  const [description, setDescription] = useState('');
  const [publicAddress, setPublicAddress] = useState('');

  // Fetch token-verified property data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/seller/complete/${propertyId}?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || 'Invalid or expired self-completion token.');
        }

        if (isMounted && data.property) {
          const p = data.property;
          setTitle(p.title || '');
          setProjectName(p.project_name || p.project_locality_id || '');
          setLocalityName(p.locality || p.project_locality_id || '');
          setUnitNumber(p.unit_number || '');
          setWingTower(p.wing_tower || '');
          setPropertyType(p.property_type || 'Apartment');
          setBhkType(p.bhk_type || '2 BHK');
          setSuperBuiltUpSqft(p.super_built_up_sqft || 1200);
          setCarpetAreaSqft(p.carpet_area_sqft || 950);
          setUnitFloor(p.unit_floor || 1);
          setTotalFloors(p.total_floors || 10);
          setBathroomsCount(p.bathrooms_count || 2);
          setBalconiesCount(p.balconies_count || 1);
          setFacing(p.facing || 'EAST');
          setAskingPriceInr(Number(p.asking_price_inr) || 10000000);
          setMonthlyMaintenanceInr(Number(p.monthly_maintenance_inr) || 0);
          setFurnishing(p.furnishing || 'Semi-Furnished');
          setDescription(p.description || '');
          setPublicAddress(p.public_address || '');
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to access property details with this token.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (propertyId && token) {
      loadData();
    } else {
      setError('Missing property ID or access token.');
      setLoading(false);
    }

    return () => { isMounted = false; };
  }, [propertyId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        token,
        title: title.trim() || `${bhkType} in ${projectName || localityName}`,
        projectName: projectName.trim(),
        localityName: localityName.trim(),
        unit_number: unitNumber.trim(),
        wing_tower: wingTower.trim(),
        property_type: propertyType,
        bhk_type: bhkType,
        super_built_up_sqft: Number(superBuiltUpSqft) || 1200,
        carpet_area_sqft: Number(carpetAreaSqft) || 950,
        unit_floor: Number(unitFloor) || 1,
        total_floors: Number(totalFloors) || 10,
        bathrooms_count: Number(bathroomsCount) || 2,
        balconies_count: Number(balconiesCount) || 1,
        facing,
        asking_price_inr: Number(askingPriceInr) || 10000000,
        monthly_maintenance_inr: Number(monthlyMaintenanceInr) || 0,
        furnishing,
        description: description.trim(),
        public_address: publicAddress.trim()
      };

      const res = await fetch(`/api/seller/complete/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': (() => {
            const match = document.cookie.match(/sellmyghar_csrf=([^;]+)/);
            return match ? match[1] : '';
          })()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to save property specifications.');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error saving property specifications. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center max-w-sm w-full">
          <Loader2 className="w-8 h-8 text-[#0176D3] animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800">Verifying secure access link...</p>
          <p className="text-xs text-slate-500 mt-1">Loading property specifications</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center max-w-md w-full">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Secure Link Invalid or Expired</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">{error}</p>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-[#0176D3] hover:bg-[#005fb2] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs"
            >
              Return to Homepage
            </button>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-2xs text-center max-w-md w-full">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Property Details Saved</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Your property specifications have been recorded and sent to the SellMyGhar verification team. This one-time link has now expired for your security.
          </p>
          {onBackToHome && (
            <button
              onClick={onBackToHome}
              className="px-4 py-2 bg-[#0176D3] hover:bg-[#005fb2] text-white text-xs font-semibold rounded-md transition-colors shadow-2xs"
            >
              Go to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 text-[#0176D3] rounded-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Complete Property Specifications</h1>
              <p className="text-xs text-slate-500">Secure owner self-completion form for {propertyId}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-md border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#0176D3] shrink-0" />
            <span>Single-use encrypted link authorized by your assigned SellMyGhar representative. Internal pricing notes remain protected.</span>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-6">
          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              1. Basic Location & Building Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Apartment / Society Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  placeholder="e.g. Prestige Shantiniketan"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Locality <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={localityName}
                  onChange={(e) => setLocalityName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  placeholder="e.g. Whitefield"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tower / Block / Wing
                </label>
                <input
                  type="text"
                  value={wingTower}
                  onChange={(e) => setWingTower(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  placeholder="e.g. Tower 2, Wing A"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit / Flat Number
                </label>
                <input
                  type="text"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  placeholder="e.g. 504"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Unit Configuration */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              2. Unit Configuration & Areas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  BHK Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bhkType}
                  onChange={(e) => setBhkType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                >
                  <option value="1 BHK">1 BHK</option>
                  <option value="2 BHK">2 BHK</option>
                  <option value="3 BHK">3 BHK</option>
                  <option value="4 BHK">4 BHK</option>
                  <option value="5+ BHK">5+ BHK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Super Built-up Area (sq.ft.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={300}
                  max={25000}
                  value={superBuiltUpSqft}
                  onChange={(e) => setSuperBuiltUpSqft(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Carpet Area (sq.ft.)
                </label>
                <input
                  type="number"
                  min={200}
                  max={20000}
                  value={carpetAreaSqft}
                  onChange={(e) => setCarpetAreaSqft(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Floor
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={unitFloor}
                  onChange={(e) => setUnitFloor(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Floors in Tower
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Balconies
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={balconiesCount}
                  onChange={(e) => setBalconiesCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Facing
                </label>
                <select
                  value={facing}
                  onChange={(e) => setFacing(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                >
                  <option value="EAST">East</option>
                  <option value="WEST">West</option>
                  <option value="NORTH">North</option>
                  <option value="SOUTH">South</option>
                  <option value="NORTH_EAST">North-East</option>
                  <option value="SOUTH_EAST">South-East</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Furnishing
                </label>
                <select
                  value={furnishing}
                  onChange={(e) => setFurnishing(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                >
                  <option value="Unfurnished">Unfurnished</option>
                  <option value="Semi-Furnished">Semi-Furnished</option>
                  <option value="Fully-Furnished">Fully-Furnished</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Commercials */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              3. Commercial Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Price (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={500000}
                  max={1000000000}
                  value={askingPriceInr}
                  onChange={(e) => setAskingPriceInr(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  placeholder="e.g. 15000000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Maintenance (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={200000}
                  value={monthlyMaintenanceInr}
                  onChange={(e) => setMonthlyMaintenanceInr(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
                  placeholder="e.g. 4500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Highlights / Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
              4. Description & Key Features
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention unique features, terrace views, proximity to metro or tech parks..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3]"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Submitting will lock this single-use link and notify your assigned RM.
            </span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0176D3] hover:bg-[#005fb2] disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving Details...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Submit Property Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
