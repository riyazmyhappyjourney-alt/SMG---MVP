import React, { useState } from 'react';
import { Header } from '../home/Header';
import { Footer } from '../home/Footer';
import { 
  HelpCircle, 
  ChevronDown, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  FileText, 
  PhoneCall, 
  ArrowRight,
  Search
} from 'lucide-react';

interface FaqPageProps {
  onBackToHome?: () => void;
  onNavigateToContact?: () => void;
  onNavigateToSellerAssisted?: () => void;
  onSignInClick?: () => void;
}

interface FaqCategory {
  title: string;
  items: Array<{ q: string; a: string }>;
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: 'Selling Your Apartment',
    items: [
      {
        q: 'How does SellMyGhar differ from listing on general classifieds portals?',
        a: 'Unlike open classifieds where your personal phone number is shared with hundreds of unvetted local brokers, SellMyGhar assigns a dedicated residential advisor, screens all prospective buyers for loan eligibility, and coordinates accompanied visits with zero broker spam.'
      },
      {
        q: 'Do I have to pay any upfront fee to list my flat on SellMyGhar?',
        a: 'No. Listing your property and onboarding with our assisted selling desk is 100% free with zero upfront charges. Our advisory success fee is only payable upon successful agreement execution and registration.'
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
    ]
  },
  {
    title: 'Buying a Resale Property',
    items: [
      {
        q: 'Are all properties listed on SellMyGhar verified?',
        a: 'Yes. Every published listing undergoes legal deed scrutiny against public records. Look for the "SellMyGhar Verified Property" badge indicating our legal team has confirmed clear marketable title.'
      },
      {
        q: 'Will SellMyGhar help me secure a home loan?',
        a: 'Yes. We partner with leading public and private banks (SBI, HDFC, ICICI) to provide fast-track project legal clearance and home loan pre-approvals for prospective buyers.'
      },
      {
        q: 'Can I negotiate the asking price with the seller?',
        a: 'Yes. All genuine offers submitted through SellMyGhar are formally communicated to direct owners through our deal negotiation desk without third-party commission markups.'
      }
    ]
  },
  {
    title: 'Legal Due Diligence & RERA Compliance',
    items: [
      {
        q: 'What is SellMyGhar’s Karnataka RERA registration number?',
        a: 'SellMyGhar operates as an authorized real estate facilitation platform registered with the Karnataka Real Estate Regulatory Authority under registration number PRM/KA/RERA/1251/309/AG/221108/003210.'
      },
      {
        q: 'What legal documents do you inspect before completing a resale?',
        a: 'Our legal desk verifies 30-year parent sale deeds, Joint Development Agreements (JDA), BBMP/BDA Khata extracts, Form 15 Encumbrance Certificates, latest property tax receipts, and Society No Objection Certificates (NOC).'
      },
      {
        q: 'How is my personal data handled under DPDP Act 2023?',
        a: 'We strictly comply with the Digital Personal Data Protection Act 2023. Your contact details are never monetized, never shared with third-party telemarketers, and only accessed with your verifiable consent.'
      }
    ]
  }
];

export const FaqPage: React.FC<FaqPageProps> = ({
  onBackToHome,
  onNavigateToContact,
  onNavigateToSellerAssisted,
  onSignInClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    '0-0': true, // first item open by default
  });

  // Ensure page starts cleanly at the top when navigated
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTabClick = (tab: 'BUY' | 'SELL' | 'ABOUT' | 'CONTACT') => {
    if (tab === 'SELL') {
      if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
      else window.location.hash = '#/post-property';
    } else if (tab === 'CONTACT') {
      if (onNavigateToContact) onNavigateToContact();
      else window.location.hash = '#/contact';
    } else if (tab === 'ABOUT') {
      window.location.hash = '#/about';
    } else {
      if (onBackToHome) onBackToHome();
      else window.location.href = '/';
    }
  };

  const categoriesToDisplay = selectedCategory === 'ALL'
    ? FAQ_CATEGORIES
    : FAQ_CATEGORIES.filter(c => c.title === selectedCategory);

  const filteredCategories = categoriesToDisplay.map(category => {
    if (!searchQuery.trim()) return category;
    const q = searchQuery.toLowerCase().trim();
    const filteredItems = category.items.filter(item => 
      item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
    );
    return {
      ...category,
      items: filteredItems
    };
  }).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-['Montserrat'] text-slate-800">
      <Header
        onPostPropertyClick={() => {
          if (onNavigateToSellerAssisted) onNavigateToSellerAssisted();
          else window.location.hash = '#/post-property';
        }}
        onLoginClick={() => {
          if (onSignInClick) onSignInClick();
          else window.location.hash = '#/auth/login';
        }}
        onTabClick={handleTabClick}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-[#0073E6] to-[#172033] text-white py-16 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto space-y-4 relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#B68A4A] text-xs font-bold tracking-wide uppercase border border-white/15">
              <HelpCircle className="w-4 h-4 text-[#B68A4A]" />
              <span>Knowledge Base & Advisory Support</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-['Poppins'] max-w-2xl mx-auto leading-relaxed">
              Find transparent answers about selling, buying, RERA compliance, title due diligence, and accompanied inspections.
            </p>

            {/* Quick Search */}
            <div className="max-w-xl mx-auto pt-4">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions (e.g. fees, home loan, RERA, visits)..."
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0073E6] shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs Filter */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'ALL', label: 'All Questions' },
              { id: 'Selling Your Apartment', label: 'Selling Flat' },
              { id: 'Buying a Resale Property', label: 'Buying Resale' },
              { id: 'Legal Due Diligence & RERA Compliance', label: 'Legal & RERA' },
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#0073E6] text-white shadow-md'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs Accordion */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-12">
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200">
              <p className="text-slate-600 font-['Poppins'] text-sm">
                No questions found matching "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-bold text-[#0073E6] hover:underline"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredCategories.map((category, catIdx) => (
              <div key={category.title} className="space-y-4">
                <h2 className="text-lg font-bold text-[#172033] flex items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="w-2 h-2 rounded-full bg-[#0073E6]" />
                  <span>{category.title}</span>
                </h2>

                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = Boolean(openItems[key]);

                    return (
                      <div
                        key={item.q}
                        className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(key)}
                          className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-bold text-xs sm:text-sm text-[#172033] leading-snug">
                            {item.q}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#0073E6]' : ''
                            }`}
                          />
                        </button>

                        {isOpen && (
                          <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 font-['Poppins'] leading-relaxed border-t border-slate-100 pt-3">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Still Have Questions CTA */}
          <div className="bg-[#172033] text-white rounded-3xl p-8 text-center space-y-4">
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Still have questions about your property?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-['Poppins'] max-w-lg mx-auto">
              Our residential resale advisors are available 7 days a week to guide you through Bengaluru transactions.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateToContact) onNavigateToContact();
                  else window.location.hash = '#/contact';
                }}
                className="px-5 py-2.5 bg-[#0073E6] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Contact Advisory Desk</span>
              </button>
              <a
                href="mailto:support@sellmyghar.in"
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
              >
                support@sellmyghar.in
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer onNavClick={handleTabClick} />
    </div>
  );
};
