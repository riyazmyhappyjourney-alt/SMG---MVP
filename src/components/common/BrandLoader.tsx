import React from 'react';
import { Building2 } from 'lucide-react';

interface BrandLoaderProps {
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BrandLoader: React.FC<BrandLoaderProps> = ({
  label = 'Loading verified listings...',
  sublabel = 'Connecting to Bengaluru title registry & inventory desk',
  size = 'md',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const containerSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      <div className="relative mb-4">
        {/* Outer Ring Ambient Pulse */}
        <div
          className={`${containerSizes[size]} rounded-2xl bg-blue-100/60 animate-ping absolute inset-0 opacity-40`}
          aria-hidden="true"
        />
        {/* Core Brand Square with Trust Blue */}
        <div
          className={`${containerSizes[size]} rounded-2xl bg-[#0073E6] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 relative z-10`}
        >
          <Building2 className={`${iconSizes[size]} animate-pulse`} />
        </div>
      </div>

      {label && (
        <p className="text-sm font-bold text-[#172033] tracking-tight font-['Montserrat']">
          {label}
        </p>
      )}
      {sublabel && (
        <p className="text-xs text-slate-500 mt-1 max-w-xs font-['Plus_Jakarta_Sans']">
          {sublabel}
        </p>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
};
