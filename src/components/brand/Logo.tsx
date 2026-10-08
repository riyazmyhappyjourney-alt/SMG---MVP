import React from 'react';

interface LogoProps {
  className?: string;
  height?: number | string;
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  height = 44,
  alt = 'SellMyGhar',
}) => {
  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/logo.png"
        alt={alt}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: 'auto' }}
        className="object-contain max-h-full"
      />
    </div>
  );
};
