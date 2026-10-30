import React from 'react';
import { SupplierRecord, RankedSupplierResult } from '../types/sourcing';
import { CheckCircle2, AlertTriangle, HelpCircle, ShieldAlert, FileText, Scale } from 'lucide-react';

interface SupplierCardProps {
  result: RankedSupplierResult;
  onCompareToggle?: (supplier: SupplierRecord) => void;
  isCompared?: boolean;
  onDraftRfq?: (supplier: SupplierRecord) => void;
  calculatedQuantity?: number | null;
}

export const SupplierCard: React.FC<SupplierCardProps> = ({
  result,
  onCompareToggle,
  isCompared = false,
  onDraftRfq,
  calculatedQuantity,
}) => {
  const { supplier, matchReasons, tradeOffs, missingFields, isDemo } = result;

  const getStatusBadge = (fieldKey: string, label: string) => {
    const evidence = supplier.field_evidence[fieldKey];
    const status = evidence?.status || 'not_confirmed';

    switch (status) {
      case 'verified':
        return (
          <span
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800"
            title={evidence?.source ? `Verified via: ${evidence.source} (${evidence.checked_at || 'date unrecorded'})` : 'Verified from traceable source'}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{label}</span>
          </span>
        );
      case 'supplier_claimed':
        return (
          <span
            className="inline-flex items-center gap-1 text-xs text-amber-800"
            title={evidence?.note || 'Supplier-claimed, not independently verified'}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{label} (Claimed)</span>
          </span>
        );
      case 'estimated_inferred':
        return (
          <span
            className="inline-flex items-center gap-1 text-xs text-sky-800"
            title={evidence?.note || 'Estimated/inferred calculation'}
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>{label} (Estimated)</span>
          </span>
        );
      case 'illustrative_demo':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>{label} (Demo)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-stone-500">
            <span>{label}: Not confirmed</span>
          </span>
        );
    }
  };

  return (
    <div className={`p-4 md:p-5 rounded-xl border bg-white transition-shadow ${isDemo ? 'border-amber-400 bg-amber-50/20' : 'border-stone-200 shadow-sm'}`}>
      {/* Prominent Demo Banner if illustrative demo record */}
      {isDemo && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-900 text-xs">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Illustrative demo record — not verified; do not use for real sourcing.</strong>
            <p className="text-rose-700 mt-0.5">Fabricated purely to test interface mechanics and ranking logic.</p>
          </div>
        </div>
      )}

      {/* Header: Name, Type, and Location */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pb-3 border-b border-stone-100">
        <div>
          <h4 className="text-base font-semibold text-stone-900 flex items-center gap-2">
            {supplier.name}
            {supplier.record_status === 'real_verified' && (
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Verified Business
              </span>
            )}
          </h4>
          <div className="text-xs text-stone-600 mt-0.5 flex flex-wrap items-center gap-x-2">
            <span>{supplier.location.city}, {supplier.location.state}</span>
            <span aria-hidden="true">·</span>
            <span>{supplier.supplier_type.join(', ')}</span>
            {supplier.last_reviewed_at && (
              <>
                <span aria-hidden="true">·</span>
                <span>Reviewed {supplier.last_reviewed_at}</span>
              </>
            )}
          </div>
        </div>

        {/* Commercial summary highlights */}
        <div className="text-left sm:text-right mt-2 sm:mt-0">
          <div className="text-sm font-semibold text-stone-900 font-mono-nums">
            {supplier.commercial.price !== null
              ? `₹${supplier.commercial.price} ${supplier.commercial.price_unit || ''}`
              : <span className="text-stone-600 font-normal">Price unconfirmed</span>}
          </div>
          <div className="text-xs text-stone-600">
            {supplier.commercial.moq !== null
              ? `MOQ: ${supplier.commercial.moq} ${supplier.commercial.moq_unit || ''}`
              : 'MOQ unconfirmed'}
          </div>
          {calculatedQuantity && supplier.commercial.price !== null && supplier.commercial.price_unit?.includes('metre') && (
            <div className="mt-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block font-mono-nums">
              Est. Run Cost: ₹{(supplier.commercial.price * calculatedQuantity).toLocaleString('en-IN')} ({calculatedQuantity}m)
            </div>
          )}
        </div>
      </div>

      {/* Match Rationale */}
      {matchReasons.length > 0 && (
        <div className="my-3">
          <div className="text-xs font-semibold text-stone-700 mb-1">Why this matches your brief:</div>
          <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
            {matchReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Structured Details Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 my-2 bg-stone-50 rounded-lg p-2.5 text-xs text-stone-700">
        <div>
          <span className="text-stone-500 block">Lead Time</span>
          <span className="font-medium text-stone-900">
            {supplier.commercial.lead_time || 'Not confirmed'}
          </span>
        </div>
        <div>
          <span className="text-stone-500 block">Swatches</span>
          <span className="font-medium text-stone-900">
            {supplier.commercial.swatches === 'available_paid'
              ? 'Paid cards'
              : supplier.commercial.swatches === 'available_free'
              ? 'Free samples'
              : supplier.commercial.swatches === 'not_available'
              ? 'Not available'
              : 'Not confirmed'}
          </span>
        </div>
        <div>
          <span className="text-stone-500 block">Certifications</span>
          <span className="font-medium text-stone-900 truncate block">
            {supplier.technical.certifications.length > 0
              ? supplier.technical.certifications.join(', ')
              : 'None listed'}
          </span>
        </div>
        <div>
          <span className="text-stone-500 block">Contact Info</span>
          <span className="font-medium text-stone-900 truncate block">
            {supplier.contact.phone || supplier.contact.email || supplier.contact.website || 'Not in record'}
          </span>
        </div>
      </div>

      {/* Field-level Evidence Row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pt-1 pb-2">
        <span className="text-stone-500 font-medium">Evidence audit:</span>
        {getStatusBadge('name', 'Identity')}
        {getStatusBadge('commercial.moq', 'MOQ')}
        {getStatusBadge('commercial.price', 'Pricing')}
        {supplier.technical.certifications.length > 0 && getStatusBadge('technical.certifications', 'Certificates')}
      </div>

      {/* Trade-offs & Missing Fields Notice */}
      {(tradeOffs.length > 0 || missingFields.length > 0) && (
        <div className="mt-2 text-xs text-stone-600 bg-stone-100/60 p-2.5 rounded-md space-y-1">
          {tradeOffs.length > 0 && (
            <div>
              <span className="font-medium text-stone-700">Trade-offs: </span>
              {tradeOffs.join(' · ')}
            </div>
          )}
          {missingFields.length > 0 && (
            <div>
              <span className="font-medium text-stone-700">To confirm with supplier: </span>
              {missingFields.join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Action Affordances */}
      <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-stone-500">
          {supplier.contact.website ? (
            <a
              href={supplier.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-stone-700 font-medium"
            >
              Visit supplier catalog ↗
            </a>
          ) : (
            <span>Direct phone contact only</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCompareToggle && (
            <button
              type="button"
              onClick={() => onCompareToggle(supplier)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                isCompared
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
              aria-label={`Toggle comparison for ${supplier.name}`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{isCompared ? 'In Compare' : 'Add to Compare'}</span>
            </button>
          )}

          {onDraftRfq && (
            <button
              type="button"
              onClick={() => onDraftRfq(supplier)}
              className="px-3 py-1.5 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5"
              aria-label={`Prepare editable RFQ draft for ${supplier.name}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Draft RFQ</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
