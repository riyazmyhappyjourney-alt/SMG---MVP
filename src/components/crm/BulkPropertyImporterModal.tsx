import React, { useState, useTransition } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ClipboardPaste,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Building2,
  Trash2,
  Check
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatters';
import { safeFetch } from '../../utils/safeApi';

interface BulkPropertyImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Sample dataset extracted directly from the user's Google Sheet screenshot
const SAMPLE_SHEET_DATA = `Project Name\tConfigurations\tSuper Buildup Area\tFacing\tFurnishing Status\tFloor\tBalcony\tBathrooms\tProperty age\tPossession\tPrice\tClosing Price\tLead Source\tOwner Name\tOwner Contact\tSellmyghar
Prestige Meridian Park\t3BHK\t1387\tNorth East\tNon Furnished\t5/31\t\t\t\tJan 2027\t1.95 cr\t1.85 cr\tWhatsapp Blast\tPrashanth Chowdry\t7338325688\tTRUE
Centroo by Enessen Estates\t2BHK\t1415\tWest Facing\tNon Furnished\t3/13\t\t\t\tReady to Move\t1.9 cr\t\tFacebook\tGopinath\t9845489179\tFALSE
Rajatha Greens\t3BHK\t1978\tEast Facing\tFully Furnished\t4/9\t4\t\t15years\tReady to Move\t1.5cr\t1.45cr\tFacebook\tDevinder Sharma\t7406116899\tFALSE
Pyramid Bilberry\t2BHK\t1311\tEast Facing\tSemi Furnished\t2/4\t1\t\t\tReady to Move\t95 Lakhs\t92 Lakhs\tFacebook\tAtul Nagavekar\t9663370777\tFALSE
Ds Max Stone Scape\t3BHK\t1347\tEast Facing\tSemi Furnished\t2/4\t\t\t\tReady to Move\t91 Lakhs\t88 Lakhs\tFacebook\tSudhindra S M\t8851223083\tFALSE
Prestige Green Gables\t3.5BHK\t1910\tEast Facing\tFully Furnished\t11/12\t\t\t\tReady to Move\t4.4cr\t\tWhatsapp Blast\tPournima\t8790101631\tFALSE
Sobha Brooklyn Towers\t3BHK\t1865\tEast Facing\tNon Furnished\t4/36\t\t\t\tReady to Move\t2.5cr\t\t99 Acres\tPallabi\t9035699708\tFALSE
RRBC Picasso\t3BHK\t2468\tNorth East\tNon Furnished\t10/14\t\t\t\tReady to Move\t6.5cr\t\t99 Acres\tDrashan\t9818712509\tFALSE
RRBC Picasso\t3BHK\t2119\tNorth East\tNon Furnished\t4/14\t\t\t\tReady to Move\t4.5cr\t\t99 Acres\tSuresh (Security)\t9482007546\tTRUE
Orchid Piccadilly\t2BHK\t1178\tNorth East\tSemi Furnished\t5/12\t\t\t\tReady to Move\t1.5\t\t99 Acres\tKalim\t9980154597\tFALSE
Godrej Lakeside Orchid\t3BHK\t1578\tNorth East\tNon Furnished\t23/25\t2\t\t\tUnder Construction\t2.2cr\t2.15cr\tSMG\tManoj\t7736529895\tFALSE
Godrej Lakeside Orchid\t3BHK\t1934\tEast\tNon Furnished\t15/25\t\t\t\tUnder Construction\t2.76cr\t\t99 Acres\tNiranjan\t6291804642\tFALSE
Prestige Gulmohar\t2BHK\t1377\tWest Facing\tSemi Furnished\t4/26\t\t\t\tReady to Move\t2cr\t\tOld Client\tBhopanna\t8095555109\tFALSE
Sumadhura Sushanth\t2.5BHK\t1550\t\tFully Furnished\t6/14\t2\t\t\tReady to Move\t1.95 Cr\t\tFacebook\tAshpak Sayed\t9606382786\tFALSE
Skylark Zenith\t2BHK\t923\tEast\tSemi Furnished\t2/8\t2\t\t13 years\tReady to Move\t85 Lakhs\t80 Lakhs\tFacebook\tAyushman\t9888902512\tFALSE
Disha Pursuit of Elements\t3.5BHK\t2103\tEast\tNon Furnished\t6/30\t2\t\t\tJan 2027\t2.3 Cr\t\tFacebook\tKrishna\t8945693878\tFALSE
Prestige Park Grove\t4.5BHK\t2530\t\tNon Furnished\t33/42\t\t\t\tDec 2027\t\t\tSMG\tKrishna Raju\t9301193018\tFALSE
Sobha Manhattan Towers\t3BHK\t1498\tWest\tNon Furnished\t26/38\t\t\t\tDec 2026\t1.9cr\t1.8cr\tSMG\tBhageshwar\t9250099763\tFALSE
Sobha Manhattan Towers\t3BHK\t1498\tEast\tNon Furnished\t34/38\t\t\t\tDec 2026\t1.9cr\t1.8cr\tSMG\tBhageshwar\t9250099763\tFALSE
Prestige City Avalon Park\t3BHK\t2418\tEast\tNon Furnished\t0/1\t\t\t\tReady to Move\t3.1cr\t3cr\tSMG\tPradeep Kumar\t9845019823\tFALSE
Sobha Brooklyn Towers\t3BHK\t1865\t\tNon Furnished\t16/36\t\t\t\t2027\t2.43cr\t2.4cr\tSMG\trohan kaul\t8510284694\tFALSE
Sobha Lake Garden\t2.5BHK\t1533\tWest\tNon Furnished\t11/18\t\t\t\tReady to Move\t2cr\t\tSMG\tSanjay Rao\t9845012399\tFALSE
Prestige Meridian Park\t3BHK\t1630\tEast\tNon Furnished\t7/31\t\t\t\tJan 2027\t2.05 Cr\t2.05 Cr\tWhatsapp Blast\tRamesh\t9845901529\tFALSE
Sowparnika the Columns\t2BHK\t1305\t\tSemi Furnished\t\t\t\t\tReady to Move\t1.1cr\t1.2cr\t\tManoj Kumar\t9845019283\tFALSE`;

export function BulkPropertyImporterModal({ isOpen, onClose, onSuccess }: BulkPropertyImporterModalProps) {
  const [activeStep, setActiveStep] = useState<'INPUT' | 'PREVIEW'>('INPUT');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsing, setParsing] = useState<boolean>(false);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to parse TSV / CSV text into array of row objects
  const parseDelimitedText = (text: string): Record<string, any>[] => {
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const delimiter = lines[0].includes('\t') ? '\t' : ',';
    
    // Parse header row
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));

    const rows: Record<string, any>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      let values: string[] = [];

      if (delimiter === '\t') {
        values = line.split('\t');
      } else {
        // Simple CSV quote handler
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        let match;
        while ((match = regex.exec(line)) !== null && match.index < line.length) {
          let val = match[1] || '';
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          values.push(val.trim());
          if (regex.lastIndex >= line.length) break;
        }
      }

      if (values.length > 0 && values.some(v => v.trim().length > 0)) {
        const rowObj: Record<string, any> = {};
        headers.forEach((header, idx) => {
          rowObj[header] = values[idx] !== undefined ? values[idx].trim() : '';
        });
        rows.push(rowObj);
      }
    }
    return rows;
  };

  // Handle preview request
  const handleGeneratePreview = async (overrideRows?: Record<string, any>[]) => {
    setErrorMsg(null);
    const rowsToParse = overrideRows || parseDelimitedText(rawText);

    if (rowsToParse.length === 0) {
      setErrorMsg('Please paste spreadsheet data or upload a valid CSV file.');
      return;
    }

    setParsing(true);
    try {
      const res = await safeFetch('/api/crm/properties/bulk-import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: rowsToParse })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to parse spreadsheet rows');
      }
      setPreviewData(data);
      setActiveStep('PREVIEW');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing spreadsheet');
    } finally {
      setParsing(false);
    }
  };

  // Load user's sheet preset
  const handleLoadSampleSheet = () => {
    setRawText(SAMPLE_SHEET_DATA);
    setFileName('Google_Sheets_Active_Inventory.tsv');
    const rows = parseDelimitedText(SAMPLE_SHEET_DATA);
    handleGeneratePreview(rows);
  };

  // Handle file drop / upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      const rows = parseDelimitedText(content);
      handleGeneratePreview(rows);
    };
    reader.readAsText(file);
  };

  // Execute import
  const handleExecuteImport = async () => {
    if (!previewData?.items) return;
    const validItems = previewData.items.filter((item: any) => item.isValid);
    if (validItems.length === 0) {
      setErrorMsg('No valid rows found to import.');
      return;
    }

    setIngesting(true);
    setErrorMsg(null);
    try {
      const res = await safeFetch('/api/crm/properties/bulk-import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validItems })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to ingest properties');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ingestion failed');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto font-['Poppins'] animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
            <div className="w-9 h-9 rounded-md bg-[#0176D3] text-white flex items-center justify-center shadow-2xs shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center flex-wrap gap-1.5 sm:gap-2">
                <span>Bulk Spreadsheet Inventory Importer</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0176D3] border border-blue-200">
                  Auto-Dedup & Normalizer
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-normal truncate sm:whitespace-normal">
                Directly ingest Google Sheets / Excel rows with Indian real estate pricing and dedup flags.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              onClick={() => setActiveStep('INPUT')}
              className={`flex items-center space-x-1.5 font-semibold cursor-pointer ${
                activeStep === 'INPUT' ? 'text-[#0176D3]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 'INPUT' ? 'bg-[#0176D3] text-white' : 'bg-slate-200 text-slate-700'
              }`}>1</span>
              <span>Upload / Paste Data</span>
            </button>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
            <button
              type="button"
              disabled={!previewData}
              onClick={() => setActiveStep('PREVIEW')}
              className={`flex items-center space-x-1.5 font-semibold cursor-pointer ${
                activeStep === 'PREVIEW' ? 'text-[#0176D3]' : previewData ? 'text-slate-500 hover:text-slate-800' : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                activeStep === 'PREVIEW' ? 'bg-[#0176D3] text-white' : 'bg-slate-200 text-slate-700'
              }`}>2</span>
              <span>Review ({previewData ? previewData.total : 0})</span>
            </button>
          </div>

          <a
            href="/api/crm/properties/bulk-import/template"
            download="SellMyGhar_Inventory_Import_Template.csv"
            className="inline-flex items-center space-x-1 text-slate-600 hover:text-[#0176D3] font-medium text-xs ml-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </a>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeStep === 'INPUT' ? (
            <div className="space-y-4">
              {/* Preset Quick Load */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-md flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Load Your 24-Property Inventory Spreadsheet</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Pre-populated with all projects from your screenshot (Prestige Meridian Park, Sobha Manhattan, Godrej Lakeside, etc.).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleSheet}
                  disabled={parsing}
                  className="px-3.5 py-1.5 bg-[#0176D3] hover:bg-[#005fb2] text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer flex items-center space-x-1.5 shrink-0"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Load My 24 Rows</span>
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center hover:bg-slate-50/60 transition-colors relative">
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-xs text-slate-800 block">
                      {fileName ? `Loaded: ${fileName}` : 'Drop your .CSV or .TSV file here, or click to browse'}
                    </strong>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Supports direct exports from Google Sheets, Excel, or real estate CRM portals
                    </span>
                  </div>
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Or Copy & Paste Directly From Google Sheets (Tab-Separated or CSV)
                  </label>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => { setRawText(''); setFileName(''); }}
                      className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Text</span>
                    </button>
                  )}
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Project Name\tConfigurations\tSuper Buildup Area\tFacing\tFloor\tPrice\tClosing Price\tLead Source\tOwner Name\tOwner Contact\tSellmyghar\nPrestige Meridian Park\t3BHK\t1387\tNorth East\t5/31\t1.95 cr\t1.85 cr\tWhatsapp Blast\tPrashanth Chowdry\t7338325688\tTRUE`}
                  rows={8}
                  className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:border-[#0176D3] focus:ring-1 focus:ring-[#0176D3] outline-hidden leading-relaxed"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* KPI Strip */}
              {previewData && (
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-medium">Total Rows Parsed</span>
                    <strong className="text-slate-900 text-sm font-bold">{previewData.total}</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-md border border-emerald-200">
                    <span className="text-emerald-700 text-[10px] block font-medium">Valid Ready to Ingest</span>
                    <strong className="text-emerald-800 text-sm font-bold">{previewData.validCount}</strong>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-md border border-amber-200">
                    <span className="text-amber-700 text-[10px] block font-medium">Dedup Flagged (Review)</span>
                    <strong className="text-amber-800 text-sm font-bold">{previewData.duplicateCount}</strong>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-md border border-rose-200">
                    <span className="text-rose-700 text-[10px] block font-medium">Invalid / Missing Phone</span>
                    <strong className="text-rose-800 text-sm font-bold">{previewData.errorCount}</strong>
                  </div>
                </div>
              )}

              {/* Parsed Items Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs">
                <div className="max-h-[360px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50/80 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Project & BHK</th>
                        <th className="py-2.5 px-3">Area & Floor</th>
                        <th className="py-2.5 px-3">Asking Price</th>
                        <th className="py-2.5 px-3">Reserve (Bottom)</th>
                        <th className="py-2.5 px-3">Owner Contact</th>
                        <th className="py-2.5 px-3">Portal Status</th>
                        <th className="py-2.5 px-3">Dedup Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewData?.items?.map((item: any) => (
                        <tr key={item.index} className={`hover:bg-slate-50/80 ${!item.isValid ? 'bg-rose-50/40' : ''}`}>
                          <td className="py-2 px-3 font-mono text-[10px] text-slate-400">{item.index}</td>
                          <td className="py-2 px-3">
                            <strong className="text-slate-900 block truncate max-w-[180px]">{item.projectName}</strong>
                            <span className="text-[10px] text-slate-500">{item.bhkType} • {item.facing}</span>
                          </td>
                          <td className="py-2 px-3 text-[11px]">
                            <span>{item.superBuiltUpSqft} sq.ft</span>
                            <span className="text-[10px] text-slate-400 block">Fl. {item.unitFloor}/{item.totalFloors}</span>
                          </td>
                          <td className="py-2 px-3">
                            <strong className="text-slate-900 font-bold">
                              {item.askingPriceInr ? formatIndianCurrency(item.askingPriceInr) : 'N/A'}
                            </strong>
                          </td>
                          <td className="py-2 px-3 text-emerald-700 font-bold">
                            {item.reservePriceInr ? formatIndianCurrency(item.reservePriceInr) : '—'}
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-slate-800 font-medium block truncate max-w-[130px]">{item.ownerName}</span>
                            <span className="font-mono text-[10px] text-slate-500">{item.ownerPhone || 'Missing'}</span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              item.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.isPublished ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            {!item.isValid ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                {item.validationError}
                              </span>
                            ) : item.isDuplicate ? (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1" title={item.duplicateReason}>
                                <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Near Duplicate</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Clean</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {activeStep === 'PREVIEW' && (
              <button
                type="button"
                onClick={() => setActiveStep('INPUT')}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-md shadow-2xs cursor-pointer"
              >
                Back to Edit Rows
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-md cursor-pointer transition-colors"
            >
              Cancel
            </button>
            {activeStep === 'INPUT' ? (
              <button
                type="button"
                onClick={() => handleGeneratePreview()}
                disabled={parsing || !rawText.trim()}
                className="px-4 py-1.5 bg-[#0176D3] hover:bg-[#005fb2] disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                {parsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>{parsing ? 'Analyzing...' : 'Parse & Preview Rows'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={ingesting || !previewData?.validCount}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs rounded-md shadow-2xs cursor-pointer flex items-center space-x-1.5"
              >
                {ingesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{ingesting ? 'Ingesting into Database...' : `Ingest ${previewData?.validCount || 0} Properties`}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
