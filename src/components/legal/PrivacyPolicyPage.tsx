import React from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { ShieldCheck, Lock, CheckCircle2, ArrowLeft, Mail, FileText } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
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
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>DPDP Act 2023 Compliant</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 font-['Poppins']">
              Last updated: October 2026 &bull; Formulated in strict compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and IT Rules, 2011.
            </p>
          </div>

          {/* Privacy Content Body */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-8 sm:p-10 space-y-8 font-['Poppins'] text-sm leading-relaxed text-slate-600">
            
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>1. Overview & Commitment to Data Privacy</span>
              </h2>
              <p>
                SellMyGhar ("SellMyGhar", "we", "our", or "us") respects your privacy. Unlike legacy real estate portals that publish personal contact numbers or distribute lead lists to unvetted brokers, SellMyGhar operates with strict data confidentiality: your phone number, identity, and property documents are never sold, rented, or made public.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>2. Information We Collect</span>
              </h2>
              <p>We collect only the data necessary to provide authentic resale facilitation services:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Identity & Contact Data:</strong> Mobile number, full name, email address collected via OTP verification.</li>
                <li><strong>Property Information:</strong> Society name, wing/unit, floor band, super built-up sqft, carpet area, expected price, and amenities.</li>
                <li><strong>Verification Documents:</strong> Sale deeds, BBMP Khata, tax receipts, Form 15 Encumbrance Certificates uploaded by sellers for title diligence.</li>
                <li><strong>Technical & Analytical Data:</strong> IP address, browser type, device information, and interaction telemetry.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>3. Lawful Basis & Purpose Limitation</span>
              </h2>
              <p>
                Under the DPDP Act 2023, data is processed solely for specified lawful purposes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Authenticating user sessions and preventing fraudulent listings.</li>
                <li>Conducting legal title scrutiny and preparing buyer presentation dossiers.</li>
                <li>Coordinating accompanied property viewings between verified buyers and sellers.</li>
                <li>Dispatching transactional email and WhatsApp/SMS alerts regarding tour requests and price proposals.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>4. Zero Broker Spam Policy</span>
              </h2>
              <p>
                We do not display seller phone numbers publicly on the website. Inbound buyer inquiries are answered by our professional relationship managers, who screen buyer financing readiness before any property visit is scheduled.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>5. Data Principal Rights (Access, Correction & Erasure)</span>
              </h2>
              <p>
                As a Data Principal under Indian law, you have enforceable statutory rights:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Right to Access:</strong> View all personal data and document copies held by SellMyGhar.</li>
                <li><strong>Right to Correction:</strong> Update inaccurate phone numbers, names, or property details.</li>
                <li><strong>Right to Erasure / Deletion:</strong> Submit an account and data erasure request via our dedicated Consent Portal (<a href="#/consent" className="text-[#244B8F] underline">#/consent</a>).</li>
                <li><strong>Right of Grievance Redressal:</strong> Direct escalation to our appointed Data Protection Officer.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>6. Data Security & Storage Standards</span>
              </h2>
              <p>
                Uploaded property documents are sealed with SHA-256 digital verification hashes, encrypted at rest using AES-256, and stored in secure Indian cloud server regions compliant with CERT-In and RBI data localization guidelines.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-bold text-[#172033] font-['Montserrat'] flex items-center space-x-2">
                <span>7. Grievance Officer Contact</span>
              </h2>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <p><strong>Grievance Officer:</strong> Srikanth Narayanan (Principal Compliance Lead)</p>
                <p><strong>Email:</strong> grievances@sellmyghar.in / privacy@sellmyghar.in</p>
                <p><strong>Address:</strong> ESTEEM PARK, Rose Garden Rd, 5th Phase, J P Nagar Phase 5, J. P. Nagar, Bengaluru, Karnataka 560078</p>
                <p><strong>Response SLA:</strong> Inquiries acknowledged within 24 business hours; resolved within 7 business days.</p>
              </div>
            </section>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">Manage consent preferences anytime at sellmyghar.in/#/consent</span>
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
