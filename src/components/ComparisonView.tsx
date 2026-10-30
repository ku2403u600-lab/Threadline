import React from 'react';
import { SupplierRecord } from '../types/sourcing';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, FileText } from 'lucide-react';

interface ComparisonViewProps {
  shortlist: SupplierRecord[];
  onRemove: (supplierId: string) => void;
  onClear: () => void;
  onDraftRfq: (supplier: SupplierRecord) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  shortlist,
  onRemove,
  onClear,
  onDraftRfq,
}) => {
  if (shortlist.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
        <h3 className="text-sm font-semibold text-stone-900 mb-1">No suppliers selected for comparison</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
          Click &ldquo;Add to Compare&rdquo; on any supplier card in the sourcing workspace to compare MOQ, price, lead time, and evidence status side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-stone-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-stone-900">
            Supplier Comparison Matrix ({shortlist.length})
          </h3>
          <p className="text-xs text-stone-500">
            Transparent comparison across recorded commercial terms, certifications, and verification status.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-stone-500 hover:text-stone-800 underline px-2 py-1"
        >
          Clear shortlist
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="p-3 font-semibold text-stone-700 w-44 shrink-0">Specification</th>
              {shortlist.map((s) => (
                <th key={s.supplier_id} className="p-3 min-w-[220px] max-w-[280px] font-semibold text-stone-900 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm">{s.name}</div>
                      <div className="text-[11px] font-normal text-stone-500">
                        {s.location.city}, {s.location.state}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(s.supplier_id)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200"
                      title="Remove from comparison"
                      aria-label={`Remove ${s.name} from comparison`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {s.record_status === 'illustrative_demo' && (
                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      DEMO ONLY
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {/* Primary Materials */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">Materials Handled</td>
              {shortlist.map((s) => (
                <td key={s.supplier_id} className="p-3 text-stone-800">
                  {s.materials.join(', ')}
                </td>
              ))}
            </tr>

            {/* Price & Unit Basis */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">
                Indicative Price
                <span className="block text-[10px] text-stone-600 font-normal">Check unit basis carefully</span>
              </td>
              {shortlist.map((s) => {
                const evidence = s.field_evidence['commercial.price'];
                return (
                  <td key={s.supplier_id} className="p-3">
                    <div className="font-semibold text-stone-900 font-mono-nums">
                      {s.commercial.price !== null
                        ? `₹${s.commercial.price} ${s.commercial.price_unit || ''}`
                        : <span className="text-stone-600 font-normal">Not confirmed</span>}
                    </div>
                    {evidence && (
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        Status: <span className="capitalize">{evidence.status.replace('_', ' ')}</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Minimum Order Quantity (MOQ) */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">
                Minimum Order (MOQ)
                <span className="block text-[10px] text-stone-600 font-normal">Critical for boutique runs</span>
              </td>
              {shortlist.map((s) => {
                const evidence = s.field_evidence['commercial.moq'];
                return (
                  <td key={s.supplier_id} className="p-3">
                    <div className="font-semibold text-stone-900">
                      {s.commercial.moq !== null
                        ? `${s.commercial.moq} ${s.commercial.moq_unit || 'units'}`
                        : <span className="text-stone-600 font-normal">Not confirmed</span>}
                    </div>
                    {evidence && (
                      <div className="text-[11px] text-stone-600 mt-0.5">
                        Status: <span className="capitalize">{evidence.status.replace('_', ' ')}</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Lead Time */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">Lead Time</td>
              {shortlist.map((s) => (
                <td key={s.supplier_id} className="p-3 text-stone-800">
                  {s.commercial.lead_time || <span className="text-stone-600">Not confirmed</span>}
                </td>
              ))}
            </tr>

            {/* Swatch Availability */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">Swatch Sample Policy</td>
              {shortlist.map((s) => (
                <td key={s.supplier_id} className="p-3 text-stone-800">
                  {s.commercial.swatches === 'available_paid'
                    ? 'Paid swatch cards'
                    : s.commercial.swatches === 'available_free'
                    ? 'Free samples'
                    : s.commercial.swatches === 'not_available'
                    ? 'No swatches'
                    : <span className="text-stone-600">Not confirmed</span>}
                </td>
              ))}
            </tr>

            {/* Certifications & Evidence */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">Certifications</td>
              {shortlist.map((s) => {
                const certs = s.technical.certifications || [];
                const evidence = s.field_evidence['technical.certifications'];
                return (
                  <td key={s.supplier_id} className="p-3">
                    {certs.length > 0 ? (
                      <div>
                        <div className="font-medium text-stone-900">{certs.join(', ')}</div>
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          Evidence: <span className="capitalize">{evidence?.status || 'supplier_claimed'}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-stone-600">None in record</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Contact Details */}
            <tr>
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">Contact Availability</td>
              {shortlist.map((s) => (
                <td key={s.supplier_id} className="p-3 text-stone-700">
                  <div>{s.contact.phone || 'Phone: Not confirmed'}</div>
                  <div className="truncate">{s.contact.email || 'Email: Not confirmed'}</div>
                  {s.contact.website && (
                    <a
                      href={s.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-stone-900 hover:underline block truncate mt-0.5"
                    >
                      {s.contact.website}
                    </a>
                  )}
                </td>
              ))}
            </tr>

            {/* Action Row */}
            <tr className="bg-stone-50/30">
              <td className="p-3 font-medium text-stone-600 bg-stone-50/50">Actions</td>
              {shortlist.map((s) => (
                <td key={s.supplier_id} className="p-3">
                  <button
                    type="button"
                    onClick={() => onDraftRfq(s)}
                    className="w-full px-3 py-1.5 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Draft RFQ</span>
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
