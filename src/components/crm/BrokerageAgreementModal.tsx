import React, { useState } from 'react';
import {
  X,
  FileCheck2,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Building2,
  User,
  Clock,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatIndianCurrency, formatReadableDate, formatReadableTime } from '../../utils/formatters';

interface BrokerageAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  owner: any;
  signingUrl?: string;
  onSignComplete?: () => void;
}

export function BrokerageAgreementModal({
  isOpen,
  onClose,
  property,
  owner,
  signingUrl,
  onSignComplete
}: BrokerageAgreementModalProps) {
  const [copied, setCopied] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!isOpen || !property) return null;

  const isSigned = property.brokerage_agreement_status === 'SIGNED';
  const agreementId = property.brokerage_agreement_document_id || `agr-brk-${property.id || 'seed'}`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sellmyghar.in';
  const base = origin.includes('crm.') ? 'https://sellmyghar.in' : origin;
  const effectiveUrl = signingUrl || `${base}/#/esign/brokerage/${property.id}`;
  const sellerName = owner?.display_name || owner?.displayName || property?.owner_name || 'Property Owner';
  const sellerPhone = owner?.phone || property?.owner_phone || '+91 99999 99999';
  const price = property.asking_price_inr || property.askingPriceInr || 14500000;
  const projectTitle = property.title || property.projectName || property.project_locality_id || 'Residential Apartment';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(effectiveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulateSign = async () => {
    setSigning(true);
    try {
      const res = await fetch(`/api/crm/properties/${property.id}/brokerage-agreement/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agreementId,
          signerAadhaarHash: `UIDAI-VERIFIED-TOKEN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
        })
      });
      if (res.ok) {
        if (onSignComplete) onSignComplete();
      }
    } catch (e) {
      console.error('Sign error:', e);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto font-['Poppins'] animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-[#0176D3] text-white flex items-center justify-center shadow-2xs">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Brokerage Representation Agreement</span>
                <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                  isSigned
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {isSigned ? 'SIGNED & EXECUTED' : 'AWAITING AADHAAR OTP eSIGN'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-normal">
                Agency representation mandate governed by the Indian Contract Act & Information Technology Act.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Callout Strip (When Awaiting Signature) */}
        {!isSigned && (
          <div className="px-5 py-3 bg-blue-50/80 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" />
              <span className="text-slate-700 font-medium text-[11px]">
                Signing link dispatched to seller: <strong className="text-slate-900">{sellerPhone}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded text-[11px] font-semibold text-slate-700 shadow-2xs cursor-pointer flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                <span>{copied ? 'Link Copied!' : 'Copy Signing Link'}</span>
              </button>
              <button
                type="button"
                onClick={handleSimulateSign}
                disabled={signing}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold shadow-2xs cursor-pointer flex items-center space-x-1"
                title="Test signing as seller in sandbox mode"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>{signing ? 'Signing...' : 'Simulate Aadhaar eSign'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Agreement Document Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-100/60">
          <div className="bg-white p-6 sm:p-8 rounded-lg border border-slate-200 shadow-xs space-y-5 text-slate-800 text-xs leading-relaxed font-sans">
            
            {/* Document Letterhead */}
            <div className="text-center border-b border-slate-200 pb-4 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#0176D3]">
                SellMyGhar Technologies Private Limited
              </span>
              <h2 className="text-base font-bold text-slate-900">
                EXCLUSIVE REAL ESTATE BROKERAGE & MARKETING MANDATE
              </h2>
              <div className="text-[10px] text-slate-500 flex items-center justify-center space-x-2 pt-0.5">
                <span>Ref: <strong className="font-mono text-slate-700">{agreementId}</strong></span>
                <span>•</span>
                <span>Platform: Digio ESP (CCA Accredited)</span>
              </div>
            </div>

            {/* Parties */}
            <div className="bg-slate-50/70 p-3.5 rounded-md border border-slate-200 space-y-2 text-[11px]">
              <div className="flex items-start justify-between">
                <div>
                  <strong className="text-slate-900 block font-semibold">1. BROKERAGE:</strong>
                  <span className="text-slate-600">SellMyGhar Technologies Pvt. Ltd., Bengaluru, Karnataka.</span>
                </div>
              </div>
              <div className="flex items-start justify-between border-t border-slate-200/60 pt-2">
                <div>
                  <strong className="text-slate-900 block font-semibold">2. PROPERTY OWNER / SELLER:</strong>
                  <span className="text-slate-700 font-medium">{sellerName}</span>
                  <span className="text-slate-500 block font-mono text-[10px]">{sellerPhone}</span>
                </div>
              </div>
            </div>

            {/* Property Under Mandate */}
            <div className="space-y-1.5 text-[11px]">
              <strong className="text-slate-900 font-semibold block uppercase tracking-wider text-[10px] text-slate-500">
                Property Specifications
              </strong>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/70 rounded-md border border-slate-200">
                <div>
                  <span className="text-slate-400 text-[10px] block">Project / Community:</span>
                  <strong className="text-slate-800">{projectTitle}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Agreed Asking Price:</span>
                  <strong className="text-slate-900 font-bold">{formatIndianCurrency(price)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Unit Config:</span>
                  <strong className="text-slate-800">{property.bhk_type || property.bhkType || '3 BHK'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Super Built-Up Area:</span>
                  <strong className="text-slate-800">{property.super_built_up_sqft || property.superBuiltUpSqft || 1450} sq.ft</strong>
                </div>
              </div>
            </div>

            {/* Core Terms */}
            <div className="space-y-2 text-[11px] text-slate-700 leading-relaxed">
              <p>
                <strong>1. Appointment:</strong> The Seller hereby appoints SellMyGhar as its authorized real estate marketing representative to arrange visits, advertise, and represent the unit to qualified prospective purchasers.
              </p>
              <p>
                <strong>2. Success Fee:</strong> The Seller agrees to pay a brokerage consideration of <strong>1.0% (One Percent)</strong> of the final negotiated registered sale consideration upon execution of the definitive conveyance contract.
              </p>
              <p>
                <strong>3. Non-Exclusive Representation:</strong> The Seller retains full freedom to reject any buyer offer below their reserve price floor. No advance marketing deposit or listing retainer is charged.
              </p>
            </div>

            {/* Execution / Certificate Stamp */}
            <div className="border-t border-slate-200 pt-4">
              {isSigned ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Cryptographically Signed via Aadhaar eSign</span>
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700">CCA VERIFIED</span>
                  </div>
                  <div className="text-[10px] text-emerald-900/80 font-mono space-y-0.5 pt-1">
                    <div>Signer: {sellerName} (Aadhaar Verified)</div>
                    <div>Signed At: {property.brokerage_agreement_signed_at ? `${formatReadableDate(property.brokerage_agreement_signed_at)} at ${formatReadableTime(property.brokerage_agreement_signed_at)}` : new Date().toLocaleString()}</div>
                    <div>Doc Digest: SHA-256 (Valid X.509 v3 Digital Certificate)</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-[11px] text-amber-900 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Awaiting Aadhaar OTP authentication from seller ({sellerPhone})</span>
                  </div>
                  <span className="font-semibold text-[10px] text-amber-700 uppercase tracking-wider">PENDING</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            Status: <strong className={isSigned ? 'text-emerald-700' : 'text-blue-700'}>{property.brokerage_agreement_status || 'SENT'}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer"
          >
            Close Viewer
          </button>
        </div>

      </div>
    </div>
  );
}
