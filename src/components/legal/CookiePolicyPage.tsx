import React from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { ShieldCheck, Cookie, ArrowLeft } from 'lucide-react';

interface CookiePolicyPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
}

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({
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
          
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 mb-8">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
              <Cookie className="w-4 h-4" />
              <span>Cookie Transparency & Consent</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Cookie Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-['Poppins']">
              Last updated: October 2026 &bull; Explains how SellMyGhar uses cookies and local browser storage.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-8 font-['Poppins'] text-sm leading-relaxed text-slate-600">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat']">
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work properly, provide a secure browsing session, remember user preferences, and supply aggregated analytical insights to website owners.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat']">
                2. Why is a Cookie Policy Required?
              </h2>
              <p>
                Under modern data privacy guidelines (including India's Digital Personal Data Protection Act, 2023 and global privacy frameworks), platforms must transparently disclose the categories of cookies they store, the specific purposes they serve, and how users can control their storage. SellMyGhar strictly adheres to these transparency standards.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat']">
                3. Categories of Cookies We Use
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 font-['Montserrat'] text-xs uppercase tracking-wide">
                    A. Strictly Essential Cookies (Session & Security)
                  </h3>
                  <p className="text-xs">
                    Required for the operation of SellMyGhar. This includes our cryptographically signed, HTTP-only session cookie (<code>sellmyghar_session</code>) configured with <code>SameSite=Lax</code> and <code>Secure</code> flags to keep you safely logged in without exposing session tokens to malicious browser scripts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 font-['Montserrat'] text-xs uppercase tracking-wide">
                    B. Functional & Preference Storage
                  </h3>
                  <p className="text-xs">
                    Used to remember your saved favorite properties, search corridor filter preferences (e.g. Bengaluru East vs North), and calculator parameters across browser visits.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <h3 className="font-bold text-slate-900 font-['Montserrat'] text-xs uppercase tracking-wide">
                    C. Aggregated Performance & Telemetry
                  </h3>
                  <p className="text-xs">
                    We collect non-personally identifiable telemetry regarding button clicks, calculator interactions, and page response times to optimize application speed and user experience.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat']">
                4. Managing & Disabling Cookies
              </h2>
              <p>
                Most modern browsers automatically accept cookies, but you can modify your browser settings to refuse non-essential cookies. Please note that disabling strictly essential session cookies may prevent you from logging in or saving properties to your dashboard.
              </p>
            </section>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Questions? Contact privacy@sellmyghar.in</span>
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
