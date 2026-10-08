import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Lock, 
  RefreshCw,
  Search,
  Check,
  Ban
} from 'lucide-react';
import { AuthenticatedUser } from '../../core/types/auth';

export interface AdminErasureItem {
  id: string;
  userId: string;
  phoneDisplay: string;
  phoneHash: string;
  reason: string;
  requestedAt: string;
  status: 'PENDING_ADMIN_REVIEW' | 'APPROVED_EXECUTED' | 'REJECTED_STATUTORY_HOLD';
  hasCompletedDeal: boolean;
  activeDealsCount: number;
  unconvertedLeadsCount: number;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  summary?: {
    unconvertedLeadsAnonymized: number;
    userAccountAnonymized: boolean;
    propertiesSanitized: number;
  };
}

const INITIAL_DEMO_REQUESTS: AdminErasureItem[] = [
  {
    id: 'era-kn92f-8812',
    userId: 'usr-buyer-karthik-89',
    phoneDisplay: '+91 98450 12891 (Unconverted Lead)',
    phoneHash: 'a681771e33504cccc9e7806093acf29771305c5a7d6e696606cb273fef9aabc1',
    reason: 'I bought through another broker and no longer want my contact stored.',
    requestedAt: '1 hour ago',
    status: 'PENDING_ADMIN_REVIEW',
    hasCompletedDeal: false,
    activeDealsCount: 0,
    unconvertedLeadsCount: 1,
  },
  {
    id: 'era-pl88m-9934',
    userId: 'usr-seller-ramesh-02',
    phoneDisplay: '+91 98860 44219 (Completed Transaction)',
    phoneHash: '812f584b71e9e90f89e3b59ea4e208efaaaf28005c77bccb915ef26956ec0b80',
    reason: 'Property is sold, please wipe my entire account and deed papers.',
    requestedAt: '3 hours ago',
    status: 'PENDING_ADMIN_REVIEW',
    hasCompletedDeal: true,
    activeDealsCount: 1,
    unconvertedLeadsCount: 0,
  },
  {
    id: 'era-vc11x-4401',
    userId: 'usr-unlisted-priya-44',
    phoneDisplay: '+91 97412 88390 (Withdrawn Listing)',
    phoneHash: '39bb2f1c8411e741639f72782e4e4a055ff9626e2e5c83bc5df87e221379ec89',
    reason: 'Decided not to sell my flat. Requesting full DPDP erasure.',
    requestedAt: 'Yesterday',
    status: 'PENDING_ADMIN_REVIEW',
    hasCompletedDeal: false,
    activeDealsCount: 0,
    unconvertedLeadsCount: 1,
  }
];

export function AdminErasureQueue() {
  const [requests, setRequests] = useState<AdminErasureItem[]>(INITIAL_DEMO_REQUESTS);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_DEMO_REQUESTS[0].id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedRequest = requests.find(r => r.id === selectedId) || requests[0];

  const adminActor: AuthenticatedUser = {
    uid: 'usr-super-admin-01',
    phone: '+919876500000',
    email: 'compliance@sellmyghar.com',
    roles: ['STAFF_SUPER_ADMIN'],
    permissions: [],
  };

  const handleExecute = async () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setActionMessage(null);
    setShowConfirmModal(false);

    try {
      // Dispatch to compliance API backend
      const res = await fetch(`/api/compliance/erasure-requests/${selectedRequest.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: adminActor.uid,
          reason: 'Administrative erasure processed under DPDP Act Sec 12',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Backend execution failed with status ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'REJECTED_STATUTORY_HOLD') {
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
          ...r,
          status: 'REJECTED_STATUTORY_HOLD',
          reviewedByAdminId: adminActor.uid,
          reviewedAt: new Date().toLocaleTimeString(),
          rejectionReason: data.reason || 'Statutory Legal Hold Active: Party to completed transaction.',
        } : r));
        setActionMessage(`Erasure request ${selectedRequest.id} REJECTED due to mandatory statutory transaction hold.`);
      } else {
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
          ...r,
          status: 'APPROVED_EXECUTED',
          reviewedByAdminId: adminActor.uid,
          reviewedAt: new Date().toLocaleTimeString(),
          summary: data.summary || {
            unconvertedLeadsAnonymized: selectedRequest.unconvertedLeadsCount,
            userAccountAnonymized: true,
            propertiesSanitized: 1,
          }
        } : r));
        setActionMessage(`Atomic erasure executed for request ${selectedRequest.id}. Unconverted leads anonymized and phone hashed with irreversible HMAC-SHA256.`);
      }
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectStatutory = () => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    setTimeout(() => {
      setRequests(prev => prev.map(r => r.id === selectedRequest.id ? {
        ...r,
        status: 'REJECTED_STATUTORY_HOLD',
        reviewedByAdminId: adminActor.uid,
        reviewedAt: new Date().toLocaleTimeString(),
        rejectionReason: 'Manually rejected by Super Admin under DPDP Statutory Limitation Retention Rule.'
      } : r));
      setActionMessage(`Request ${selectedRequest.id} rejected under Statutory Hold.`);
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="text-base font-bold font-['Montserrat'] text-gray-900">
              DPDP Act Section 12: Statutory Erasure Review Queue
            </h2>
          </div>
          <p className="text-xs text-gray-600 mt-1 max-w-3xl">
            Dual-Key Super Admin Governance: Review data principal erasure requests. Verify whether statutory transaction holds apply
            before executing irreversible database anonymization.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 shrink-0">
          STAFF_SUPER_ADMIN Required
        </span>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Grid: Queue & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Request List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Pending Requests ({requests.filter(r => r.status === 'PENDING_ADMIN_REVIEW').length})
            </span>
            <span className="text-[11px] text-gray-400">Section 12 Queue</span>
          </div>

          <div className="divide-y divide-gray-100 overflow-y-auto max-h-[550px]">
            {requests.map(req => (
              <div
                key={req.id}
                onClick={() => setSelectedId(req.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedId === req.id ? 'bg-red-50/50 border-l-4 border-red-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-gray-900">{req.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    req.status === 'APPROVED_EXECUTED' ? 'bg-green-100 text-green-800' :
                    req.status === 'REJECTED_STATUTORY_HOLD' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {req.status === 'APPROVED_EXECUTED' ? 'ERASED' :
                     req.status === 'REJECTED_STATUTORY_HOLD' ? 'HOLD ACTIVE' : 'PENDING REVIEW'}
                  </span>
                </div>

                <p className="text-xs text-gray-700 font-semibold mt-1">{req.phoneDisplay}</p>
                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">"{req.reason}"</p>

                <div className="flex items-center space-x-2 text-[10px] text-gray-400 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{req.requestedAt}</span>
                  <span>•</span>
                  {req.hasCompletedDeal ? (
                    <span className="text-amber-700 font-semibold">1 Completed Deal</span>
                  ) : (
                    <span className="text-green-700 font-semibold">Eligible (0 Deals)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 2 Columns: Selected Request Review & Decision Pane */}
        {selectedRequest && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">Request: {selectedRequest.id}</span>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    User: {selectedRequest.userId}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Submitted: {selectedRequest.requestedAt}</p>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full self-start ${
                selectedRequest.status === 'APPROVED_EXECUTED' ? 'bg-green-100 text-green-800' :
                selectedRequest.status === 'REJECTED_STATUTORY_HOLD' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {selectedRequest.status}
              </span>
            </div>

            {/* Requester Statement */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Data Principal Stated Reason
              </span>
              <p className="text-xs text-gray-800 italic">"{selectedRequest.reason}"</p>
              <div className="text-[11px] text-gray-500 pt-2 font-mono break-all">
                Irreversible Phone Hash: <span className="text-gray-700">{selectedRequest.phoneHash}</span>
              </div>
            </div>

            {/* Statutory Hold Evaluation */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Automated Statutory Retention Hold Audit
              </h3>

              <div className={`p-4 rounded-xl border ${
                selectedRequest.hasCompletedDeal 
                  ? 'bg-amber-50/60 border-amber-200 text-amber-900' 
                  : 'bg-green-50/60 border-green-200 text-green-900'
              }`}>
                <div className="flex items-start space-x-3">
                  {selectedRequest.hasCompletedDeal ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold">
                      {selectedRequest.hasCompletedDeal
                        ? 'STATUTORY LEGAL HOLD ACTIVE (Retention Required)'
                        : 'ELIGIBLE FOR ATOMIC ERASURE (No Active or Completed Deals)'}
                    </h4>
                    <p className="text-xs leading-relaxed">
                      {selectedRequest.hasCompletedDeal
                        ? 'User is a registered party to 1 completed real estate transaction. Under Indian Income Tax Act Sec 194-IA (TDS on immovable property) and State Stamp limitation rules, transaction and linked deed escrow records must be retained. Full erasure must be rejected.'
                        : 'No active offers, visits, or completed transactions detected. Unconverted leads and unlisted property declarations are clear for atomic anonymization.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions for Pending Requests */}
            {selectedRequest.status === 'PENDING_ADMIN_REVIEW' && (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Super Admin Decision Desk
                </h3>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {!selectedRequest.hasCompletedDeal ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setShowConfirmModal(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Execute Atomic Erasure</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={handleExecute}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Apply Statutory Hold & Reject Erasure</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleRejectStatutory}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50 cursor-pointer"
                  >
                    Dismiss Request
                  </button>
                </div>
              </div>
            )}

            {/* Decision Receipt for Processed Requests */}
            {selectedRequest.status !== 'PENDING_ADMIN_REVIEW' && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-gray-800 font-bold">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Decision Finalized by Super Admin</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                  <div>Reviewed By: <strong className="font-mono text-gray-800">{selectedRequest.reviewedByAdminId || 'usr-super-admin-01'}</strong></div>
                  <div>Reviewed At: <strong className="text-gray-800">{selectedRequest.reviewedAt || 'Just now'}</strong></div>
                </div>
                {selectedRequest.rejectionReason && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                    Hold Reason: {selectedRequest.rejectionReason}
                  </div>
                )}
                {selectedRequest.summary && (
                  <div className="text-[11px] text-green-800 bg-green-50 p-2 rounded border border-green-200 mt-2">
                    Anonymization Summary: {selectedRequest.summary.unconvertedLeadsAnonymized} unconverted lead(s) wiped, user account anonymized.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold">Confirm Irreversible Data Erasure</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              You are about to execute an irreversible atomic PostgreSQL transaction for <strong>{selectedRequest?.id}</strong>.
              This will overwrite owner names with NULL, replace phone numbers with HMAC-SHA256, and sanitize private records.
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleExecute}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Executing...' : 'Confirm & Execute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
