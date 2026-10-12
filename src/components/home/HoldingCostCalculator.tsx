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
  const [propertyValueInr, setPropertyValueInr] = useState<number | string>(10800000);
  const [areaSqft, setAreaSqft] = useState<number | string>(1461);
  const [maintenanceRate, setMaintenanceRate] = useState<number | string>(5);
  const [isVacant, setIsVacant] = useState<boolean>(true);
  const [monthlyRentInr, setMonthlyRentInr] = useState<number | string>(40000);
  const [holdingMonths, setHoldingMonths] = useState<number>(12);
  const [brokeragePct, setBrokeragePct] = useState<number | string>(2.0);

  // Accessible unique IDs
  const propValueId = useId();
  const areaId = useId();
  const maintId = useId();
  const rentId = useId();
  const monthsId = useId();

  // Safe numerical normalization (prevents NaN / Infinity)
  const numValue = Math.max(0, Number(propertyValueInr) || 0);
  const numArea = Math.max(0, Number(areaSqft) || 0);
  const numMaintRate = Math.max(0, Number(maintenanceRate) || 0);
  const numRent = Math.max(0, Number(monthlyRentInr) || 0);
  const numMonths = Math.max(1, Number(holdingMonths) || 12);
  const numBrokeragePct = Math.max(0, Number(brokeragePct) || 0);

  // Exact audited calculations
  // 1. Maintenance cost
  const totalMaintenance = Math.round(numArea * numMaintRate * numMonths);

  // 2. Foregone rent (if vacant)
  const totalForegoneRent = isVacant ? Math.round(numRent * numMonths) : 0;

  // 3. Brokerage cost at sale
  const totalBrokerage = Math.round(numValue * (numBrokeragePct / 100));

  // Combined illustrative total
  const totalHoldingCost = totalMaintenance + totalForegoneRent + totalBrokerage;

  return (
    <section id="holding-calculator" className="bg-[#F4F6F9] py-12 sm:py-16 font-['Poppins',sans-serif]">
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
                  <span className="font-bold text-[#244B8F]">
                    {formatIndianCurrency(numValue)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">₹</span>
                  <input
                    type="number"
                    id={propValueId}
                    min="100000"
                    step="50000"
                    value={propertyValueInr}
                    onChange={(e) => setPropertyValueInr(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    placeholder="10800000"
                  />
                </div>
              </div>

              {/* 2. Super Built-up Area & Maintenance Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor={areaId} className="font-semibold text-slate-700">Area (sq.ft)</label>
                    <span className="text-slate-500">{numArea} sq.ft</span>
                  </div>
                  <input
                    type="number"
                    id={areaId}
                    min="100"
                    step="10"
                    value={areaSqft}
                    onChange={(e) => setAreaSqft(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    placeholder="1461"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor={maintId} className="font-semibold text-slate-700">Maintenance (₹/sq.ft/mo)</label>
                    <span className="text-slate-500">₹{numMaintRate}/sq.ft</span>
                  </div>
                  <input
                    type="number"
                    id={maintId}
                    min="0"
                    step="0.5"
                    value={maintenanceRate}
                    onChange={(e) => setMaintenanceRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#244B8F]"
                    placeholder="5"
                  />
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
                        isVacant ? 'bg-[#244B8F] text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Vacant
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsVacant(false)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                        !isVacant ? 'bg-[#244B8F] text-white' : 'text-slate-600 hover:text-slate-900'
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
                        {formatIndianNumberFull(numRent)} / mo
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400">₹</span>
                      <input
                        type="number"
                        id={rentId}
                        min="0"
                        step="1000"
                        value={monthlyRentInr}
                        onChange={(e) => setMonthlyRentInr(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#244B8F]"
                        placeholder="40000"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Holding Period Selector */}
              <div>
                <label htmlFor={monthsId} className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Holding Period
                </label>
                <div className="grid grid-cols-4 gap-2">
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
                <Info className="w-3.5 h-3.5 text-[#244B8F] shrink-0 mt-0.5" />
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
                className="w-full py-2.5 px-4 rounded-xl bg-[#244B8F] hover:bg-[#1B396E] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 group"
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
