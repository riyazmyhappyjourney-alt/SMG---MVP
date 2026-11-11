import { LeadStatus } from '../core/types/entities';

export interface PipelineStageConfig {
  key: LeadStatus;
  label: string;
  desc: string;
}

export const SELLER_PIPELINE_STAGES: PipelineStageConfig[] = [
  { key: 'NEW', label: 'NEW', desc: 'Fresh Seller Inquiry' },
  { key: 'RNR', label: 'RNR', desc: 'Ring Not Received' },
  { key: 'CONTACTED', label: 'CONTACTED', desc: 'Spoke with Owner' },
  { key: 'FOLLOW_UP', label: 'FOLLOW UP', desc: 'Valuation & Mandate Follow-up' },
  { key: 'PROPERTY_DETAILS', label: 'PROPERTY DETAILS', desc: 'Collecting Unit Specs & Photos' },
  { key: 'VERIFICATION', label: 'VERIFICATION', desc: 'Legal & Title Docs Review' },
  { key: 'LISTED', label: 'LISTED', desc: 'Verified & Live Listing' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', desc: 'Offer & Deal Pricing' },
  { key: 'CONVERTED', label: 'CONVERTED', desc: 'Deal Closed / Sold' },
  { key: 'LOST', label: 'LOST', desc: 'Inquiry Dropped' },
];

export const BUYER_PIPELINE_STAGES: PipelineStageConfig[] = [
  { key: 'NEW', label: 'NEW', desc: 'Fresh Buyer Inquiry' },
  { key: 'RNR', label: 'RNR', desc: 'Ring Not Received' },
  { key: 'CONTACTED', label: 'CONTACTED', desc: 'Requirement Call Done' },
  { key: 'FOLLOW_UP', label: 'FOLLOW UP', desc: 'Options Shared & Follow-up' },
  { key: 'SITE_VISIT', label: 'SITE VISIT', desc: 'Physical Tours' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', desc: 'Offer & Token Discussion' },
  { key: 'CONVERTED', label: 'CONVERTED', desc: 'Deal Closed / Booked' },
  { key: 'LOST', label: 'LOST', desc: 'Inquiry Dropped' },
];

/** Union of all distinct pipeline stages across Seller and Buyer workflows. */
export const ALL_PIPELINE_STAGES: PipelineStageConfig[] = [
  { key: 'NEW', label: 'NEW', desc: 'Fresh Inbound' },
  { key: 'RNR', label: 'RNR', desc: 'Ring Not Received' },
  { key: 'CONTACTED', label: 'CONTACTED', desc: 'Outreach Initiated' },
  { key: 'FOLLOW_UP', label: 'FOLLOW UP', desc: 'Follow-up in Progress' },
  { key: 'PROPERTY_DETAILS', label: 'PROPERTY DETAILS', desc: 'Unit Specs & Photos' },
  { key: 'VERIFICATION', label: 'VERIFICATION', desc: 'Title & Docs Review' },
  { key: 'LISTED', label: 'LISTED', desc: 'Property Listed Live' },
  { key: 'SITE_VISIT', label: 'SITE VISIT', desc: 'Physical Tours' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', desc: 'Offer & Pricing' },
  { key: 'CONVERTED', label: 'CONVERTED', desc: 'Deal Closed' },
  { key: 'LOST', label: 'LOST', desc: 'Inquiry Dropped' },
];

/** Returns the tailored lifecycle stages list for a Seller or Buyer lead. */
export function getPipelineStagesForLead(leadType?: string | null): PipelineStageConfig[] {
  return String(leadType || '').toUpperCase() === 'BUYER'
    ? BUYER_PIPELINE_STAGES
    : SELLER_PIPELINE_STAGES;
}

/** Returns user-friendly label and badge classes for any lead status. */
export function getStageDisplayMeta(stage?: string | null): { label: string; badgeClass: string; selectClass: string } {
  const s = String(stage || 'NEW').toUpperCase();
  switch (s) {
    case 'NEW':
      return {
        label: 'New Lead',
        badgeClass: 'bg-blue-50 text-[#0176D3] border-blue-200',
        selectClass: 'bg-blue-50/70 border-blue-200 text-[#0176D3]',
      };
    case 'RNR':
      return {
        label: 'RNR',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        selectClass: 'bg-orange-50 border-orange-300 text-orange-800',
      };
    case 'CONTACTED':
      return {
        label: 'CONTACTED',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        selectClass: 'bg-indigo-50/70 border-indigo-200 text-indigo-800',
      };
    case 'FOLLOW_UP':
      return {
        label: 'FOLLOW UP',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        selectClass: 'bg-amber-50/70 border-amber-200 text-amber-900',
      };
    case 'PROPERTY_DETAILS':
      return {
        label: 'PROPERTY DETAILS',
        badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        selectClass: 'bg-cyan-50/70 border-cyan-200 text-cyan-900',
      };
    case 'VERIFICATION':
      return {
        label: 'VERIFICATION',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
        selectClass: 'bg-teal-50/70 border-teal-200 text-teal-900',
      };
    case 'LISTED':
      return {
        label: 'LISTED',
        badgeClass: 'bg-violet-50 text-violet-800 border-violet-200',
        selectClass: 'bg-violet-50/70 border-violet-200 text-violet-900',
      };
    case 'SITE_VISIT':
      return {
        label: 'SITE VISIT',
        badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
        selectClass: 'bg-sky-50/70 border-sky-200 text-sky-900',
      };
    case 'NEGOTIATION':
      return {
        label: 'NEGOTIATION',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        selectClass: 'bg-purple-50/70 border-purple-200 text-purple-900',
      };
    case 'CONVERTED':
      return {
        label: 'CONVERTED',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        selectClass: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      };
    case 'LOST':
      return {
        label: 'LOST',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        selectClass: 'bg-rose-50 border-rose-300 text-rose-700',
      };
    default:
      return {
        label: s,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        selectClass: 'bg-white border-slate-200 text-slate-800',
      };
  }
}

export const LOST_REASON_OPTIONS: string[] = [
  'Bought elsewhere / Found another property',
  'Seller asking price not feasible / High expectations',
  'Location / Locality mismatch',
  'Budget constraints / Financing fell through',
  'Unresponsive / Invalid contact number',
  'Owner postponed / Cancelled listing',
  'Commission / Terms disagreement',
  'Other reason',
];
