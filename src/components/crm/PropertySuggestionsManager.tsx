import React, { useState, useEffect, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Building,
  MapPin,
  Tag,
  ShieldAlert,
  Loader2,
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { ExternalPropertySuggestion, CsvParsedRow, CsvImportSummary } from '../../server/inventory/property-suggestions-service';

interface PropertySuggestionsManagerProps {
  bearerToken?: string;
}

export const PropertySuggestionsManager: React.FC<PropertySuggestionsManagerProps> = ({ bearerToken }) => {
  const [suggestions, setSuggestions] = useState<ExternalPropertySuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // CSV Upload & Preview State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<CsvParsedRow[] | null>(null);
  const [previewStats, setPreviewStats] = useState<{ total: number; valid: number; errors: number; duplicates: number } | null>(null);
  const [duplicatePolicy, setDuplicatePolicy] = useState<'SKIP_DUPLICATES' | 'UPDATE_DUPLICATES'>('SKIP_DUPLICATES');
  const [importing, setImporting] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<CsvImportSummary | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'SUCCESS' | 'ERROR'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
  };

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/property-suggestions', { headers: authHeaders });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuggestions(data.items || []);
      }
    } catch {
      // Ignore network errors in test mode
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  // Handle Download Template
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch('/api/crm/property-suggestions/template', { headers: authHeaders });
      if (!res.ok) throw new Error('Failed to download template');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sellmyghar_external_suggestions_template.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionNotice({ type: 'ERROR', message: err.message || 'Unable to download CSV template' });
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setActionNotice({ type: 'ERROR', message: 'Please upload a valid .csv file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setActionNotice({ type: 'ERROR', message: 'CSV file must be under 5MB' });
      return;
    }

    setCsvFile(file);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      await generatePreview(content);
    };
    reader.readAsText(file);
  };

  // Generate Preview
  const generatePreview = async (text: string) => {
    setImporting(true);
    setActionNotice(null);
    setImportSummary(null);

    try {
      const res = await fetch('/api/crm/property-suggestions/preview', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ csvText: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse CSV preview');
      }

      setPreviewRows(data.preview.rows || []);
      setPreviewStats({
        total: data.preview.totalRows,
        valid: data.preview.validCount,
        errors: data.preview.errorCount,
        duplicates: data.preview.duplicateCount,
      });
    } catch (err: any) {
      setActionNotice({ type: 'ERROR', message: err.message || 'Error parsing CSV file' });
      setPreviewRows(null);
    } finally {
      setImporting(false);
    }
  };

  // Execute Import
  const handleExecuteImport = async () => {
    if (!csvText) return;
    setImporting(true);
    setActionNotice(null);

    try {
      const res = await fetch('/api/crm/property-suggestions/import', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          csvText,
          policy: duplicatePolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setImportSummary(data.summary);
      setActionNotice({
        type: 'SUCCESS',
        message: `Import completed: ${data.summary.acceptedCount} added, ${data.summary.updatedCount} updated, ${data.summary.skippedCount} skipped.`,
      });
      setPreviewRows(null);
      setCsvFile(null);
      setCsvText('');
      await loadSuggestions();
    } catch (err: any) {
      setActionNotice({ type: 'ERROR', message: err.message || 'Import execution failed' });
    } finally {
      setImporting(false);
    }
  };

  // Toggle Suggestion Status
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/crm/property-suggestions/${id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
      }
    } catch {
      // Ignore in dev
    }
  };

  // Delete Suggestion
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this external property suggestion?')) return;
    try {
      const res = await fetch(`/api/crm/property-suggestions/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== id));
      }
    } catch {
      // Ignore in dev
    }
  };

  // Filtered Suggestions
  const filteredSuggestions = suggestions.filter(item => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (selectedLocality !== 'ALL' && !item.localityName.toLowerCase().includes(selectedLocality.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        item.societyName.toLowerCase().includes(q) ||
        item.localityName.toLowerCase().includes(q) ||
        item.externalRefId.toLowerCase().includes(q) ||
        (item.contactPersonName && item.contactPersonName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const localities = Array.from(new Set(suggestions.map(s => s.localityName))).filter(Boolean);

  return (
    <div className="space-y-6 font-['Montserrat']">
      
      {/* Top Header & Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#244B8F]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                External Property Suggestions (CSV Manager)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized intake for external inventory suggestions. Decoupled from verified SellMyGhar seller listings.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Download CSV Template</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Suggestions CSV</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-xl border flex items-start space-x-2.5 text-xs ${
          actionNotice.type === 'SUCCESS'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          {actionNotice.type === 'SUCCESS' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="font-medium">{actionNotice.message}</span>
        </div>
      )}

      {/* Import Summary Card */}
      {importSummary && (
        <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Import Summary</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Total Rows: {importSummary.totalRows}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-emerald-600">{importSummary.acceptedCount}</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Accepted</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-blue-600">{importSummary.updatedCount}</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Updated</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-amber-600">{importSummary.skippedCount}</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Skipped</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-rose-600">{importSummary.rejectedCount}</span>
              <p className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* CSV Validation Preview Modal / Card */}
      {previewRows && (
        <div className="bg-white rounded-2xl border border-indigo-200 p-6 space-y-4 shadow-md ring-2 ring-indigo-50">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>CSV File Validation Preview:</span>
                <span className="font-mono text-xs text-[#244B8F] font-normal">{csvFile?.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review parsed rows and validation errors before committing to the suggestions database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setPreviewRows(null);
                setCsvFile(null);
                setCsvText('');
              }}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Metrics */}
          {previewStats && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg font-semibold">
                Total: <strong>{previewStats.total}</strong>
              </span>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-semibold">
                Valid: <strong>{previewStats.valid}</strong>
              </span>
              {previewStats.duplicates > 0 && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-semibold">
                  Duplicates Detected: <strong>{previewStats.duplicates}</strong>
                </span>
              )}
              {previewStats.errors > 0 && (
                <span className="px-3 py-1 bg-rose-100 text-rose-800 rounded-lg font-semibold">
                  Errors: <strong>{previewStats.errors}</strong>
                </span>
              )}
            </div>
          )}

          {/* Duplicate Resolution Policy */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">Duplicate Resolution Policy:</span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupPolicy"
                  checked={duplicatePolicy === 'SKIP_DUPLICATES'}
                  onChange={() => setDuplicatePolicy('SKIP_DUPLICATES')}
                  className="text-[#244B8F]"
                />
                <span className="font-medium text-slate-800">Skip Duplicates (Keep Existing)</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="dupPolicy"
                  checked={duplicatePolicy === 'UPDATE_DUPLICATES'}
                  onChange={() => setDuplicatePolicy('UPDATE_DUPLICATES')}
                  className="text-[#244B8F]"
                />
                <span className="font-medium text-slate-800">Update Existing Records</span>
              </label>
            </div>
          </div>

          {/* Table Preview */}
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Row</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Society & Locality</th>
                  <th className="py-2.5 px-3">Config & SBUA</th>
                  <th className="py-2.5 px-3">Asking Price</th>
                  <th className="py-2.5 px-3">Validation Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {previewRows.map((row) => (
                  <tr key={row.rowNumber} className={row.errors.length > 0 ? 'bg-rose-50/50' : row.isDuplicate ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                    <td className="py-2 px-3 font-mono text-slate-500 font-semibold">{row.rowNumber}</td>
                    <td className="py-2 px-3">
                      {row.errors.length > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          INVALID
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          DUPLICATE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          READY
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {row.data.societyName} <span className="text-slate-400">({row.data.localityName})</span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {row.data.bhkType} • {row.data.superBuiltUpSqft} sq.ft
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">
                      ₹{(row.data.askingPriceInr || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {row.errors.length > 0 ? (
                        <span className="text-rose-600 font-medium">
                          {row.errors.map(e => `${e.fieldName}: ${e.message}`).join('; ')}
                        </span>
                      ) : row.isDuplicate ? (
                        <span className="text-amber-700 italic">Matches existing record</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">Validated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setPreviewRows(null);
                setCsvFile(null);
                setCsvText('');
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={importing || (previewStats?.valid === 0 && previewStats?.duplicates === 0)}
              onClick={handleExecuteImport}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] disabled:bg-slate-300 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Commit & Import ({previewStats?.valid || 0} valid rows)</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by society, locality, ref ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {localities.length > 0 && (
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
            >
              <option value="ALL">All Localities</option>
              {localities.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            type="button"
            onClick={loadSuggestions}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Suggestions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No External Suggestions Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Download the template above and upload a CSV file with external property suggestions to stage and manage them here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref ID / Source</th>
                  <th className="py-3 px-4">Society & Locality</th>
                  <th className="py-3 px-4">Configuration</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Distinction & Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredSuggestions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.externalRefId}</div>
                      <div className="text-[10px] text-slate-400">{item.externalSource}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.societyName}</div>
                      <div className="text-slate-500 text-[11px] flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.localityName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{item.bhkType} • {item.superBuiltUpSqft} sq.ft</div>
                      {item.floor !== undefined && (
                        <div className="text-[11px] text-slate-400">Floor {item.floor} of {item.totalFloors || '—'}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold font-mono text-slate-900">
                        ₹{item.askingPriceInr.toLocaleString('en-IN')}
                      </div>
                      {item.pricePerSqft && (
                        <div className="text-[10px] text-slate-400">₹{item.pricePerSqft.toLocaleString('en-IN')}/sq.ft</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                        <span>EXTERNAL SUGGESTION - NOT VERIFIED</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id, item.status)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer ${
                          item.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete suggestion"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
