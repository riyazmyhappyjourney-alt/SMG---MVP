import React, { useState, useEffect } from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { Briefcase, MapPin, CheckCircle, AlertCircle, X, Send, FileText } from 'lucide-react';
import { safeFetch } from '../../utils/safeApi';

interface CareersPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
  onNavigateToAbout?: () => void;
  onNavigateToFaq?: () => void;
}

interface RoleItem {
  id?: string;
  title: string;
  dept?: string;
  department?: string;
  location: string;
  type?: string;
  employment_type?: string;
  description: string;
}

const FALLBACK_ROLES: RoleItem[] = [
  {
    id: 'pos-seed-rm',
    title: 'Senior Residential Relationship Manager',
    department: 'Sales & Field Operations',
    location: 'Bengaluru (East: Whitefield / ORR)',
    employment_type: 'Full-time',
    description: 'Lead pre-screened site viewings, conduct seller consultations, and guide buyers through apartment resale agreements in premium gated societies.'
  },
  {
    id: 'pos-seed-legal',
    title: 'Legal Conveyance & Title Diligence Specialist',
    department: 'Legal & Compliance',
    location: 'Bengaluru (Head Office: JP Nagar Phase 5)',
    employment_type: 'Full-time',
    description: 'Scrutinize 30-year parent sale deeds, BBMP Khata certificates, and Form 15 Encumbrance Certificates to ensure pristine title clarity for apartment resales.'
  },
  {
    id: 'pos-seed-analyst',
    title: 'Real Estate Valuation & Pricing Analyst',
    department: 'Market Research',
    location: 'Bengaluru (Hybrid)',
    employment_type: 'Full-time',
    description: 'Analyze recorded Sub-Registrar transactions, guidance values, and locality absorption indices to price flats at peak fair market value.'
  }
];

export const CareersPage: React.FC<CareersPageProps> = ({
  onBackToHome,
  onNavigateToContact,
  onNavigateToSellerAssisted,
  onSignInClick,
  onNavigateToAbout,
  onNavigateToFaq,
}) => {
  const [roles, setRoles] = useState<RoleItem[]>(FALLBACK_ROLES);
  const [loading, setLoading] = useState(true);

  // Application Modal State
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [experienceYears, setExperienceYears] = useState('3-5 years');
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/careers/positions');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.positions) && data.positions.length > 0) {
            if (isMounted) setRoles(data.positions);
          }
        }
      } catch (err) {
        // Fall back gracefully to preset seeds
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPositions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'SELL') {
      if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
      else window.location.hash = '#/post-property';
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) onNavigateToContact();
      else window.location.hash = '#/contact';
    } else if (tab === 'ABOUT') {
      if (onNavigateToAbout) onNavigateToAbout();
      else window.location.hash = '#/about';
    } else {
      if (onBackToHome) onBackToHome();
      else window.location.hash = '#/';
    }
  };

  const openApplyModal = (role: RoleItem) => {
    setSelectedRole(role);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const closeApplyModal = () => {
    setSelectedRole(null);
    setApplicantName('');
    setApplicantEmail('');
    setApplicantPhone('');
    setExperienceYears('3-5 years');
    setResumeUrl('');
    setCoverNote('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.trim() || !applicantPhone.trim()) {
      setSubmitError('Please fill in your name, email, and contact phone.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await safeFetch('/api/careers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position_id: selectedRole?.id || null,
          position_title: selectedRole?.title || 'General Application',
          applicant_name: applicantName.trim(),
          email: applicantEmail.trim(),
          phone: applicantPhone.trim(),
          experience_years: experienceYears,
          resume_url: resumeUrl.trim(),
          cover_note: coverNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Error submitting application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] selection:bg-[#0073E6] selection:text-white font-['Montserrat'] text-slate-800">
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
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-[#0073E6] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#172033] font-['Montserrat']">
                Open Positions in Bengaluru
              </h2>
              <span className="text-xs text-slate-500 font-['Poppins']">
                {roles.length} {roles.length === 1 ? 'Opening' : 'Openings'} Available
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {roles.map((role, idx) => (
                <div 
                  key={role.id || idx}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 font-['Poppins']">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#0073E6] bg-blue-50 px-2 py-0.5 rounded-md">
                        {role.department || role.dept || 'Operations'}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {role.employment_type || role.type || 'Full-time'}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#172033] font-['Montserrat']">
                      {role.title}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {role.description}
                    </p>
                    <div className="flex items-center text-xs text-slate-400 space-x-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{role.location}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openApplyModal(role)}
                    className="shrink-0 px-5 py-2.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-all text-center cursor-pointer shadow-xs hover:shadow-sm"
                  >
                    Apply Now &rarr;
                  </button>
                </div>
              ))}
            </div>

          </div>

        </div>
      </main>

      {/* Application Form Modal */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 font-['Poppins'] relative">
            <button
              type="button"
              onClick={closeApplyModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {submitSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Montserrat']">
                  Application Received!
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Thank you for applying for <strong className="text-slate-800">{selectedRole.title}</strong>. Our talent acquisition team will review your qualifications and reach out to you shortly.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={closeApplyModal}
                    className="px-6 py-2.5 bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0073E6] bg-blue-50 px-2 py-0.5 rounded-md">
                    Application Form
                  </span>
                  <h3 className="text-lg font-bold text-[#172033] font-['Montserrat'] mt-2">
                    {selectedRole.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedRole.department || selectedRole.dept} &bull; {selectedRole.location}
                  </p>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <form onSubmit={handleApplicationSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0073E6] font-['Poppins']"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={applicantEmail}
                        onChange={(e) => setApplicantEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0073E6] font-['Poppins']"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0073E6] font-['Poppins']"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Relevant Experience
                      </label>
                      <select
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0073E6] font-['Poppins'] bg-white"
                      >
                        <option value="0-1 years (Fresher)">0-1 years (Fresher)</option>
                        <option value="1-3 years">1-3 years</option>
                        <option value="3-5 years">3-5 years</option>
                        <option value="5-8 years">5-8 years</option>
                        <option value="8+ years">8+ years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Resume / Portfolio Link
                      </label>
                      <input
                        type="url"
                        placeholder="Google Drive / LinkedIn link"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0073E6] font-['Poppins']"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Brief Note / Why SellMyGhar? (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Tell us briefly about your domain expertise and background..."
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0073E6] font-['Poppins']"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={closeApplyModal}
                      className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <Footer onNavClick={handleTabClick} />
    </div>
  );
};
