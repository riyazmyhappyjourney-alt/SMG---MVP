import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Upload,
  AlertCircle,
  Eye,
  Sliders,
  Info
} from 'lucide-react';
import { safeFetchJson } from '../../utils/safeApi';

export interface PartnerLogo {
  id: string;
  name: string;
  logo_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PartnerSectionSettings {
  heading: string;
  scroll_speed: 'slow' | 'normal' | 'fast';
  pause_on_hover: boolean;
}

export const PartnerLogosManager: React.FC = () => {
  const [logos, setLogos] = useState<PartnerLogo[]>([]);
  const [settings, setSettings] = useState<PartnerSectionSettings>({
    heading: 'Trusted Channel Partners of',
    scroll_speed: 'normal',
    pause_on_hover: true,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Logo Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logosRes, settingsRes] = await Promise.all([
        safeFetchJson<{ success: boolean; logos: PartnerLogo[] }>('/api/cms/partner-logos?all=true'),
        safeFetchJson<{ success: boolean; settings: PartnerSectionSettings }>('/api/cms/partner-section'),
      ]);

      if (logosRes.ok && logosRes.data?.logos) {
        setLogos(logosRes.data.logos);
        setDisplayOrder((logosRes.data.logos.length || 0) + 1);
      } else if (logosRes.error) {
        setError(logosRes.error);
      }

      if (settingsRes.ok && settingsRes.data?.settings) {
        setSettings(settingsRes.data.settings);
      } else if (settingsRes.error && !logosRes.error) {
        setError(settingsRes.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to partner CMS APIs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Explicitly reject document files (PDF, Word, TXT, HTML, etc.)
    const fileNameLower = file.name.toLowerCase();
    const docExtensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.html', '.htm', '.xls', '.xlsx', '.csv', '.xml'];
    const isDocExtension = docExtensions.some(ext => fileNameLower.endsWith(ext));
    const isDocMime = file.type.startsWith('application/') || file.type.startsWith('text/');

    if (isDocExtension || (isDocMime && !file.type.includes('svg'))) {
      setError(`Document files ("${file.name}") are not supported for partner logos. Please select an image file (SVG, PNG, WebP, JPG).`);
      return;
    }

    // Supported image formats
    const validImageMimes = ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
    const isImageMime = validImageMimes.includes(file.type) || file.type.startsWith('image/');
    const isImageExt = ['.svg', '.png', '.webp', '.jpg', '.jpeg'].some(ext => fileNameLower.endsWith(ext));

    if (!isImageMime && !isImageExt) {
      setError('Please select a valid image file format: SVG vector, transparent PNG, WebP, or JPG.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 2MB limit for partner logos.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (fileNameLower.endsWith('.svg') || file.type.includes('svg')) {
        try {
          const raw = result.includes('base64,') ? atob(result.split('base64,')[1]) : result;
          if (!raw.includes('<svg')) {
            setError('The selected SVG file is invalid (missing <svg> element).');
            return;
          }
          if (/<script[\s>]/i.test(raw)) {
            setError('Security warning: SVG files containing script tags are not allowed.');
            return;
          }
        } catch {
          // Continue if atob inspection fails on browser-encoded data
        }
      }

      setLogoUrl(result);
      if (!name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      if (!altText) {
        setAltText(`${name || file.name.replace(/\.[^/.]+$/, '')} Official Channel Partner`);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setError(null);
    try {
      const response = await safeFetchJson<{ success: boolean; settings?: PartnerSectionSettings }>('/api/cms/partner-section', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok && response.data?.success) {
        setSuccessMsg('Partner section settings updated successfully!');
        if (response.data.settings) setSettings(response.data.settings);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response.error || 'Failed to update section settings.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a partner name (e.g. Prestige, Sobha, Brigade, Godrej)');
      return;
    }
    if (!logoUrl.trim()) {
      setError('Please upload a logo image or provide an image URL');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await safeFetchJson<{ success: boolean; logo?: PartnerLogo }>('/api/cms/partner-logos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          logo_url: logoUrl.trim(),
          alt_text: altText.trim() || `${name.trim()} Official Channel Partner`,
          display_order: Number(displayOrder) || 1,
          is_active: isActive,
        }),
      });

      if (response.ok && response.data?.success) {
        setSuccessMsg(`Logo for ${name} added successfully!`);
        setIsAdding(false);
        setName('');
        setLogoUrl('');
        setAltText('');
        fetchData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(response.error || 'Failed to create partner logo');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error saving partner logo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (logo: PartnerLogo) => {
    setError(null);
    try {
      const response = await safeFetchJson<{ success: boolean }>(`/api/cms/partner-logos/${logo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !logo.is_active }),
      });
      if (response.ok) {
        fetchData();
      } else {
        setError(response.error || 'Failed to toggle active status');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to toggle logo active status');
    }
  };

  const handleDelete = async (id: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to remove the logo for ${partnerName}?`)) return;
    setError(null);
    try {
      const response = await safeFetchJson<{ success: boolean }>(`/api/cms/partner-logos/${id}`, {
        method: 'DELETE',
      });
      if (response.ok && response.data?.success) {
        setSuccessMsg(`Removed logo for ${partnerName}`);
        fetchData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(response.error || 'Failed to delete logo');
      }
    } catch (err: any) {
      setError(err?.message || 'Error deleting logo');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= logos.length) return;

    const newLogos = [...logos];
    const [moved] = newLogos.splice(index, 1);
    newLogos.splice(targetIdx, 0, moved);

    setLogos(newLogos);
    try {
      const response = await safeFetchJson<{ success: boolean }>('/api/cms/partner-logos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoIds: newLogos.map((l) => l.id) }),
      });
      if (!response.ok) {
        setError(response.error || 'Failed to save new logo order');
        fetchData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save reordered logos');
      fetchData();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-8 text-[#172033]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#244B8F]" />
            <h3 className="text-base font-extrabold text-[#172033]">
              "Trusted Channel Partners of" Section CMS
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage premier developer partner logos, continuous scroll marquee animation, and section copy.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchData}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3.5 py-2 rounded-xl bg-[#244B8F] text-white text-xs font-bold hover:bg-[#1B396E] transition-colors cursor-pointer flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Cancel' : 'Add Partner Logo'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Section Settings Editor */}
      <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#244B8F]" />
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Marquee Display &amp; Copy Settings
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Applied immediately across homepage</span>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Section Heading</label>
            <input
              type="text"
              value={settings.heading}
              onChange={(e) => setSettings({ ...settings, heading: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
              placeholder="e.g. Trusted Channel Partners of"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Scroll Speed</label>
            <select
              value={settings.scroll_speed}
              onChange={(e) => setSettings({ ...settings, scroll_speed: e.target.value as any })}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
            >
              <option value="slow">Slow &amp; Subtle (32s)</option>
              <option value="normal">Normal Pace (24s)</option>
              <option value="fast">Fast (16s)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center justify-between gap-2">
            <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pause_on_hover}
                onChange={(e) => setSettings({ ...settings, pause_on_hover: e.target.checked })}
                className="w-4 h-4 rounded text-[#244B8F] focus:ring-[#244B8F] border-slate-300"
              />
              <span className="text-[11px]">Pause on Hover</span>
            </label>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              {savingSettings ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Add New Partner Logo Panel */}
      {isAdding && (
        <form onSubmit={handleCreateLogo} className="p-5 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#244B8F]">
              Add New Premier Developer Logo
            </h4>
            <span className="text-[11px] text-slate-500">Supports SVG vector or transparent PNG</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Developer / Builder Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Puravankara, Total Environment, Birla Estates"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Alt Text (Accessibility &amp; SEO)</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="e.g. Puravankara Official Channel Partner"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
              />
            </div>
          </div>

          {/* Logo File Upload / URL input */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-700">Logo Graphic File or URL</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-[#244B8F] text-xs font-bold text-[#244B8F] cursor-pointer flex items-center space-x-1.5 shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo File (SVG / PNG)</span>
                <input
                  type="file"
                  accept="image/svg+xml,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-400">or enter relative / CDN path:</span>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/images/partners/example.svg"
                className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
              />
            </div>

            {/* Live Logo Preview Box against Marquee background */}
            {logoUrl && (
              <div className="pt-2">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Preview Against Section Background:</span>
                <div className="inline-flex items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs min-w-[200px] h-18">
                  <img src={logoUrl} alt="Preview" className="h-10 w-auto object-contain max-w-[180px]" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-blue-200/60">
            <label className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#244B8F] focus:ring-[#244B8F] border-slate-300"
              />
              <span>Active in Public Marquee</span>
            </label>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {submitting ? 'Saving...' : 'Add Logo'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Upload Helper Panel (Standard Specifications) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center space-x-1.5">
          <Info className="w-4 h-4 text-[#244B8F]" />
          <span>Recommended Partner Logo Specifications</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-500 pt-1">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
            <strong className="text-slate-800 block mb-0.5">Recommended Dimensions</strong>
            <span>240 × 80 px (Aspect ~3:1) or native vector SVG</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
            <strong className="text-slate-800 block mb-0.5">Supported Formats</strong>
            <span>SVG (preferred for retina crispness), transparent PNG, WebP</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
            <strong className="text-slate-800 block mb-0.5">Maximum File Size</strong>
            <span>2 MB per logo asset</span>
          </div>
        </div>
      </div>

      {/* Active Logos Table / Card Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold uppercase tracking-wider text-slate-500 text-[10px]">
            Configured Logos ({logos.length})
          </span>
          <span className="text-[11px] text-slate-400">Order from left to right in continuous rolling marquee</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading partner logos...</div>
        ) : logos.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No partner logos configured. Click "Add Partner Logo" to begin.</div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
            {logos.map((logo, idx) => (
              <div 
                key={logo.id}
                className="p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors bg-white"
              >
                {/* Logo Thumbnail + Details */}
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Thumbnail Card */}
                  <div className="w-24 sm:w-28 h-14 bg-white rounded-lg border border-slate-200 p-2 flex items-center justify-center shrink-0 shadow-2xs">
                    <img 
                      src={logo.logo_url} 
                      alt={logo.alt_text} 
                      className="max-h-10 max-w-[90px] w-auto object-contain"
                    />
                  </div>

                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900">{logo.name}</h5>
                    <p className="text-[11px] text-slate-400">{logo.alt_text}</p>
                    <span className="text-[10px] text-slate-400 font-mono">Order: {idx + 1}</span>
                  </div>
                </div>

                {/* Status Toggle & Order Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(logo)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                      logo.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {logo.is_active ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                    <span>{logo.is_active ? 'Active' : 'Disabled'}</span>
                  </button>

                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveOrder(idx, 'UP')}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                      title="Move earlier"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === logos.length - 1}
                      onClick={() => handleMoveOrder(idx, 'DOWN')}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer border-l border-slate-200"
                      title="Move later"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(logo.id, logo.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
