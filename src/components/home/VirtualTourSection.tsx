import React, { useState } from 'react';
import { 
  Eye, 
  RotateCw, 
  Compass, 
  Maximize2, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Layers,
  Camera,
  Play
} from 'lucide-react';

interface RoomView {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  hotspots: { x: number; y: number; label: string }[];
}

const SAMPLE_ROOMS: RoomView[] = [
  {
    id: 'living',
    name: 'Living & Dining Room',
    subtitle: 'Spacious 24 × 14 ft layout with Italian vitrified tiling',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
    hotspots: [
      { x: 32, y: 48, label: 'Full French Windows' },
      { x: 68, y: 38, label: 'Dining Alcove' },
      { x: 82, y: 62, label: 'Foyer Entrance' },
    ],
  },
  {
    id: 'balcony',
    name: 'Panoramic Skyline Balcony',
    subtitle: 'East-facing open vista with morning sunrise view',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
    hotspots: [
      { x: 45, y: 35, label: '180° Lake View' },
      { x: 22, y: 70, label: 'Toughened Glass Railing' },
      { x: 78, y: 55, label: 'Deck Seating Area' },
    ],
  },
  {
    id: 'master',
    name: 'Master Bedroom Suite',
    subtitle: 'Laminate wooden flooring with walk-in wardrobe space',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=85',
    hotspots: [
      { x: 38, y: 42, label: 'Attached Master Bath' },
      { x: 74, y: 52, label: 'Private Balcony Access' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Designer Modular Kitchen',
    subtitle: 'Granite countertop with piped gas & utility balcony',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
    hotspots: [
      { x: 40, y: 45, label: 'Chimney & Hob Provision' },
      { x: 62, y: 60, label: 'Utility Wash Area' },
    ],
  },
];

interface VirtualTourSectionProps {
  onExploreListings?: () => void;
}

export const VirtualTourSection: React.FC<VirtualTourSectionProps> = ({ onExploreListings }) => {
  const [activeRoomId, setActiveRoomId] = useState('living');
  const [panAngle, setPanAngle] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);

  const activeRoom = SAMPLE_ROOMS.find((r) => r.id === activeRoomId) || SAMPLE_ROOMS[0];

  const handleRotate = () => {
    setPanAngle((prev) => (prev + 90) % 360);
  };

  const handleScrollToListings = () => {
    if (onExploreListings) {
      onExploreListings();
    } else {
      const el = document.getElementById('listings');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-14 sm:py-20 bg-slate-900 text-white relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <RotateCw className="w-3.5 h-3.5 animate-spin-slow text-blue-400" />
            <span>360° Immersive Virtual Walkthroughs</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Experience Homes in 360°
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            In Listed Properties, SellMyGhar offers interactive 360-degree virtual walkthroughs. Prospective buyers explore room-by-room, inspect balcony views, and examine finishes before booking physical visits — filtering out unserious inquiries.
          </p>
        </div>

        {/* Interactive 360° Preview Viewer Card */}
        <div className="bg-slate-950/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Viewer Toolbar */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
            
            {/* Room Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {SAMPLE_ROOMS.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    setActiveRoomId(room.id);
                    setActiveHotspot(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRoomId === room.id
                      ? 'bg-[#244B8F] text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center space-x-2 text-xs">
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Rotate 360 view"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Rotate ({panAngle}°)</span>
              </button>

              <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active 360° Tour</span>
              </span>
            </div>

          </div>

          {/* 360 Viewer Canvas Element */}
          <div className="relative aspect-16/10 sm:aspect-21/9 overflow-hidden bg-black select-none group">
            
            <img
              src={activeRoom.image}
              alt={activeRoom.name}
              style={{
                transform: `scale(1.08) rotate(${panAngle * 0.05}deg)`,
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="w-full h-full object-cover filter brightness-95 contrast-105"
            />

            {/* Subtle Pan Grid Overlay */}
            <div className="absolute inset-0 bg-radial from-transparent via-black/10 to-black/40 pointer-events-none" />

            {/* 360 Rotation Compass Badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold text-white">
              <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
              <span>360° Interactive Room View</span>
            </div>

            {/* Hotspots */}
            {activeRoom.hotspots.map((spot, i) => (
              <div
                key={i}
                style={{ top: `${spot.y}%`, left: `${spot.x}%` }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                onClick={() => setActiveHotspot(activeHotspot === spot.label ? null : spot.label)}
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping" />
                  <button
                    type="button"
                    className="relative w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform hover:scale-110 cursor-pointer"
                    aria-label={spot.label}
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <div className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-950/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-xl border border-white/20 pointer-events-none">
                    {spot.label}
                  </div>
                </div>
              </div>
            ))}

            {/* Viewer Bottom Info Bar */}
            <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <p className="text-base sm:text-lg font-bold text-white">
                  {activeRoom.name}
                </p>
                <p className="text-xs sm:text-sm text-slate-300">
                  {activeRoom.subtitle}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleScrollToListings}
                  className="px-4 py-2 rounded-lg bg-[#244B8F] hover:bg-[#1B3A70] text-white text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Browse 360° Listed Homes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/80">
            <div className="p-5 sm:p-6 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-2">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Included With Every Listing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our field verification team captures high-definition 360° panoramas during the physical A-Khata inspection at zero charge to the owner.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-2">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Filter Out Window Shoppers</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Buyers inspect room flow, natural sunlight, and balcony orientation virtually, eliminating 80% of unfocused physical inquiries.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">Faster Buyer Closures</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Listings with 360° tours receive 3.4× more qualified offers from tech corridor professionals looking for ready-to-move flats.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
