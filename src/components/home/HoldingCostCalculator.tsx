import React, { useState, useId } from 'react';
import { ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { formatIndianCurrency, formatIndianNumberFull } from '../../utils/formatters';

interface HoldingCostCalculatorProps {
  onExploreSellingOptions?: () => void;
}

export const HoldingCostCalculator: React.FC<HoldingCostCalculatorProps> = ({
  onExploreSellingOptions,
}) => {
  // Baseline parameters: ₹1.08 Cr, 1,461 sq.ft, ₹5/sq.ft/mo, ₹40k rent, 12 months, 2% brokerage
  const [propertyValueInr, setPropertyValueInr] = useState<string>('10800000');
  const [areaSqft, setAreaSqft] = useState<string>('1461');
  const [maintenanceRate, setMaintenanceRate] = useState<string>('5');
  const [isVacant, setIsVacant] = useState<boolean>(true);
  const [monthlyRentInr, setMonthlyRentInr] = useState<string>('40000');
  const [holdingMonths, setHoldingMonths] = useState<number>(12);
  const [brokeragePct] = useState<number>(2.0);

  // Accessible unique IDs
  const propValueId = useId();
  const areaId = useId();
  const maintId = useId();
  const rentId = useId();
  const monthsId = useId();

  // Clean numeric parser tolerant to commas and spaces
  const parseNum = (val: string | number): number => {
    if (typeof val === 'number') return isFinite(val) ? val : 0;
    const cleaned = String(val).replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isFinite(parsed) ? parsed : 0;
  };

  const numValue = parseNum(propertyValueInr);
  const numArea = parseNum(areaSqft);
  const numMaintRate = parseNum(maintenanceRate);
  const numRent = parseNum(monthlyRentInr);
  const numMonths = Math.min(36, Math.max(1, holdingMonths || 12));
  const numBrokeragePct = Math.min(10, Math.max(0, brokeragePct || 2));

  // Validation errors
  const propValueError = propertyValueInr && (numValue < 100000 || numValue > 1000000000)
    ? 'Price must be between ₹1 Lakh and ₹100 Cr (max 10 digits)'
    : null;
  const areaError = areaSqft && (numArea < 100 || numArea > 50000)
    ? 'Area must be between 100 and 50,000 sq.ft (max 5 digits)'
    : null;
  const maintError = maintenanceRate && (numMaintRate < 0 || numMaintRate > 100)
    ? 'Maintenance must be between ₹0 and ₹100/sq.ft'
    : null;
  const rentError = monthlyRentInr && (numRent < 0 || numRent > 5000000)
    ? 'Monthly rent cannot exceed ₹50 Lakhs'
    : null;

  // Clamped values to prevent NaN or astronomical overflows
  const clampedValue = Math.min(1000000000, Math.max(0, numValue));
  const clampedArea = Math.min(50000, Math.max(0, numArea));
  const clampedMaint = Math.min(100, Math.max(0, numMaintRate));
  const clampedRent = Math.min(5000000, Math.max(0, numRent));

  // Exact audited calculations
  // 1. Maintenance cost
  const totalMaintenance = Math.round(clampedArea * clampedMaint * numMonths);

  // 2. Foregone rent (if vacant)
  const totalForegoneRent = isVacant ? Math.round(clampedRent * numMonths) : 0;

  // 3. Brokerage cost at sale
  const totalBrokerage = Math.round(clampedValue * (numBrokeragePct / 100));

  // Combined illustrative total
  const rawTotal = totalMaintenance + totalForegoneRent + totalBrokerage;
  const totalHoldingCost = isFinite(rawTotal) && rawTotal >= 0 ? rawTotal : 0;

  return (
    <section id="holding-calculator" className="bg-[#F4F6F9] py-12 sm:py-16 font-['Poppins',sans-serif] relative">
      <div id="calculator" className="absolute -top-20 left-0" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact White Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
                Financial Cost of an Unsold Flat
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Estimate maintenance, unrealised rental income, and transaction costs while awaiting a buyer.
              </p>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 self-start sm:self-center">
              Illustrative Calculation
            </div>
          </div>

          {/* Interactive Calculator Form & Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Column: 4 Clean Minimal Inputs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* 1. Property Value */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <label htmlFor={propValueId} className="font-semibold text-slate-700">
                    Expected Asking Price
                  </label>
                  <span className="font-bold text-[#0073E6]">
                    {formatIndianCurrency(clampedValue)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    id={propValueId}
                    value={propertyValueInr}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      if (clean.length <= 10) {
                        setPropertyValueInr(clean);
                      }
                    }}
                    className={`w-full pl-7 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ${
                      propValueError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-[#0073E6]'
                    }`}
                    placeholder="10800000"
                  />
                </div>
                {propValueError && (
                  <p className="text-[11px] text-rose-600 font-medium mt-1">
                    {propValueError}
                  </p>
                )}
                <div className="mt-2.5">
                  <input
                    type="range"
                    min="5000000"
                    max="50000000"
                    step="500000"
                    value={Math.min(50000000, Math.max(5000000, clampedValue))}
                    onChange={(e) => setPropertyValueInr(e.target.value)}
                    className="w-full accent-[#0073E6] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>₹50 L</span>
                    <span>₹2.5 Cr</span>
                    <span>₹5 Cr</span>
                  </div>
                </div>
              </div>

              {/* 2. Super Built-up Area & Maintenance Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor={areaId} className="font-semibold text-slate-700">Area (sq.ft)</label>
                    <span className="text-slate-500">{clampedArea} sq.ft</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    id={areaId}
                    value={areaSqft}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      if (clean.length <= 5) {
                        setAreaSqft(clean);
                      }
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ${
                      areaError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-[#0073E6]'
                    }`}
                    placeholder="1461"
                  />
                  {areaError && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      {areaError}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor={maintId} className="font-semibold text-slate-700">Maintenance (₹/sq.ft/mo)</label>
                    <span className="text-slate-500">₹{clampedMaint}/sq.ft</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    id={maintId}
                    value={maintenanceRate}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9.]/g, '');
                      if (clean.length <= 4) {
                        setMaintenanceRate(clean);
                      }
                    }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 ${
                      maintError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-[#0073E6]'
                    }`}
                    placeholder="5"
                  />
                  {maintError && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                      {maintError}
                    </p>
                  )}
                </div>
              </div>

              {/* 3. Occupancy Status & Foregone Rent */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Occupancy Status</span>
                  <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setIsVacant(true)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                        isVacant ? 'bg-[#0073E6] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Vacant
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVacant(false)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                        !isVacant ? 'bg-[#0073E6] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tenanted
                    </button>
                  </div>
                </div>

                {isVacant && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor={rentId} className="font-semibold text-slate-600">
                        Monthly Expected Rent
                      </label>
                      <span className="font-bold text-slate-800">
                        {formatIndianNumberFull(clampedRent)} / mo
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        id={rentId}
                        value={monthlyRentInr}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '');
                          if (clean.length <= 8) {
                            setMonthlyRentInr(clean);
                          }
                        }}
                        className={`w-full pl-7 pr-3 py-1.5 bg-white border rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 ${
                          rentError ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-300 focus:ring-[#0073E6]'
                        }`}
                        placeholder="40000"
                      />
                    </div>
                    {rentError && (
                      <p className="text-[11px] text-rose-600 font-medium mt-1">
                        {rentError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 4. Holding Period Selector */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <label htmlFor={monthsId} className="font-semibold text-slate-700">
                    Holding Period
                  </label>
                  <span className="font-bold text-[#0073E6]">
                    {holdingMonths} Months
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {[6, 9, 12, 18].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setHoldingMonths(m)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        holdingMonths === m
                          ? 'bg-[#172033] text-white border-[#172033]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {m} Months
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  id={monthsId}
                  min="3"
                  max="24"
                  step="1"
                  value={holdingMonths}
                  onChange={(e) => setHoldingMonths(Number(e.target.value))}
                  className="w-full accent-[#0073E6] h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>3 Months</span>
                  <span>12 Months</span>
                  <span>24 Months</span>
                </div>
              </div>

            </div>

            {/* Right Column: Clean Displayed Result (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
              
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Estimated Holding Breakdown ({numMonths} Months)
                </span>
                
                <div className="space-y-2 text-xs divide-y divide-slate-200/60 pt-1">
                  <div className="flex justify-between items-center pt-1.5 first:pt-0">
                    <span className="text-slate-600">Maintenance</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {formatIndianNumberFull(totalMaintenance)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-slate-600">Unrealised Rent</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {isVacant ? formatIndianNumberFull(totalForegoneRent) : '₹0 (Tenanted)'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-slate-600">Assumed Brokerage (2%)</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      {formatIndianNumberFull(totalBrokerage)}
                    </span>
                  </div>
                </div>

                {/* Visual Proportion Breakdown Bar */}
                <div className="pt-3 border-t border-slate-200/60 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                    <span>Cost Distribution</span>
                    <span>{totalHoldingCost > 0 ? '100%' : '0%'}</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    {totalHoldingCost > 0 && (
                      <>
                        <div
                          style={{ width: `${(totalMaintenance / totalHoldingCost) * 100}%` }}
                          className="bg-amber-500 h-full transition-all duration-300"
                          title={`Maintenance: ${Math.round((totalMaintenance / totalHoldingCost) * 100)}%`}
                        />
                        <div
                          style={{ width: `${(totalForegoneRent / totalHoldingCost) * 100}%` }}
                          className="bg-sky-600 h-full transition-all duration-300"
                          title={`Foregone Rent: ${Math.round((totalForegoneRent / totalHoldingCost) * 100)}%`}
                        />
                        <div
                          style={{ width: `${(totalBrokerage / totalHoldingCost) * 100}%` }}
                          className="bg-indigo-700 h-full transition-all duration-300"
                          title={`Brokerage: ${Math.round((totalBrokerage / totalHoldingCost) * 100)}%`}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-600 pt-0.5">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Maint ({totalHoldingCost > 0 ? Math.round((totalMaintenance / totalHoldingCost) * 100) : 0}%)</span>
                    </div>
                    {isVacant && (
                      <div className="flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                        <span>Rent ({totalHoldingCost > 0 ? Math.round((totalForegoneRent / totalHoldingCost) * 100) : 0}%)</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-700 shrink-0" />
                      <span>Brokerage ({totalHoldingCost > 0 ? Math.round((totalBrokerage / totalHoldingCost) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Card */}
              <div className="p-4 bg-[#172033] text-white rounded-xl shadow-xs space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300">
                  Total Estimated Holding Cost
                </span>
                <div className="text-2xl font-black text-white tracking-tight">
                  {formatIndianNumberFull(totalHoldingCost)}
                </div>
                <p className="text-[11px] text-slate-300 leading-tight pt-1">
                  Based on {numMonths} months of holding before closing a sale.
                </p>
              </div>

              {/* Restrained Informational Note on Market Conditions */}
              <div className="flex items-start space-x-2 text-[11px] text-slate-500 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200/70">
                <Info className="w-3.5 h-3.5 text-[#0073E6] shrink-0 mt-0.5" />
                <span>
                  Micro-market pricing varies with buyer absorption and registered sale deed trends. SellMyGhar benchmarks real government registered deed transactions to price accurately.
                </span>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  if (onExploreSellingOptions) {
                    onExploreSellingOptions();
                  } else {
                    window.location.hash = '/seller-assisted';
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#0073E6] hover:bg-[#005BB5] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 group"
              >
                <span>Explore Selling Options</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
