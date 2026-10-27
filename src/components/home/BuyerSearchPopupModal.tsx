import React, { useState } from 'react';
import { X, Search, MapPin, IndianRupee, Phone, User, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BENGALURU_LOCALITIES } from '../../data/bengaluruData';
import { safeFetch } from '../../utils/safeApi';

interface BuyerSearchPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowseListings: (bhk?: string, locality?: string) => void;
}

export const BuyerSearchPopupModal: React.FC<BuyerSearchPopupModalProps> = ({
  isOpen,
  onClose,
  onBrowseListings,
}) => {
  const [selectedLocality, setSelectedLocality] = useState('ALL');
  const [selectedBhk, setSelectedBhk] = useState('3 BHK');
  const [budgetBand, setBudgetBand] = useState('₹1 Cr - ₹2 Cr');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBrowseNow = () => {
    onClose();
    onBrowseListings(selectedBhk.replace(' ', ''), selectedLocality === 'ALL' ? undefined : selectedLocality);
  };

  const handleRequestShortlist = async (e: React.FormEvent) => {
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
      const res = await safeFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: `+91${cleanPhone}`,
          locality: selectedLocality === 'ALL' ? 'Bengaluru' : selectedLocality,
          societyName: `${selectedBhk} in ${selectedLocality === 'ALL' ? 'Bengaluru' : selectedLocality}`,
          bhkType: selectedBhk,
          intent: 'BUY',
          notes: `Budget: ${budgetBand}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit enquiry. Please try again.');
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
          <div className="px-6 py-5 bg-gradient-to-r from-[#172033] to-[#0073E6] text-white flex items-start justify-between">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
                <Search className="w-3.5 h-3.5" />
                <span>For Home Buyers</span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Find Your Verified Flat
              </h3>
              <p className="text-xs text-blue-100 font-normal mt-0.5">
                Authentic registered deed benchmarks & pre-screened titles in Bengaluru.
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
                  <h4 className="text-lg font-bold text-slate-900">Buyer Requirement Saved!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    We will send verified {selectedBhk} options in {selectedLocality} matching your budget directly to your WhatsApp.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={handleBrowseNow}
                    className="px-5 py-2.5 rounded-xl bg-[#0073E6] text-white text-xs font-bold hover:bg-[#005BB5] transition-colors cursor-pointer"
                  >
                    Browse Live Listings Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Preferred Locality */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Locality
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      value={selectedLocality}
                      onChange={(e) => setSelectedLocality(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#0073E6] focus:outline-hidden bg-white font-medium"
                    >
                      <option value="ALL">All Bengaluru Corridors</option>
                      {BENGALURU_LOCALITIES.map((loc) => (
                        <option key={loc.id} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* BHK Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    BHK Requirement
                  </label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {['1 BHK', '2 BHK', '3 BHK', '4 BHK+'].map((bhk) => (
                      <button
                        key={bhk}
                        type="button"
                        onClick={() => setSelectedBhk(bhk)}
                        className={`py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                          selectedBhk === bhk
                            ? 'bg-[#0073E6] text-white border-[#0073E6]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {bhk}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Band */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Budget Band
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {['Under ₹1 Cr', '₹1 Cr - ₹2 Cr', '₹2 Cr - ₹3.5 Cr', '₹3.5 Cr+'].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setBudgetBand(b)}
                        className={`py-2 px-1 text-center rounded-lg font-semibold border transition-colors cursor-pointer text-[11px] ${
                          budgetBand === b
                            ? 'bg-[#172033] text-white border-[#172033]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Browse button */}
                <button
                  type="button"
                  onClick={handleBrowseNow}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#172033] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-[#0073E6]" />
                  <span>Browse Matching Flats On Page</span>
                </button>

                {/* WhatsApp Shortlist Form */}
                <form onSubmit={handleRequestShortlist} className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Or get curated verified flats sent to WhatsApp:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Your Full Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#0073E6] focus:outline-hidden font-medium"
                    />
                    <input
                      type="tel"
                      required
                      placeholder="10-digit Mobile"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:border-[#0073E6] focus:outline-hidden font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <span>{isSubmitting ? 'Requesting...' : 'Get Verified Shortlist on WhatsApp'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
