import React from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { 
  Building2, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  FileText, 
  Award, 
  Clock, 
  ArrowRight,
  PhoneCall,
  MapPin,
  Lock
} from 'lucide-react';

interface AboutUsPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = ({
  onBackToHome,
  onNavigateToContact,
  onNavigateToSellerAssisted,
  onSignInClick,
}) => {
  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'SELL') {
      if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
      else window.location.hash = '#/post-property';
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) onNavigateToContact();
      else window.location.hash = '#/contact';
    } else if (tab === 'ABOUT') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      if (onBackToHome) onBackToHome();
      else window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat'] text-slate-800">
      <Header
        onPostPropertyClick={() => {
          if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
          else window.location.hash = '#/post-property';
        }}
        onLoginClick={() => {
          if (onSignInClick) onSignInClick();
          else window.location.hash = '#/auth/login';
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#0073E6] to-[#172033] text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Award className="w-4 h-4" />
              <span>Bengaluru's Dedicated Resale Advisory</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              About SellMyGhar
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-['Poppins'] max-w-2xl mx-auto leading-relaxed">
              We built SellMyGhar to solve Bengaluru’s broken apartment resale market: eliminating broker spam, verifying legal titles before listing, and enabling direct transparent transactions.
            </p>
          </div>
        </div>

        {/* Core Value Proposition */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0073E6] bg-blue-50 px-3 py-1 rounded-md">
                Our Purpose
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172033] leading-snug">
                Why apartment owners and genuine buyers choose SellMyGhar
              </h2>
              <p className="text-sm text-slate-600 font-['Poppins'] leading-relaxed">
                When you list an apartment on generic property portals, your personal phone number is broadcast to hundreds of unvetted local brokers. Within 24 hours, you receive dozens of cold calls, unrealistic offers, and unauthorized duplicate listings across classifieds boards.
              </p>
              <p className="text-sm text-slate-600 font-['Poppins'] leading-relaxed">
                SellMyGhar changes that. We assign a dedicated Bengaluru residential relationship manager to every apartment, screen prospective buyers for pre-approved home loan eligibility, coordinate accompanied society visits, and perform thorough legal title scrutiny before closing.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-md space-y-6">
              <h3 className="text-lg font-bold text-[#172033] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Our Institutional Standards</span>
              </h3>
              <ul className="space-y-4 font-['Poppins'] text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Zero Broker Spam:</strong> Your direct phone number and unit floor are never exposed on public websites.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>3-Tier Verification:</strong> Every property is verified against ownership deeds and public Sub-Registrar records.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Accompanied Tours:</strong> Verified relationship managers handle key handovers and escort buyers.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>RERA Regulated:</strong> Fully registered under Karnataka Real Estate Regulatory Authority PRM/KA/RERA/1251/309/AG/221108/003210.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0073E6] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#172033]">Bengaluru Corridors</h4>
              <p className="text-xs text-slate-500 font-['Poppins'] leading-relaxed">
                Specialized in Whitefield, Sarjapur Road, Bellandur, HSR Layout, Hebbal, Thanisandra, and JP Nagar apartment townships.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#172033]">Title Diligence</h4>
              <p className="text-xs text-slate-500 font-['Poppins'] leading-relaxed">
                Parent sale deed trace, BBMP/BDA Khata extracts, and up-to-date Encumbrance Certificates verified before token payments.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#172033]">Direct Buyer Screening</h4>
              <p className="text-xs text-slate-500 font-['Poppins'] leading-relaxed">
                Buyers are verified for home loan pre-approvals and down-payment readiness before setting up private society walkthroughs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-[#172033]">DPDP Compliance</h4>
              <p className="text-xs text-slate-500 font-['Poppins'] leading-relaxed">
                Full compliance with the Digital Personal Data Protection Act 2023 with strict consent capture and data minimization.
              </p>
            </div>
          </div>

          {/* Registered Office & Contact CTA */}
          <div className="bg-[#172033] text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-5">
              <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                Connect with our Bengaluru Resale Desk
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-['Poppins'] leading-relaxed">
                Whether you wish to list your apartment or inspect verified resale homes in Bengaluru, our advisors are here to assist you.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
                    else window.location.hash = '#/post-property';
                  }}
                  className="px-6 py-3 rounded-xl bg-[#0073E6] hover:bg-blue-600 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <span>List Your Property FREE</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToContact) onNavigateToContact();
                    else window.location.hash = '#/contact';
                  }}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/20 cursor-pointer flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Contact Advisory Desk</span>
                </button>
              </div>
              <div className="pt-4 text-[11px] text-slate-400 font-['Poppins'] flex items-center justify-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Esteem Park, Rose Garden Road, JP Nagar Phase 5, Bengaluru, Karnataka 560078</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer onNavClick={handleTabClick} />
    </div>
  );
};
