import React from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { LeadCapture } from '../home/LeadCapture';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';

interface ContactPageProps {
  onNavigate: (route: 'HOME' | 'CRM' | 'CONSENT' | 'POST_PROPERTY' | 'CONTACT') => void;
  onSignInClick?: () => void;
  onConsentPortalOpen?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigate,
  onSignInClick,
  onConsentPortalOpen,
}) => {
  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'SELL') {
      onNavigate('POST_PROPERTY');
    } else if (tab === 'BUY' || tab === 'ABOUT') {
      onNavigate('HOME');
    } else if (tab === 'CONTACT') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#244B8F] selection:text-white font-['Montserrat']">
      {/* Sticky Header */}
      <Header
        onPostPropertyClick={() => onNavigate('POST_PROPERTY')}
        onLoginClick={() => {
          if (onSignInClick) onSignInClick();
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1 pb-16">
        {/* Editorial Top Banner */}
        <section className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/85 to-[#244B8F]/30 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 bg-white/10 text-slate-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B68A4A]" />
                <span>Dedicated Bengaluru Advisory Desk</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                Get in Touch with SellMyGhar
              </h1>
              <p className="mt-3 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
                Whether you are looking to sell your premium apartment or enquire about verified resales, our team handles all legal diligence and buyer connections with zero broker spam.
              </p>
            </div>
          </div>
        </section>

        {/* Content Section: Info Cards + Simple Lead Form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Office Details & Direct Channels (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Primary Office Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-lg border border-slate-200/80">
                <h3 className="text-lg font-bold text-[#172033] mb-4 flex items-center">
                  <Building2 className="w-5 h-5 text-[#244B8F] mr-2" />
                  Bengaluru Operations Centre
                </h3>

                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-[#B68A4A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">SellMyGhar Resale Desk</p>
                      <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                        Suite 402, 100ft Road, HAL 2nd Stage, Indiranagar,<br />
                        Bengaluru, Karnataka 560038
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-1 border-t border-slate-100">
                    <Phone className="w-4 h-4 text-[#244B8F] shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Verification Helpline</span>
                      <a href="tel:+918047193300" className="font-semibold text-slate-800 hover:text-[#244B8F]">
                        +91 80 4719 3300
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-1 border-t border-slate-100">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">WhatsApp Direct Desk</span>
                      <span className="font-semibold text-slate-800">+91 98765 43210</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-1 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-xs text-slate-400 block">Operating Hours</span>
                      <span className="font-medium text-slate-700">Monday – Saturday: 9:30 AM – 7:00 PM IST</span>
                    </div>
                  </div>
                </div>

                {/* RERA Assurance Stamp */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-[#244B8F]" />
                    <span>Karnataka RERA Registered</span>
                  </div>
                  <span className="font-bold text-[#244B8F]">PRM/KA/RERA/1251</span>
                </div>
              </div>

              {/* Direct Post Property Banner for Sellers */}
              <div className="bg-gradient-to-br from-[#244B8F] to-[#1B396E] rounded-2xl p-6 text-white shadow-lg">
                <span className="text-xs uppercase tracking-wider text-amber-200 font-bold block mb-1">
                  Ready to List Directly?
                </span>
                <h4 className="text-lg font-bold text-white mb-2">
                  Use our Dedicated Property Wizard
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed mb-4">
                  Provide detailed unit specifications, amenities, and photos to fast-track legal verification and ready-buyer matching.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('POST_PROPERTY')}
                  className="w-full inline-flex items-center justify-center px-4 py-3 bg-white text-[#244B8F] hover:bg-slate-100 font-bold text-sm rounded-lg shadow-sm transition-all cursor-pointer group"
                >
                  <span>Launch 6-Step Post Property Wizard</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>

            {/* Right Column: Simple Lead Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#172033]">
                      Direct Enquiry & Callback Form
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fast 2-minute submission — our Bengaluru desk will reach out within 2 business hours.
                    </p>
                  </div>
                  <span className="hidden sm:inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                    Zero Broker Spam
                  </span>
                </div>

                <div className="p-4 sm:p-6">
                  {/* Clean, simple lead form */}
                  <LeadCapture
                    initialIntent="SELL"
                    initialLocality="Whitefield, Bengaluru"
                    initialBhk="3BHK"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer
        onNavClick={handleTabClick}
        onConsentPortalOpen={onConsentPortalOpen}
      />
    </div>
  );
};
