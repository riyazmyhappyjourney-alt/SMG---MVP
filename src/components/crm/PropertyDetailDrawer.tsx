import React from 'react';
import {
  Building2,
  Home,
  MapPin,
  Phone,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  Share2,
  AlertCircle,
  Calendar,
  Layers,
  Compass,
  RefreshCw,
  MessageSquare,
  ExternalLink,
  Edit3,
  BadgeCheck,
  FileCheck2,
  Tag,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import {
  formatIndianCurrency,
  formatReadableDate,
  formatReadableTime
} from '../../utils/formatters';

export interface PropertyDetailDrawerProps {
  selectedPropertyId: string;
  onClose: () => void;
  propertyDetailData: any;
  propertyDetailLoading: boolean;
  propertyDetailError: string | null;
  onRetry: (pid: string) => void;
  canSeeReservePrice: boolean;
  onVerifyDocument?: (docId: string, status: 'VERIFIED' | 'REJECTED', note?: string) => Promise<void>;
  onVerifyPropertyStatus?: (status: string) => Promise<void>;
  onRejectDocument?: (doc: any) => void;
  onEditInPropertyEditor?: (property: any) => void;
  onGenerateBrochure?: () => void;
  onGenerateCompletionLink?: (propertyId: string) => void;
  onInitiateBrokerageAgreement?: (propertyId: string) => void;
  onViewLead?: (leadId: string) => void;
  isAdmin?: boolean;
}

export function PropertyDetailDrawer({
  selectedPropertyId,
  onClose,
  propertyDetailData,
  propertyDetailLoading,
  propertyDetailError,
  onRetry,
  canSeeReservePrice,
  onVerifyDocument,
  onVerifyPropertyStatus,
  onRejectDocument,
  onEditInPropertyEditor,
  onGenerateBrochure,
  onGenerateCompletionLink,
  onInitiateBrokerageAgreement,
  onViewLead,
  isAdmin,
}: PropertyDetailDrawerProps) {
  const property = propertyDetailData?.property;
  const owner = propertyDetailData?.owner;
  const linkedLead = propertyDetailData?.linkedLead;
  const documents: any[] = propertyDetailData?.documents || [];
  const visits: any[] = propertyDetailData?.visits || [];
  const offers: any[] = propertyDetailData?.offers || [];

  const displayTitle = property?.title || property?.projectName || property?.apartment_society_name || 'Property Specifications';
  const bhk = property?.bhk_type || property?.bhkType || property?.bhk || '2 BHK';
  const locality = property?.locality || property?.localityName || property?.project_locality_id || 'Bengaluru';
  const askingPrice = property?.asking_price_inr || property?.askingPriceInr;
  const reservePrice = property?.reserve_minimum_price_inr;
  const superBuiltUp = property?.super_built_up_sqft || property?.superBuiltUpSqft;
  const carpetArea = property?.carpet_area_sqft || property?.carpetAreaSqft;
  const facing = property?.facing || 'East';
  const floorInfo = [
    property?.wing_tower ? `Tower ${property.wing_tower}` : null,
    property?.unit_floor ? `Floor ${property.unit_floor}` : (property?.total_floors ? `Floor — of ${property.total_floors}` : null),
    property?.unit_number ? `Unit ${property.unit_number}` : null,
  ].filter(Boolean).join(' • ');

  const listingStatus = property?.listing_status || property?.listingStatus || 'ACTIVE';
  const verificationTier = property?.verification_tier || 'LEVEL_1_OWNER_DECLARED';
  const brokerageStatus = property?.brokerage_agreement_status || 'DRAFT';

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg lg:max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-slate-200/80 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header (Exact Match to LeadDetailDrawer) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 max-w-[260px] truncate" title={displayTitle}>
                {displayTitle}
              </h3>
              <div className="flex items-center flex-wrap gap-2 mt-0.5 text-xs text-slate-500 font-normal">
                <span className="font-medium text-slate-800">
                  {bhk}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-normal">
                  {locality}
                </span>
                <span className="text-slate-300">•</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                  listingStatus === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : listingStatus === 'DRAFT'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {listingStatus}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[11px] text-slate-400">{selectedPropertyId}</span>
              </div>
              {/* Secondary Address / Unit Subheading */}
              <div className="flex items-center space-x-1.5 mt-1 text-xs text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#0176D3] shrink-0" />
                <span className="text-slate-600 truncate max-w-[240px]">
                  {floorInfo ? `${floorInfo} • ${facing} Facing` : `${facing} Facing • Bengaluru`}
                </span>
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center space-x-1.5">
            {onGenerateBrochure && (
              <button
                type="button"
                onClick={onGenerateBrochure}
                title="Generate Property Brochure (A4)"
                className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#0176D3]" />
              </button>
            )}
            {onGenerateCompletionLink && (
              <button
                type="button"
                onClick={() => onGenerateCompletionLink(selectedPropertyId)}
                title="Generate Seller Self-Completion Link (7 Days)"
                className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
              </button>
            )}
            {onEditInPropertyEditor && property && (
              <button
                type="button"
                onClick={() => onEditInPropertyEditor(property)}
                title="Edit Property Specs"
                className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body (Exact Match to LeadDetailDrawer) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-xs font-['Poppins']">
          {propertyDetailLoading ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0073E6]" />
              <p className="text-xs font-medium">Retrieving verified property record from PostgreSQL...</p>
            </div>
          ) : propertyDetailError ? (
            <div className="py-16 text-center space-y-3">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-700 max-w-sm mx-auto">
                <p className="font-bold text-xs">Unable to load property specifications</p>
                <p className="text-[11px] mt-1">{propertyDetailError}</p>
              </div>
              <button
                type="button"
                onClick={() => onRetry(selectedPropertyId)}
                className="px-4 py-2 bg-[#0073E6] text-white rounded-md font-bold text-xs shadow-xs cursor-pointer hover:bg-[#005BB5]"
              >
                Retry
              </button>
            </div>
          ) : !propertyDetailData || !property ? (
            <div className="py-16 text-center text-slate-400">Property record not found.</div>
          ) : (
            <>
              {/* 1. Quick Financials & Specs Strip (Matching LeadDetailDrawer Strip) */}
              <div className="bg-slate-50/80 rounded-md p-3.5 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Asking Price</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {askingPrice && !isNaN(Number(askingPrice))
                        ? formatIndianCurrency(askingPrice)
                        : 'Price on Request'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Owner Reserve Bottom</span>
                    <strong className="text-emerald-700 font-bold text-sm">
                      {canSeeReservePrice
                        ? reservePrice && !isNaN(Number(reservePrice))
                          ? formatIndianCurrency(reservePrice)
                          : 'Not Specified'
                        : '[RESTRICTED]'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">BHK & Area</span>
                    <strong className="text-slate-900 font-bold text-sm">
                      {bhk} • {superBuiltUp ? `${superBuiltUp.toLocaleString('en-IN')} sq.ft` : 'SBUA N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block font-medium">Facing & Floor</span>
                    <strong className="text-slate-900 font-bold text-xs block mt-0.5">
                      {facing} • {property.unit_floor ? `Floor ${property.unit_floor}` : 'Mid Floor'}
                    </strong>
                  </div>
                </div>

                {/* Sub-strip with Listing Status & Verification Tier */}
                <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 flex items-center space-x-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0073E6] shrink-0" />
                    <span>Title Due Diligence:</span>
                    <strong className="text-slate-900 font-semibold">
                      {verificationTier === 'LEVEL_3_PHYSICALLY_INSPECTED'
                        ? 'Level 3 (Advocate Certified)'
                        : verificationTier === 'LEVEL_2_DOCS_REVIEWED'
                        ? 'Level 2 (Docs Verified)'
                        : 'Level 1 (Owner Declared)'}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Created: <strong className="text-slate-800">{formatReadableDate(property.created_at || new Date().toISOString())}</strong>
                  </span>
                </div>
              </div>

              {/* 2. Owner & Linked Seller Lead Card */}
              {(owner || linkedLead) && (
                <div className="bg-white rounded-md p-3.5 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-[#0176D3]" />
                      <span>Property Ownership & Seller Lead Link</span>
                    </h4>
                    {linkedLead && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Lead Linked: {linkedLead.lead_status || 'Active'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {owner && (
                      <div className="bg-slate-50/70 rounded-md p-3 border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Verified Title Owner
                        </span>
                        <div className="font-semibold text-slate-900 text-sm">
                          {owner.display_name || owner.displayName || 'Owner'}
                        </div>
                        <div className="text-slate-600 font-mono text-xs flex items-center justify-between">
                          <span>{owner.phone || 'Phone not listed'}</span>
                          {owner.phone && (
                            <div className="flex items-center space-x-1">
                              <a
                                href={`tel:${owner.phone}`}
                                title="Call Owner"
                                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => window.open(`https://wa.me/${String(owner.phone).replace(/[^0-9]/g, '')}`, '_blank')}
                                title="WhatsApp Owner"
                                className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        {owner.email && (
                          <div className="text-[11px] text-slate-500 truncate">
                            {owner.email}
                          </div>
                        )}
                      </div>
                    )}

                    {linkedLead && (
                      <div className="bg-slate-50/70 rounded-md p-3 border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Linked Intake Lead
                        </span>
                        <div className="font-semibold text-slate-900 text-sm">
                          {linkedLead.owner_name || linkedLead.ownerName || 'Seller Intake'}
                        </div>
                        <div className="text-slate-600 text-xs flex items-center justify-between">
                          <span>Status: <strong>{linkedLead.lead_status || 'NEW'}</strong></span>
                          {linkedLead.assigned_staff_name && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              Staff: {linkedLead.assigned_staff_name}
                            </span>
                          )}
                        </div>
                        {onViewLead && linkedLead.id && (
                          <button
                            type="button"
                            onClick={() => onViewLead(linkedLead.id)}
                            className="mt-1 text-[11px] font-semibold text-[#0176D3] hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <span>Open In Lead Detail Drawer</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Title Verification & Due Diligence Documents */}
              <div className="bg-white rounded-md p-3.5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Title Verification & Legal Due Diligence ({documents.length})</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0073E6] border border-blue-200">
                      {verificationTier}
                    </span>
                    {onVerifyPropertyStatus && verificationTier !== 'LEVEL_2_DOCS_REVIEWED' && verificationTier !== 'LEVEL_3_PHYSICALLY_INSPECTED' && (
                      <button
                        type="button"
                        onClick={() => onVerifyPropertyStatus('VERIFIED')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-md cursor-pointer flex items-center space-x-1"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verify to L2</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Statutory IT Act Section 1(4) Notice */}
                <div className="bg-slate-50/70 rounded-md p-2.5 border border-slate-200 text-[11px] space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-semibold text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#0176D3] shrink-0" />
                    <span>Statutory Property Documentation Architecture</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    Under Indian Law (IT Act 2000 Section 1(4)), Sale Deeds and conveyance instruments are strictly excluded from digital electronic signatures. Scanned, registered physical deed uploads are maintained below with cryptographic SHA-256 validation.
                  </p>
                </div>

                {documents.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] py-2 text-center">No documents uploaded for this property yet.</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white rounded-md border border-slate-200 space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <strong className="text-slate-900 text-xs block truncate" title={doc.file_name}>
                              {doc.file_name}
                            </strong>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Type: <strong className="text-slate-700">{doc.doc_type || 'Title Deed'}</strong> • Uploaded: {formatReadableDate(doc.created_at)}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${
                              doc.verification_status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : doc.verification_status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {doc.verification_status}
                          </span>
                        </div>

                        {doc.discrepancy_note && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-md text-[10px] text-rose-800">
                            <strong>Discrepancy Note:</strong> {doc.discrepancy_note}
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-1.5 pt-1.5 border-t border-slate-100">
                          {onVerifyDocument && doc.verification_status !== 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={() => onVerifyDocument(doc.id, 'VERIFIED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] rounded-md cursor-pointer"
                            >
                              Verify Document
                            </button>
                          )}
                          {onRejectDocument && doc.verification_status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => onRejectDocument(doc)}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[10px] rounded-md cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Brokerage Agreement & Aadhaar eSign Lifecycle */}
              <div className="bg-white rounded-md p-3.5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Brokerage Agreement (Agency Representation eSign)</span>
                  </h4>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                    brokerageStatus === 'SIGNED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : brokerageStatus === 'SENT'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-700 border border-slate-200'
                  }`}>
                    {brokerageStatus}
                  </span>
                </div>

                <div className="bg-slate-50/70 rounded-md p-3 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">eSign Platform Integration:</span>
                    <strong className="text-slate-900">Licensed ESP (Digio / Aadhaar eSign)</strong>
                  </div>
                  {property?.brokerage_agreement_signed_at && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Execution Timestamp:</span>
                      <strong className="text-emerald-700">
                        {formatReadableDate(property.brokerage_agreement_signed_at)} at {formatReadableTime(property.brokerage_agreement_signed_at)}
                      </strong>
                    </div>
                  )}
                  {property?.brokerage_agreement_document_id && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Stored Agreement Doc:</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {property.brokerage_agreement_document_id}
                      </span>
                    </div>
                  )}

                  {brokerageStatus !== 'SIGNED' && onInitiateBrokerageAgreement && (
                    <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onInitiateBrokerageAgreement(selectedPropertyId)}
                        className="px-3 py-1.5 bg-[#0073E6] hover:bg-[#005BB5] text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer flex items-center space-x-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Send Aadhaar eSign Agreement</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Scheduled Buyer Visits */}
              <div className="bg-white rounded-md p-3.5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Scheduled Property Visits ({visits.length})</span>
                  </h4>
                </div>

                {visits.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] py-2 text-center">No client visits scheduled for this property.</p>
                ) : (
                  <div className="space-y-2">
                    {visits.map((v: any) => (
                      <div key={v.id} className="p-3 bg-slate-50/70 rounded-md border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 text-xs block">{v.client_name || v.buyer_name || 'Prospective Buyer'}</strong>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatReadableDate(v.visit_date)} at {formatReadableTime(v.visit_time)}
                            {v.assigned_staff_name && ` • Assigned: ${v.assigned_staff_name}`}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0073E6] border border-blue-200">
                          {v.status || 'SCHEDULED'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Buyer Offers & Deal Execution */}
              <div className="bg-white rounded-md p-3.5 border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#0176D3]" />
                    <span>Buyer Offers & Purchase Orders ({offers.length})</span>
                  </h4>
                </div>

                {offers.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px] py-2 text-center">No buyer offers recorded for this listing.</p>
                ) : (
                  <div className="space-y-2">
                    {offers.map((o: any) => (
                      <div key={o.id} className="p-3 bg-slate-50/70 rounded-md border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900 text-xs block">{o.buyer_name || 'Buyer'}</strong>
                          <p className="text-[10px] text-[#0073E6] font-bold mt-0.5">
                            {formatIndianCurrency(o.offer_amount_inr)}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          o.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : o.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-[#0073E6] border border-blue-200'
                        }`}>
                          {o.status || 'PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer (Exact Match to LeadDetailDrawer) */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {onGenerateCompletionLink && (
              <button
                type="button"
                onClick={() => onGenerateCompletionLink(selectedPropertyId)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Self-Completion Link</span>
              </button>
            )}
            {onGenerateBrochure && (
              <button
                type="button"
                onClick={onGenerateBrochure}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-md shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#0073E6]" />
                <span>Brochure</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onEditInPropertyEditor && property && (
              <button
                type="button"
                onClick={() => onEditInPropertyEditor(property)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer"
              >
                Edit in PropertyEditor
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-md cursor-pointer transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
