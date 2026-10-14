import React from 'react';

export const PropertyCardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs flex flex-col"
          aria-hidden="true"
        >
          {/* Image Placeholder with Aspect 16:10 */}
          <div className="relative aspect-16/10 overflow-hidden bg-slate-100 animate-brand-shimmer">
            <div className="absolute top-3 left-3 w-28 h-6 rounded-full bg-slate-200/80" />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-200/80" />
          </div>

          {/* Card Body */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              {/* BHK & Title */}
              <div className="h-5 w-3/4 rounded-md bg-slate-200 animate-brand-shimmer mb-2" />
              {/* Locality */}
              <div className="h-3.5 w-1/2 rounded-md bg-slate-100 animate-brand-shimmer" />
            </div>

            {/* Price & Area Specs */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-6 w-24 rounded-md bg-slate-200 animate-brand-shimmer" />
                <div className="h-3 w-16 rounded bg-slate-100" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-4 w-20 rounded bg-slate-200 animate-brand-shimmer ml-auto" />
                <div className="h-3 w-14 rounded bg-slate-100 ml-auto" />
              </div>
            </div>

            {/* Action Button Placeholder */}
            <div className="h-10 w-full rounded-xl bg-slate-100 animate-brand-shimmer" />
          </div>
        </div>
      ))}
    </>
  );
};
