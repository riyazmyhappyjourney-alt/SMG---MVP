import React from 'react';

interface PartnerItem {
  id: string;
  name: string;
  logoSrc: string;
  alt: string;
  imgClass?: string;
}

export const TrustedPartnersMarquee: React.FC = () => {
  // Exactly the 4 requested premier builders using official high-res seeklogo/Wikimedia assets
  const partners: PartnerItem[] = [
    {
      id: 'godrej',
      name: 'Godrej Properties',
      logoSrc: '/images/partners/godrej.svg',
      alt: 'Godrej Properties',
      imgClass: 'h-9 sm:h-10 w-auto object-contain',
    },
    {
      id: 'brigade',
      name: 'Brigade Group',
      logoSrc: '/images/partners/brigade.svg',
      alt: 'Brigade Group',
      imgClass: 'h-10 sm:h-11 w-auto object-contain',
    },
    {
      id: 'sobha',
      name: 'Sobha Realty',
      logoSrc: '/images/partners/sobha.svg',
      alt: 'Sobha Realty',
      imgClass: 'h-8 sm:h-9 w-auto object-contain',
    },
    {
      id: 'prestige',
      name: 'Prestige Group',
      logoSrc: '/images/partners/Prestige_Group.png',
      alt: 'Prestige Group',
      imgClass: 'h-11 sm:h-12 w-auto object-contain',
    },
  ];

  // Tripled sequence for uninterrupted infinite continuous rolling loop
  const rollingItems = [...partners, ...partners, ...partners, ...partners];

  return (
    <section className="bg-white border-y border-slate-200 py-6 sm:py-7 overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif] select-none">
      
      {/* Clean Minimal Section Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 text-center">
        <p className="text-xs sm:text-sm font-extrabold tracking-widest uppercase text-slate-500">
          Trusted Channel Partners of
        </p>
      </div>

      {/* Edge Gradient Masks for Soft Seamless Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-white via-white/90 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-white via-white/90 to-transparent z-10 pointer-events-none" />

      {/* Seamless Continuous Rolling Loop of the 4 Official Builder Logos */}
      <div className="flex overflow-hidden">
        <div className="animate-partner-marquee flex items-center space-x-8 sm:space-x-12 py-2">
          {rollingItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="bg-white hover:bg-slate-50 px-6 sm:px-8 py-3 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer shrink-0 flex items-center justify-center min-w-[160px] sm:min-w-[190px] h-16 sm:h-20"
              title={item.name}
            >
              <img
                src={item.logoSrc}
                alt={item.alt}
                className={item.imgClass || 'h-10 w-auto object-contain'}
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
