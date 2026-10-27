import React, { useState, useEffect } from 'react';
import { 
  Image, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Download, 
  CheckCircle, 
  RefreshCw,
  Upload,
  AlertCircle
} from 'lucide-react';
import { safeFetch } from '../../utils/safeApi';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  alt_text: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const HeroCmsManager: React.FC = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New slide form state
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchSlides = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/hero-slides');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.slides)) {
          setSlides(data.slides);
          setDisplayOrder((data.slides.length || 0) + 1);
        }
      } else {
        setError('Failed to fetch hero slides from server');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to hero CMS API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      if (!altText) {
        setAltText(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      setError('Please provide an image URL or upload an image file');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await safeFetch('/api/cms/hero-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'Bengaluru Residential Resale',
          subtitle: subtitle.trim() || 'Verified Gated Community',
          image_url: imageUrl.trim(),
          alt_text: altText.trim() || title.trim() || 'SellMyGhar Hero Banner',
          display_order: Number(displayOrder) || 1,
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Slide successfully created!');
        setIsAdding(false);
        setTitle('');
        setSubtitle('');
        setImageUrl('');
        setAltText('');
        fetchSlides();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(data.error || 'Failed to create slide');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while saving slide');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      const res = await safeFetch(`/api/cms/hero-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !slide.is_active }),
      });
      if (res.ok) {
        fetchSlides();
      }
    } catch {
      // Ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this hero banner slide?')) return;
    try {
      const res = await safeFetch(`/api/cms/hero-slides/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSlides();
      }
    } catch {
      // Ignore
    }
  };

  const handleMove = async (index: number, direction: 'UP' | 'DOWN') => {
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    setSlides(newSlides);

    try {
      await safeFetch('/api/cms/hero-slides/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_ids: newSlides.map((s) => s.id) }),
      });
      fetchSlides();
    } catch {
      // Ignore
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 text-[#172033]">
      
      {/* Header and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Image className="w-5 h-5 text-[#0073E6]" />
            <h3 className="text-base font-extrabold text-[#172033]">
              Hero Banner Carousel CMS
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage sliding banners displayed on the SellMyGhar public homepage hero.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Download 1920x800 Design Specification Asset */}
          <a
            href="/api/cms/hero-slides/sample"
            download="sellmyghar-sample-hero-banner-1920x800.png"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            title="Download pixel-perfect 1920×800 sample graphic template"
          >
            <Download className="w-3.5 h-3.5 text-[#0073E6]" />
            <span>Sample 1920×800 Spec Template</span>
          </a>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'Add New Slide'}</span>
          </button>
        </div>
      </div>

      {/* Recommended Spec Guidelines Callout */}
      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 text-xs text-slate-700 space-y-1">
        <div className="font-bold text-[#0073E6] flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4" />
          <span>Recommended Image Specifications for Indian Real Estate Portals</span>
        </div>
        <p className="text-[11px] text-slate-600">
          • Recommended Dimensions: <strong>1920 × 800 pixels</strong> (Aspect Ratio: ~2.40:1).<br />
          • Safe Composition Zone: Keep prominent building architecture in the right 60%; left 40% reserved for high-contrast headline readability.<br />
          • Formats: WebP, PNG, or high-res JPG under 2.5 MB.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Add New Slide Form */}
      {isAdding && (
        <form onSubmit={handleCreateSlide} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
          <h4 className="font-bold text-slate-900 text-sm">Add New Hero Banner Slide</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Slide Title / Tag</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Prestige Shantiniketan Exterior"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Subtitle / Corridor</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Whitefield Tech Corridor"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or /images/..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Or Upload Local Image</label>
              <label className="flex items-center justify-center space-x-2 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600 font-medium">Choose File (1920x800)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {imageUrl && (
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Image Preview</span>
              <div className="h-32 w-full max-w-md overflow-hidden rounded-md bg-slate-900">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Accessibility Alt Text</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="e.g. Luxury township at sunset"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Display Order</label>
              <input
                type="number"
                min="1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pb-2">
              <input
                type="checkbox"
                id="is_active_check"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300 text-[#0073E6] cursor-pointer"
              />
              <label htmlFor="is_active_check" className="font-bold text-slate-700 cursor-pointer">
                Active on Live Site
              </label>
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#0073E6] text-white rounded-lg font-bold hover:bg-[#005BB5] transition-colors cursor-pointer"
            >
              {submitting ? 'Saving Slide...' : 'Save & Publish Slide'}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Slide Table / List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span>Active Slides ({slides.length})</span>
          <button
            type="button"
            onClick={fetchSlides}
            className="inline-flex items-center space-x-1 text-slate-500 hover:text-[#0073E6] cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading banner slides...</div>
        ) : slides.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            No custom slides created yet. The platform is using default fallback images.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {slides.map((slide, idx) => (
              <div
                key={slide.id}
                className="p-3.5 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                {/* Thumbnail & Info */}
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-20 h-12 bg-slate-900 rounded-md overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={slide.image_url}
                      alt={slide.alt_text}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 truncate">{slide.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        slide.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {slide.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      Alt: {slide.alt_text} • Order: #{slide.display_order}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'UP')}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => handleMove(idx, 'DOWN')}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(slide)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    {slide.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(slide.id)}
                    className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                    title="Delete Slide"
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
  );
};
