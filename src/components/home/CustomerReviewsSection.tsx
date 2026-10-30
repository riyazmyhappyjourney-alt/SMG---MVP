import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';
import { motion } from 'framer-motion';

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
        'Got a fair market price for my flat and sold within a short time. The dedicated relationship manager escorted every single site visit. Excellent service and support throughout closing.'
    }
  ];

  return (
    <section id="reviews" className="py-14 sm:py-20 bg-slate-50/70 border-t border-slate-200/60 font-['Montserrat',sans-serif]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center space-x-2 text-[#0073E6] font-extrabold text-[11px] sm:text-xs tracking-wider uppercase mb-2 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#0073E6]"></span>
            <span>Verified Owner Reviews</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-500 font-['Poppins'] font-normal leading-relaxed">
            Real stories from verified Bengaluru apartment owners who successfully sold through SellMyGhar.
          </p>
        </div>

        {/* 3 Review Cards with Hover Elevation Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {reviews.map((rev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: idx * 0.15 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-[#0073E6]/40 transition-all duration-300 flex flex-col justify-between space-y-4 relative group"
            >
              {/* Subtle Quote Icon Watermark */}
              <div className="absolute top-5 right-5 text-slate-100 group-hover:text-blue-50 transition-colors pointer-events-none">
                <Quote className="w-8 h-8 fill-current" />
              </div>

              <div>
                {/* 5 Star Rating */}
                <div className="flex items-center space-x-1 text-amber-400 mb-3.5">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-1.5 font-mono">5.0</span>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal font-['Poppins']">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-3">
                <img
                  src={rev.avatar}
                  alt={rev.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm ring-1 ring-slate-200"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {rev.name}
                    </h4>
                    <span title="Verified Homeowner" className="inline-flex">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {rev.society}, {rev.locality}
                  </p>
                  <p className="text-[10px] font-bold text-[#0073E6] mt-0.5">
                    {rev.bhk}
                  </p>
                </div>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
