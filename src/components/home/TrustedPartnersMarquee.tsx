import React, { useState, useEffect } from 'react';
import { safeFetchJson } from '../../utils/safeApi';

interface PartnerItem {
  id: string;
  name: string;
  logoSrc: string;
  alt: string;
  imgClass?: string;
}

const DEFAULT_PARTNERS: PartnerItem[] = [
  {
    id: 'godrej',
    name: 'Godrej Properties',
    logoSrc: '/images/partners/godrej.svg',
    alt: 'Godrej Properties Official Channel Partner',
    imgClass: 'h-9 sm:h-10 w-auto object-contain',
  },
  {
    id: 'brigade',
    name: 'Brigade Group',
    logoSrc: '/images/partners/brigade.svg',
    alt: 'Brigade Group Official Channel Partner',
    imgClass: 'h-10 sm:h-11 w-auto object-contain',
  },
  {
    id: 'sobha',
    name: 'Sobha Realty',
    logoSrc: '/images/partners/sobha.svg',
    alt: 'Sobha Realty Official Channel Partner',
    imgClass: 'h-8 sm:h-9 w-auto object-contain',
  },
  {
    id: 'prestige',
    name: 'Prestige Group',
    logoSrc: '/images/partners/Prestige_Group.png',
    alt: 'Prestige Group Official Channel Partner',
    imgClass: 'h-11 sm:h-12 w-auto object-contain',
  },
];

export const TrustedPartnersMarquee: React.FC = () => {
  const [partners, setPartners] = useState<PartnerItem[]>(DEFAULT_PARTNERS);
  const [heading, setHeading] = useState<string>('Trusted Channel Partners of');
  const [scrollSpeed, setScrollSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [pauseOnHover, setPauseOnHover] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCmsData = async () => {
      try {
        const [logosRes, settingsRes] = await Promise.all([
          safeFetchJson<{ success: boolean; logos: any[] }>('/api/cms/partner-logos'),
          safeFetchJson<{ success: boolean; settings: any }>('/api/cms/partner-section'),
        ]);

        if (logosRes.ok && isMounted && logosRes.data?.success && Array.isArray(logosRes.data.logos) && logosRes.data.logos.length > 0) {
          const mapped = logosRes.data.logos.map((l: any) => ({
            id: l.id,
            name: l.name,
            logoSrc: l.logo_url,
            alt: l.alt_text || `${l.name} Channel Partner`,
            imgClass: 'h-9 sm:h-11 w-auto object-contain max-w-[160px]',
          }));
          setPartners(mapped);
        }

        if (settingsRes.ok && isMounted && settingsRes.data?.success && settingsRes.data.settings) {
          const s = settingsRes.data.settings;
          if (s.heading) setHeading(s.heading);
          if (s.scroll_speed) setScrollSpeed(s.scroll_speed);
          if (s.pause_on_hover !== undefined) setPauseOnHover(s.pause_on_hover);
        }
      } catch {
        // Retain default static partners if CMS is unreachable
      }
    };

    fetchCmsData();
    return () => { isMounted = false; };
  }, []);

  // Duplicate items 4 times to ensure seamless infinite looping on ultra-wide screens
  const rollingItems = [...partners, ...partners, ...partners, ...partners];

  // Dynamic animation duration based on CMS speed setting
  const durationClass = scrollSpeed === 'slow' ? '28s' : scrollSpeed === 'fast' ? '16s' : '22s';

  return (
    <section className="bg-white border-y border-slate-200 py-6 sm:py-7 overflow-hidden relative font-['Poppins',sans-serif] select-none w-full max-w-full">
      
      {/* Clean Minimal Section Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 text-center">
        <p className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-slate-500">
          {heading}
        </p>
      </div>

      {/* Edge Gradient Masks for Soft Seamless Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/90 to-transparent z-10 pointer-events-none" />

      {/* Seamless Continuous Rolling Loop of Builder Logos */}
      <div className="flex overflow-hidden w-full max-w-full">
        <div 
          className={`flex items-center space-x-6 sm:space-x-10 py-2 animate-partner-marquee ${
            pauseOnHover ? 'hover:[animation-play-state:paused]' : ''
          }`}
          style={{ animationDuration: durationClass }}
        >
          {rollingItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-white hover:bg-slate-50/80 px-6 sm:px-8 py-3 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 shrink-0 flex items-center justify-center min-w-[160px] sm:min-w-[190px] h-16 sm:h-20"
              title={item.name}
            >
              <img
                src={item.logoSrc}
                alt={item.alt}
                className={item.imgClass || 'h-9 sm:h-10 w-auto object-contain max-h-12'}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

    </section>
  );
};
