import React from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { Briefcase, MapPin, Users, ArrowRight, ShieldCheck } from 'lucide-react';

interface CareersPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
}

const OPEN_ROLES = [
  {
    title: 'Senior Residential Relationship Manager',
    dept: 'Sales & Field Operations',
    location: 'Bengaluru (East: Whitefield / ORR)',
    type: 'Full-time',
    description: 'Lead pre-screened site viewings, conduct seller consultations, and guide buyers through apartment resale agreements in premium gated societies.'
  },
  {
    title: 'Legal Conveyance & Title Diligence Specialist',
    dept: 'Legal & Compliance',
    location: 'Bengaluru (Head Office: JP Nagar Phase 5)',
    type: 'Full-time',
    description: 'Scrutinize 30-year parent sale deeds, BBMP Khata certificates, and Form 15 Encumbrance Certificates to ensure pristine title clarity for apartment resales.'
  },
  {
    title: 'Real Estate Valuation & Pricing Analyst',
    dept: 'Market Research',
    location: 'Bengaluru (Hybrid)',
    type: 'Full-time',
    description: 'Analyze recorded Sub-Registrar transactions, guidance values, and locality absorption indices to price flats at peak fair market value.'
  }
];

export const CareersPage: React.FC<CareersPageProps> = ({
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
    } else {
      if (onBackToHome) onBackToHome();
      else window.location.hash = '#/';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#244B8F] selection:text-white font-['Montserrat'] text-slate-800">
      <Header
        onPostPropertyClick={() => {
          if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
          else window.location.hash = '#/post-property';
        }}
        onLoginClick={() => {
          if (onSignInClick) onSignInClick();
          else window.location.hash = '#/login';
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1 py-12 lg:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-12 mb-10 text-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#244B8F] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Join SellMyGhar</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
              Build the Future of Transparent Home Resale
            </h1>
            <p className="mt-3 text-sm text-slate-500 font-['Poppins'] max-w-2xl mx-auto leading-relaxed">
              We are reimagining Bengaluru apartment resales with zero broker spam, verified legal title diligence, and high-trust client relationships.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#172033] font-['Montserrat']">
              Open Positions in Bengaluru
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {OPEN_ROLES.map((role, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 font-['Poppins']">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#244B8F] bg-blue-50 px-2 py-0.5 rounded-md">
                        {role.dept}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {role.type}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#172033] font-['Montserrat']">
                      {role.title}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-2xl">
                      {role.description}
                    </p>
                    <div className="flex items-center text-xs text-slate-400 space-x-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{role.location}</span>
                    </div>
                  </div>

                  <a
                    href={`mailto:careers@sellmyghar.in?subject=Application%20for%20${encodeURIComponent(role.title)}`}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all text-center"
                  >
                    Apply Now &rarr;
                  </a>
                </div>
              ))}
            </div>

          </div>

        </div>
      </main>

      <Footer onNavClick={handleTabClick} />
    </div>
  );
};
