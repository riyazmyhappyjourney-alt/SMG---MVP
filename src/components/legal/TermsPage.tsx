import React from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { Scale, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 mb-8">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#244B8F] uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Legal & Platform Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-['Poppins']">
              Last updated: October 2026 &bull; Effective for all SellMyGhar website visitors, buyers, sellers, and registered users.
            </p>
          </div>

          {/* Terms Content Body */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-8 font-['Poppins'] text-sm leading-relaxed text-slate-600">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>1. Nature of the Platform & Services</span>
              </h2>
              <p>
                SellMyGhar operates an assisted residential resale facilitation platform specializing in Bengaluru apartment corridors. We connect direct flat owners with verified prospective buyers, offering legal title documentation diligence, government deed valuation benchmarking, professional photography, accompanied property site viewings, and end-to-end conveyance advisory.
              </p>
              <p>
                SellMyGhar acts as an authorized real estate facilitation advisory under applicable Karnataka RERA and state regulations. We are not an unmoderated open classifieds board; all listings undergo primary verification prior to public publication.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>2. User Account Registration & Mobile Authentication</span>
              </h2>
              <p>
                To list a flat, schedule site visits, or access proprietary diligence reports, users register using a verified 10-digit Indian mobile number authenticated via Time-based One-Time Password (OTP). You agree to provide accurate, truthful, and lawful contact information. You are responsible for maintaining confidentiality of your device and sessions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>3. Seller Representations & Property Diligence</span>
              </h2>
              <p>
                When submitting a flat for resale, the property owner represents and warrants that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>They hold lawful title or recognized Power of Attorney authorization to dispose of the apartment.</li>
                <li>All furnished documentation (Registered Sale Deed, BBMP Khata, Form 15 Encumbrance Certificate, tax receipts, Occupancy Certificate) is genuine and unencumbered except as explicitly disclosed.</li>
                <li>Any existing mortgage, bank loan, or statutory lien is truthfully declared to enable structured loan closure or tripartite balance transfer.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>4. Advisory Success Fee & Brokerage Terms</span>
              </h2>
              <p>
                Listing an apartment on SellMyGhar is 100% free with zero upfront marketing charges. Upon successful execution of an Agreement to Sell or registered Sale Deed facilitated through our platform, a standardized facilitation advisory fee (brokerage) is payable as mutually agreed in the written seller engagement mandate. There are no hidden administrative levies or undisclosed charges.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>5. Escorted Site Viewings & Code of Conduct</span>
              </h2>
              <p>
                Site visits are arranged exclusively by pre-screened appointment accompanied by a dedicated SellMyGhar relationship manager. Buyers and sellers agree to treat platform personnel, residential society security, and resident welfare associations with courtesy and adhere to community bylaws.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>6. Limitation of Liability</span>
              </h2>
              <p>
                While SellMyGhar conducts comprehensive operational due diligence against public records, title transfer is ultimately governed by the formal Sale Deed executed before the Karnataka Sub-Registrar. Parties are encouraged to engage independent legal counsel for definitive title certification. SellMyGhar shall not be liable for unforeseen municipal delays, legislative changes, or developer latent defects.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>7. Governing Law & Dispute Resolution</span>
              </h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of India, under the exclusive jurisdiction of the civil courts in Bengaluru, Karnataka.
              </p>
            </section>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Questions about our Terms? Contact legal@sellmyghar.in</span>
              <a
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  if (onBackToHome) onBackToHome();
                  else window.location.hash = '#/';
                }}
                className="inline-flex items-center space-x-2 text-xs font-bold text-[#244B8F] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </a>
            </div>

          </div>

        </div>
      </main>

      <Footer onNavClick={handleTabClick} />
    </div>
  );
};
