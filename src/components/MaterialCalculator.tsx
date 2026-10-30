import React, { useState, useId, useEffect } from 'react';
import { Calculator, ArrowRight, CheckCircle2, Filter, RotateCcw, X } from 'lucide-react';
import { SupplierRecord } from '../types/sourcing';

interface MaterialCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierRecord[];
  onApplyFilter: (params: { quantityMetres: number; budgetPerMetre?: number }) => void;
  onSendToChat?: (summaryText: string) => void;
  activeQuantity?: number | null;
  activeBudget?: number | null;
}

export const MaterialCalculator: React.FC<MaterialCalculatorProps> = ({
  isOpen,
  onClose,
  suppliers,
  onApplyFilter,
  onSendToChat,
  activeQuantity,
  activeBudget,
}) => {
  const [calculationMode, setCalculationMode] = useState<'garment' | 'direct'>('garment');
  const [garmentType, setGarmentType] = useState('co-ord');
  const [garmentCount, setGarmentCount] = useState<number>(10);
  const [consumptionPerGarment, setConsumptionPerGarment] = useState<number>(2.8);
  const [wastagePercent, setWastagePercent] = useState<number>(8);
  const [directMetres, setDirectMetres] = useState<number>(activeQuantity || 30);
  const [budgetPerMetre, setBudgetPerMetre] = useState<number>(activeBudget || 180);
  const [isFilterActive, setIsFilterActive] = useState<boolean>(Boolean(activeQuantity));

  const countInputId = useId();
  const consumptionInputId = useId();
  const directMetresInputId = useId();
  const budgetInputId = useId();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Presets for common garment consumption in Indian apparel
  const handleGarmentPreset = (type: string) => {
    setGarmentType(type);
    switch (type) {
      case 'co-ord':
        setConsumptionPerGarment(2.8);
        break;
      case 'shirt':
        setConsumptionPerGarment(1.8);
        break;
      case 'dress':
        setConsumptionPerGarment(3.2);
        break;
      case 'trouser':
        setConsumptionPerGarment(2.2);
        break;
      case 'jacket':
        setConsumptionPerGarment(2.5);
        break;
      default:
        break;
    }
  };

  // Compute total metres needed
  const totalMetresNeeded =
    calculationMode === 'garment'
      ? Math.ceil(garmentCount * consumptionPerGarment * (1 + wastagePercent / 100))
      : directMetres;

  const totalEstimatedCost = totalMetresNeeded * budgetPerMetre;

  // Filter suppliers by MOQ accommodation
  const matchingSuppliers = suppliers.filter((s) => {
    if (s.commercial.moq === null) return true; // Keep unconfirmed for manual checking
    return s.commercial.moq <= totalMetresNeeded;
  });

  const handleApply = () => {
    setIsFilterActive(true);
    onApplyFilter({
      quantityMetres: totalMetresNeeded,
      budgetPerMetre: budgetPerMetre > 0 ? budgetPerMetre : undefined,
    });
    onClose();
  };

  const handleClear = () => {
    setIsFilterActive(false);
    onApplyFilter({ quantityMetres: 0, budgetPerMetre: undefined });
  };

  const handleConsultChat = () => {
    if (onSendToChat) {
      const summary =
        calculationMode === 'garment'
          ? `I need fabric for ${garmentCount} ${garmentType} sets (~${consumptionPerGarment}m each with ${wastagePercent}% wastage = ${totalMetresNeeded} metres total) at target ₹${budgetPerMetre}/m. Which suppliers have an MOQ of ${totalMetresNeeded}m or lower?`
          : `I need ${totalMetresNeeded} metres of fabric at target ₹${budgetPerMetre}/m. Which suppliers can fulfill this order size within their MOQ?`;
      onSendToChat(summary);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calculator-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header Bar */}
        <div className="p-4 md:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-stone-900 text-white">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 id="calculator-dialog-title" className="text-base font-semibold text-stone-900">
                Material Yardage & Cost Calculator
              </h3>
              <p className="text-xs text-stone-500">
                Calculate required metres and filter supplier directory by MOQ fit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              aria-label="Close calculator pop-up"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4">
          {/* Calculation Mode Toggle */}
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-stone-700 uppercase tracking-wide">
              Estimation Method:
            </span>
            <div className="flex items-center bg-stone-100 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setCalculationMode('garment')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  calculationMode === 'garment'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                By Garment Count
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('direct')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  calculationMode === 'direct'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Direct Metres
              </button>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs bg-stone-50/70 p-4 rounded-xl border border-stone-200">
            {calculationMode === 'garment' ? (
              <>
                {/* Garment Preset */}
                <div>
                  <span className="block font-semibold text-stone-800 mb-1">
                    Garment Silhouette
                  </span>
                  <select
                    aria-label="Garment Silhouette"
                    value={garmentType}
                    onChange={(e) => handleGarmentPreset(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-stone-900 text-xs text-stone-800"
                  >
                    <option value="co-ord">Summer Co-ord Set (~2.8m)</option>
                    <option value="shirt">Shirt / Blouse (~1.8m)</option>
                    <option value="dress">Flowing Dress (~3.2m)</option>
                    <option value="trouser">Tailored Trouser (~2.2m)</option>
                    <option value="jacket">Light Jacket (~2.5m)</option>
                  </select>
                </div>

                {/* Garments Count */}
                <div>
                  <label htmlFor={countInputId} className="block font-semibold text-stone-800 mb-1">
                    Target Garment Quantity
                  </label>
                  <input
                    id={countInputId}
                    type="number"
                    min={1}
                    max={5000}
                    value={garmentCount}
                    onChange={(e) => setGarmentCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-stone-900 text-xs font-mono-nums text-stone-800"
                  />
                </div>

                {/* Consumption per piece */}
                <div>
                  <label htmlFor={consumptionInputId} className="block font-semibold text-stone-800 mb-1">
                    Metres Consumption / Piece
                  </label>
                  <input
                    id={consumptionInputId}
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={consumptionPerGarment}
                    onChange={(e) => setConsumptionPerGarment(parseFloat(e.target.value) || 1)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-stone-900 text-xs font-mono-nums text-stone-800"
                  />
                </div>

                {/* Wastage allowance */}
                <div>
                  <span className="block font-semibold text-stone-800 mb-1">
                    Cutting Wastage Buffer
                  </span>
                  <select
                    aria-label="Cutting Wastage Buffer"
                    value={wastagePercent}
                    onChange={(e) => setWastagePercent(parseInt(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-stone-900 text-xs text-stone-800"
                  >
                    <option value={5}>5% (Solid colour / Plain weave)</option>
                    <option value={8}>8% (Standard apparel production)</option>
                    <option value={12}>12% (Matched prints / Checks / Plaids)</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                {/* Direct metres */}
                <div className="sm:col-span-2">
                  <label htmlFor={directMetresInputId} className="block font-semibold text-stone-800 mb-1">
                    Total Fabric Yardage Required (Metres)
                  </label>
                  <input
                    id={directMetresInputId}
                    type="number"
                    min={1}
                    max={10000}
                    value={directMetres}
                    onChange={(e) => setDirectMetres(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-stone-900 text-xs font-mono-nums text-stone-800"
                  />
                </div>
              </>
            )}

            {/* Target Budget per metre */}
            <div className="sm:col-span-2">
              <label htmlFor={budgetInputId} className="block font-semibold text-stone-800 mb-1">
                Target Budget Ceiling per Metre (₹/metre)
              </label>
              <input
                id={budgetInputId}
                type="number"
                step="5"
                min="20"
                max="2000"
                value={budgetPerMetre}
                onChange={(e) => setBudgetPerMetre(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:ring-2 focus:ring-stone-900 text-xs font-mono-nums text-stone-800"
              />
            </div>
          </div>

          {/* Real-time Calculation Result Summary */}
          <div className="p-4 bg-stone-100/70 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
            <div>
              <span className="text-[11px] text-stone-500 block uppercase tracking-wide">
                Required Yardage
              </span>
              <span className="text-xl font-bold text-stone-900 font-mono-nums">
                {totalMetresNeeded} metres
              </span>
              {calculationMode === 'garment' && (
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  ({garmentCount} pcs × {consumptionPerGarment}m + {wastagePercent}% wastage)
                </span>
              )}
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block uppercase tracking-wide">
                Est. Fabric Cost
              </span>
              <span className="text-xl font-bold text-stone-900 font-mono-nums">
                ₹{totalEstimatedCost.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                (@ ₹{budgetPerMetre}/m, excl. GST/courier)
              </span>
            </div>

            <div>
              <span className="text-[11px] text-stone-500 block uppercase tracking-wide">
                MOQ Feasibility
              </span>
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{matchingSuppliers.length} of {suppliers.length} suppliers match MOQ</span>
              </div>
              <span className="text-[10px] text-stone-500 block mt-0.5">
                (Suppliers with MOQ &le; {totalMetresNeeded}m)
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-stone-200 bg-stone-50/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isFilterActive && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-xl transition-colors"
            >
              Cancel
            </button>

            {onSendToChat && (
              <button
                type="button"
                onClick={handleConsultChat}
                className="px-3.5 py-2 text-xs font-medium text-stone-800 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                title="Send calculation to THREADLINE sourcing chat"
              >
                <span>Ask Assistant</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              aria-label="Filter suppliers by this calculation"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filter ({totalMetresNeeded}m)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
