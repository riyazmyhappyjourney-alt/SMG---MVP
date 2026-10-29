import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Handshake, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';

interface HowItWorksProps {
  onPostProperty?: () => void;
  className?: string;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ 
  onPostProperty,
  className = '' 
}) => {
  const steps = [
    {
      num: 1,
      icon: FileText,
      color: 'bg-blue-50 text-[#0073E6] border-blue-200',
      numBg: 'bg-[#0073E6] text-white',
      title: 'Share Your Property Details',
      desc: 'Tell us your apartment, society, and configuration details in under a minute.'
    },
    {
      num: 2,
      icon: TrendingUp,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      numBg: 'bg-emerald-600 text-white',
      title: 'Get Resale Valuation',
      desc: 'Receive market-based pricing insights benchmarked against recent registry deeds.'
    },
    {
      num: 3,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      numBg: 'bg-indigo-600 text-white',
      title: 'Connect with Verified Buyers',
      desc: 'We bring serious, pre-screened buyers with approved loans. Zero cold broker spam.'
    },
    {
      num: 4,
      icon: Handshake,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      numBg: 'bg-amber-600 text-white',
      title: 'Complete the Sale',
      desc: 'Get dedicated legal support for sale deed drafting and Sub-Registrar registration.'
    }
  ];

  const handleStepClick = () => {
    const el = document.getElementById('hero-valuation-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (onPostProperty) {
      onPostProperty();
    }
  };

  return (
    <section id="how-it-works" className={`py-16 sm:py-24 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-18">
          <div className="inline-flex items-center space-x-2 text-[#0073E6] font-extrabold text-xs tracking-widest uppercase mb-2">
            <span className="w-5 h-0.5 bg-[#0073E6]"></span>
            <span>How It Works</span>
            <span className="w-5 h-0.5 bg-[#0073E6]"></span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Sell Your Flat in 4 Simple Steps
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            A structured, transparent selling journey designed to eliminate spam and protect your property's value.
          </p>
        </div>

        {/* 4 Steps Horizontal Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                onClick={handleStepClick}
                className="group relative bg-slate-50/80 rounded-2xl p-6 sm:p-7 border border-slate-200/80 hover:bg-white hover:border-[#0073E6]/40 hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Top: Step Number Badge + Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shadow-xs ${step.numBg}`}>
                      {step.num}
                    </span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0073E6] transition-colors leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200/60 flex items-center space-x-1 text-[11px] font-bold text-[#0073E6] group-hover:translate-x-1 transition-transform">
                  <span>Start Step {step.num}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
