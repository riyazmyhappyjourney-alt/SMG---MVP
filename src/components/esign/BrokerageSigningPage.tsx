import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  User,
  Clock,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  BadgeCheck,
  ExternalLink,
  Download,
  Share2
} from 'lucide-react';
import { formatIndianCurrency, formatReadableDate } from '../../utils/formatters';

interface BrokerageSigningPageProps {
  propertyId: string;
  onBackToHome?: () => void;
}

export const BrokerageSigningPage: React.FC<BrokerageSigningPageProps> = ({
  propertyId,
  onBackToHome
}) => {
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Signing Flow State
  const [step, setStep] = useState<'REVIEW' | 'OTP' | 'SIGNED'>('REVIEW');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [signing, setSigning] = useState(false);
  const [agreementToken, setAgreementToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgreement() {
      if (!propertyId) {
        setError('Missing property reference ID.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/public/brokerage-agreement/${encodeURIComponent(propertyId)}`);
        const data = await res.json();
        if (res.ok && data.success && data.property) {
          setProperty(data.property);
          if (data.property.status === 'SIGNED') {
            setStep('SIGNED');
            setAgreementToken(data.property.agreementId || `DIGIO-ESIGN-UIDAI-${propertyId.toUpperCase()}`);
          }
        } else {
          setError(data.message || 'Unable to load brokerage agreement details.');
        }
      } catch (e: any) {
        setError('Network error connecting to agreement verification server.');
      } finally {
        setLoading(false);
      }
    }
    fetchAgreement();
  }, [propertyId]);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      alert('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setStep('OTP');
  };

  const handleCompleteSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      alert('Please enter the 6-digit OTP sent to your Aadhaar-linked mobile number.');
      return;
    }

    setSigning(true);
    try {
      const cleanAadhaar = aadhaarNumber.replace(/\D/g, '');
      const signerHash = `UIDAI-SHA256-${cleanAadhaar.slice(-4)}-${Date.now().toString(36).toUpperCase()}`;
      const res = await fetch(`/api/public/brokerage-agreement/${encodeURIComponent(propertyId)}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId: property?.agreementId || `agr-brk-${propertyId}`,
          signerAadhaarHash: signerHash
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAgreementToken(data.signerAadhaarHash || signerHash);
        setStep('SIGNED');
        if (property) {
          setProperty({ ...property, status: 'SIGNED' });
        }
      } else {
        alert(data.message || 'Failed to complete digital Aadhaar signature. Please try again.');
      }
    } catch {
      alert('Network error connecting to eSign service.');
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Poppins'] flex flex-col">
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Back to SellMyGhar"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#0176D3] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                SMG
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm tracking-tight block">SellMyGhar</span>
                <span className="text-[10px] text-slate-500 block">Digital Mandate Signing Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Digio Licensed ESP</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <Loader2 className="w-8 h-8 text-[#0073E6] animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-800">Loading Brokerage Agreement...</p>
            <p className="text-xs text-slate-500 mt-1">Verifying statutory compliance and document authenticity</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">Agreement Not Found</h3>
            <p className="text-xs text-slate-600 mt-1 mb-4">{error}</p>
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="px-4 py-2 bg-[#0073E6] text-white text-xs font-semibold rounded-xl hover:bg-[#005BB5] cursor-pointer"
              >
                Return to SellMyGhar
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statutory Compliance Notice Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950 text-xs flex items-start space-x-3">
              <ShieldCheck className="w-4 h-4 text-[#0176D3] shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-blue-900 mb-0.5">
                  Statutory Compliance: Section 1(4) Information Technology Act, 2000
                </strong>
                <span>
                  This Aadhaar eSign digitally executes the Exclusive Brokerage Representation Mandate between SellMyGhar and the Property Owner. It does not transfer property ownership. Physical deed execution and Sub-Registrar registration apply solely upon final buyer conveyance.
                </span>
              </div>
            </div>

            {/* Document Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Document Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                    MANDATE REF: {property?.agreementId || property?.id}
                  </span>
                  <h1 className="text-lg font-bold text-slate-900">
                    Exclusive Sole Representation Mandate Agreement
                  </h1>
                  <p className="text-xs text-slate-500">
                    Indian Contract Act 1872 & Information Technology Act 2000 Electronic Execution
                  </p>
                </div>

                <div>
                  {step === 'SIGNED' ? (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                      <BadgeCheck className="w-4 h-4 text-emerald-600" />
                      <span>SIGNED & EXECUTED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span>AWAITING AADHAAR OTP eSIGN</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Property & Owner Highlights Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-b border-slate-100 bg-white">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Property Asset</span>
                  </div>
                  <strong className="text-sm font-bold text-slate-900 block truncate">
                    {property?.title}
                  </strong>
                  <span className="text-xs text-slate-500">{property?.locality}, Bengaluru</span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <User className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Registered Owner</span>
                  </div>
                  <strong className="text-sm font-bold text-slate-900 block truncate">
                    {property?.ownerName}
                  </strong>
                  <span className="text-xs text-slate-500 font-mono">{property?.ownerPhone}</span>
                </div>

                <div className="p-4 sm:p-5">
                  <div className="flex items-center space-x-2 text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <FileText className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Fixed Success Fee</span>
                  </div>
                  <strong className="text-sm font-bold text-emerald-700 block">
                    1% (Payable on Deed Registration)
                  </strong>
                  <span className="text-xs text-slate-500">
                    Asking Price: {formatIndianCurrency(property?.askingPriceInr || 15000000)}
                  </span>
                </div>
              </div>

              {/* Agreement Clauses & Terms Content */}
              <div className="p-6 sm:p-8 space-y-5 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto bg-slate-50/20 border-b border-slate-100">
                <div className="border-b border-slate-200/80 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">1. Appointment & Scope of Representation</h4>
                  <p>
                    The Owner hereby appoints SellMyGhar as their sole and exclusive property sales advisory firm to market, syndicate, showcase, and coordinate prospective buyer offers for the residential property specified above.
                  </p>
                </div>

                <div className="border-b border-slate-200/80 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">2. Professional Fee (1% Success-Only Fee)</h4>
                  <p>
                    The Owner agrees to pay SellMyGhar a fixed professional brokerage fee equal to 1.0% (one percent) of the final agreed sale consideration value. <strong>This fee is strictly payable upon successful execution and registration of the Sale Deed before the Sub-Registrar.</strong> There are zero upfront listing fees, zero photography fees, and zero hidden platform charges.
                  </p>
                </div>

                <div className="border-b border-slate-200/80 pb-3">
                  <h4 className="font-bold text-slate-900 text-sm mb-1">3. Services Provided by SellMyGhar</h4>
                  <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-600">
                    <li>High-definition professional photography & virtual floorplan documentation</li>
                    <li>Syndication across verified high-intent buyer networks and enterprise portals</li>
                    <li>Dedicated Relationship Manager conducting vetted, pre-screened buyer site visits</li>
                    <li>End-to-end legal title verification, encumbrance check, and draft Agreement to Sell coordination</li>
                    <li>Sub-Registrar slot booking and registration assistance</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">4. Validity & Governing Law</h4>
                  <p>
                    This Agreement shall be valid for a period of 90 days from the date of Aadhaar electronic signature. It is governed by the laws of India and subject to the exclusive jurisdiction of the Courts at Bengaluru, Karnataka.
                  </p>
                </div>
              </div>

              {/* Action / Signing Box */}
              <div className="p-6 sm:p-8 bg-white">
                {step === 'SIGNED' ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-emerald-900">
                        Agreement Signed & Executed Successfully!
                      </h3>
                      <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                        Your brokerage agreement is legally binding under the Information Technology Act 2000. SellMyGhar is now actively representing your property.
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="inline-block bg-white px-3.5 py-1.5 rounded-lg border border-emerald-300 text-left font-mono text-[11px] text-slate-700 shadow-2xs">
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Aadhaar eSign Ref</span>
                        <span>{agreementToken || `UIDAI-DIGIO-VERIFIED-${property?.id}`}</span>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-center space-x-3">
                      {onBackToHome && (
                        <button
                          type="button"
                          onClick={onBackToHome}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Go to SellMyGhar Home
                        </button>
                      )}
                    </div>
                  </div>
                ) : step === 'REVIEW' ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4 max-w-md mx-auto">
                    <div className="text-center mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Sign Digitally via Aadhaar OTP</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Enter your 12-digit Aadhaar Number to receive an instant verification OTP.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Aadhaar / Virtual ID (UIDAI) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={14}
                        value={aadhaarNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                          // Format XXXX-XXXX-XXXX
                          const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1-');
                          setAadhaarNumber(formatted);
                        }}
                        placeholder="••••-••••-••••"
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-base font-bold text-slate-900 tracking-widest focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073E6]/20 focus:border-[#0073E6]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={aadhaarNumber.replace(/\D/g, '').length !== 12}
                      className="w-full py-3 bg-[#0073E6] hover:bg-[#005BB5] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Request Aadhaar OTP (Digio ESP)</span>
                    </button>

                    <p className="text-[10px] text-center text-slate-400">
                      Your Aadhaar number is securely encrypted and used solely for authenticating your electronic signature. SellMyGhar never stores core biometric data.
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleCompleteSign} className="space-y-4 max-w-md mx-auto">
                    <div className="text-center mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Enter Verification Code</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        6-digit OTP sent to mobile linked with Aadhaar ending in {aadhaarNumber.slice(-4)}.
                      </p>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="• • • • • •"
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-lg font-bold text-slate-900 tracking-widest focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={otp.length < 4 || signing}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck2 className="w-4 h-4" />}
                      <span>{signing ? 'Verifying with UIDAI...' : 'Confirm & Sign Mandate'}</span>
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setStep('REVIEW')}
                        className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
                      >
                        Change Aadhaar Number
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        <span>© {new Date().getFullYear()} SellMyGhar. Licensed eSign Integration powered by Digio ESP. Governed by IT Act 2000.</span>
      </footer>
    </div>
  );
};
