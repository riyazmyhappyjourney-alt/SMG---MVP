import React, { useState } from 'react';
import { X, Building2, MapPin, IndianRupee, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BENGALURU_LOCALITIES } from '../../data/bengaluruData';

interface SellFlatPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFullWizard?: () => void;
}

export const SellFlatPopupModal: React.FC<SellFlatPopupModalProps> = ({
  isOpen,
  onClose,
  onOpenFullWizard,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [locality, setLocality] = useState('Whitefield');
  const [society, setSociety] = useState('');
  const [bhkType, setBhkType] = useState('3 BHK');
  const [expectedPrice, setExpectedPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: `+91${cleanPhone}`,
          locality,
          societyName: society.trim() || `${locality} Apartment`,
          bhkType,
          builtUpSqft: 1500,
          intent: 'SELL',
          notes: expectedPrice ? `Expected Price: ${expectedPrice}` : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit. Please try again.');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        
        {/* Backdrop click dismiss */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Window with Slide Up Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 50 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden font-['Montserrat'] my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-[#244B8F] to-[#1B396E] text-white flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>For Apartment Owners</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Sell Your Flat in 45 Days
              </h3>
              <p className="text-xs text-blue-100 font-normal mt-0.5">
                Registered deed valuation, legal diligence, and verified buyer matchmaking.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {isSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Request Received!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Our Bengaluru resale manager will contact you within 2 business hours with an authentic market deed price estimate.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-[#244B8F] text-white text-xs font-bold hover:bg-[#1B396E] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#244B8F] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit number"
                        maxLength={10}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#244B8F] focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Locality & Society */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bengaluru Locality <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={locality}
                        onChange={(e) => setLocality(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#244B8F] focus:outline-hidden bg-white font-medium"
                      >
                        {BENGALURU_LOCALITIES.map((loc) => (
                          <option key={loc.id} value={loc.name}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Society / Apartment Name
                    </label>
                    <input
                      type="text"
                      value={society}
                      onChange={(e) => setSociety(e.target.value)}
                      placeholder="e.g. Prestige Shantiniketan"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#244B8F] focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* BHK Configuration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Unit Configuration
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {['1 BHK', '2 BHK', '3 BHK', '4 BHK+'].map((bhk) => (
                      <button
                        key={bhk}
                        type="button"
                        onClick={() => setBhkType(bhk)}
                        className={`py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                          bhkType === bhk
                            ? 'bg-[#244B8F] text-white border-[#244B8F]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {bhk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected Resale Price */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Resale Price (Optional)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      placeholder="e.g. ₹1.45 Cr"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#244B8F] focus:outline-hidden font-medium"
                    />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <span>{isSubmitting ? 'Submitting...' : 'Sell Your Flat Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Fallback to full wizard */}
                {onOpenFullWizard && (
                  <div className="pt-2 text-center border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenFullWizard();
                      }}
                      className="text-xs text-slate-500 hover:text-[#244B8F] font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Want to upload photos & complete our 6-step listing wizard? Click here →
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
