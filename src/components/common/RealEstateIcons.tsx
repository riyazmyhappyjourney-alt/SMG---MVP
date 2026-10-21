import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Premium, cohesive SVG iconography designed specifically for
 * SellMyGhar.in real estate specifications, amenities, and landmarks.
 * Consistent 1.75px stroke weight, unified optical sizing, and crisp geometry.
 */

// --- 1. SPECIFICATION ICONS ---

export const SuperBuiltUpAreaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 21V9M9 3v6M15 9v12" />
  </svg>
);

export const CarpetAreaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M4 4h16v16H4z" />
    <path d="M8 4v16M16 4v16M4 8h16M4 16h16" strokeDasharray="1.5 2" />
    <path d="M7 7h10v10H7z" strokeWidth="2" />
  </svg>
);

export const FloorLevelIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 6h6M9 10h6M9 14h6M9 18h6" />
    <path d="M12 2v20" strokeDasharray="2 2" strokeOpacity="0.5" />
  </svg>
);

export const OrientationFacingIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <polygon points="12 6 15 13 12 11 9 13 12 6" fill="currentColor" fillOpacity="0.2" />
    <polygon points="12 18 15 13 12 11 9 13 12 18" />
  </svg>
);

export const BathroomsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 13h18c0 3.866-3.134 7-7 7H10c-3.866 0-7-3.134-7-7z" />
    <path d="M5 13V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
    <path d="M5 20l-1 2M19 20l1 2M10 7a1.5 1.5 0 0 1 3 0" />
  </svg>
);

export const BalconiesIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 12h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" />
    <path d="M3 16h18M6 12v10M10 12v10M14 12v10M18 12v10" />
    <path d="M5 12V3h14v9" />
  </svg>
);

export const CoveredParkingIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 7l9-4 9 4v13H3V7z" />
    <path d="M9 17v-6h3a2.5 2.5 0 0 1 0 5H9" />
  </svg>
);

export const MaintenanceLedgerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M8 8h8M8 12h5M8 16h7" />
  </svg>
);

// --- 2. AMENITIES ICONS ---

export const SwimmingPoolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M2 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M2 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />
    <path d="M8 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
    <path d="M12 9l-3 3-3-2M11 6l4 2 3-1" />
  </svg>
);

export const GymnasiumIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6 5v14M18 5v14M2 9v6M22 9v6M2 12h20M6 8h12M6 16h12" />
  </svg>
);

export const ClubhouseIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10z" />
    <path d="M9 21v-7h6v7M8 9h8" />
  </svg>
);

export const SportsCourtIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M12 4v16M2 12h20M7 4v16M17 4v16" />
  </svg>
);

export const PowerBackupIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M13 2l-4 9h6l-4 11" fill="currentColor" fillOpacity="0.1" />
  </svg>
);

export const SecurityCctvIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="3" />
    <path d="M12 8v1M12 13v1M9 11h1M14 11h1" />
  </svg>
);

export const LandscapedGardensIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 22V12M12 12c-3.5 0-6-2.5-6-6 4 0 6 3 6 6zM12 12c3.5 0 6-2.5 6-6-4 0-6 3-6 6z" />
    <path d="M4 22h16" />
  </svg>
);

export const PlayAreaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 21l6-15 6 15M9 6l6 15M5 16h14" />
    <path d="M12 6v6M10 12h4" />
  </svg>
);

export const WaterSupplyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    <path d="M12 8v5M10 11l2 2 2-2" />
  </svg>
);

export const EvChargingIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="4" width="12" height="16" rx="2" />
    <path d="M9 8v4h2l-3 4M15 9h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1M19 14v4" />
  </svg>
);

export const PipedGasIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

export const ElevatorIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M12 2v20M8 8l2-2 2 2M8 16l2 2 2-2" />
  </svg>
);

export const GenericAmenityCheckIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);

// --- 3. LANDMARK & TRANSIT ICONS ---

export const MetroTransitIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="4" y="3" width="16" height="15" rx="3" />
    <path d="M4 11h16M9 3v8M15 3v8M8 15h.01M16 15h.01M7 21l2-3M17 21l-2-3" />
  </svg>
);

export const TechParkWorkplaceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="6" width="10" height="15" rx="1" />
    <rect x="13" y="2" width="8" height="19" rx="1" />
    <path d="M6 10h4M6 14h4M6 18h4M16 6h2M16 10h2M16 14h2M16 18h2" />
  </svg>
);

export const HealthcareHospitalIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M10 9h4M12 7v4" strokeWidth="2" />
  </svg>
);

export const EducationSchoolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 3 3 5 6 5s6-2 6-5v-5" />
  </svg>
);

export const RetailShoppingMallIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

export const LandmarkPinIcon: React.FC<IconProps> = ({ className = 'w-5 h-5 text-[#0073E6]', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
);

// --- 4. DEVELOPER IDENTITY ARCHITECTURAL FALLBACK EMBLEM ---

export const DeveloperArchitecturalEmblem: React.FC<IconProps> = ({ className = 'w-8 h-8 text-[#0073E6]', size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {/* Institutional foundation base */}
    <path d="M4 27h24M6 27V12l6-4v19M12 8l8-4v23M20 16l6 3v8" />
    {/* Architectural fenestration grid */}
    <path d="M8 15h2M8 19h2M8 23h2M15 7h2M15 11h2M15 15h2M15 19h2M15 23h2M22 21h2M22 24h2" strokeWidth="1.5" />
  </svg>
);
