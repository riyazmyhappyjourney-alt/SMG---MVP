import React, { useState } from 'react';
import { ChevronDown, HelpCircle, PhoneCall } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is there any charge for finding buyers?',
      a: 'No upfront charges whatsoever. The property valuation, marketing, and buyer screening are 100% free. We operate strictly on a transparent success basis upon final legal deed registration at the Sub-Registrar Office.'
    },
    {
      q: 'How long does it take to sell my flat?',
      a: 'Most flats in active Bengaluru corridors (Whitefield, Sarjapur, Thanisandra, Hebbal, Bellandur) find verified buyers and close within 45 days. Our pre-qualified buyer pool and realistic market pricing ensure fast turnaround.'
    },
    {
      q: 'How is the resale value calculated?',
      a: 'Our valuation combines recent registered deed records from the Kaveri Sub-Registrar registry, active society demand, floor rise, carpet area efficiency, and orientation to arrive at a realistic, non-inflated market price.'
    },
    {
      q: 'Do you help with legal documentation?',
      a: 'Yes, our senior diligence desk assists with complete Encumbrance Certificate (EC) download, Khata certificate transfer, loan clearance documentation, sale agreement drafting, and in-person registration closing at the Sub-Registrar.'
    },
    {
      q: 'Will I get endless spam calls from brokers?',
      a: 'Never. Your contact number is strictly shielded and never shared on public directories. All buyer queries, financial screenings, and site visits are handled directly by your dedicated Relationship Manager.'
    },
    {
      q: 'Can I sell my flat if there is an active home loan on it?',
      a: 'Yes. Over 60% of properties sold through SellMyGhar have existing bank loans. Our team coordinates with your lending bank for foreclosure statements, list of documents (LOD), and smooth tripartite escrow closing.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center space-x-2 text-[#0073E6] font-extrabold text-xs tracking-widest uppercase mb-2">
            <span className="w-5 h-0.5 bg-[#0073E6]"></span>
            <span>Frequently Asked Questions</span>
            <span className="w-5 h-0.5 bg-[#0073E6]"></span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600">
            Clear, straightforward answers about our Bengaluru apartment resale process.
          </p>
        </div>

        {/* 2-Column Responsive FAQ Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between space-x-3 hover:bg-slate-50/80 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#0073E6]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Help Note */}
        <div className="mt-10 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
          <span>Have more questions? Speak directly with our Bengaluru desk:</span>
          <a
            href="tel:+918217873708"
            className="inline-flex items-center space-x-1.5 font-bold text-[#0073E6] hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>+91 8217873708</span>
          </a>
        </div>

      </div>
    </section>
  );
};
