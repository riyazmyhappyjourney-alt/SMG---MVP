import React from 'react';
import { Star, Quote, CheckCircle, ShieldCheck } from 'lucide-react';

export const CustomerReviewsSection: React.FC = () => {
  const reviews = [
    {
      name: 'Amit Verma',
      society: 'Brigade Gateway',
      locality: 'Rajajinagar',
      bhk: '3 BHK Sold in 38 Days',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      comment:
        'Very professional team. They gave the right valuation based on registered registry records and connected us with genuine buyers with pre-approved loans. No endless broker spam calls. Highly recommended!'
    },
    {
      name: 'Priya Nair',
      society: 'Sobha Dream Acres',
      locality: 'Panathur',
      bhk: '2 BHK Sold in 42 Days',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      comment:
        'Smooth and transparent process. They handled everything from buyer screening meetings to documentation, Form 15 EC verification, and final sub-registrar deed registration.'
    },
    {
      name: 'Suresh Kumar',
      society: 'Prestige Lakeside Habitat',
      locality: 'Varthur',
      bhk: '3 BHK Sold in 45 Days',
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      comment:
        'Got a good price for my flat and sold within a short time. The dedicated relationship manager escorted every single site visit. Excellent service and support.'
    }
  ];

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 text-[#0073E6] font-extrabold text-xs tracking-widest uppercase mb-2">
            <span className="w-5 h-0.5 bg-[#0073E6]"></span>
            <span>Verified Owner Reviews</span>
            <span className="w-5 h-0.5 bg-[#0073E6]"></span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            Real stories from verified Bengaluru homeowners who sold through SellMyGhar.
          </p>
        </div>

        {/* 3 Review Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-slate-50 rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:border-[#0073E6]/40 hover:bg-white hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* 5 Star Rating */}
                <div className="flex items-center space-x-1 text-amber-400 mb-3">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-slate-200/70 flex items-center space-x-3">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {rev.name}
                    </h4>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {rev.society}, {rev.locality}
                  </p>
                  <p className="text-[10px] font-semibold text-[#0073E6]">
                    {rev.bhk}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
