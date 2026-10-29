import React from 'react';
import { 
  BadgePercent, 
  Users, 
  FileText, 
  Headphones, 
  Quote, 
  CheckCircle2, 
  ShieldCheck,
  Star
} from 'lucide-react';

export const WhySellMyGharSection: React.FC = () => {
  const features = [
    {
      icon: BadgePercent,
      color: 'bg-amber-100 text-amber-700',
      title: 'Verified Resale Pricing',
      description: 'Get accurate pricing insights based on actual Sub-Registrar circle rates and recent verified transactions in your society.'
    },
    {
      icon: Users,
      color: 'bg-emerald-100 text-emerald-700',
      title: 'Relevant Buyer Connections',
      description: 'Reach genuine, pre-screened buyers actively looking in your specific society with pre-approved bank loans.'
    },
    {
      icon: FileText,
      color: 'bg-blue-100 text-[#0073E6]',
      title: 'Documentation Support',
      description: 'Full legal title assistance, Encumbrance Certificate (EC) review, Khata verification, and sale agreement drafting.'
    },
    {
      icon: Headphones,
      color: 'bg-purple-100 text-purple-700',
      title: 'End-to-End Assistance',
      description: 'From free valuation to in-person escort at the Sub-Registrar office for final deed registration, we handle everything.'
    }
  ];

  return (
    <section id="why-sellmyghar" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading & 4 Feature Items */}
          <div className="lg:col-span-7 space-y-8">
            <div>
              <div className="inline-flex items-center space-x-2 text-[#0073E6] font-extrabold text-xs tracking-widest uppercase mb-2">
                <span className="w-6 h-0.5 bg-[#0073E6]"></span>
                <span>Why SellMyGhar</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                A Better Way to Sell Your Apartment
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                We make the resale process simple, transparent, and hassle-free for Bengaluru homeowners. Zero cold broker spam, complete statutory diligence.
              </p>
            </div>

            {/* 4 Feature Cards */}
            <div className="space-y-6">
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div key={idx} className="flex items-start space-x-4 group">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105 ${feat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Family Living Photo + Testimonial Callout Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
              {/* Couple / Family in Bengaluru Home */}
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1000&q=80"
                alt="Happy Bengaluru homeowners celebrating apartment resale"
                className="w-full h-[400px] sm:h-[480px] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none"></div>

              {/* Verified Trust Tag */}
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-1.5 shadow-md">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold text-slate-800">Verified Sale Deed Escort</span>
              </div>

              {/* Floating Quote Card (Matching Image 1 Reference) */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/60 space-y-2">
                <div className="flex items-start space-x-2 text-slate-700">
                  <Quote className="w-5 h-5 text-[#0073E6] shrink-0 rotate-180" />
                  <p className="text-xs sm:text-sm italic font-medium text-slate-800 leading-snug">
                    "Sold our apartment at a great price without any hassle. The team was very professional and helpful throughout the process."
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-1 border-t border-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    alt="Rohit and Neha Sharma"
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Rohit & Neha Sharma</h4>
                    <p className="text-[11px] text-slate-500">Prestige Shantiniketan, Whitefield</p>
                  </div>
                  <div className="ml-auto flex items-center text-amber-500 space-x-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
