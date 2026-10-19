import React from 'react';
import { X, BookOpen, ShieldCheck, Calculator, ArrowRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface GuideArticle {
  id: string;
  title: string;
  category: string;
  readTime: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
}

export const SAMPLE_GUIDES: GuideArticle[] = [
  {
    id: 'subregistrar-guidance-benchmarking',
    title: 'Bengaluru Sub-Registrar Resale Deed Benchmarking & Guidance Value 2026',
    category: 'Valuation & Legal',
    readTime: '5 min read',
    summary: 'How Karnataka Department of Stamps and Registration calculates guidance value, stamp duty, and registration charges for apartment resale.',
    sections: [
      {
        heading: 'What is Sub-Registrar Guidance Value?',
        content: 'Karnataka Stamps & Registration Department benchmarks apartment guidance values based on exact super built-up area (SBUA), floor level, age of building, and society amenities.'
      },
      {
        heading: 'How Guidance Value Impacts Your Sale',
        content: 'The registered deed value cannot be lower than the government guidance value. In prime Bengaluru corridors (Whitefield, Bellandur, Hebbal, Thanisandra), guidance values were updated in late 2023 to reflect real-world market values, ensuring fair pricing and bank loan safety.'
      },
      {
        heading: 'Stamp Duty & Registration Costs Breakdown',
        content: 'In Karnataka, flat resale attracts 5% Stamp Duty + 1% Registration Fee + 2% Surcharge on stamp duty + 10% Cess. In total, buyers budget approximately 6.6% to 6.65% of the transaction value for statutory registration.'
      }
    ]
  },
  {
    id: 'title-diligence-checklist',
    title: '30-Year Parent Title & Document Diligence Checklist for Flats',
    category: 'Legal Due Diligence',
    readTime: '6 min read',
    summary: 'The comprehensive document checklist verified by SellMyGhar advocates before listing any resale property in Bengaluru.',
    sections: [
      {
        heading: '1. Primary Ownership Proofs',
        content: 'Mother Deed / Sale Deed, Absolute Sale Agreement with Developer, Joint Development Agreement (JDA), and Power of Attorney (if applicable).'
      },
      {
        heading: '2. Revenue & Municipal Authentications',
        content: 'BBMP e-Khata Certificate & Extract (Form A-Khata is mandatory for loan approval and clear resale transfer), up-to-date Property Tax SAS Receipts.'
      },
      {
        heading: '3. Encumbrance & Compliance Clearances',
        content: 'Form 15 Encumbrance Certificate for 30 years reflecting NIL outstanding mortgage claims, Occupancy Certificate (OC), and Commencement Certificate (CC).'
      }
    ]
  },
  {
    id: 'holding-cost-guide',
    title: 'The Real Financial Holding Cost of an Unsold Flat in Bengaluru',
    category: 'Financial Strategy',
    readTime: '4 min read',
    summary: 'Why waiting 9–12 months with traditional brokers costs Bengaluru flat owners ₹6 to ₹10 Lakhs in foregone rent and society maintenance.',
    sections: [
      {
        heading: 'The Hidden Drain of Prolonged Resale',
        content: 'A vacant 3 BHK in Whitefield or Sarjapur Road carrying ₹45,000 monthly rental value loses ₹5,40,000 in rental revenue every year it sits unsold. Adding ₹60,000 in society maintenance, owners surrender ₹6,00,000 annually.'
      },
      {
        heading: 'The SellMyGhar 45-Day Formula',
        content: 'By pairing accurate registered deed benchmarking with pre-screened buyers and title verification, properties transact within 45 days at peak market price rather than languishing on open classifieds.'
      }
    ]
  }
];

interface GuideModalProps {
  guideId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ guideId, isOpen, onClose }) => {
  if (!isOpen) return null;

  const currentGuide = SAMPLE_GUIDES.find(g => g.id === guideId) || SAMPLE_GUIDES[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-['Montserrat']">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 text-left"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-[#172033] text-white flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{currentGuide.category} · {currentGuide.readTime}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {currentGuide.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed bg-blue-50/70 p-4 rounded-xl border border-blue-100">
              {currentGuide.summary}
            </p>

            <div className="space-y-5">
              {currentGuide.sections.map((sec, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="text-sm font-bold text-[#172033]">
                    {sec.heading}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-['Poppins']">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold">
                SellMyGhar Knowledge Desk · Updated 2026
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#0073E6] text-white text-xs font-bold hover:bg-[#005BB5] transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
