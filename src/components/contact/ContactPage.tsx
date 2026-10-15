import React, { useState } from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Send,
  ShieldCheck,
  Headphones,
  FileCheck
} from 'lucide-react';
import { trackEnquirySubmitted } from '../../utils/analytics';

interface ContactPageProps {
  onNavigate: (route: 'HOME' | 'CRM' | 'CONSENT' | 'SELLER_ASSISTED' | 'CONTACT') => void;
  onSignInClick?: () => void;
  onConsentPortalOpen?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onNavigate,
  onSignInClick,
  onConsentPortalOpen,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<'SELLING' | 'BUYING' | 'LEGAL_DILIGENCE' | 'GENERAL'>('SELLING');
  const [message, setMessage] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    referenceId: string;
    message: string;
  } | null>(null);

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'SELL') {
      onNavigate('SELLER_ASSISTED');
    } else if (tab === 'BUY' || tab === 'ABOUT') {
      onNavigate('HOME');
    } else if (tab === 'CONTACT') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!dpdpConsent) {
      setErrorMessage('Please accept the DPDP data handling consent to submit your enquiry.');
      return;
    }

    setIsSubmitting(true);

    try {
      const subjectMap: Record<string, string> = {
        SELLING: 'Selling a Resale Apartment',
        BUYING: 'Buying a Resale Apartment',
        LEGAL_DILIGENCE: 'Legal Title Diligence & Deed Review',
        GENERAL: 'General Enquiry / Partnership'
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim(),
          subject: subjectMap[subject] || 'General Enquiry',
          message: message.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry. Please try again.');
      }

      setSubmissionSuccess({
        referenceId: data.referenceId || `SMG-CONT-${Date.now().toString().slice(-4)}`,
        message: data.message || 'Your enquiry has been received. Our advisory team will reach out within 2 business hours.'
      });

      trackEnquirySubmitted({ enquiryType: 'CONTACT' });

      // Reset form fields
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#244B8F] selection:text-white font-['Montserrat'] text-slate-800">
      
      {/* Sticky Header identical to Homepage */}
      <Header
        onPostPropertyClick={() => onNavigate('SELLER_ASSISTED')}
        onLoginClick={() => {
          if (onSignInClick) onSignInClick();
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1 pb-16 lg:pb-24">
        
        {/* Hero Section */}
        <section className="bg-[#172033] text-white py-12 lg:py-16 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 bg-white/10 text-slate-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border border-white/10 font-['Montserrat']">
                <Building2 className="w-3.5 h-3.5 text-[#B68A4A]" />
                <span>Bengaluru Resale Operations</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-['Montserrat'] leading-tight">
                Connect with SellMyGhar
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed font-['Poppins']">
                Whether you are listing an apartment for resale, scheduling a private walkthrough, or requesting legal title diligence, our advisory desk provides end-to-end assistance with zero broker spam.
              </p>
            </div>
          </div>
        </section>

        {/* Content Section: 2 Columns (Direct Channels + Form) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Direct Contact & Office Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Primary Office Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-200">
                <h3 className="text-base sm:text-lg font-bold text-[#172033] mb-4 flex items-center font-['Montserrat']">
                  <Building2 className="w-5 h-5 text-[#244B8F] mr-2 shrink-0" />
                  <span>Headquarters & Advisory Desk</span>
                </h3>

                <div className="space-y-4 text-xs sm:text-sm font-['Poppins'] text-slate-600">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-[#B68A4A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 font-['Montserrat']">SellMyGhar Technologies Pvt. Ltd.</p>
                      <p className="text-slate-600 text-xs sm:text-sm mt-0.5 leading-relaxed">
                        ESTEEM PARK, Rose Garden Rd, 5th Phase, J P Nagar Phase 5,<br />
                        J. P. Nagar, Bengaluru, Karnataka 560078
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                    <Phone className="w-4 h-4 text-[#244B8F] shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-['Montserrat'] font-semibold">Phone Helpline</span>
                      <a href="tel:+918217873708" className="font-semibold text-slate-900 hover:text-[#244B8F] transition-colors">
                        +91 8217873708
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                    <MessageSquare className="w-4 h-4 text-[#25D366] shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-['Montserrat'] font-semibold">WhatsApp Desk</span>
                      <a 
                        href="https://wa.me/918217873708?text=Hello%20SellMyGhar%20Desk,%20I%20have%20an%20enquiry%20regarding%20Bengaluru%20apartment%20resales."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        +91 82178 73708
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                    <Mail className="w-4 h-4 text-[#244B8F] shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-['Montserrat'] font-semibold">Email Desk</span>
                      <a href="mailto:support@sellmyghar.in" className="font-semibold text-slate-900 hover:text-[#244B8F] transition-colors">
                        support@sellmyghar.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-400 block font-['Montserrat'] font-semibold">Operating Hours</span>
                      <span className="font-medium text-slate-700">Monday – Saturday: 9:30 AM – 7:00 PM IST</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-['Montserrat']">
                  <div className="flex items-center space-x-1.5 text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-[#244B8F]" />
                    <span>Karnataka RERA Facilitator</span>
                  </div>
                  <span className="font-bold text-[#244B8F]">PRM/KA/RERA/1251</span>
                </div>
              </div>

              {/* Corridor Field Hubs */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-['Montserrat'] mb-3">
                  Bengaluru Corridor Field Hubs
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs font-['Poppins']">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 font-['Montserrat'] block">Whitefield Hub</span>
                    <span className="text-slate-500 text-[11px]">ITPL Main Road</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 font-['Montserrat'] block">Bellandur & ORR Hub</span>
                    <span className="text-slate-500 text-[11px]">EcoSpace Corridor</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 font-['Montserrat'] block">Hebbal & North Hub</span>
                    <span className="text-slate-500 text-[11px]">Airport Road Corridor</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-800 font-['Montserrat'] block">HSR & Sarjapur Hub</span>
                    <span className="text-slate-500 text-[11px]">Sector 2, HSR Layout</span>
                  </div>
                </div>
              </div>

              {/* Quick Seller Funnel CTA Card */}
              <div className="bg-[#172033] rounded-2xl p-6 text-white shadow-xs space-y-3">
                <span className="text-[11px] uppercase tracking-wider text-[#B68A4A] font-bold block font-['Montserrat']">
                  Looking to Sell Your Apartment?
                </span>
                <h4 className="text-base font-bold text-white font-['Montserrat']">
                  Start Assisted Resale Process
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-['Poppins']">
                  Get verified registration deed valuation, title vetting, and escorted visits with genuine pre-screened buyers.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('SELLER_ASSISTED')}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white text-[#172033] hover:bg-slate-100 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer group font-['Montserrat']"
                >
                  <span>Post Property Free</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

            </div>

            {/* Right Column: Direct Enquiry & Submission Form (7 cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#244B8F] uppercase tracking-wider mb-1 font-['Montserrat']">
                    <Headphones className="w-4 h-4" />
                    <span>Direct Enquiry & Callback</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] font-['Montserrat']">
                    Send Us a Message
                  </h2>
                  <p className="text-xs text-slate-500 font-['Poppins'] mt-1">
                    Fill in your details below. Our Bengaluru relationship team will get back to you within 2 business hours.
                  </p>
                </div>

                <div className="p-6 sm:p-8">
                  {submissionSuccess ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-emerald-900 font-['Montserrat']">
                        Enquiry Submitted Successfully
                      </h3>
                      <p className="text-xs text-emerald-800 font-['Poppins'] max-w-md mx-auto">
                        {submissionSuccess.message}
                      </p>
                      <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono text-xs font-bold text-emerald-900 max-w-xs mx-auto">
                        Reference ID: {submissionSuccess.referenceId}
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setSubmissionSuccess(null)}
                          className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer font-['Montserrat']"
                        >
                          Submit Another Enquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      
                      {errorMessage && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl font-['Poppins']">
                          {errorMessage}
                        </div>
                      )}

                      {/* Nature of Enquiry Radio / Pills */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2 font-['Montserrat']">
                          How can we assist you?
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { key: 'SELLING', label: 'Selling Flat' },
                            { key: 'BUYING', label: 'Buying Flat' },
                            { key: 'LEGAL_DILIGENCE', label: 'Title Diligence' },
                            { key: 'GENERAL', label: 'General Desk' },
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSubject(item.key as any)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer font-['Montserrat'] ${
                                subject === item.key
                                  ? 'bg-[#244B8F] text-white border-[#244B8F] shadow-xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Name & Phone in 2 cols */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Montserrat']">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Ramesh Kumar"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden font-['Poppins']"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Montserrat']">
                            Phone Number <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 font-['Montserrat']">+91</span>
                            <input
                              type="tel"
                              required
                              maxLength={10}
                              value={phone}
                              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                              placeholder="9845012345"
                              className="w-full pl-12 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden font-['Poppins']"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email (Optional) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Montserrat']">
                          Email Address <span className="text-slate-400 font-normal">(Optional, for summary copy)</span>
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. ramesh.kumar@example.com"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden font-['Poppins']"
                        />
                      </div>

                      {/* Message / Details */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 font-['Montserrat']">
                          Your Requirements or Message
                        </label>
                        <textarea
                          rows={4}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Please provide details about your property (society name, locality, BHK) or any specific questions regarding resale..."
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#244B8F] focus:outline-hidden font-['Poppins'] resize-y"
                        />
                      </div>

                      {/* DPDP Statutory Consent Checkbox */}
                      <div className="pt-1">
                        <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed font-['Poppins']">
                          <input
                            type="checkbox"
                            checked={dpdpConsent}
                            onChange={(e) => setDpdpConsent(e.target.checked)}
                            className="mt-0.5 rounded text-[#244B8F] focus:ring-[#244B8F]"
                          />
                          <span>
                            I consent to SellMyGhar processing my details under the Digital Personal Data Protection (DPDP) Act, 2023 for answering this enquiry. Zero broker spam guaranteed.
                          </span>
                        </label>
                      </div>

                      {/* Submit Button */}
                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 px-6 bg-[#244B8F] hover:bg-[#1B396E] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 font-['Montserrat']"
                        >
                          <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-paper-plane' : ''}`} />
                          <span>{isSubmitting ? 'Sending Enquiry...' : 'Submit Enquiry'}</span>
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 text-center font-['Poppins']">
                        Protected by statutory confidentiality. We never sell your number to external brokers.
                      </p>

                    </form>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer identical to Homepage */}
      <Footer
        onNavClick={handleTabClick}
        onConsentPortalOpen={onConsentPortalOpen}
      />

    </div>
  );
};
