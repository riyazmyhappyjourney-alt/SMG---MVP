import React from 'react';
import { ArrowRight, ShieldCheck, Phone } from 'lucide-react';

export const CtaBanner: React.FC = () => {
  const scrollToForm = () => {
    const el = document.getElementById('hero-valuation-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-[#172033] text-white p-8 sm:p-12 lg:p-14 shadow-2xl border border-slate-800">
          
          {/* Subtle Background Glow */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#0073E6]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#0073E6] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-block">
                Bengaluru Apartment Resale Desk
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Ready to Sell Your Flat in 45 Days?
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Get your free resale valuation today and take the first step towards a faster, safer, and more profitable sale with dedicated RM support.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={scrollToForm}
                className="py-3.5 px-6 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>Get My Free Valuation</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="tel:+918217873708"
                className="py-3.5 px-5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 border border-white/15 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span>Call Desk: +91 8217873708</span>
              </a>
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>No obligation. Your property details and phone number are 100% confidential.</span>
          </div>

        </div>
      </div>
    </section>
  );
};
