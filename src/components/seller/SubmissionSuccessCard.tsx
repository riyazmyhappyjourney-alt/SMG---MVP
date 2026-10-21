import React from 'react';
import { CheckCircle2, ExternalLink, ArrowRight, Home, Building2, ShieldCheck, Clock } from 'lucide-react';

export interface SubmissionSuccessCardProps {
  propertyTitle: string;
  propertyId: string | null;
  referenceId: string;
  listingStatus?: string;
  verificationTier?: string;
  societyName: string;
  locality: string;
  bhkConfig: string;
  superBuiltUpSqft: number | string;
  expectedPrice: string | number;
  formattedPriceText?: string;
  onViewProperty?: (id: string) => void;
  onViewDashboard?: () => void;
  onBackToHome?: () => void;
}

export function SubmissionSuccessCard({
  propertyTitle,
  propertyId,
  referenceId,
  listingStatus = 'PUBLISHED',
  verificationTier = 'LEVEL_1_OWNER_DECLARED',
  societyName,
  locality,
  bhkConfig,
  superBuiltUpSqft,
  expectedPrice,
  formattedPriceText,
  onViewProperty,
  onViewDashboard,
  onBackToHome,
}: SubmissionSuccessCardProps) {
  const isPublished = listingStatus === 'PUBLISHED';

  const handleOpenProperty = () => {
    if (!propertyId) return;
    if (onViewProperty) {
      onViewProperty(propertyId);
    } else {
      window.location.href = `/property/${propertyId}`;
    }
  };

  const handleOpenDashboard = () => {
    if (onViewDashboard) {
      onViewDashboard();
    } else {
      window.location.hash = '/dashboard';
    }
  };

  const handleOpenHome = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      window.location.hash = '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] py-12 px-4 sm:px-6 lg:px-8 font-['Poppins']">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xs border border-slate-200 p-8 sm:p-10 text-center">
        {/* Verification / Success Icon */}
        <div className="w-16 h-16 bg-[#EBF1FA] text-[#244B8F] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#244B8F]/20">
          <CheckCircle2 className="w-8 h-8 text-[#244B8F]" />
        </div>

        {/* Dynamic Status Badge */}
        <div className="mb-3">
          {isPublished ? (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 font-['Montserrat']">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>Listing Status: Published & Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 font-['Montserrat']">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Listing Status: Under Legal Review</span>
            </span>
          )}
        </div>

        {/* Standard Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mb-2 font-['Montserrat']">
          Thank You for Listing with SellMyGhar!
        </h1>

        {/* Context-Aware Supporting Text */}
        <p className="text-slate-600 text-sm leading-relaxed mb-6 max-w-lg mx-auto font-['Poppins']">
          {isPublished
            ? 'Your property details have been submitted successfully. You can view your property listing below.'
            : 'Your property details have been submitted successfully and are currently awaiting review by our Bengaluru title diligence team. You can view your submitted property details below.'}
        </p>

        {/* Property Summary Specs Box */}
        <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 mb-8 text-left max-w-lg mx-auto space-y-3 font-['Poppins'] text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="text-slate-500 font-medium">Property Title:</span>
            <span className="font-bold text-[#172033] text-right max-w-[280px] truncate">
              {propertyTitle || `${societyName} - ${bhkConfig}`}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Listing Reference:</span>
            <span className="font-mono font-bold text-[#244B8F] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
              {referenceId}
            </span>
          </div>

          {propertyId && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Property ID:</span>
              <span className="font-mono text-slate-700">{propertyId}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Community & Location:</span>
            <span className="font-semibold text-slate-800 text-right">
              {societyName}, {locality}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Configuration & Area:</span>
            <span className="font-semibold text-slate-800">
              {bhkConfig} ({superBuiltUpSqft} sq.ft.)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
            <span className="text-slate-500 font-medium">Expected Price:</span>
            <span className="font-bold text-[#244B8F] text-sm font-['Montserrat']">
              {formattedPriceText || expectedPrice}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 font-['Montserrat']">
          {propertyId && (
            <button
              type="button"
              onClick={handleOpenProperty}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#244B8F] hover:bg-[#1B386B] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>{isPublished ? 'View Listed Property' : 'View Submitted Property'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenDashboard}
            className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#244B8F] hover:bg-[#F0F4FA] text-[#244B8F] font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>Go to My Properties</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleOpenHome}
            className="w-full sm:w-auto px-5 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Home className="w-3.5 h-3.5 text-slate-500" />
            <span>Return to Homepage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
