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
    <footer className="relative overflow-hidden bg-white text-slate-600 pt-12 pb-10 border-t border-slate-200 shadow-2xs font-['Poppins']">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 pb-10 border-b border-slate-200">
          
          {/* Brand Info (2 cols) */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="inline-block">
              <Logo height={40} />
            </div>
            <p className="text-xs text-slate-600 font-['Poppins'] leading-relaxed max-w-sm">
              SellMyGhar is Bengaluru’s dedicated apartment resale platform. We eliminate broker spam, provide certified title due diligence, and connect verified sellers directly with serious home buyers.
            </p>
            <div className="pt-1 inline-flex items-center space-x-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/80 font-semibold font-['Montserrat']">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Karnataka RERA Approved Real Estate Resale Platform</span>
            </div>
          </div>

          {/* Company Column (Referenced from 99acres) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] font-['Montserrat']">
              Company
            </h4>
            <ul className="space-y-2 text-xs font-['Poppins']">
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('ABOUT')}
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left"
                >
                  About us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('CONTACT')}
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left"
                >
                  Contact us
                </button>
              </li>
              <li>
                <a
                  href="#/careers"
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left block"
                >
                  Careers with us
                </a>
              </li>
              <li>
                <a
                  href="#/terms"
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left block"
                >
                  Terms & Conditions
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType('FEEDBACK')}
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left"
                >
                  Feedback
                </button>
              </li>
              <li>
                <a
                  href="#/privacy-policy"
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left block"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalType('GRIEVANCE')}
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left"
                >
                  Grievances
                </button>
              </li>
              <li>
                <a
                  href="#/cookie-policy"
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left block"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Resale Services (1 col) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] font-['Montserrat']">
              Resale Services
            </h4>
            <ul className="space-y-2 text-xs font-['Poppins']">
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('BUY')}
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left"
                >
                  Buy Resale Homes
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavClick('SELL')}
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left"
                >
                  Sell My Flat (Free)
                </button>
              </li>
              <li>
                <a
                  href="#/holding-calculator"
                  className="hover:text-[#244B8F] text-slate-600 transition-colors cursor-pointer text-left block"
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
                  className="hover:text-[#244B8F] transition-colors cursor-pointer text-left flex items-center text-amber-700 font-semibold"
                >
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                  <span>Frequently Asked Questions</span>
                </button>
              </li>
              {onConsentPortalOpen && (
                <li>
                  <button
                    type="button"
                    onClick={onConsentPortalOpen}
                    className="hover:text-[#244B8F] transition-colors cursor-pointer text-left flex items-center text-slate-600"
                  >
                    <Lock className="w-3 h-3 mr-1.5 shrink-0 text-slate-500" />
                    <span>Manage Consent</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contact & Hours (1 col) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] font-['Montserrat']">
              Bengaluru Office
            </h4>
            <div className="space-y-2.5 text-xs text-slate-600 font-['Poppins']">
              <p className="flex items-start">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-[#244B8F] shrink-0 mt-0.5" />
                <span>100 Feet Road, Indiranagar, Bengaluru, KA 560038</span>
              </p>
              <p className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1.5 text-[#244B8F] shrink-0" />
                <span>+91 80 4719 3200</span>
              </p>
              <p className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1.5 text-[#244B8F] shrink-0" />
                <span>support@sellmyghar.in</span>
              </p>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* FOOTER ILLUSTRATION SHOWCASE AREA                               */}
        {/* Dedicated Slot Ready for User Uploaded Illustration             */}
        {/* ============================================================== */}
        <div 
          id="footer-illustration-wrapper"
          className="w-full pt-6 pb-4 flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 flex items-center justify-center">
            <img
              id="footer-illustration"
              src="/images/bengaluru-cityscape-footer.svg"
              alt="SellMyGhar Resale Architecture Illustration"
              className="w-full max-h-[160px] sm:max-h-[220px] md:max-h-[260px] object-contain object-bottom opacity-90 hover:opacity-100 transition-opacity"
              onError={(e) => {
                // Graceful fallback if user uploads or swaps image
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <p className="text-[10px] text-slate-400 font-['Poppins'] mt-1 tracking-wide text-center">
            Bengaluru Residential Resale Infrastructure • Curated Gated Communities
          </p>
        </div>

        {/* Bottom Bar: Copyright & DPDP Notice */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 font-['Poppins'] gap-3">
          <p>© {new Date().getFullYear()} SellMyGhar Technologies Private Limited. All rights reserved.</p>
          <p className="text-center sm:text-right">
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
