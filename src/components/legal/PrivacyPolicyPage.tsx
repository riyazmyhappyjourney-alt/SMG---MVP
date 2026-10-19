import React, { useState } from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowLeft, 
  Building2, 
  FileCheck2, 
  UserCheck, 
  Trash2, 
  Cookie, 
  Scale, 
  HelpCircle,
  ExternalLink,
  CheckCircle2,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';

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
  const [activeSection, setActiveSection] = useState<string>('intro');

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

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sections = [
    { id: 'sec-1', title: '1. Introduction' },
    { id: 'sec-2', title: '2. Information We Collect' },
    { id: 'sec-3', title: '3. How We Use Information' },
    { id: 'sec-4', title: '4. Google Sign-In & User Data' },
    { id: 'sec-5', title: '5. Property Listings & Sharing' },
    { id: 'sec-6', title: '6. When We Share Information' },
    { id: 'sec-7', title: '7. Data Storage & Security' },
    { id: 'sec-8', title: '8. Data Retention' },
    { id: 'sec-9', title: '9. Your Privacy Rights' },
    { id: 'sec-10', title: '10. Account Deletion' },
    { id: 'sec-11', title: '11. Cookies & Tracking' },
    { id: 'sec-12', title: '12. Communications' },
    { id: 'sec-13', title: '13. Children’s Privacy' },
    { id: 'sec-14', title: '14. Third-Party Services' },
    { id: 'sec-15', title: '15. Indian DPDP Compliance' },
    { id: 'sec-16', title: '16. Policy Updates' },
    { id: 'sec-17', title: '17. Contact & Grievances' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#0073E6] selection:text-white font-['Montserrat'] text-slate-800">
      
      {/* Top Header */}
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

      {/* Breadcrumb Navigation Bar */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between text-xs font-['Poppins']">
          <div className="flex items-center space-x-2 text-slate-500">
            <button
              type="button"
              onClick={() => onBackToHome ? onBackToHome() : window.location.hash = '#/'}
              className="hover:text-[#0073E6] transition-colors cursor-pointer"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-semibold">Privacy Policy</span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-medium text-[11px] border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>DPDP Act 2023 Compliant</span>
            </span>
            <a
              href="mailto:support@sellmyghar.in"
              className="inline-flex items-center space-x-1 text-[#0073E6] font-semibold hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@sellmyghar.in</span>
            </a>
          </div>
        </div>
      </div>

      <main className="flex-1 py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Hero Header Banner */}
          <div className="bg-gradient-to-br from-[#172033] via-[#005BB5] to-[#0073E6] text-white rounded-3xl shadow-xl p-8 sm:p-12 mb-10 relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Statutory Privacy & Data Protection Statement</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                Privacy Policy
              </h1>
              <p className="mt-3 text-slate-200 font-['Poppins'] text-sm sm:text-base leading-relaxed">
                SellMyGhar.in is committed to the protection of your personal information, transparency in data processing, and compliance with the Digital Personal Data Protection Act, 2023.
              </p>
              
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-['Poppins'] text-slate-300">
                <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="font-semibold text-white">Effective Date:</span>
                  <span>15 October 2026</span>
                </div>
                <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="font-semibold text-white">Last Updated:</span>
                  <span>15 October 2026</span>
                </div>
                <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="font-semibold text-white">Entity:</span>
                  <span>Sell My Ghar (Prop. Sudhamathi)</span>
                </div>
              </div>
            </div>

            {/* Decorative subtle background accents */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-[#0073E6]/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT SIDEBAR: Table of Contents (Sticky on Desktop) */}
            <div className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-8 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 font-['Poppins']">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] font-['Montserrat'] mb-3 flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-[#0073E6]" />
                  <span>Table of Contents</span>
                </h3>
                <nav className="space-y-1 text-xs">
                  {sections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => scrollTo(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                        activeSection === sec.id
                          ? 'bg-[#0073E6] text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span className="truncate pr-2">{sec.title}</span>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${activeSection === sec.id ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  ))}
                </nav>

                <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Privacy Contact Desk</p>
                  <a
                    href="mailto:support@sellmyghar.in"
                    className="flex items-center space-x-2 text-xs font-semibold text-[#0073E6] hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#0073E6]" />
                    <span>support@sellmyghar.in</span>
                  </a>
                  <a
                    href="mailto:contact@sellmyghar.in"
                    className="flex items-center space-x-2 text-xs font-semibold text-slate-700 hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>contact@sellmyghar.in</span>
                  </a>
                </div>
              </div>

              {/* Quick Self-Serve Deletion Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/80 p-5 font-['Poppins'] text-xs">
                <div className="flex items-center space-x-2 text-amber-800 font-bold font-['Montserrat'] mb-2">
                  <Trash2 className="w-4 h-4 text-amber-600" />
                  <span>Account & Data Deletion</span>
                </div>
                <p className="text-amber-900/80 text-[11px] leading-relaxed mb-3">
                  You have the statutory right under DPDP Act 2023 to request full account and data erasure anytime.
                </p>
                <a
                  href="mailto:support@sellmyghar.in?subject=Account%20Deletion%20Request%20-%20SellMyGhar"
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold font-['Montserrat'] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Request Account Deletion</span>
                </a>
              </div>
            </div>

            {/* RIGHT CONTENT BODY: Complete 17 Sections */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-8 font-['Poppins'] text-sm leading-relaxed text-slate-600">
              
              {/* SECTION 1 */}
              <section id="sec-1" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    01
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    1. Introduction
                  </h2>
                </div>
                <p>
                  <strong>SellMyGhar.in</strong> (“SellMyGhar”, “we”, “our” or “us”) is an assisted residential property resale platform operated by <strong>Sudhamathi</strong>, Proprietor of Sell My Ghar, in Bengaluru, Karnataka, India.
                </p>
                <p>
                  We help property owners list residential properties, connect with prospective buyers, and access assistance during the property transaction process.
                </p>
                <p>
                  This Privacy Policy explains how we collect, use, store, disclose and protect personal information when you visit our website, create an account, sign in using Google, submit a property listing, contact us or use our services.
                </p>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
                  By using our services, you acknowledge that you have read this Privacy Policy. Where applicable law requires consent for processing personal information, we will obtain that consent through an appropriate mechanism.
                </p>
              </section>

              {/* SECTION 2 */}
              <section id="sec-2" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    02
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    2. Information We Collect
                  </h2>
                </div>
                <p>Depending on the services you use, we may collect the following categories of information:</p>

                <div className="space-y-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-[#172033] font-['Montserrat'] text-sm mb-2 flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-[#0073E6]" />
                      <span>A. Personal and Account Information</span>
                    </h3>
                    <p className="mb-2">When you register or create an account, we may collect:</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Full name.</li>
                      <li>Email address.</li>
                      <li>Mobile phone number.</li>
                      <li>Account identifiers and authentication information.</li>
                      <li>Profile information provided through your chosen sign-in method.</li>
                    </ul>
                    <p className="mt-3 text-xs text-slate-600">
                      When you use Google Sign-In, we may receive your name, email address, profile picture and Google account identifier, depending on the permissions requested and granted. We use this information to authenticate you, create or manage your account, and provide the requested services.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      We do not request access to your Google password.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-[#172033] font-['Montserrat'] text-sm mb-2 flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-[#0073E6]" />
                      <span>B. Property Information</span>
                    </h3>
                    <p className="mb-2">When you submit a property listing, we may collect:</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>Property location, including locality and address details you provide.</li>
                      <li>Apartment or residential property details.</li>
                      <li>Property configuration, area, floor and age.</li>
                      <li>Expected selling price and related transaction information.</li>
                      <li>Property photographs and other listing information you choose to submit.</li>
                      <li>Ownership or authorization declarations relevant to listing a property.</li>
                      <li>Property verification and transaction status information.</li>
                    </ul>
                    <p className="mt-3 text-xs italic text-slate-500">
                      Please do not submit sensitive personal information or documents unless the platform specifically requests them through an appropriate, secure process.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-[#172033] font-['Montserrat'] text-sm mb-2 flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-[#0073E6]" />
                      <span>C. Buyer and Seller Enquiry Information</span>
                    </h3>
                    <p className="text-xs">
                      When you contact us, request property information, express interest in a property or submit an enquiry, we may collect your name, contact details, preferences, budget, enquiry messages and relevant transaction requirements.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="font-bold text-[#172033] font-['Montserrat'] text-sm mb-2 flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-[#0073E6]" />
                      <span>D. Technical and Usage Information</span>
                    </h3>
                    <p className="text-xs leading-relaxed">
                      When you access our website, we may collect technical information such as IP address, browser type, device information, access timestamps, diagnostic logs and information about interactions with our services. Cookies or similar technologies may be used for essential website functionality, session management, security and, where implemented, analytics or performance measurement.
                    </p>
                  </div>
                </div>
              </section>

              {/* SECTION 3 */}
              <section id="sec-3" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    03
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    3. How We Use Your Information
                  </h2>
                </div>
                <p>We process personal information for specific business and service-related purposes, including:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs">
                  {[
                    'Creating and managing user accounts.',
                    'Authenticating users through Google Sign-In or other supported authentication methods.',
                    'Receiving and managing residential property listings.',
                    'Connecting interested buyers and property owners.',
                    'Responding to enquiries and providing customer support.',
                    'Coordinating property visits, verification activities and transaction assistance where requested.',
                    'Maintaining property listing records and service histories.',
                    'Detecting fraud, unauthorized access, misuse and security incidents.',
                    'Maintaining, troubleshooting and improving our website and services.',
                    'Meeting applicable legal, regulatory and contractual obligations.',
                    'Sending service-related notifications and updates.',
                    'Sending promotional communications where permitted and, where required, with your consent.'
                  ].map((purpose, idx) => (
                    <div key={idx} className="flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{purpose}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 pt-2 font-medium">
                  We do not use personal information for purposes incompatible with the purposes disclosed in this policy without an appropriate legal basis or required consent.
                </p>
              </section>

              {/* SECTION 4: GOOGLE SIGN-IN & LIMITED USE */}
              <section id="sec-4" className="bg-gradient-to-br from-white to-blue-50/40 rounded-2xl border-2 border-[#0073E6]/30 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6] text-white flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    04
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    4. Google Sign-In and Google User Data
                  </h2>
                </div>
                <p>
                  SellMyGhar may offer Google Sign-In to allow users to authenticate using their Google accounts. When you choose Google Sign-In, Google may provide us with the information necessary to authenticate you and identify your account, subject to the permissions displayed during sign-in.
                </p>
                
                <div className="p-4 rounded-xl bg-white border border-blue-200 space-y-2">
                  <p className="font-bold text-[#172033] text-xs uppercase tracking-wider font-['Montserrat']">
                    We use Google user data for the following purposes:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li>Authenticating your identity.</li>
                    <li>Creating or accessing your SellMyGhar account.</li>
                    <li>Associating your Google account with your SellMyGhar account.</li>
                    <li>Supporting account security and preventing unauthorized access.</li>
                    <li>Communicating with you about your account and requested services.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs space-y-2 text-emerald-950">
                  <p className="font-bold font-['Montserrat'] flex items-center space-x-1.5 text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Google API Services User Data Policy Compliance (Limited Use Requirements):</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>We limit our access to Google user data to the information necessary for the functionality you request.</li>
                    <li><strong>No Sale:</strong> We do not sell Google user data.</li>
                    <li><strong>No Advertising:</strong> We do not use Google user data for advertising, personalized advertising or unrelated purposes.</li>
                    <li><strong>No Unauthorized Transfers:</strong> We do not transfer Google user data to third parties except where necessary to provide the requested functionality, comply with applicable law, or as otherwise permitted under Google's applicable policies and your consent.</li>
                    <li><strong>No AI Model Training:</strong> We do not use Google user data to develop, improve or train generalized artificial intelligence or machine learning models.</li>
                    <li><strong>Restricted Access:</strong> Access to Google user data is restricted to authorized personnel and service providers who need it for legitimate operational purposes and are subject to appropriate confidentiality and security obligations.</li>
                  </ul>
                  <p className="pt-1 font-semibold text-[11px] text-emerald-800">
                    Our handling of Google user data strictly complies with the Google API Services User Data Policy, including its Limited Use requirements.
                  </p>
                </div>
              </section>

              {/* SECTION 5 */}
              <section id="sec-5" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    05
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    5. Property Listings and Information Sharing
                  </h2>
                </div>
                <p>
                  SellMyGhar facilitates connections between property owners and prospective buyers. Information included in a property listing may be displayed to website visitors or shared with interested buyers to the extent necessary to provide the listing service and in accordance with your preferences and applicable law.
                </p>
                <p>
                  We aim to limit public property listings to relevant property information. Personal contact details, private account information and other non-public personal information will not intentionally be displayed publicly unless you choose to disclose them or the disclosure is otherwise permitted by applicable law.
                </p>
                <p>
                  We may share relevant information with an interested buyer, property owner or authorized service provider when necessary to respond to an enquiry, coordinate a viewing, perform an agreed verification activity or facilitate a transaction.
                </p>
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                  <strong>Important Notice:</strong> You should not include personal phone numbers, identity documents or other confidential information in publicly visible listing descriptions or photographs.
                </div>
              </section>

              {/* SECTION 6 */}
              <section id="sec-6" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    06
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    6. When We Share Personal Information
                  </h2>
                </div>
                <p>We may share personal information in the following circumstances:</p>
                <ul className="list-disc pl-5 space-y-2 text-xs">
                  <li><strong>Service providers:</strong> We may use hosting, database, authentication, communications, security and technical support providers to operate our platform.</li>
                  <li><strong>Buyers and sellers:</strong> We may share relevant information to facilitate property enquiries, viewings and transactions, subject to the nature of the service and applicable permissions.</li>
                  <li><strong>Professional service providers:</strong> Where necessary, we may share relevant information with authorized legal, verification or transaction service providers.</li>
                  <li><strong>Legal and regulatory requirements:</strong> We may disclose information where required by law, a valid legal process or a competent authority.</li>
                  <li><strong>Business changes:</strong> If our business undergoes a merger, restructuring or transfer, relevant information may be transferred subject to applicable legal requirements and appropriate safeguards.</li>
                </ul>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-[#172033]">
                  We do not sell personal information to third parties.
                </div>
                <p className="text-xs text-slate-500">
                  Third-party providers may process information under their own applicable privacy policies and contractual obligations. We take reasonable steps to use providers appropriate to the services they perform.
                </p>
              </section>

              {/* SECTION 7 */}
              <section id="sec-7" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    07
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    7. Data Storage and Security
                  </h2>
                </div>
                <p>
                  We use technical and organizational measures intended to protect personal information against unauthorized access, alteration, disclosure, loss or misuse.
                </p>
                <p>
                  Depending on the service and implementation, these measures may include access restrictions, authentication controls, secure communications, database permissions, logging, backups and security monitoring.
                </p>
                <p>
                  We may use third-party infrastructure providers to host or process information. The location of processing may depend on the infrastructure configuration and applicable provider arrangements.
                </p>
                <p className="text-xs text-slate-500 italic">
                  No method of electronic transmission or storage is completely secure. We cannot guarantee absolute security, but we work to maintain appropriate safeguards and address identified security issues.
                </p>
              </section>

              {/* SECTION 8 */}
              <section id="sec-8" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    08
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    8. Data Retention
                  </h2>
                </div>
                <p>
                  We retain personal information only for as long as reasonably necessary for the purposes described in this policy, including account management, property listing services, transaction support, dispute resolution, security and compliance with legal obligations.
                </p>
                <p>
                  Retention periods may vary according to the type of information, the services used, whether a transaction remains active and whether records must be preserved under applicable law.
                </p>
                <p>
                  When information is no longer required, we will take reasonable steps to delete it or anonymize it, subject to applicable legal obligations and legitimate retention requirements.
                </p>
              </section>

              {/* SECTION 9 */}
              <section id="sec-9" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    09
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    9. Your Privacy Rights and Choices
                  </h2>
                </div>
                <p>Subject to applicable law, you may request to:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs">
                  <li>Access information associated with your account.</li>
                  <li>Correct inaccurate or incomplete personal information.</li>
                  <li>Withdraw consent where processing relies on consent.</li>
                  <li>Request deletion of personal information where legally permissible.</li>
                  <li>Raise a grievance concerning the processing of your personal information.</li>
                  <li>Request information about relevant data processing or sharing, where applicable.</li>
                </ul>
                <p className="text-xs text-slate-600">
                  Withdrawing consent does not affect processing lawfully undertaken before withdrawal. It may also affect our ability to provide certain services.
                </p>
                <p className="text-xs">
                  To exercise these rights, contact us at <a href="mailto:support@sellmyghar.in" className="text-[#0073E6] font-semibold underline">support@sellmyghar.in</a> or <a href="mailto:contact@sellmyghar.in" className="text-[#0073E6] font-semibold underline">contact@sellmyghar.in</a>. We will review requests and respond in accordance with applicable law. We may need to verify your identity before acting on a request.
                </p>
              </section>

              {/* SECTION 10: ACCOUNT DELETION */}
              <section id="sec-10" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    10
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    10. Account Deletion
                  </h2>
                </div>
                <p>
                  You may request deletion of your SellMyGhar account and associated personal information by contacting us at:
                </p>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">Primary Deletion Desks:</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 font-mono text-[#0073E6] font-bold">
                      <a href="mailto:support@sellmyghar.in" className="hover:underline">support@sellmyghar.in</a>
                      <span className="text-slate-300">|</span>
                      <a href="mailto:contact@sellmyghar.in" className="hover:underline">contact@sellmyghar.in</a>
                    </div>
                  </div>
                  <a
                    href="mailto:support@sellmyghar.in?subject=SellMyGhar%20Account%20Deletion%20Request"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold font-['Montserrat'] transition-colors"
                  >
                    Email Deletion Request
                  </a>
                </div>

                <p className="text-xs">
                  Please include the email address or mobile number associated with your account and clearly state that you are requesting account deletion.
                </p>
                <p className="text-xs">
                  We may request reasonable information to verify your identity. After verification, we will process the request in accordance with applicable law and our retention obligations.
                </p>
                <p className="text-xs text-slate-500">
                  Some records may need to be retained for legal compliance, security, fraud prevention, dispute resolution or other lawful purposes. Where retention is necessary, we will limit it to the applicable purpose and period.
                </p>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-slate-700">
                  <strong>Google Sign-In Users:</strong> If you signed in using Google, you may also manage third-party access through your Google Account settings. Removing Google access does not necessarily delete your SellMyGhar account or information already stored by us. A separate deletion request may be required.
                </div>
              </section>

              {/* SECTION 11 */}
              <section id="sec-11" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    11
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    11. Cookies and Similar Technologies
                  </h2>
                </div>
                <p>
                  Our website may use cookies, session identifiers or similar technologies to maintain login sessions, support essential functionality, protect against misuse and improve website performance.
                </p>
                <p>
                  Where analytics or optional tracking technologies are implemented, we will provide applicable disclosures and obtain consent where required by law.
                </p>
                <p className="text-xs text-slate-500">
                  You can manage cookies through your browser settings. Disabling certain cookies may affect login or other website functionality.
                </p>
              </section>

              {/* SECTION 12 */}
              <section id="sec-12" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    12
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    12. Communications and Marketing
                  </h2>
                </div>
                <p>
                  We may contact you regarding account activity, property enquiries, listing updates, security matters and services you have requested.
                </p>
                <p>
                  Promotional communications will be handled in accordance with applicable law and any required consent. You may request to stop promotional communications by using an available unsubscribe mechanism or contacting us.
                </p>
                <p className="text-xs text-slate-500">
                  Essential service or security communications may continue where necessary to provide our services or comply with legal obligations.
                </p>
              </section>

              {/* SECTION 13 */}
              <section id="sec-13" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    13
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    13. Children’s Privacy
                  </h2>
                </div>
                <p>
                  SellMyGhar is intended for individuals legally capable of using our property-related services. Our services are not directed at children, and we do not knowingly collect children’s personal information in violation of applicable law.
                </p>
                <p className="text-xs text-slate-600">
                  If you believe that a child has provided personal information inappropriately, contact us at <a href="mailto:support@sellmyghar.in" className="text-[#0073E6] font-semibold underline">support@sellmyghar.in</a> so that we can review the matter and take appropriate action.
                </p>
              </section>

              {/* SECTION 14 */}
              <section id="sec-14" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    14
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    14. Third-Party Websites and Services
                  </h2>
                </div>
                <p>
                  Our website may integrate with or link to third-party services. Their collection and use of information are governed by their respective terms and privacy policies.
                </p>
                <p className="text-xs text-slate-500">
                  SellMyGhar is not responsible for the independent privacy practices of third-party websites or services, except to the extent required by applicable law.
                </p>
              </section>

              {/* SECTION 15 */}
              <section id="sec-15" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    15
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    15. Privacy and Data Protection in India
                  </h2>
                </div>
                <p>
                  We aim to handle personal information in accordance with applicable Indian laws, including the <strong>Digital Personal Data Protection Act, 2023</strong>, and the rules and provisions that apply to our processing activities as they come into force.
                </p>
                <p>
                  Where applicable, we will provide the required notices, obtain valid consent or rely on another lawful basis where permitted, facilitate the exercise of data principal rights, and maintain appropriate security and grievance-handling procedures.
                </p>
                <p className="text-xs font-semibold text-emerald-800">
                  Nothing in this policy limits rights available to individuals under applicable law.
                </p>
              </section>

              {/* SECTION 16 */}
              <section id="sec-16" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6]/10 text-[#0073E6] flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    16
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    16. Changes to This Privacy Policy
                  </h2>
                </div>
                <p>
                  We may update this Privacy Policy when our services, data practices, technology or legal obligations change.
                </p>
                <p>
                  The revised version will be published on this page with an updated date. Where required by law, we will provide additional notice or obtain consent before implementing material changes.
                </p>
                <p className="text-xs text-slate-500">
                  We encourage users to review this page periodically.
                </p>
              </section>

              {/* SECTION 17: CONTACT US & GRIEVANCES */}
              <section id="sec-17" className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0073E6] text-white flex items-center justify-center font-bold text-xs font-['Montserrat']">
                    17
                  </div>
                  <h2 className="text-xl font-extrabold text-[#172033] font-['Montserrat']">
                    17. Contact Us and Grievances
                  </h2>
                </div>
                <p>
                  For privacy questions, requests, complaints, or account deletion requests, please contact:
                </p>

                <div className="bg-[#172033] text-white p-6 sm:p-8 rounded-2xl space-y-4 text-xs font-['Poppins']">
                  <div className="border-b border-slate-700/80 pb-4">
                    <h3 className="text-base font-bold font-['Montserrat'] text-white">Sell My Ghar</h3>
                    <p className="text-slate-300 text-xs mt-0.5">Operated by Sudhamathi, Proprietor of Sell My Ghar</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Email Contacts</p>
                      <p className="flex items-center space-x-2 text-slate-200 font-medium">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <a href="mailto:support@sellmyghar.in" className="hover:text-emerald-400 transition-colors">support@sellmyghar.in</a>
                      </p>
                      <p className="flex items-center space-x-2 text-slate-200 font-medium">
                        <Mail className="w-3.5 h-3.5 text-emerald-400" />
                        <a href="mailto:contact@sellmyghar.in" className="hover:text-emerald-400 transition-colors">contact@sellmyghar.in</a>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Official Website</p>
                      <p className="flex items-center space-x-2 text-slate-200 font-medium">
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        <a href="https://sellmyghar.in" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition-colors">
                          https://sellmyghar.in
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-700/80 pt-4 space-y-1">
                    <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Business Address</p>
                    <p className="flex items-start space-x-2 text-slate-200 leading-relaxed">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>ESTEEM PARK, Rose Garden Road, 5th Phase, J. P. Nagar Phase 5, Bengaluru, Karnataka 560078, India.</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  Please describe your request clearly and include sufficient information for us to identify the relevant account. Do not send passwords, OTPs or unnecessary sensitive information by email. We will review and respond to privacy requests and grievances in accordance with applicable law.
                </p>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <span className="text-xs text-slate-400 font-['Montserrat']">End of Privacy Policy &bull; SellMyGhar.in</span>
                  <button
                    type="button"
                    onClick={() => onBackToHome ? onBackToHome() : window.location.hash = '#/'}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold font-['Montserrat'] shadow-md transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Homepage</span>
                  </button>
                </div>
              </section>

            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer onNavClick={handleTabClick} />
    </div>
  );
};
