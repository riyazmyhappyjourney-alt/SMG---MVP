import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import { ShieldCheck, Mail, MapPin, Phone, Scale, Lock, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FooterProps {
  onNavClick: (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => void;
  onConsentPortalOpen?: () => void;
}

const FOOTER_FAQS = [
  {
    q: 'How does SellMyGhar differ from listing on general classifieds portals?',
    a: 'Unlike open classifieds where your personal phone number is shared with hundreds of unvetted local brokers, SellMyGhar assigns a dedicated residential advisor, screens all prospective buyers for loan eligibility, and coordinates accompanied visits with zero broker spam.'
  },
  {
    q: 'Do I have to pay any upfront fee to list my flat on SellMyGhar?',
    a: 'No. Listing your property and onboarding with our assisted selling desk is 100% free with zero upfront charges. Our advisory success fee is only payable upon successful agreement and registration.'
  },
  {
    q: 'How do you determine the asking price for my Bengaluru apartment?',
    a: 'We do not rely on speculative portal asking prices. We benchmark your society against actual government registered sale deeds from the past 6 to 12 months, accounting for floor rise, facing, carpet area, and current inventory absorption.'
  },
  {
    q: 'What if my apartment has an active home loan from a bank?',
    a: 'Over 65% of resale transactions in Bengaluru involve an existing mortgage. We guide you through requesting the bank Outstanding Balance Statement, List of Documents (LOD), and managing buyer bank loan foreclosure or tripartite transfer.'
  },
  {
    q: 'How are physical buyer inspections and site visits conducted?',
    a: 'We coordinate all inspections at your preferred timings. If your apartment is vacant or you reside outside Bengaluru, our verified property manager can hold keys with full digital visit tracking and instant feedback logs.'
  }
];

export const Footer: React.FC<FooterProps> = ({ onNavClick, onConsentPortalOpen }) => {
  const [modalType, setModalType] = useState<'PRIVACY' | 'TERMS' | 'GRIEVANCE' | 'FAQ' | 'FEEDBACK' | 'COOKIE' | null>(null);
  const [openModalFaqIndex, setOpenModalFaqIndex] = useState<number | null>(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-[#EBF5FB] via-[#E2F0F9] to-[#D5EBF8] text-[#1E3A8A] font-['Poppins',sans-serif] border-t border-slate-200/80">
      
      {/* 1. Integrated Bengaluru Skyline Illustration Anchored at the Bottom (Crisp & High-Res) */}
      <div 
        className="absolute inset-x-0 bottom-0 pointer-events-none z-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <img
          id="footer-skyline-backdrop"
          src="/images/bengaluru-skyline-footer.png"
          alt="Bengaluru Vidhana Soudha, Metro and Resale Infrastructure Panorama"
          className="w-full h-auto object-cover object-bottom max-h-[260px] sm:max-h-[320px] md:max-h-[360px] lg:max-h-[400px]"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* 2. Soft Sky Dissolve Gradient: Ensures high-contrast readability without covering the crisp skyline below */}
      <div 
        className="absolute inset-x-0 top-0 h-80 sm:h-96 bg-gradient-to-b from-[#EBF5FB] via-[#EBF5FB]/95 to-transparent pointer-events-none z-1" 
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20 sm:pb-28 lg:pb-36">
        
        {/* Main 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Column 1: Brand Info & Unified RERA Block (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="inline-block">
              <Logo height={68} className="mb-1" />
            </div>
            <p className="text-xs text-[#1E3A8A] font-medium leading-relaxed max-w-sm">
              SellMyGhar is Bengaluru’s dedicated apartment resale platform. We eliminate broker spam, provide certified title due diligence, and connect verified sellers directly with serious home buyers.
            </p>
            
            {/* Unified Karnataka RERA Approved Block with Registration Number & Lighting Sweep */}
            <div className="pt-2">
              <div 
                className="relative overflow-hidden inline-block text-xs bg-emerald-50/95 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-emerald-400 font-['Montserrat'] shadow-2xs max-w-full"
                title="Karnataka Real Estate Regulatory Authority Approved Platform"
              >
                <div className="flex items-center space-x-2 font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Karnataka RERA Approved Real Estate Resale Platform</span>
                </div>
                <div className="mt-1.5 pl-6 font-mono text-[11px] font-bold text-[#1E3A8A] tracking-wider break-all select-all">
                  PRM/KA/RERA/1251/309/AG/221108/003210
                </div>
                {/* Subtle Lighting Sweep Animation Across the Card */}
                <span className="animate-rera-sweep" aria-hidden="true" />
                <span className="animate-rera-underline" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Column 2: Company (lg:col-span-3, subtle divider on desktop) */}
          <div className="lg:col-span-3 lg:border-l lg:border-sky-300/40 lg:pl-8 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] font-['Montserrat']">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-['Poppins']">
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('ABOUT')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  About us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('CONTACT')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Contact us
                </button>
              </li>
              <li>
                <a
                  href="#/careers"
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left block py-0.5"
                >
                  Careers with us
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType('TERMS')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setFeedbackSent(false);
                    setFeedbackText('');
                    setModalType('FEEDBACK');
                  }}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Feedback
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType('PRIVACY')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType('GRIEVANCE')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Grievances
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType('COOKIE')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Resale Services (lg:col-span-2.5, subtle divider on desktop) */}
          <div className="lg:col-span-2.5 lg:border-l lg:border-sky-300/40 lg:pl-8 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] font-['Montserrat']">
              Resale Services
            </h4>
            <ul className="space-y-2 text-xs font-['Poppins']">
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('BUY')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Buy Resale Homes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('SELL')}
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left py-0.5"
                >
                  Sell My Flat (Free)
                </button>
              </li>
              <li>
                <a
                  href="#/holding-calculator"
                  className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left block py-0.5"
                >
                  Holding Cost Calculator
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setOpenModalFaqIndex(0);
                    setModalType('FAQ');
                  }}
                  className="hover:text-[#B85418] text-[#D96B27] font-semibold transition-colors cursor-pointer text-left flex items-center py-0.5"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-[#D96B27] shrink-0" />
                  <span>Frequently Asked Questions</span>
                </button>
              </li>
              {onConsentPortalOpen && (
                <li>
                  <button
                    type="button"
                    onClick={onConsentPortalOpen}
                    className="hover:text-[#0F2860] text-[#1E3A8A] font-medium transition-colors cursor-pointer text-left flex items-center py-0.5"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5 shrink-0 text-[#1E3A8A]" />
                    <span>Manage Consent</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Bengaluru Office (lg:col-span-2.5, subtle divider on desktop) */}
          <div className="lg:col-span-2.5 lg:border-l lg:border-sky-300/40 lg:pl-8 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E3A8A] font-['Montserrat']">
              Bengaluru Office
            </h4>
            <div className="space-y-3 text-xs text-[#1E3A8A] font-['Poppins']">
              <p className="flex items-start leading-relaxed font-medium">
                <MapPin className="w-3.5 h-3.5 mr-2 text-[#244B8F] shrink-0 mt-0.5" />
                <span>100 Feet Road, Indiranagar, Bengaluru, KA 560038</span>
              </p>
              <p className="flex items-center font-medium">
                <Phone className="w-3.5 h-3.5 mr-2 text-[#244B8F] shrink-0" />
                <a href="tel:+918047193200" className="hover:text-[#0F2860] transition-colors">
                  +91 80 4719 3200
                </a>
              </p>
              <p className="flex items-center font-medium">
                <Mail className="w-3.5 h-3.5 mr-2 text-[#244B8F] shrink-0" />
                <a href="mailto:support@sellmyghar.in" className="hover:text-[#0F2860] transition-colors">
                  support@sellmyghar.in
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright & Compliance */}
      <div className="relative z-20 pt-4 pb-6 bg-[#172033] text-slate-300 font-['Poppins'] border-t border-slate-700/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
          <p>© {new Date().getFullYear()} SellMyGhar Technologies Private Limited. All rights reserved.</p>
          <p className="text-center sm:text-right text-slate-400">
            Karnataka RERA Approved Real Estate Resale Facilitator. Transparent legal due diligence & certified document verification.
          </p>
        </div>
      </div>

      {/* Legal & FAQ Information Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {modalType === 'FAQ' && (
              <div className="space-y-4 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-[#244B8F]">
                  <HelpCircle className="w-6 h-6 text-[#244B8F] shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold font-['Montserrat'] text-[#172033]">
                      Frequently Asked Questions
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      Everything you need to know about selling or buying an apartment on SellMyGhar.in.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {FOOTER_FAQS.map((faq, idx) => {
                    const isOpen = openModalFaqIndex === idx;
                    return (
                      <div 
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenModalFaqIndex(isOpen ? null : idx)}
                          className="w-full flex items-center justify-between text-left p-3.5 text-xs font-bold text-slate-900 hover:text-[#244B8F] transition-colors cursor-pointer"
                        >
                          <span className="pr-3">{faq.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#B68A4A] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 pt-1 text-[11px] text-slate-600 font-['Poppins'] leading-relaxed border-t border-slate-200/80">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {modalType === 'GRIEVANCE' && (
              <div className="space-y-4 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-[#244B8F]">
                  <ShieldCheck className="w-6 h-6" />
                  <h3 className="text-lg font-bold font-['Montserrat'] text-[#172033]">
                    Statutory DPDP Grievance Officer
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  In accordance with the Digital Personal Data Protection (DPDP) Act 2023, SellMyGhar has appointed a dedicated Grievance Redressal Officer to handle data queries, consent revocations, and privacy concerns:
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p><strong>Officer Name:</strong> Mr. A. Krishnamurthy</p>
                  <p><strong>Designation:</strong> Head of Legal & Data Compliance</p>
                  <p><strong>Direct Email:</strong> <a href="mailto:grievance@sellmyghar.in" className="text-[#244B8F] underline">grievance@sellmyghar.in</a></p>
                  <p><strong>Response SLA:</strong> Acknowledgment within 24 hours, resolution within 48 business hours.</p>
                  <p><strong>Office:</strong> 100 Feet Road, Indiranagar, Bengaluru, KA 560038</p>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Users have the statutory right to withdraw consent or request complete erasure of personal data at any time through our Consent Portal.
                </p>
              </div>
            )}

            {modalType === 'PRIVACY' && (
              <div className="space-y-4 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-[#244B8F]">
                  <Lock className="w-6 h-6" />
                  <h3 className="text-lg font-bold font-['Montserrat'] text-[#172033]">
                    Privacy Policy & DPDP Notice
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>1. Data Collection:</strong> We collect your name, phone number, and apartment locality solely for facilitating verified property transactions, valuation, and physical property visits.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>2. Zero Spam & Public Shielding:</strong> Your phone number, flat number, and sensitive property documents are NEVER published online or sold to third-party telemarketers.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>3. Right to Withdraw & Erasure:</strong> You retain complete ownership of your personal data. You may withdraw consent or request irreversible data erasure by contacting our Grievance Officer or using the self-serve Consent Portal.
                </p>
              </div>
            )}

            {modalType === 'TERMS' && (
              <div className="space-y-4 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-[#244B8F]">
                  <Scale className="w-6 h-6" />
                  <h3 className="text-lg font-bold font-['Montserrat'] text-[#172033]">
                    Terms of Service
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  SellMyGhar acts as a technology and legal facilitation platform for genuine property resale transactions in Bengaluru. All property listings undergo Level 1 (Owner-Declared), Level 2 (Document Legal Review), or Level 3 (Physical Inspection) checks prior to transaction finalization.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Misrepresentation of title or fraudulent document submission will lead to immediate removal and reporting to appropriate civil authorities.
                </p>
              </div>
            )}

            {modalType === 'FEEDBACK' && (
              <div className="space-y-4 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-[#244B8F]">
                  <HelpCircle className="w-6 h-6 text-[#244B8F]" />
                  <h3 className="text-lg font-bold font-['Montserrat'] text-[#172033]">
                    Feedback & Suggestions
                  </h3>
                </div>
                {feedbackSent ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                    Thank you! Your feedback has been received by our Bengaluru customer advisory team.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-600 leading-relaxed">
                      We continuously refine our platform for Bengaluru apartment owners and buyers. Share your thoughts or feature requests:
                    </p>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your thoughts, feedback, or suggestions..."
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#244B8F] focus:outline-none min-h-[100px]"
                    />
                    <button
                      type="button"
                      disabled={!feedbackText.trim()}
                      onClick={() => setFeedbackSent(true)}
                      className="px-4 py-2 bg-[#244B8F] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#1B396E] disabled:opacity-50 transition-colors"
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}
              </div>
            )}

            {modalType === 'COOKIE' && (
              <div className="space-y-4 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-[#244B8F]">
                  <Lock className="w-6 h-6" />
                  <h3 className="text-lg font-bold font-['Montserrat'] text-[#172033]">
                    Cookie Policy
                  </h3>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  SellMyGhar uses essential first-party cookies solely to maintain secure authentication sessions, verify user identity, and preserve your property preferences. We do not use intrusive third-party cross-site tracking cookies.
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-[#244B8F] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#1B396E] transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </footer>
  );
};
